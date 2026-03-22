/**
 * meshSync.ts
 * Peer-to-peer mesh sync engine.
 *
 * Transport layers (in priority order):
 * 1. Web Bluetooth GATT — works offline, short range (~10m), no WiFi needed
 * 2. WebRTC DataChannel via LAN signaling (same WiFi/hotspot)
 * 3. Outbox flush to Firestore when any internet is available
 *
 * Protocol: JSON frames over characteristic notifications / data channels
 * Frame types: HELLO | PULL_REQUEST | PUSH_RECORDS | ACK | SYNC_DONE
 */

import {
  addToOutbox, getPendingOutbox, markSynced, markFailed,
  mergeFromPeer, getLocalRecords, dbPut, dbGet, getDeviceId,
  getVectorClock, type OfflineRecord, type MeshPeer
} from './offlineDB';

// ── Bluetooth constants ────────────────────────────────────────────
const BT_SERVICE_UUID   = '12345678-1234-5678-1234-56789abcdef0';
const BT_CHAR_RX_UUID   = '12345678-1234-5678-1234-56789abcdef1'; // remote → us
const BT_CHAR_TX_UUID   = '12345678-1234-5678-1234-56789abcdef2'; // us → remote

// ── Event bus ─────────────────────────────────────────────────────
type SyncEvent =
  | { type: 'peer_found'; peer: MeshPeer }
  | { type: 'sync_progress'; message: string; count?: number }
  | { type: 'sync_complete'; peer: string; merged: number }
  | { type: 'server_sync'; synced: number; failed: number }
  | { type: 'error'; message: string };

type Listener = (event: SyncEvent) => void;
const listeners = new Set<Listener>();

export const onSyncEvent = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = (e: SyncEvent) => listeners.forEach(l => l(e));

// ── Frame codec ────────────────────────────────────────────────────
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const encodeFrame = (obj: any): Uint8Array => encoder.encode(JSON.stringify(obj));
const decodeFrame = (buf: ArrayBuffer): any => {
  try { return JSON.parse(decoder.decode(buf)); } catch { return null; }
};

// ── Split large payloads into 512-byte BT chunks ──────────────────
const CHUNK_SIZE = 480; // safe BLE MTU
const chunkify = (data: string): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
};

// ── BLE advertising (central role — scan) ─────────────────────────
export const scanForPeers = async (): Promise<void> => {
  if (!navigator.bluetooth) {
    emit({ type: 'error', message: 'Web Bluetooth not supported on this device/browser' });
    return;
  }
  emit({ type: 'sync_progress', message: 'Scanning for nearby PragatiPath devices...' });
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [BT_SERVICE_UUID] }],
      optionalServices: [BT_SERVICE_UUID],
    });
    emit({ type: 'sync_progress', message: `Found device: ${device.name || 'Unknown'}` });
    await syncWithBluetoothDevice(device);
  } catch (e: any) {
    if (e.name !== 'NotFoundError') { // user cancelled — not an error
      emit({ type: 'error', message: `Bluetooth scan failed: ${e.message}` });
    }
  }
};

