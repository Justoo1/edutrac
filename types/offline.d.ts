// Offline Mode Type Definitions

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

declare module 'idb' {
  export function openDB<T>(
    name: string,
    version: number,
    options?: {
      upgrade(db: any): void;
    }
  ): Promise<any>;
}
