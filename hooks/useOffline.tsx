// hooks/useOffline.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { syncManager, SyncStatus, StorageInfo } from '../lib/offline/sync-manager';
import { offlineStorage } from '../lib/offline/storage';

export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  failedSyncCount: number;
  lastSyncStatus: SyncStatus | null;
  storageInfo: StorageInfo | null;
}

export interface OfflineActions {
  // Manual sync operations
  triggerSync: () => Promise<void>;
  retryFailedSync: () => Promise<void>;
  clearFailedSync: () => Promise<void>;
  
  // Data operations
  syncSpecificData: (dataType: string) => Promise<void>;
  getOfflineData: (dataType: string, key?: string) => Promise<any>;
  storeOfflineData: (dataType: string, key: string, data: any) => Promise<void>;
  
  // Queue operations
  queueRequest: (url: string, method: string, headers?: Record<string, string>, body?: any) => Promise<string>;
  
  // Storage management
  clearOfflineStorage: (dataType?: string) => Promise<void>;
  getStorageStats: () => Promise<{ [key: string]: number }>;
}

export function useOffline(): [OfflineState, OfflineActions] {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingSyncCount: 0,
    failedSyncCount: 0,
    lastSyncStatus: null,
    storageInfo: null
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Update storage info
  const updateStorageInfo = useCallback(async () => {
    try {
      const info = await syncManager.getStorageInfo();
      setState(prev => ({ ...prev, storageInfo: info }));
    } catch (error) {
      console.error('Error updating storage info:', error);
    }
  }, []);

  // Handle sync status changes
  const handleSyncStatusChange = useCallback((status: SyncStatus) => {
    setState(prev => ({
      ...prev,
      lastSyncStatus: status,
      isSyncing: status.type === 'sync_started' ? true : 
                 status.type === 'sync_completed' || status.type === 'sync_failed' ? false : 
                 prev.isSyncing
    }));

    // Update counts after sync operations
    if (status.type === 'sync_completed' || status.type === 'sync_failed') {
      updateStorageInfo();
    }
  }, [updateStorageInfo]);

  // Network status handler
  const handleNetworkChange = useCallback(() => {
    const isOnline = navigator.onLine;
    setState(prev => ({ ...prev, isOnline }));
    
    if (isOnline) {
      // Trigger sync when coming back online
      setTimeout(() => {
        syncManager.triggerSync().catch(console.error);
      }, 1000);
    }
  }, []);

  // Initialize effect
  useEffect(() => {
    // Set up network listeners
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    // Set up sync status listener
    const unsubscribe = syncManager.onSyncStatusChange(handleSyncStatusChange);

    // Initialize storage info
    updateStorageInfo();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      unsubscribe();
    };
  }, [handleNetworkChange, handleSyncStatusChange, updateStorageInfo]);

  // Periodic update of storage info
  useEffect(() => {
    const interval = setInterval(updateStorageInfo, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [updateStorageInfo]);

  // Actions
  const actions: OfflineActions = {
    triggerSync: useCallback(async () => {
      await syncManager.triggerSync();
    }, []),

    retryFailedSync: useCallback(async () => {
      await syncManager.retryFailedItems();
    }, []),

    clearFailedSync: useCallback(async () => {
      await syncManager.clearFailedItems();
      await updateStorageInfo();
    }, [updateStorageInfo]),

    syncSpecificData: useCallback(async (dataType: string) => {
      await syncManager.syncSpecificData(dataType);
      await updateStorageInfo();
    }, [updateStorageInfo]),

    getOfflineData: useCallback(async (dataType: string, key?: string) => {
      if (key) {
        return await offlineStorage.getData(dataType as any, key);
      } else {
        return await offlineStorage.getAllData(dataType as any);
      }
    }, []),

    storeOfflineData: useCallback(async (dataType: string, key: string, data: any) => {
      await offlineStorage.storeData(dataType as any, key, data);
      await updateStorageInfo();
    }, [updateStorageInfo]),

    queueRequest: useCallback(async (url: string, method: string, headers = {}, body = null) => {
      const id = await syncManager.queueRequest(url, method, headers, body);
      await updateStorageInfo();
      return id;
    }, [updateStorageInfo]),

    clearOfflineStorage: useCallback(async (dataType?: string) => {
      if (dataType) {
        await offlineStorage.clearStore(dataType as any);
      } else {
        // Clear all data stores
        const stores = ['students', 'staff', 'classes', 'subjects', 'attendance', 'exams', 'grades'];
        await Promise.all(stores.map(store => offlineStorage.clearStore(store as any)));
      }
      await updateStorageInfo();
    }, [updateStorageInfo]),

    getStorageStats: useCallback(async () => {
      return await offlineStorage.getStorageStats();
    }, [])
  };

  return [state, actions];
}

// Higher-order component for offline-aware components
export function withOffline<P extends object>(
  Component: React.ComponentType<P & { offline: OfflineState; offlineActions: OfflineActions }>
) {
  return function OfflineComponent(props: P) {
    const [offlineState, offlineActions] = useOffline();
    
    return (
      <Component
        {...props}
        offline={offlineState}
        offlineActions={offlineActions}
      />
    );
  };
}

// Hook for simplified offline data fetching
export function useOfflineData<T = any>(
  dataType: string,
  key?: string,
  fallbackUrl?: string
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, actions] = useOffline();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get offline data first
      const offlineData = await actions.getOfflineData(dataType, key);
      
      if (offlineData) {
        setData(offlineData);
        setLoading(false);
        
        // If online, also try to fetch fresh data in the background
        if (navigator.onLine && fallbackUrl) {
          try {
            const response = await fetch(fallbackUrl);
            if (response.ok) {
              const freshData = await response.json();
              await actions.storeOfflineData(dataType, key || 'default', freshData);
              setData(freshData);
            }
          } catch (error) {
            // Ignore background fetch errors
            console.warn('Background fetch failed:', error);
          }
        }
      } else if (navigator.onLine && fallbackUrl) {
        // No offline data, try network
        const response = await fetch(fallbackUrl);
        if (response.ok) {
          const freshData = await response.json();
          await actions.storeOfflineData(dataType, key || 'default', freshData);
          setData(freshData);
        } else {
          setError(`Network error: ${response.status}`);
        }
      } else {
        setError('No offline data available and network is offline');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dataType, key, fallbackUrl, actions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const updateData = useCallback(async (newData: T) => {
    try {
      await actions.storeOfflineData(dataType, key || 'default', newData);
      setData(newData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update data');
    }
  }, [dataType, key, actions]);

  return {
    data,
    loading,
    error,
    refetch,
    updateData
  };
}

// Hook for offline-aware API calls
export function useOfflineApi() {
  const [, actions] = useOffline();

  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<any> => {
    const { method = 'GET', headers = {}, body } = options;

    if (navigator.onLine) {
      // Online: make normal request
      try {
        const response = await fetch(url, options);
        
        if (response.ok) {
          const data = await response.json();
          
          // Cache GET responses
          if (method === 'GET') {
            await offlineStorage.cacheApiResponse(url, data);
          }
          
          return data;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        // If request fails but we have cached data for GET requests
        if (method === 'GET') {
          const cachedData = await offlineStorage.getCachedApiResponse(url);
          if (cachedData) {
            console.warn('Using cached data due to network error:', error);
            return cachedData;
          }
        }
        throw error;
      }
    } else {
      // Offline: handle based on method
      if (method === 'GET') {
        const cachedData = await offlineStorage.getCachedApiResponse(url);
        if (cachedData) {
          return cachedData;
        } else {
          throw new Error('No cached data available for offline request');
        }
      } else {
        // Queue non-GET requests for later sync
        const requestId = await actions.queueRequest(
          url,
          method,
          headers as Record<string, string>,
          body
        );
        
        return {
          queued: true,
          requestId,
          message: 'Request queued for sync when online'
        };
      }
    }
  }, [actions]);

  return { makeRequest };
}