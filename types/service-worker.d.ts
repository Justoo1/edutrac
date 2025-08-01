// types/service-worker.d.ts
// Service Worker type definitions for EdutTrac Offline Mode

declare global {
  interface ServiceWorkerGlobalScope {
    skipWaiting(): Promise<void>;
    clients: Clients;
  }

  interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
  }

  interface FetchEvent extends ExtendableEvent {
    request: Request;
    respondWith(response: Promise<Response> | Response): void;
  }

  interface SyncEvent extends ExtendableEvent {
    tag: string;
  }

  interface PeriodicSyncEvent extends ExtendableEvent {
    tag: string;
  }

  interface MessageEvent extends Event {
    data: any;
    ports: MessagePort[];
    source: Client | ServiceWorker | MessagePort | null;
  }

  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
    periodicSync?: {
      register(tag: string, options?: { minInterval?: number }): Promise<void>;
    };
  }

  interface Navigator {
    serviceWorker: ServiceWorkerContainer;
  }

  interface Window {
    debugOffline?: {
      storage: any;
      sync: any;
      sw: any;
    };
  }
}

// Service Worker specific types
export interface CacheEntry {
  url: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}

export interface SyncMessage {
  type: 'STORE_FAILED_REQUEST' | 'BACKGROUND_SYNC' | 'CACHE_UPDATED' | 'SKIP_WAITING';
  data?: any;
}

export {};
