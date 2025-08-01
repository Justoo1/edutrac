// lib/offline/sync-manager.ts
import { offlineStorage } from './storage';

export interface SerializedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}

class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInProgress: Set<string> = new Set();
  private maxRetries: number = 3;
  private retryDelay: number = 5000; // 5 seconds
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    this.setupNetworkListeners();
    this.setupServiceWorkerListener();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private setupServiceWorkerListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'STORE_FAILED_REQUEST') {
          this.handleFailedRequest(event.data.data);
        } else if (event.data.type === 'BACKGROUND_SYNC') {
          this.triggerSync();
        }
      });
    }
  }

  private async handleFailedRequest(requestData: any): Promise<void> {
    await offlineStorage.addToSyncQueue({
      url: requestData.url,
      method: requestData.method,
      headers: requestData.headers || {},
      body: requestData.body
    });

    this.notifyListeners({
      type: 'request_queued',
      message: 'Request queued for sync when online',
      details: { url: requestData.url, method: requestData.method }
    });
  }

  async queueRequest(
    url: string,
    method: string,
    headers: Record<string, string> = {},
    body: any = null
  ): Promise<string> {
    const serializedBody = body ? JSON.stringify(body) : null;
    
    const id = await offlineStorage.addToSyncQueue({
      url,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: serializedBody
    });

    this.notifyListeners({
      type: 'request_queued',
      message: 'Request queued for offline sync',
      details: { id, url, method }
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      setTimeout(() => this.triggerSync(), 100);
    }

    return id;
  }

  async triggerSync(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({
      type: 'sync_started',
      message: 'Starting offline sync...'
    });

    try {
      const queuedItems = await offlineStorage.getSyncQueue();
      const results = await this.processSyncQueue(queuedItems);
      
      this.notifyListeners({
        type: 'sync_completed',
        message: `Sync completed: ${results.successful} successful, ${results.failed} failed`,
        details: results
      });
    } catch (error: Error | any) {
      console.error('Sync error:', error);
      this.notifyListeners({
        type: 'sync_failed',
        message: 'Sync failed with error',
        details: { error: error.message }
      });
    } finally {
      this.isSyncing = false;
    }
  }

  private async processSyncQueue(queuedItems: SerializedRequest[]): Promise<{
    successful: number;
    failed: number;
    details: Array<{ id: string; status: string; error?: string }>;
  }> {
    const results = {
      successful: 0,
      failed: 0,
      details: [] as Array<{ id: string; status: string; error?: string }>
    };

    for (const item of queuedItems) {
      if (this.syncInProgress.has(item.id)) {
        continue; // Skip if already being processed
      }

      this.syncInProgress.add(item.id);

      try {
        await offlineStorage.updateSyncQueueItem(item.id, { status: 'syncing' });
        
        const success = await this.syncSingleRequest(item);
        
        if (success) {
          await offlineStorage.updateSyncQueueItem(item.id, { status: 'completed' });
          results.successful++;
          results.details.push({ id: item.id, status: 'completed' });
        } else {
          const newRetryCount = item.retryCount + 1;
          
          if (newRetryCount >= this.maxRetries) {
            await offlineStorage.updateSyncQueueItem(item.id, { 
              status: 'failed',
              retryCount: newRetryCount
            });
            results.failed++;
            results.details.push({ id: item.id, status: 'failed', error: 'Max retries exceeded' });
          } else {
            await offlineStorage.updateSyncQueueItem(item.id, { 
              status: 'pending',
              retryCount: newRetryCount
            });
            results.details.push({ id: item.id, status: 'retry_later' });
          }
        }
      } catch (error: Error | any) {
        console.error(`Error syncing request ${item.id}:`, error);
        await offlineStorage.updateSyncQueueItem(item.id, { 
          status: 'failed',
          retryCount: item.retryCount + 1
        });
        results.failed++;
        results.details.push({ id: item.id, status: 'error', error: error.message });
      } finally {
        this.syncInProgress.delete(item.id);
      }
    }

    // Clean up completed items
    await offlineStorage.clearCompletedSyncItems();

    return results;
  }

  private async syncSingleRequest(item: SerializedRequest): Promise<boolean> {
    try {
      const headers = {
        ...item.headers,
        'X-Offline-Sync': 'true',
        'X-Original-Timestamp': item.timestamp.toString()
      };

      const response = await fetch(item.url, {
        method: item.method,
        headers,
        body: item.body
      });

      if (response.ok) {
        // Handle response data if needed
        const responseData = await response.json();
        
        // Cache the successful response if it's useful
        if (item.method === 'GET') {
          await offlineStorage.cacheApiResponse(item.url, responseData);
        }

        // Update local data based on the synced request
        await this.updateLocalDataAfterSync(item, responseData);

        return true;
      } else {
        console.warn(`Sync failed for ${item.id}: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`Network error syncing ${item.id}:`, error);
      return false;
    }
  }

  private async updateLocalDataAfterSync(item: SerializedRequest, responseData: any): Promise<void> {
    // Update local storage based on the type of request that was synced
    const url = new URL(item.url);
    const pathSegments = url.pathname.split('/');
    
    if (pathSegments.includes('students')) {
      if (item.method === 'POST' && responseData.id) {
        await offlineStorage.storeData('students', responseData.id, responseData);
      } else if (item.method === 'PUT' && responseData.id) {
        await offlineStorage.storeData('students', responseData.id, responseData);
      } else if (item.method === 'DELETE') {
        const id = pathSegments[pathSegments.length - 1];
        await offlineStorage.deleteData('students', id);
      }
    }
    
    // Similar logic for other entities (staff, classes, etc.)
    if (pathSegments.includes('staff')) {
      if (item.method === 'POST' && responseData.id) {
        await offlineStorage.storeData('staff', responseData.id, responseData);
      } else if (item.method === 'PUT' && responseData.id) {
        await offlineStorage.storeData('staff', responseData.id, responseData);
      } else if (item.method === 'DELETE') {
        const id = pathSegments[pathSegments.length - 1];
        await offlineStorage.deleteData('staff', id);
      }
    }

    if (pathSegments.includes('attendance')) {
      if (item.method === 'POST' && responseData.id) {
        await offlineStorage.storeData('attendance', responseData.id, responseData);
      } else if (item.method === 'PUT' && responseData.id) {
        await offlineStorage.storeData('attendance', responseData.id, responseData);
      }
    }

    if (pathSegments.includes('grades') || pathSegments.includes('exams')) {
      if (item.method === 'POST' && responseData.id) {
        const storeName = pathSegments.includes('grades') ? 'grades' : 'exams';
        await offlineStorage.storeData(storeName, responseData.id, responseData);
      } else if (item.method === 'PUT' && responseData.id) {
        const storeName = pathSegments.includes('grades') ? 'grades' : 'exams';
        await offlineStorage.storeData(storeName, responseData.id, responseData);
      }
    }
  }

  async getPendingSyncCount(): Promise<number> {
    const queuedItems = await offlineStorage.getSyncQueue();
    return queuedItems.length;
  }

  async getFailedSyncItems(): Promise<SerializedRequest[]> {
    const allItems = await offlineStorage.getAllData('syncQueue' as any);
    return allItems.filter(item => item.status === 'failed');
  }

  async retryFailedItems(): Promise<void> {
    const failedItems = await this.getFailedSyncItems();
    
    for (const item of failedItems) {
      await offlineStorage.updateSyncQueueItem(item.id, {
        status: 'pending',
        retryCount: 0
      });
    }

    if (failedItems.length > 0) {
      this.notifyListeners({
        type: 'retry_initiated',
        message: `Retrying ${failedItems.length} failed sync items`,
        details: { count: failedItems.length }
      });

      if (this.isOnline) {
        await this.triggerSync();
      }
    }
  }

  async clearFailedItems(): Promise<void> {
    const failedItems = await this.getFailedSyncItems();
    
    for (const item of failedItems) {
      await offlineStorage.removeSyncQueueItem(item.id);
    }

    this.notifyListeners({
      type: 'failed_items_cleared',
      message: `Cleared ${failedItems.length} failed sync items`,
      details: { count: failedItems.length }
    });
  }

  // Event listener management
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status callback:', error);
      }
    });
  }

  // Utility methods
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  async getStorageInfo(): Promise<StorageInfo> {
    const stats = await offlineStorage.getStorageStats();
    const pendingCount = await this.getPendingSyncCount();
    const failedItems = await this.getFailedSyncItems();

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingSync: pendingCount,
      failedSync: failedItems.length,
      storageStats: stats,
      lastSyncAttempt: await offlineStorage.getSetting('lastSyncAttempt')
    };
  }

  // Force sync specific data types
  async syncSpecificData(dataType: string): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    const endpoints = {
      students: '/api/students',
      staff: '/api/staff', 
      classes: '/api/classes',
      subjects: '/api/subjects',
      attendance: '/api/attendance',
      exams: '/api/exams',
      grades: '/api/grades'
    };

    const endpoint = endpoints[dataType as keyof typeof endpoints];
    if (!endpoint) {
      throw new Error(`Unknown data type: ${dataType}`);
    }

    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        
        // Clear existing data and store fresh data
        await offlineStorage.clearStore(dataType as any);
        
        if (Array.isArray(data)) {
          const items = data.map((item, index) => ({
            key: item.id || `${dataType}_${index}`,
            data: item
          }));
          await offlineStorage.bulkStoreData(dataType as any, items);
        }

        this.notifyListeners({
          type: 'data_synced',
          message: `${dataType} data synced successfully`,
          details: { dataType, count: Array.isArray(data) ? data.length : 1 }
        });
      }
    } catch (error) {
      console.error(`Error syncing ${dataType}:`, error);
      throw error;
    }
  }

  // Background maintenance
  async performMaintenance(): Promise<void> {
    await offlineStorage.cleanup();
    await offlineStorage.setSetting('lastMaintenance', Date.now());
    
    this.notifyListeners({
      type: 'maintenance_completed',
      message: 'Storage maintenance completed'
    });
  }
}

export interface SyncStatus {
  type: 'request_queued' | 'sync_started' | 'sync_completed' | 'sync_failed' | 
        'retry_initiated' | 'failed_items_cleared' | 'data_synced' | 'maintenance_completed';
  message: string;
  details?: any;
}

export interface StorageInfo {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSync: number;
  failedSync: number;
  storageStats: { [key: string]: number };
  lastSyncAttempt: number | null;
}

// Singleton instance
export const syncManager = new SyncManager();

// Auto-trigger sync when online
if (typeof window !== 'undefined') {
  // Trigger initial sync after a short delay
  setTimeout(() => {
    if (navigator.onLine) {
      syncManager.triggerSync();
    }
  }, 2000);

  // Setup periodic maintenance
  setInterval(() => {
    syncManager.performMaintenance().catch(console.error);
  }, 30 * 60 * 1000); // Every 30 minutes
}