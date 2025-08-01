import { serviceWorkerManager } from './sw-registration';
import { syncManager } from './sync-manager';
import { offlineStorage } from './storage';

export async function initializeOfflineSupport() {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('Initializing offline support...');
    
    // Initialize storage
    await offlineStorage.init();
    console.log('✅ Offline storage initialized');
    
    // Register service worker
    await serviceWorkerManager.register();
    console.log('✅ Service worker registered');
    
    // Register background sync
    await serviceWorkerManager.registerBackgroundSync();
    console.log('✅ Background sync registered');
    
    // Set up periodic maintenance
    setInterval(async () => {
      await offlineStorage.cleanup();
    }, 30 * 60 * 1000); // Every 30 minutes
    
    console.log('🎉 Offline support initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize offline support:', error);
    return false;
  }
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeOfflineSupport, 1000);
    });
  } else {
    setTimeout(initializeOfflineSupport, 1000);
  }
}
