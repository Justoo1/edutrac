"use client";

// components/offline/OfflineStatusIndicator.tsx
import React, { useState } from 'react';
import { useOffline } from '@/hooks/useOffline';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X,
  Database,
  FolderSync
} from 'lucide-react';

interface OfflineStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineStatusIndicator({ 
  className = '', 
  showDetails = false 
}: OfflineStatusIndicatorProps) {
  const [offlineState, actions] = useOffline();
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const {
    isOnline,
    isSyncing,
    pendingSyncCount,
    failedSyncCount,
    lastSyncStatus,
    storageInfo
  } = offlineState;

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await actions.triggerSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    try {
      await actions.retryFailedSync();
    } catch (error) {
      console.error('Retry failed sync items failed:', error);
    }
  };

  const handleClearFailed = async () => {
    try {
      await actions.clearFailedSync();
    } catch (error) {
      console.error('Clear failed sync items failed:', error);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500 bg-red-50';
    if (isSyncing || syncing) return 'text-blue-500 bg-blue-50';
    if (failedSyncCount > 0) return 'text-yellow-500 bg-yellow-50';
    if (pendingSyncCount > 0) return 'text-orange-500 bg-orange-50';
    return 'text-green-500 bg-green-50';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (isSyncing || syncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (failedSyncCount > 0) return <AlertCircle className="w-4 h-4" />;
    if (pendingSyncCount > 0) return <Clock className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing || syncing) return 'Syncing...';
    if (failedSyncCount > 0) return `${failedSyncCount} sync failed`;
    if (pendingSyncCount > 0) return `${pendingSyncCount} pending`;
    return 'Online';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Status Indicator */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer
          transition-all duration-200 hover:shadow-md
          ${getStatusColor()}
        `}
        onClick={() => setShowDetailPanel(!showDetailPanel)}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {showDetails && (
          <div className="flex items-center gap-1 text-xs opacity-75">
            {storageInfo && (
              <>
                <Database className="w-3 h-3" />
                <span>{Object.values(storageInfo.storageStats).reduce((a, b) => a + b, 0)} items</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {showDetailPanel && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Offline Status</h3>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Connection Status */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              {!isOnline && (
                <p className="text-sm text-gray-600 ml-7">
                  Working offline. Changes will sync when connection is restored.
                </p>
              )}
            </div>

            {/* Sync Status */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FolderSync className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Sync Status</span>
                </div>
                
                {isOnline && (
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || syncing}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${(isSyncing || syncing) ? 'animate-spin' : ''}`} />
                    Sync Now
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {pendingSyncCount > 0 && (
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <span className="text-orange-700">Pending sync</span>
                    <span className="font-medium text-orange-800">{pendingSyncCount}</span>
                  </div>
                )}

                {failedSyncCount > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-red-700">Failed sync</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-red-800">{failedSyncCount}</span>
                      <button
                        onClick={handleRetryFailed}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Retry
                      </button>
                      <button
                        onClick={handleClearFailed}
                        className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {isSyncing && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-blue-700">Syncing in progress...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Info */}
            {storageInfo && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Local Storage</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(storageInfo.storageStats).map(([key, count]) => (
                    <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="capitalize">{key}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Sync Status */}
            {lastSyncStatus && (
              <div className="border-t pt-4">
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">Last sync event:</div>
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{lastSyncStatus.type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{lastSyncStatus.message}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified notification component for sync events
export function OfflineNotification() {
  const [offlineState] = useOffline();
  const [show, setShow] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (offlineState.lastSyncStatus) {
      const status = offlineState.lastSyncStatus;
      
      // Show notification for important events
      if (['sync_completed', 'sync_failed', 'request_queued'].includes(status.type)) {
        setLastStatus(status.message);
        setShow(true);
        
        // Auto-hide after 3 seconds
        setTimeout(() => setShow(false), 3000);
      }
    }
  }, [offlineState.lastSyncStatus]);

  if (!show || !lastStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-2">
          <FolderSync className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-700">{lastStatus}</span>
          <button
            onClick={() => setShow(false)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Note: The main OfflineNotification component is now in a separate file
// components/offline/OfflineNotification.tsx for better organization
// This simple version is kept here for backward compatibility

export function SimpleOfflineNotification() {
  const [offlineState] = useOffline();
  const [show, setShow] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (offlineState.lastSyncStatus) {
      const status = offlineState.lastSyncStatus;
      
      // Show notification for important events
      if (['sync_completed', 'sync_failed', 'request_queued'].includes(status.type)) {
        setLastStatus(status.message);
        setShow(true);
        
        // Auto-hide after 3 seconds
        setTimeout(() => setShow(false), 3000);
      }
    }
  }, [offlineState.lastSyncStatus]);

  if (!show || !lastStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-2">
          <FolderSync className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-700">{lastStatus}</span>
          <button
            onClick={() => setShow(false)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}