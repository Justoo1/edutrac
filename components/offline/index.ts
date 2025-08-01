// components/offline/index.ts
// Export all offline-related components from a single location

export { OfflineStatusIndicator, SimpleOfflineNotification } from './OfflineStatusIndicator';
export { OfflineNotification, CompactOfflineNotification } from './OfflineNotification';

// Re-export types for convenience
export type { OfflineState, OfflineActions } from '../../hooks/useOffline';
