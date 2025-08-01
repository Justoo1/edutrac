// lib/offline/storage.ts
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb/build/';

interface OfflineDBSchema extends DBSchema {
  // Cached API responses
  apiCache: {
    key: string;
    value: {
      url: string;
      data: any;
      timestamp: number;
      expiresAt: number;
    };
  };
  
  // Queued requests for sync
  syncQueue: {
    key: string;
    value: {
      id: string;
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string | null;
      timestamp: number;
      retryCount: number;
      status: 'pending' | 'syncing' | 'failed' | 'completed';
    };
  };
  
  // Offline data stores
  students: {
    key: string;
    value: any;
  };
  
  staff: {
    key: string;
    value: any;
  };
  
  classes: {
    key: string;
    value: any;
  };
  
  subjects: {
    key: string;
    value: any;
  };
  
  attendance: {
    key: string;
    value: any;
  };
  
  exams: {
    key: string;
    value: any;
  };
  
  grades: {
    key: string;
    value: any;
  };
  
  // Offline configuration
  settings: {
    key: string;
    value: any;
  };
}

class OfflineStorage {
  private db: IDBPDatabase<OfflineDBSchema> | null = null;
  private dbName = 'edutrac-offline';
  private version = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<OfflineDBSchema>(this.dbName, this.version, {
      upgrade(db) {
        // API Cache store
        if (!db.objectStoreNames.contains('apiCache')) {
          db.createObjectStore('apiCache', { keyPath: 'url' });
        }

        // Sync Queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('status', 'status');
          syncStore.createIndex('timestamp', 'timestamp');
        }

        // Data stores
        const stores = ['students', 'staff', 'classes', 'subjects', 'attendance', 'exams', 'grades', 'settings'];
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        });
      },
    });
  }

  // API Cache methods
  async cacheApiResponse(url: string, data: any, ttlMinutes: number = 60): Promise<void> {
    if (!this.db) await this.init();
    
    const cacheEntry = {
      url,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlMinutes * 60 * 1000)
    };

    await this.db!.put('apiCache', cacheEntry);
  }

  async getCachedApiResponse(url: string): Promise<any | null> {
    if (!this.db) await this.init();
    
    const cached = await this.db!.get('apiCache', url);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      await this.db!.delete('apiCache', url);
      return null;
    }
    
    return cached.data;
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction('apiCache', 'readwrite');
    const store = tx.objectStore('apiCache');
    const allEntries = await store.getAll();
    
    const now = Date.now();
    for (const entry of allEntries) {
      if (now > entry.expiresAt) {
        await store.delete(entry.url);
      }
    }
    
    await tx.done;
  }

  // Sync Queue methods
  async addToSyncQueue(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | null;
  }): Promise<string> {
    if (!this.db) await this.init();
    
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueItem = {
      id,
      ...request,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending' as const
    };

    await this.db!.put('syncQueue', queueItem);
    return id;
  }

  async getSyncQueue(): Promise<any[]> {
        if (!this.db) await this.init();
        
        const tx = this.db!.transaction('syncQueue', 'readonly');
        const store = tx.objectStore('syncQueue');
        const allItems = await store.getAll();
        
        // Filter for pending items
        return allItems.filter(item => item.status === 'pending');
    }

  async updateSyncQueueItem(id: string, updates: Partial<any>): Promise<void> {
    if (!this.db) await this.init();
    
    const item = await this.db!.get('syncQueue', id);
    if (item) {
      Object.assign(item, updates);
      await this.db!.put('syncQueue', item);
    }
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('syncQueue', id);
  }

  async clearCompletedSyncItems(): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const allItems = await store.getAll();
    
    for (const item of allItems) {
      if (item.status === 'completed') {
        await store.delete(item.id);
      }
    }
    
    await tx.done;
  }

  // Data storage methods
  async storeData(storeName: keyof Pick<OfflineDBSchema, 'students' | 'staff' | 'classes' | 'subjects' | 'attendance' | 'exams' | 'grades'>, key: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put(storeName, data, key);
  }

  async getData(storeName: keyof Pick<OfflineDBSchema, 'students' | 'staff' | 'classes' | 'subjects' | 'attendance' | 'exams' | 'grades'>, key: string): Promise<any | null> {
    if (!this.db) await this.init();
    return await this.db!.get(storeName, key) || null;
  }

  async getAllData(storeName: keyof Pick<OfflineDBSchema, 'students' | 'staff' | 'classes' | 'subjects' | 'attendance' | 'exams' | 'grades'>): Promise<any[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll(storeName);
  }

  async deleteData(storeName: keyof Pick<OfflineDBSchema, 'students' | 'staff' | 'classes' | 'subjects' | 'attendance' | 'exams' | 'grades'>, key: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete(storeName, key);
  }

  async clearStore(storeName: keyof Pick<OfflineDBSchema, 'students' | 'staff' | 'classes' | 'subjects' | 'attendance' | 'exams' | 'grades'>): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear(storeName);
  }

  // Settings methods
  async setSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('settings', value, key);
  }

  async getSetting(key: string): Promise<any | null> {
    if (!this.db) await this.init();
    return await this.db!.get('settings', key) || null;
  }

  // Bulk operations for initial sync
  async bulkStoreData(storeName: keyof Pick<OfflineDBSchema, 'students' | 'staff' | 'classes' | 'subjects' | 'attendance' | 'exams' | 'grades'>, items: Array<{ key: string; data: any }>): Promise<void> {
    if (!this.db) await this.init();
    
    const tx = this.db!.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    await Promise.all(items.map(item => store.put(item.data, item.key)));
    await tx.done;
  }

  // Database maintenance
  async cleanup(): Promise<void> {
    await this.clearExpiredCache();
    await this.clearCompletedSyncItems();
  }

  async getStorageStats(): Promise<{ [key: string]: number }> {
    if (!this.db) await this.init();
    
    const stats: { [key: string]: number } = {};
    const storeNames = ['apiCache', 'syncQueue', 'students', 'staff', 'classes', 'subjects', 'attendance', 'exams', 'grades'];
    
    for (const storeName of storeNames) {
      try {
        const count = await this.db!.count(storeName as any);
        stats[storeName] = count;
      } catch (error) {
        stats[storeName] = 0;
      }
    }
    
    return stats;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Initialize on import
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(console.error);
}