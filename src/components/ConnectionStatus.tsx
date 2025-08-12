import React from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error?: string | null;
  systemStatus?: {
    database: 'online' | 'offline' | 'error';
    nodeRed: 'online' | 'offline' | 'error';
    sensors: number;
    activeAlerts: number;
    lastUpdate: Date;
  } | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  error,
  systemStatus
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-gray-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Connected to Node-RED' : 'Disconnected'}
            </span>
          </div>

          {systemStatus && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className={getStatusColor(systemStatus.database)}>
                  {getStatusIcon(systemStatus.database)}
                </span>
                <span className="text-gray-600">Database</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className={getStatusColor(systemStatus.nodeRed)}>
                  {getStatusIcon(systemStatus.nodeRed)}
                </span>
                <span className="text-gray-600">Node-RED</span>
              </div>

              <div className="text-gray-600">
                {systemStatus.sensors} sensors active
              </div>

              {systemStatus.activeAlerts > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{systemStatus.activeAlerts} alerts</span>
                </div>
              )}
            </div>
          )}
        </div>

        {systemStatus && (
          <div className="text-xs text-gray-500">
            Last update: {systemStatus.lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};