const syncWithBluetoothDevice = async (device: BluetoothDevice): Promise<void> => {
  let server: BluetoothRemoteGATTServer | null = null;
  try {
    server = await device.gatt!.connect();
    const service = await server.getPrimaryService(BT_SERVICE_UUID);
    const rxChar = await service.getCharacteristic(BT_CHAR_RX_UUID);
    const txChar = await service.getCharacteristic(BT_CHAR_TX_UUID);

    const deviceId = await getDeviceId();
    const clock = await getVectorClock();

    // Send HELLO
    await txChar.writeValueWithoutResponse(encodeFrame({
      type: 'HELLO',
      deviceId,
      clock,
      role: 'asha_worker',
    }));

    // Receive response
    let buffer = '';
    await rxChar.startNotifications();
    let mergedCount = 0;

    rxChar.addEventListener('characteristicvaluechanged', async (e: any) => {
      const chunk = decoder.decode(e.target.value.buffer);
      buffer += chunk;
      // Try to parse when we have a complete frame (ends with newline or valid JSON)
      try {
        const frame = JSON.parse(buffer);
        buffer = '';
        mergedCount += await handleIncomingFrame(frame, txChar);
      } catch {
        // Incomplete — keep buffering
      }
    });

    // Send our pending records
    const pending = await getPendingOutbox();
    if (pending.length > 0) {
      emit({ type: 'sync_progress', message: `Pushing ${pending.length} local records...` });
      const payload = JSON.stringify({ type: 'PUSH_RECORDS', records: pending });
      const chunks = chunkify(payload);
      for (const chunk of chunks) {
        await txChar.writeValueWithoutResponse(encoder.encode(chunk));
        await new Promise(r => setTimeout(r, 50)); // rate limit
      }
    }

    // Request peer records
    await txChar.writeValueWithoutResponse(encodeFrame({ type: 'PULL_REQUEST', deviceId }));

    await new Promise(r => setTimeout(r, 3000)); // wait for peer to respond

    await rxChar.stopNotifications();
    server.disconnect();

    emit({ type: 'sync_complete', peer: device.name || 'Unknown', merged: mergedCount });
  } catch (e: any) {
    server?.disconnect();
    emit({ type: 'error', message: `BT sync failed: ${e.message}` });
  }
};

const handleIncomingFrame = async (frame: any, txChar?: BluetoothRemoteGATTCharacteristic): Promise<number> => {
  if (!frame?.type) return 0;
  let merged = 0;

  if (frame.type === 'HELLO') {
    const peer: MeshPeer = {
      id: frame.deviceId,
      deviceId: frame.deviceId,
      name: frame.name || 'ASHA Worker',
      role: frame.role || 'unknown',
      lastSeen: new Date().toISOString(),
    };
    await dbPut('peers', peer);
    emit({ type: 'peer_found', peer });
  }

  if (frame.type === 'PUSH_RECORDS' && Array.isArray(frame.records)) {
    for (const record of frame.records as OfflineRecord[]) {
      const updated = await mergeFromPeer(record);
      if (updated) merged++;
    }
    emit({ type: 'sync_progress', message: `Merged ${merged} records from peer`, count: merged });
    if (txChar) {
      await txChar.writeValueWithoutResponse(encodeFrame({ type: 'ACK', merged }));
    }
  }

  if (frame.type === 'PULL_REQUEST') {
    // Peer wants our records — send them back
    const pending = await getPendingOutbox();
    if (txChar && pending.length > 0) {
      const payload = JSON.stringify({ type: 'PUSH_RECORDS', records: pending });
      const chunks = chunkify(payload);
      for (const chunk of chunks) {
        await txChar.writeValueWithoutResponse(encoder.encode(chunk));
        await new Promise(r => setTimeout(r, 50));
      }
    }
  }

  return merged;
};

// ── WebRTC LAN sync (same WiFi hotspot) ───────────────────────────
// Uses a simple signaling server (local Express endpoint) when on same LAN
let rtcConnections: Map<string, RTCDataChannel> = new Map();

export const initWebRTCMesh = async (signalingUrl: string, ownerUid: string): Promise<void> => {
  const deviceId = await getDeviceId();
  const ws = new WebSocket(signalingUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'register', deviceId, ownerUid }));
    emit({ type: 'sync_progress', message: 'LAN mesh: connected to local signal server' });
  };

  ws.onmessage = async (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'offer') {
      await handleRTCOffer(msg, ws, deviceId);
    } else if (msg.type === 'answer') {
      const pc = (window as any)._rtcPeers?.[msg.from];
      if (pc) await pc.setRemoteDescription(msg.sdp);
    } else if (msg.type === 'ice') {
      const pc = (window as any)._rtcPeers?.[msg.from];
      if (pc && msg.candidate) await pc.addIceCandidate(msg.candidate);
    } else if (msg.type === 'peer_list') {
      for (const peerId of msg.peers) {
        if (peerId !== deviceId) await initRTCPeer(peerId, ws, deviceId, true);
      }
    }
  };
};

