// app/offline/page.tsx
import { WifiOff, RefreshCw, Database, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        {/* Offline Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-red-600" />
        </div>

        {/* Title and Description */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        
        <p className="text-gray-600 mb-8">
          No internet connection detected. Don't worry - you can still use EdutTrac with limited functionality using your locally stored data.
        </p>

        {/* Offline Features */}
        <div className="bg-blue-50 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Available Offline:</span>
          </div>
          
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• View student records</li>
            <li>• Record attendance</li>
            <li>• Enter exam scores</li>
            <li>• Generate reports</li>
            <li>• All changes sync when online</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/app"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Offline
          </Link>
        </div>

        {/* Network Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Your changes will automatically sync when the connection is restored.
          </p>
        </div>
      </div>
    </div>
  );
}
