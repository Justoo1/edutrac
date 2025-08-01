"use client";

// components/offline/OfflineNotification.tsx
import React, { useState, useEffect } from 'react';
import { useOffline } from '../../hooks/useOffline';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X,
  FolderSync,
  AlertTriangle,
  Info
} from 'lucide-react';

interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationItemProps extends NotificationProps {
  onClose: (id: string) => void;
}

function NotificationItem({ 
  id, 
  type, 
  title, 
  message, 
  duration = 0, 
  action, 
  onClose 
}: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        transform transition-all duration-300 mb-3
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${getBackgroundColor()}
        border rounded-lg shadow-lg p-4 max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {message}
          </p>
          
          {action && (
            <button
              onClick={action.onClick}
              className={`
                mt-2 text-sm font-medium underline
                ${type === 'error' ? 'text-red-600 hover:text-red-700' : 
                  type === 'warning' ? 'text-yellow-600 hover:text-yellow-700' :
                  type === 'success' ? 'text-green-600 hover:text-green-700' :
                  'text-blue-600 hover:text-blue-700'}
              `}
            >
              {action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function OfflineNotification() {
  const [offlineState, actions] = useOffline();
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState<{
    isOnline: boolean;
    pendingCount: number;
    failedCount: number;
  }>({
    isOnline: true,
    pendingCount: 0,
    failedCount: 0
  });

  // Generate notification ID
  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add notification
  const addNotification = (notification: Omit<NotificationProps, 'id'>) => {
    const newNotification = {
      ...notification,
      id: generateId()
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Monitor offline state changes
  useEffect(() => {
    const currentStatus = {
      isOnline: offlineState.isOnline,
      pendingCount: offlineState.pendingSyncCount,
      failedCount: offlineState.failedSyncCount
    };

    // Connection status changed
    if (currentStatus.isOnline !== lastNotifiedStatus.isOnline) {
      if (currentStatus.isOnline) {
        // Came back online
        addNotification({
          type: 'success',
          title: 'Back Online',
          message: 'Connection restored. Syncing your offline changes...',
          duration: 4000,
          action: currentStatus.pendingCount > 0 ? {
            label: 'Sync Now',
            onClick: () => actions.triggerSync()
          } : undefined
        });
      } else {
        // Went offline
        addNotification({
          type: 'warning',
          title: 'Working Offline',
          message: 'No internet connection. Your changes will sync when connection is restored.',
          duration: 5000
        });
      }
    }

    // Pending sync count changed (new items queued)
    if (currentStatus.pendingCount > lastNotifiedStatus.pendingCount) {
      const newItems = currentStatus.pendingCount - lastNotifiedStatus.pendingCount;
      addNotification({
        type: 'info',
        title: 'Changes Queued',
        message: `${newItems} change${newItems > 1 ? 's' : ''} queued for sync when online.`,
        duration: 3000
      });
    }

    // Failed sync count increased
    if (currentStatus.failedCount > lastNotifiedStatus.failedCount) {
      const failedItems = currentStatus.failedCount - lastNotifiedStatus.failedCount;
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: `${failedItems} item${failedItems > 1 ? 's' : ''} failed to sync. Check your connection and try again.`,
        duration: 0, // Don't auto-dismiss errors
        action: {
          label: 'Retry',
          onClick: () => actions.retryFailedSync()
        }
      });
    }

    // Sync completed successfully
    if (currentStatus.pendingCount === 0 && lastNotifiedStatus.pendingCount > 0) {
      addNotification({
        type: 'success',
        title: 'Sync Complete',
        message: 'All your changes have been synchronized successfully.',
        duration: 3000
      });
    }

    setLastNotifiedStatus(currentStatus);
  }, [offlineState.isOnline, offlineState.pendingSyncCount, offlineState.failedSyncCount, actions, lastNotifiedStatus]);

  // Monitor sync status from lastSyncStatus
  useEffect(() => {
    if (offlineState.lastSyncStatus) {
      const status = offlineState.lastSyncStatus;
      
      switch (status.type) {
        case 'sync_started':
          // Don't show notification for sync start - too noisy
          break;
          
        case 'sync_completed':
          if (status.details?.successful && status.details.successful > 0) {
            addNotification({
              type: 'success',
              title: 'Sync Successful',
              message: `${status.details.successful} item${status.details.successful > 1 ? 's' : ''} synced successfully.`,
              duration: 3000
            });
          }
          break;
          
        case 'sync_failed':
          addNotification({
            type: 'error',
            title: 'Sync Error',
            message: status.message || 'Sync operation failed. Please try again.',
            duration: 0,
            action: {
              label: 'Retry',
              onClick: () => actions.triggerSync()
            }
          });
          break;
          
        case 'request_queued':
          // Only show for important operations
          if (status.details?.method && ['POST', 'PUT', 'DELETE'].includes(status.details.method)) {
            addNotification({
              type: 'info',
              title: 'Action Saved',
              message: 'Your action has been saved and will sync when you\'re back online.',
              duration: 2000
            });
          }
          break;
      }
    }
  }, [offlineState.lastSyncStatus, actions]);

  // Don't render if no notifications
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div className="flex flex-col-reverse pointer-events-auto">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            {...notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </div>
  );
}

// Alternative compact notification for minimal UI
export function CompactOfflineNotification() {
  const [offlineState] = useOffline();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'success' | 'error'>('info');

  useEffect(() => {
    let newMessage = '';
    let newType: 'info' | 'warning' | 'success' | 'error' = 'info';
    let shouldShow = false;

    if (!offlineState.isOnline) {
      newMessage = 'Working offline';
      newType = 'warning';
      shouldShow = true;
    } else if (offlineState.isSyncing) {
      newMessage = 'Syncing changes...';
      newType = 'info';
      shouldShow = true;
    } else if (offlineState.failedSyncCount > 0) {
      newMessage = `${offlineState.failedSyncCount} sync failed`;
      newType = 'error';
      shouldShow = true;
    } else if (offlineState.pendingSyncCount > 0) {
      newMessage = `${offlineState.pendingSyncCount} pending sync`;
      newType = 'info';
      shouldShow = true;
    }

    setMessage(newMessage);
    setType(newType);
    setShow(shouldShow);

    if (shouldShow) {
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [offlineState]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <WifiOff className="w-4 h-4" />;
      case 'info':
        return offlineState.isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
    }
  };

  return (
    <div className={`
      fixed bottom-4 left-4 z-50 px-4 py-2 rounded-lg shadow-lg
      flex items-center gap-2 text-sm font-medium
      transition-all duration-300
      ${getColors()}
    `}>
      {getIcon()}
      <span>{message}</span>
      <button
        onClick={() => setShow(false)}
        className="ml-2 opacity-75 hover:opacity-100"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}