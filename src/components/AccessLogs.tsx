import React from 'react';
import { Shield, User, Clock, CheckCircle, XCircle } from 'lucide-react';

interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  location: string;
  timestamp: Date;
  success: boolean;
}

interface AccessLogsProps {
  logs: AccessLog[];
}

export const AccessLogs: React.FC<AccessLogsProps> = ({ logs }) => {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'door_unlock':
      case 'door_lock':
        return <Shield className="w-4 h-4" />;
      case 'login':
      case 'logout':
        return <User className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Access Logs</h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No access logs available</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                log.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  log.success 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {getActionIcon(log.action)}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {log.userName}
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-700">
                      {formatAction(log.action)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{log.location}</span>
                    <span>•</span>
                    <span>{log.timestamp.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-1 ${
                log.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {log.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {log.success ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {logs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {logs.length} recent entries</span>
            <span>Auto-refreshing every 30 seconds</span>
          </div>
        </div>
      )}
    </div>
  );
};