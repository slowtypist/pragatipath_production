/**
 * offlineDB.ts
 * IndexedDB wrapper for offline-first storage.
 * All ASHA worker data is written here first, then synced to Firestore/server.
 */

const DB_NAME = 'pragatipath_offline';
const DB_VERSION = 1;

export interface OfflineRecord {
  id: string;           // local UUID
  collection: string;   // e.g. 'patient_requests', 'voice_notes'
  ownerUid: string;     // ASHA worker uid
  data: any;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncedAt?: string;
  deviceId: string;     // originating device
  vectorClock: Record<string, number>; // for conflict resolution
}

export interface MeshPeer {
  id: string;
  name: string;
  role: string;
  lastSeen: string;
  deviceId: string;
}

let _db: IDBDatabase | null = null;

export const openDB = (): Promise<IDBDatabase> => {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      // Outbox — records waiting to sync to server
      if (!db.objectStoreNames.contains('outbox')) {
        const outbox = db.createObjectStore('outbox', { keyPath: 'id' });
        outbox.createIndex('by_collection', 'collection');
        outbox.createIndex('by_sync', 'syncStatus');
        outbox.createIndex('by_owner', 'ownerUid');
      }
      // Local cache — all records including received from peers
      if (!db.objectStoreNames.contains('records')) {
        const records = db.createObjectStore('records', { keyPath: 'id' });
        records.createIndex('by_collection', 'collection');
        records.createIndex('by_owner', 'ownerUid');
      }
      // Mesh peers seen recently
      if (!db.objectStoreNames.contains('peers')) {
        db.createObjectStore('peers', { keyPath: 'deviceId' });
      }
      // Device vector clock
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
};

const tx = async (store: string, mode: IDBTransactionMode = 'readonly') => {
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
};

export const dbPut = async (store: string, record: any): Promise<void> => {
  const s = await tx(store, 'readwrite');
  await new Promise<void>((res, rej) => {
    const r = s.put(record);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
};

export const dbGet = async (store: string, key: string): Promise<any> => {
  const s = await tx(store);
  return new Promise((res, rej) => {
    const r = s.get(key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
};

export const dbGetAll = async (store: string, indexName?: string, indexValue?: any): Promise<any[]> => {
  const s = await tx(store);
  return new Promise((res, rej) => {
    const r = indexName && indexValue !== undefined
      ? s.index(indexName).getAll(indexValue)
      : s.getAll();
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  });
};

export const dbDelete = async (store: string, key: string): Promise<void> => {
  const s = await tx(store, 'readwrite');
  await new Promise<void>((res, rej) => {
    const r = s.delete(key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
};

// ── Device identity ────────────────────────────────────────────────
export const getDeviceId = async (): Promise<string> => {
  const existing = await dbGet('meta', 'deviceId');
  if (existing) return existing.value;
  const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await dbPut('meta', { key: 'deviceId', value: id });
  return id;
};

// ── Vector clock ───────────────────────────────────────────────────
export const getVectorClock = async (): Promise<Record<string, number>> => {
  const r = await dbGet('meta', 'vectorClock');
  return r?.value || {};
};

export const incrementClock = async (deviceId: string): Promise<Record<string, number>> => {
  const clock = await getVectorClock();
  clock[deviceId] = (clock[deviceId] || 0) + 1;
  await dbPut('meta', { key: 'vectorClock', value: clock });
  return clock;
};

// ── Outbox operations ──────────────────────────────────────────────
export const addToOutbox = async (record: Omit<OfflineRecord, 'id' | 'deviceId' | 'vectorClock'>): Promise<OfflineRecord> => {
  const deviceId = await getDeviceId();
  const clock = await incrementClock(deviceId);
  const full: OfflineRecord = {
    ...record,
    id: `${deviceId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    deviceId,
    vectorClock: clock,
  };
  await dbPut('outbox', full);
  await dbPut('records', full);
  return full;
};

export const getPendingOutbox = async (): Promise<OfflineRecord[]> => {
  return dbGetAll('outbox', 'by_sync', 'pending');
};

export const markSynced = async (id: string): Promise<void> => {
  const record = await dbGet('outbox', id);
  if (record) {
    await dbPut('outbox', { ...record, syncStatus: 'synced', syncedAt: new Date().toISOString() });
  }
};

export const markFailed = async (id: string): Promise<void> => {
  const record = await dbGet('outbox', id);
  if (record) await dbPut('outbox', { ...record, syncStatus: 'failed' });
};

// ── Records for a specific owner/collection ────────────────────────
export const getLocalRecords = async (ownerUid: string, collection: string): Promise<OfflineRecord[]> => {
  const all = await dbGetAll('records', 'by_owner', ownerUid);
  return all.filter(r => r.collection === collection);
};

// ── Merge record from peer (CRDT: last-write-wins per vector clock) ─
export const mergeFromPeer = async (incoming: OfflineRecord): Promise<boolean> => {
  const existing = await dbGet('records', incoming.id);
  if (!existing) {
    await dbPut('records', { ...incoming, syncStatus: 'synced' });
    // Add to outbox so it eventually reaches server too
    await dbPut('outbox', { ...incoming, syncStatus: 'pending' });
    return true; // new record
  }
  // Compare vector clocks — take the one with higher total
  const inSum = Object.values(incoming.vectorClock).reduce((a, b) => a + b, 0);
  const exSum = Object.values(existing.vectorClock).reduce((a, b) => a + b, 0);
  if (inSum > exSum) {
    await dbPut('records', { ...incoming, syncStatus: 'synced' });
    return true; // updated
  }
  return false; // existing is newer or same
};
