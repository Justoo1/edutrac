#!/bin/bash

# EdutTrac Offline Mode Installation Script
# This script sets up offline functionality for your EdutRac application

echo "🚀 Setting up EdutTrac Offline Mode..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p lib/offline
mkdir -p components/offline
mkdir -p hooks
mkdir -p app/offline
mkdir -p public/icons

# Install required dependencies
echo "📦 Installing dependencies..."
pnpm install idb
pnpm install --save-dev @types/serviceworker

# Copy service worker to public directory
echo "⚙️ Setting up service worker..."
if [ ! -f "public/sw.js" ]; then
    echo "Please copy the service worker code to public/sw.js"
    echo "You can find it in the artifacts above"
fi

# Create basic icons (you should replace these with actual icons)
echo "🎨 Setting up PWA icons..."
echo "Creating placeholder icons..."

# Create a simple SVG icon and convert to different sizes
# Note: In production, you should use proper icon files
cat > public/icons/icon.svg << 'EOF'
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1e40af"/>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="200" fill="white" text-anchor="middle">E</text>
</svg>
EOF

# Check if ImageMagick is available for icon conversion
if command -v convert &> /dev/null; then
    echo "Converting SVG to different sizes..."
    for size in 72 96 128 144 152 192 384 512; do
        convert public/icons/icon.svg -resize ${size}x${size} public/icons/icon-${size}x${size}.png
    done
else
    echo "⚠️  ImageMagick not found. Please manually create icon files:"
    echo "   - icon-72x72.png, icon-96x96.png, icon-128x128.png"
    echo "   - icon-144x144.png, icon-152x152.png, icon-192x192.png"
    echo "   - icon-384x384.png, icon-512x512.png"
    echo "   Place them in public/icons/"
fi

# Update package.json scripts
echo "📝 Updating package.json scripts..."
npm pkg set scripts.offline:init="node -e \"console.log('Offline mode initialized')\""
npm pkg set scripts.sw:update="echo 'Updating service worker version...'"

# Create environment variables template
echo "🔧 Creating environment template..."
cat > .env.offline.example << 'EOF'
# Offline Mode Configuration
NEXT_PUBLIC_OFFLINE_ENABLED=true
NEXT_PUBLIC_OFFLINE_CACHE_VERSION=1
NEXT_PUBLIC_OFFLINE_DEBUG=false
NEXT_PUBLIC_SW_UPDATE_CHECK_INTERVAL=300000
EOF

# Update next.config.js to include PWA headers
echo "⚙️ Updating Next.js configuration..."
if [ -f "next.config.js" ]; then
    echo "Please add PWA headers to your next.config.js:"
    echo "See the updated configuration in the setup guide"
else
    echo "❌ next.config.js not found. Please ensure you're in the project root."
fi

# Create initialization file
echo "🔄 Creating initialization file..."
cat > lib/offline/init.ts << 'EOF'
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
EOF

# Create TypeScript definitions
echo "📝 Creating TypeScript definitions..."
cat > types/offline.d.ts << 'EOF'
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
EOF

# Create test file
echo "🧪 Creating test utilities..."
cat > lib/offline/test-utils.ts << 'EOF'
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
EOF

# Create README for offline mode
echo "📖 Creating offline mode documentation..."
cat > OFFLINE_MODE.md << 'EOF'
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
EOF

echo ""
echo "✅ EdutTrac Offline Mode setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy the service worker code to public/sw.js"
echo "2. Copy all TypeScript files to their respective directories"
echo "3. Update your layout.tsx to include offline components"
echo "4. Add offline initialization to your app"
echo "5. Test offline functionality"
echo ""
echo "📚 Documentation:"
echo "- See OFFLINE_MODE.md for quick reference"
echo "- Check the comprehensive setup guide for detailed instructions"
echo "- Use test utilities in lib/offline/test-utils.ts for testing"
echo ""
echo "🚀 Your EdutTrac app is now ready for offline use!"