const initRTCPeer = async (peerId: string, ws: WebSocket, myId: string, initiator: boolean): Promise<void> => {
  const pc = new RTCPeerConnection({ iceServers: [] }); // no STUN — LAN only
  (window as any)._rtcPeers = (window as any)._rtcPeers || {};
  (window as any)._rtcPeers[peerId] = pc;

  pc.onicecandidate = (e) => {
    if (e.candidate) ws.send(JSON.stringify({ type: 'ice', to: peerId, from: myId, candidate: e.candidate }));
  };

  if (initiator) {
    const channel = pc.createDataChannel('sync');
    setupDataChannel(channel, peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', to: peerId, from: myId, sdp: offer }));
  } else {
    pc.ondatachannel = (e) => setupDataChannel(e.channel, peerId);
  }
};

const handleRTCOffer = async (msg: any, ws: WebSocket, myId: string): Promise<void> => {
  await initRTCPeer(msg.from, ws, myId, false);
  const pc = (window as any)._rtcPeers?.[msg.from];
  if (!pc) return;
  await pc.setRemoteDescription(msg.sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  ws.send(JSON.stringify({ type: 'answer', to: msg.from, from: myId, sdp: answer }));
};

const setupDataChannel = (channel: RTCDataChannel, peerId: string): void => {
  rtcConnections.set(peerId, channel);
  channel.onopen = async () => {
    emit({ type: 'sync_progress', message: `LAN peer connected: ${peerId.slice(0, 8)}` });
    // Push our outbox records
    const pending = await getPendingOutbox();
    if (pending.length > 0) {
      channel.send(JSON.stringify({ type: 'PUSH_RECORDS', records: pending }));
    }
    channel.send(JSON.stringify({ type: 'PULL_REQUEST', deviceId: peerId }));
  };
  channel.onmessage = async (e) => {
    const frame = JSON.parse(e.data);
    const merged = await handleIncomingFrame(frame);
    if (merged > 0) emit({ type: 'sync_progress', message: `LAN: merged ${merged} records`, count: merged });
  };
  channel.onclose = () => { rtcConnections.delete(peerId); };
};

// ── Firestore outbox flush (when internet available) ───────────────
export const flushOutboxToFirestore = async (
  firestoreWriter: (collection: string, ownerUid: string, data: any) => Promise<string>
): Promise<{ synced: number; failed: number }> => {
  const pending = await getPendingOutbox();
  let synced = 0, failed = 0;

  emit({ type: 'sync_progress', message: `Flushing ${pending.length} offline records to server...` });

  for (const record of pending) {
    try {
      await firestoreWriter(record.collection, record.ownerUid, {
        ...record.data,
        _offlineId: record.id,
        _deviceId: record.deviceId,
        _syncedAt: new Date().toISOString(),
      });
      await markSynced(record.id);
      synced++;
    } catch (e) {
      await markFailed(record.id);
      failed++;
      console.error('Outbox flush error:', e);
    }
  }

  emit({ type: 'server_sync', synced, failed });
  return { synced, failed };
};

// ── Online/offline detection ────────────────────────────────────────
export const isOnline = (): boolean => navigator.onLine;

export const watchConnectivity = (onOnline: () => void, onOffline: () => void): () => void => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

export const getConnectedPeers = async (): Promise<MeshPeer[]> => {
  const db = await import('./offlineDB');
  const peers: MeshPeer[] = await db.dbGetAll('peers');
  // Return peers seen in last 10 minutes
  const cutoff = Date.now() - 10 * 60 * 1000;
  return peers.filter(p => new Date(p.lastSeen).getTime() > cutoff);
};
