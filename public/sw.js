// public/sw.js
const CACHE_NAME = 'edutrac-v1';
const RUNTIME_CACHE = 'edutrac-runtime';
const DATA_CACHE = 'edutrac-data';

// Static assets to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/app',
  '/offline',
  '/manifest.json',
  // Add your main CSS and JS files here
];

// API endpoints that should be cached
const CACHEABLE_ROUTES = [
  '/api/schools',
  '/api/students',
  '/api/staff',
  '/api/classes',
  '/api/subjects',
  '/api/attendance',
  '/api/exams',
  '/api/grades'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== DATA_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle page requests
  if (request.destination === 'document') {
    event.respondWith(handlePageRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticAssets(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(DATA_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for GET requests
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      error: 'Network unavailable and no cached data found',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    // Network is completely unavailable
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Store failed requests for later sync
    if (request.method !== 'GET') {
      await storeFailedRequest(request);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Offline - request queued for sync',
      offline: true,
      queued: true
    }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle page requests with cache-first strategy
async function handlePageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // Network failed, try cache
  }
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Return offline page if available
  const offlinePage = await cache.match('/offline');
  if (offlinePage) {
    return offlinePage;
  }
  
  return new Response('Offline', { status: 503 });
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Asset not available offline', { status: 503 });
  }
}

// Store failed requests for background sync
async function storeFailedRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  };
  
  // Store in IndexedDB via message to main thread
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'STORE_FAILED_REQUEST',
        data: requestData
      });
    });
  });
}

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'edutrac-sync') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  // Send message to main thread to handle sync
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'BACKGROUND_SYNC' });
  });
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_UPDATED') {
    // Notify clients that cache has been updated
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'CACHE_UPDATED' });
      });
    });
  }
});

// Periodic background sync (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'edutrac-periodic-sync') {
    event.waitUntil(syncQueuedRequests());
  }
});

console.log('EdutTrac Service Worker installed and activated');
