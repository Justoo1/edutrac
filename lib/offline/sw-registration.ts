import React from 'react';

export interface ServiceWorkerState {
  isRegistered: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
  error: string | null;
}

class ServiceWorkerManager {
  private state: ServiceWorkerState = {
    isRegistered: false,
    isUpdating: false,
    hasUpdate: false,
    error: null
  };

  private listeners: Array<(state: ServiceWorkerState) => void> = [];
  private registration: ServiceWorkerRegistration | null = null;

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      this.updateState({ error: 'Service Worker not supported' });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.registration = registration;
      this.updateState({ isRegistered: true, error: null });

      // Set up event listeners
      this.setupEventListeners(registration);

      // Check for updates
      await this.checkForUpdates();

      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  }

  private setupEventListeners(registration: ServiceWorkerRegistration): void {
    // Listen for waiting service worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      this.updateState({ isUpdating: true });

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.updateState({ hasUpdate: true, isUpdating: false });
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });

    // Listen for service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated by service worker');
        break;
      case 'STORE_FAILED_REQUEST':
        console.log('Failed request stored for sync:', data.data);
        break;
      case 'BACKGROUND_SYNC':
        console.log('Background sync triggered');
        break;
      default:
        console.log('Unknown service worker message:', data);
    }
  }

  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.error('Failed to check for service worker updates:', error);
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) return;

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    this.updateState({ hasUpdate: false });
  }

  async unregister(): Promise<void> {
    if (!this.registration) return;

    try {
      const result = await this.registration.unregister();
      if (result) {
        this.updateState({ 
          isRegistered: false, 
          hasUpdate: false, 
          isUpdating: false, 
          error: null 
        });
        console.log('Service Worker unregistered successfully');
      }
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
      this.updateState({ 
        error: error instanceof Error ? error.message : 'Unregistration failed' 
      });
    }
  }

  // Register background sync
  async registerBackgroundSync(tag: string = 'edutrac-sync'): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    if ('sync' in this.registration) {
      try {
        await (this.registration as any).sync.register(tag);
        console.log('Background sync registered');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }

  // Register periodic background sync (if supported)
  async registerPeriodicSync(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    if ('periodicSync' in this.registration) {
      try {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as any
        });

        if (status.state === 'granted') {
          await (this.registration as any).periodicSync.register('edutrac-periodic-sync', {
            minInterval: 12 * 60 * 60 * 1000, // 12 hours
          });
          console.log('Periodic background sync registered');
        }
      } catch (error) {
        console.error('Failed to register periodic sync:', error);
      }
    }
  }

  // State management
  private updateState(updates: Partial<ServiceWorkerState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  getState(): ServiceWorkerState {
    return { ...this.state };
  }

  onStateChange(callback: (state: ServiceWorkerState) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.state);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in service worker state callback:', error);
      }
    });
  }

  // Send message to service worker
  sendMessage(message: any): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  // Check if app is being served from service worker
  isServedFromServiceWorker(): boolean {
    return navigator.serviceWorker.controller !== null;
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register when imported in browser
if (typeof window !== 'undefined') {
  // Register on page load
  window.addEventListener('load', () => {
    serviceWorkerManager.register().catch(console.error);
  });
}

// Hook for React components
export function useServiceWorker() {
  const [state, setState] = React.useState<ServiceWorkerState>(
    serviceWorkerManager.getState()
  );

  React.useEffect(() => {
    const unsubscribe = serviceWorkerManager.onStateChange(setState);
    return unsubscribe;
  }, []);

  const actions = React.useMemo(() => ({
    checkForUpdates: () => serviceWorkerManager.checkForUpdates(),
    skipWaiting: () => serviceWorkerManager.skipWaiting(),
    unregister: () => serviceWorkerManager.unregister(),
    registerBackgroundSync: (tag?: string) => serviceWorkerManager.registerBackgroundSync(tag),
    sendMessage: (message: any) => serviceWorkerManager.sendMessage(message)
  }), []);

  return [state, actions] as const;
}

// Install prompt management
export class InstallPromptManager {
  private deferredPrompt: any = null;
  private isInstallable: boolean = false;
  private listeners: Array<(installable: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.setInstallable(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.setInstallable(false);
      console.log('EdutTrac was installed');
    });
  }

  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      this.deferredPrompt = null;
      this.setInstallable(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Failed to show install prompt:', error);
      return false;
    }
  }

  isAppInstallable(): boolean {
    return this.isInstallable;
  }

  private setInstallable(installable: boolean): void {
    this.isInstallable = installable;
    this.listeners.forEach(callback => callback(installable));
  }

  onInstallableChange(callback: (installable: boolean) => void): () => void {
    this.listeners.push(callback);
    callback(this.isInstallable); // Call immediately
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const installPromptManager = new InstallPromptManager();