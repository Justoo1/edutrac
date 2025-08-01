# EdutTrac Offline Mode - Quick Setup Guide

## 1. Install Dependencies (Correct Commands)

```bash
# Install the IndexedDB wrapper
pnpm install idb

# Install service worker types (optional, for better TypeScript support)
pnpm install --save-dev @types/serviceworker

# If you don't have React types yet:
pnpm install --save-dev @types/react @types/react-dom
```

## 2. Create Required Files

I've already created the service worker type definitions in `types/service-worker.d.ts`. Now let's set up the core files:

### Step 1: Create Directory Structure
```bash
mkdir -p lib/offline
mkdir -p components/offline
mkdir -p hooks
mkdir -p app/offline
mkdir -p public/icons
mkdir -p types
```

### Step 2: Copy Service Worker to Public Directory

Create `public/sw.js` and copy the service worker code from the artifacts above.

### Step 3: Create the Core Files

Create these files in your project:

- `lib/offline/storage.ts` - IndexedDB wrapper (from artifacts)
- `lib/offline/sync-manager.ts` - Sync management (from artifacts)  
- `lib/offline/api-wrapper.ts` - Offline-aware API calls (from artifacts)
- `lib/offline/sw-registration.ts` - Service worker registration (from artifacts)
- `hooks/useOffline.ts` - React hooks (from artifacts)
- `components/offline/OfflineStatusIndicator.tsx` - UI components (from artifacts)

### Step 4: Update Your Layout

Add to your `app/layout.tsx`:

```typescript
import { Metadata } from "next";
// ... your existing imports

// Add these imports - Now with the correct components!
import { OfflineStatusIndicator, OfflineNotification } from '@/components/offline';
// OR use the compact version:
// import { OfflineStatusIndicator, CompactOfflineNotification } from '@/components/offline';

export const metadata: Metadata = {
  // ... your existing metadata
  
  // Add PWA manifest
  manifest: "/manifest.json",
  
  // Add theme color for PWA
  themeColor: "#1e40af",
  
  // Add additional meta tags for PWA
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "EdutTrac",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={cn([cal.variable, inter.variable, "bg-gradient-to-tr from-blue-950 to-blue-900"])}>
        <Providers>
          {children}
          
          {/* Add offline components */}
          <OfflineStatusIndicator className="fixed top-4 right-4 z-50" showDetails />
          <OfflineNotification />
          
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
```

### Step 5: Initialize Offline Support

Create `lib/offline/init.ts`:

```typescript
import { serviceWorkerManager } from './sw-registration';
import { offlineStorage } from './storage';

export async function initializeOfflineSupport() {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('🔄 Initializing EdutTrac offline support...');
    
    // Initialize IndexedDB storage
    await offlineStorage.init();
    console.log('✅ Offline storage ready');
    
    // Register service worker
    await serviceWorkerManager.register();
    console.log('✅ Service worker registered');
    
    // Set up background sync
    await serviceWorkerManager.registerBackgroundSync();
    console.log('✅ Background sync enabled');
    
    // Set up periodic cleanup
    setInterval(async () => {
      await offlineStorage.cleanup();
    }, 30 * 60 * 1000); // Every 30 minutes
    
    console.log('🎉 EdutTrac offline mode ready!');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize offline support:', error);
    return false;
  }
}

// Auto-initialize when the page loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeOfflineSupport, 1000);
    });
  } else {
    setTimeout(initializeOfflineSupport, 1000);
  }
}
```

Then import this in your main layout or app:
```typescript
// Add to the top of your layout.tsx or a component that loads on every page
import '@/lib/offline/init';
```

### Step 6: Update Your Actions

Replace your existing student/staff/attendance actions with the offline-aware versions from the artifacts above.

### Step 7: Create Basic Icons

For now, create a simple favicon and basic PWA icons:

```bash
# Create a basic icon directory
mkdir -p public/icons

# You can use any image tool to create these sizes from your logo:
# 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
```

## 3. Test the Setup

1. **Check Service Worker Registration:**
   - Open Chrome DevTools → Application → Service Workers
   - You should see your service worker registered

2. **Test Offline Mode:**
   - Open DevTools → Network → Check "Offline"
   - Navigate around your app - it should work with cached data

3. **Check Storage:**
   - DevTools → Application → IndexedDB
   - You should see `edutrac-offline` database

## 4. Usage Examples

### Record Attendance Offline:
```typescript
import { recordAttendanceOffline } from '@/lib/offline/offline-actions';

const handleAttendance = async (studentId: string, status: string) => {
  const result = await recordAttendanceOffline(schoolId, {
    studentId,
    classId,
    date: new Date().toISOString().split('T')[0],
    status
  });
  
  if (result.success) {
    toast.success(result.message);
  } else {
    toast.error(result.error);
  }
};
```

### Use Offline Hook:
```typescript
import { useOffline } from '@/hooks/useOffline';

function MyComponent() {
  const [offlineState, actions] = useOffline();
  
  return (
    <div>
      <p>Status: {offlineState.isOnline ? 'Online' : 'Offline'}</p>
      {offlineState.pendingSyncCount > 0 && (
        <p>{offlineState.pendingSyncCount} items pending sync</p>
      )}
      <button onClick={actions.triggerSync} disabled={offlineState.isSyncing}>
        {offlineState.isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
```

## 5. Troubleshooting

- **Service Worker not registering:** Check console for errors, ensure `/sw.js` exists
- **Data not saving offline:** Check IndexedDB in DevTools, verify storage initialization
- **Sync not working:** Check network tab, verify background sync registration

Your EdutTrac app will now work seamlessly offline! 🎉
