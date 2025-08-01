# EdutTrac Offline Mode

This document describes the offline functionality implemented in EdutTrac.

## Features

- ✅ Offline data storage using IndexedDB
- ✅ Automatic background synchronization
- ✅ Service Worker for asset caching
- ✅ Progressive Web App (PWA) support
- ✅ Network-aware UI components
- ✅ Optimistic updates
- ✅ Conflict resolution

## Quick Start

1. Ensure all files are in place (run the installation script)
2. Import the initialization in your main layout:
   ```typescript
   import './lib/offline/init';
   ```
3. Add the offline status indicator to your UI
4. Test offline functionality using browser dev tools

## File Structure

```
lib/offline/
├── storage.ts          # IndexedDB wrapper
├── sync-manager.ts     # Synchronization logic
├── api-wrapper.ts      # Offline-aware API calls
├── sw-registration.ts  # Service Worker management
└── init.ts            # Initialization

components/offline/
└── OfflineStatusIndicator.tsx  # UI components

hooks/
└── useOffline.ts      # React hooks

public/
├── sw.js             # Service Worker
├── manifest.json     # PWA manifest
└── icons/           # PWA icons
```

## Testing

Use the test utilities:

```typescript
import { simulateOffline, getOfflineStats } from '@/lib/offline/test-utils';

// Simulate offline mode
await simulateOffline();

// Check offline statistics
const stats = await getOfflineStats();
console.log(stats);
```

## Configuration

Environment variables (optional):
- `NEXT_PUBLIC_OFFLINE_ENABLED=true`
- `NEXT_PUBLIC_OFFLINE_DEBUG=false`

## Troubleshooting

1. Check browser console for errors
2. Verify service worker registration in DevTools > Application
3. Check IndexedDB data in DevTools > Application > Storage
4. Use `window.debugOffline` for debugging (dev mode only)

For more details, see the comprehensive setup guide.
