/**
 * useOfflineSync.ts
 * React hook that integrates offlineDB + meshSync with the rest of the app.
 * Exposes: online status, peer list, sync state, write helpers, BT scan trigger.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import {
  openDB, addToOutbox, getPendingOutbox, getLocalRecords, getDeviceId,
  type OfflineRecord, type MeshPeer
} from './offlineDB';
import {
  onSyncEvent, scanForPeers, flushOutboxToFirestore,
  watchConnectivity, isOnline, getConnectedPeers
} from './meshSync';

export type SyncStatus = 'idle' | 'scanning' | 'syncing' | 'flushing' | 'done' | 'error';

export interface OfflineSyncState {
  online: boolean;
  pendingCount: number;
  peers: MeshPeer[];
  status: SyncStatus;
  statusMessage: string;
  deviceId: string;
  lastSyncAt: string | null;
}

export interface OfflineSyncActions {
  startBluetoothScan: () => void;
  flushToServer: () => void;
  writeRecord: (ownerUid: string, col: string, data: any) => Promise<OfflineRecord>;
  getRecords: (ownerUid: string, col: string) => Promise<any[]>;
}

export const useOfflineSync = (): [OfflineSyncState, OfflineSyncActions] => {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [peers, setPeers] = useState<MeshPeer[]>([]);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init
  useEffect(() => {
    openDB().then(async () => {
      const id = await getDeviceId();
      setDeviceId(id);
      const pending = await getPendingOutbox();
      setPendingCount(pending.length);
      const p = await getConnectedPeers();
      setPeers(p);
    });

    // Service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data?.type === 'FLUSH_OUTBOX') triggerFlush();
      });
    }

    // Connectivity watcher
    const cleanup = watchConnectivity(
      () => { setOnline(true); scheduleFlush(2000); },
      () => setOnline(false)
    );

    // Sync event listener
    const unsubSync = onSyncEvent((e) => {
      if (e.type === 'sync_progress') {
        setStatus('syncing');
        setStatusMessage(e.message);
      } else if (e.type === 'sync_complete') {
        setStatus('done');
        setStatusMessage(`Synced ${e.merged} records with ${e.peer}`);
        setLastSyncAt(new Date().toISOString());
        refreshPendingCount();
        getConnectedPeers().then(setPeers);
        setTimeout(() => setStatus('idle'), 4000);
      } else if (e.type === 'server_sync') {
        setStatus('done');
        setStatusMessage(`Server sync: ${e.synced} uploaded${e.failed ? `, ${e.failed} failed` : ''}`);
        setLastSyncAt(new Date().toISOString());
        refreshPendingCount();
        setTimeout(() => setStatus('idle'), 4000);
      } else if (e.type === 'peer_found') {
        setPeers(p => {
          const exists = p.find(x => x.deviceId === e.peer.deviceId);
          if (exists) return p.map(x => x.deviceId === e.peer.deviceId ? e.peer : x);
          return [...p, e.peer];
        });
      } else if (e.type === 'error') {
        setStatus('error');
        setStatusMessage(e.message);
        setTimeout(() => setStatus('idle'), 6000);
      }
    });

    // Auto-flush when online
    if (isOnline()) scheduleFlush(5000);

    return () => {
      cleanup();
      unsubSync();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  const refreshPendingCount = async () => {
    const pending = await getPendingOutbox();
    setPendingCount(pending.length);
  };

  const scheduleFlush = (delayMs: number) => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => triggerFlush(), delayMs);
  };

  const triggerFlush = async () => {
    if (!isOnline()) return;
    setStatus('flushing');
    setStatusMessage('Uploading offline data to server...');
    await flushOutboxToFirestore(async (col, ownerUid, data) => {
      const { _offlineId, _deviceId, _syncedAt, ...cleanData } = data;
      const ref = await addDoc(collection(db, 'asha_workers', ownerUid, col), cleanData);
      return ref.id;
    });
    await refreshPendingCount();
  };

  // ── Actions ───────────────────────────────────────────────────────
  const startBluetoothScan = useCallback(async () => {
    setStatus('scanning');
    setStatusMessage('Scanning for nearby devices via Bluetooth...');
    await scanForPeers();
  }, []);

  const flushToServer = useCallback(() => triggerFlush(), []);

  const writeRecord = useCallback(async (ownerUid: string, col: string, data: any): Promise<OfflineRecord> => {
    const record = await addToOutbox({
      collection: col,
      ownerUid,
      data,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
    });
    await refreshPendingCount();
    // Try immediate server write if online
    if (isOnline()) scheduleFlush(500);
    return record;
  }, []);

  const getRecords = useCallback(async (ownerUid: string, col: string): Promise<any[]> => {
    const records = await getLocalRecords(ownerUid, col);
    return records.map(r => ({ ...r.data, firestoreId: r.id, _local: true }));
  }, []);

  return [
    { online, pendingCount, peers, status, statusMessage, deviceId, lastSyncAt },
    { startBluetoothScan, flushToServer, writeRecord, getRecords }
  ];
};
