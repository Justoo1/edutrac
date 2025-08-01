// Utilities for testing offline functionality

export async function simulateOffline() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SIMULATE_OFFLINE'
    });
  }
  
  // Dispatch offline event
  window.dispatchEvent(new Event('offline'));
}

export async function simulateOnline() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SIMULATE_ONLINE'
    });
  }
  
  // Dispatch online event
  window.dispatchEvent(new Event('online'));
}

export async function clearAllOfflineData() {
  const { offlineStorage } = await import('./storage');
  
  const stores = ['students', 'staff', 'classes', 'subjects', 'attendance', 'exams', 'grades'];
  await Promise.all(stores.map(store => offlineStorage.clearStore(store as any)));
  
  // Clear API cache
  await offlineStorage.clearExpiredCache();
  
  console.log('All offline data cleared');
}

export async function getOfflineStats() {
  const { offlineStorage } = await import('./storage');
  const { syncManager } = await import('./sync-manager');
  
  const storageStats = await offlineStorage.getStorageStats();
  const syncInfo = await syncManager.getStorageInfo();
  
  return {
    storage: storageStats,
    sync: syncInfo,
    isOnline: navigator.onLine,
    timestamp: new Date().toISOString()
  };
}
