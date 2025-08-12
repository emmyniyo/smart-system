import { useState, useEffect, useCallback } from 'react';
import { nodeRedApi } from '../services/api';

export interface SensorData {
  id: string;
  type: string;
  value: number;
  unit: string;
  location: string;
  timestamp: Date;
  status:  string;
}

export interface RoomControl {
  id: string;
  type: 'light' | 'door' | 'ac';
  name: string;
  location: string;
  status: boolean;
  value?: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  location: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  location: string;
  timestamp: Date;
  success: boolean;
}

export interface SystemStatus {
  database: 'online' | 'offline' | 'error';
  nodeRed: 'online' | 'offline' | 'error';
  sensors: number;
  activeAlerts: number;
  lastUpdate: Date;
}

export const useNodeRedData = () => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [controls, setControls] = useState<RoomControl[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle real-time WebSocket messages from Node-RED
  const handleWebSocketMessage = useCallback((data: any) => {
    try {
      switch (data.type) {
        case 'sensor_update':
          setSensors(prev => {
            const updated = [...prev];
            const index = updated.findIndex(s => s.id === data.payload.id);
            if (index >= 0) {
              updated[index] = {
                ...data.payload,
                timestamp: new Date(data.payload.timestamp)
              };
            } else {
              updated.push({
                ...data.payload,
                timestamp: new Date(data.payload.timestamp)
              });
            }
            return updated;
          });
          break;

        case 'control_update':
          setControls(prev => {
            const updated = [...prev];
            const index = updated.findIndex(c => c.id === data.payload.id);
            if (index >= 0) {
              updated[index] = { ...updated[index], ...data.payload };
            }
            return updated;
          });
          break;

        case 'new_alert':
          setAlerts(prev => [{
            ...data.payload,
            timestamp: new Date(data.payload.timestamp)
          }, ...prev]);
          break;

        case 'alert_acknowledged':
          setAlerts(prev => prev.map(alert => 
            alert.id === data.payload.id 
              ? { ...alert, acknowledged: true }
              : alert
          ));
          break;

        case 'access_log':
          setAccessLogs(prev => [{
            ...data.payload,
            timestamp: new Date(data.payload.timestamp)
          }, ...prev.slice(0, 49)]); // Keep only last 50 logs
          break;

        case 'system_status':
          setSystemStatus({
            ...data.payload,
            lastUpdate: new Date(data.payload.lastUpdate)
          });
          break;

        case 'bulk_update':
          // Handle bulk updates from Node-RED
          if (data.payload.sensors) {
            setSensors(data.payload.sensors.map((s: any) => ({
              ...s,
              timestamp: new Date(s.timestamp)
            })));
          }
          if (data.payload.controls) {
            setControls(data.payload.controls);
          }
          if (data.payload.alerts) {
            setAlerts(data.payload.alerts.map((a: any) => ({
              ...a,
              timestamp: new Date(a.timestamp)
            })));
          }
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, []);

  // Handle WebSocket errors
  const handleWebSocketError = useCallback((error: Event) => {
    setIsConnected(false);
    setError('Connection to Node-RED lost. Attempting to reconnect...');
  }, []);

  // Initialize data and WebSocket connection
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load initial data from Node-RED
        const [sensorsData, controlsData, alertsData, accessLogsData, statusData] = await Promise.allSettled([
          nodeRedApi.getSensorData(),
          nodeRedApi.getRoomControls(),
          nodeRedApi.getAlerts(),
          nodeRedApi.getAccessLogs(),
          nodeRedApi.getSystemStatus()
        ]);
        console.log("sensor data", sensorsData);

        if (sensorsData.status === 'fulfilled') {
          setSensors(sensorsData.value.map((s: any) => ({
            ...s,
            timestamp: new Date(s.timestamp)
          })));
        }

        if (controlsData.status === 'fulfilled') {
          setControls(controlsData.value);
        }

        if (alertsData.status === 'fulfilled') {
          setAlerts(alertsData.value.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp)
          })));
        }

        if (accessLogsData.status === 'fulfilled') {
          setAccessLogs(accessLogsData.value.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          })));
        }

        if (statusData.status === 'fulfilled') {
          setSystemStatus({
            ...statusData.value,
            lastUpdate: new Date(statusData.value.lastUpdate)
          });
        }

        // Connect WebSocket for real-time updates
        nodeRedApi.connectWebSocket(handleWebSocketMessage, handleWebSocketError);
        setIsConnected(nodeRedApi.isConnected());
        
        // If Node-RED is not available, show a warning but don't treat it as an error
        if (!nodeRedApi.isConnected()) {
          setError('Node-RED not available - running in demo mode with mock data');
        }

      } catch (error) {
        console.warn('Failed to initialize Node-RED connection:', error);
        setError('Node-RED not available - running in demo mode with mock data');
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup on unmount
    return () => {
      nodeRedApi.disconnectWebSocket();
    };
  }, [handleWebSocketMessage, handleWebSocketError]);

  // Control functions
  const toggleControl = useCallback(async (controlId: string) => {
    try {
      const control = controls.find(c => c.id === controlId);
      if (!control) return;

      const newStatus = !control.status;
      
      // Optimistically update UI
      setControls(prev => prev.map(c => 
        c.id === controlId ? { ...c, status: newStatus } : c
      ));


       console.log("Our request to the web socket",{
        controlId,
        status: newStatus,
        timestamp: new Date().toISOString()
      });
      
      // Send command to Node-RED
      // await nodeRedApi.updateRoomControl(controlId, newStatus, control.value);
      



      // Also send via WebSocket for immediate response
      nodeRedApi.sendCommand('toggle_control', {
        controlId,
        status: newStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to toggle control:', error);
      // Revert optimistic update on error
      setControls(prev => prev.map(c => 
        c.id === controlId ? { ...c, status: !c.status } : c
      ));
    }
  }, [controls]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      // Optimistically update UI
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));

      // Send to Node-RED
      await nodeRedApi.acknowledgeAlert(alertId);
      
      // Also send via WebSocket
      nodeRedApi.sendCommand('acknowledge_alert', {
        alertId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      // Revert optimistic update on error
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: false } : alert
      ));
    }
  }, []);

  const sendCustomCommand = useCallback((command: string, payload: any) => {
    nodeRedApi.sendCommand(command, payload);
  }, []);

  return {
    sensors,
    controls,
    alerts,
    accessLogs,
    systemStatus,
    isConnected,
    loading,
    error,
    toggleControl,
    acknowledgeAlert,
    sendCustomCommand
  };
};