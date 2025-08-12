// API service for Node-RED integration
export interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  apiKey?: string;
  enableMockData?: boolean;
}

// Default configuration - update these URLs to match your Node-RED setup
const defaultConfig: ApiConfig = {
  // baseUrl: import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1` : 'http://localhost:1880/api',
  baseUrl: 'http://localhost:1880/api',
  wsUrl: 'ws://localhost:1880/ws/test',
  apiKey: import.meta.env.VITE_API_KEY,
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA !== 'false'
};

// Mock data for when Node-RED is not available
const mockSensorData = [
  { id: 'temp-1', type: 'temperature', value: 22.5, unit: '°C', location: 'Conference Room A', timestamp: new Date().toISOString(), status: 'normal' },
  { id: 'hum-1', type: 'humidity', value: 45, unit: '%', location: 'Conference Room A', timestamp: new Date().toISOString(), status: 'normal' },
  { id: 'co2-1', type: 'co2', value: 400, unit: 'ppm', location: 'Conference Room A', timestamp: new Date().toISOString(), status: 'normal' },
  { id: 'noise-1', type: 'noise', value: 35, unit: 'dB', location: 'Conference Room A', timestamp: new Date().toISOString(), status: 'normal' },
  { id: 'presence-1', type: 'presence', value: 3, unit: 'people', location: 'Conference Room A', timestamp: new Date().toISOString(), status: 'normal' }
];

const mockControls = [
  { id: 'light-1', type: 'light', name: 'Conference Room Lights', location: 'Conference Room A', status: true, value: 75 },
  { id: 'door-1', type: 'door', name: 'Main Entrance', location: 'Lobby', status: false },
  { id: 'ac-1', type: 'ac', name: 'HVAC System', location: 'Conference Room A', status: true, value: 22 }
];

const mockAlerts = [
  { id: 'alert-1', type: 'warning', message: 'Temperature slightly elevated', location: 'Server Room', timestamp: new Date().toISOString(), acknowledged: false }
];

const mockAccessLogs = [
  { id: 'log-1', userId: 'user1', userName: 'John Doe', action: 'door_unlock', location: 'Main Entrance', timestamp: new Date().toISOString(), success: true }
];

const mockSystemStatus = {
  database: 'offline',
  nodeRed: 'offline',
  sensors: 5,
  activeAlerts: 1,
  lastUpdate: new Date().toISOString()
};

export class NodeRedApiService {
  private config: ApiConfig;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isNodeRedAvailable = true;

  constructor(config: ApiConfig = defaultConfig) {
    this.config = config;
  }

  // HTTP API methods for Node-RED endpoints
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    // If Node-RED is not available and mock data is enabled, return mock data
    if (!this.isNodeRedAvailable && this.config.enableMockData) {
      return this.getMockData(endpoint);
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // if (this.config.apiKey) {
    //   headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    // }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.isNodeRedAvailable = true;
      return await response.json();
    } catch (error) {
      console.warn(`Node-RED not available for ${endpoint}, using mock data`);
      this.isNodeRedAvailable = false;

      if (this.config.enableMockData) {
        return this.getMockData(endpoint);
      }

      throw error;
    }
  }

  private getMockData(endpoint: string) {
    switch (endpoint) {
      case '/sensors':
        return mockSensorData;
      case '/controls':
        return mockControls;
      case '/alerts':
        return mockAlerts;
      case '/system_status':
        return mockSystemStatus;
      default:
        if (endpoint.includes('/access_logs')) {
          return mockAccessLogs;
        }
        return {};
    }
  }

  // Sensor data endpoints
  async getSensorData() {
    return this.makeRequest('/sensors');
  }

  async getSensorHistory(sensorId: string, timeRange: string = '24h') {
    return this.makeRequest(`/sensors/${sensorId}/history?range=${timeRange}`);
  }

  // Room control endpoints
  async getRoomControls() {
    return this.makeRequest('/controls');
  }

  async updateRoomControl(controlId: string, status: boolean, value?: number) {
    if (!this.isNodeRedAvailable && this.config.enableMockData) {
      console.log(`Mock: Updating control ${controlId} to ${status}`);
      return { success: true };
    }

    return this.makeRequest(`/controls/${controlId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, value })
    });
  }

  // Alert endpoints
  async getAlerts() {
    return this.makeRequest('/alerts');
  }

  async acknowledgeAlert(alertId: string) {
    if (!this.isNodeRedAvailable && this.config.enableMockData) {
      console.log(`Mock: Acknowledging alert ${alertId}`);
      return { success: true };
    }

    return this.makeRequest(`/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    });
  }

  // Access logs
  async getAccessLogs(limit: number = 50) {
    return this.makeRequest(`/access_logs?limit=${limit}`);
  }

  // System status
  async getSystemStatus() {
    return this.makeRequest('/system_status');
  }

  // WebSocket connection for real-time data
  connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    // If Node-RED is not available, don't attempt WebSocket connection
    if (!this.isNodeRedAvailable && this.config.enableMockData) {
      console.log('Node-RED not available, skipping WebSocket connection');
      return;
    }

    try {
      this.ws = new WebSocket(this.config.wsUrl);

      // this.ws.onopen = () => {
      //   console.log('WebSocket connected to Node-RED');
      //   this.reconnectAttempts = 0;
      //   this.isNodeRedAvailable = true;

      //   // Subscribe to real-time updates
      //   this.ws?.send(JSON.stringify({
      //     type: 'subscribe',
      //     topics: ['sensors', 'controls', 'alerts', 'access-logs']
      //   }));
      // };


      this.ws.onopen = () => {
        console.log('WebSocket connected to Node-RED');
        this.reconnectAttempts = 0;
        this.isNodeRedAvailable = true;

        // Wait a moment to ensure connection is fully open
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'subscribe',
              topics: ['sensors', 'controls', 'alerts', 'access_logs']
            }));
          } else {
            console.warn('WebSocket not open when trying to send subscribe');
          }
        }, 100); // Delay by 100ms
      };







      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
          console.log("Message from websocket", event.data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected from Node-RED');
        this.isNodeRedAvailable = false;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(onMessage, onError);
        } else {
          console.log('Max reconnection attempts reached, switching to mock data mode');
        }
      };

      this.ws.onerror = (error) => {
        console.warn('WebSocket connection failed, Node-RED may not be available');
        this.isNodeRedAvailable = false;

        if (onError) {
          onError(error);
        }
      };
    } catch (error) {
      console.warn('Failed to create WebSocket connection to Node-RED:', error);
      this.isNodeRedAvailable = false;

      if (onError) {
        onError(error as Event);
      }
    }
  }

  private attemptReconnect(onMessage: (data: any) => void, onError?: (error: Event) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connectWebSocket(onMessage, onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached for Node-RED connection');
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Send commands to Node-RED
  sendCommand(command: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'command',
        command,
        payload,
        timestamp: new Date().toISOString()
      }));
    } else if (!this.isNodeRedAvailable && this.config.enableMockData) {
      console.log(`Mock command sent: ${command}`, payload);
    } else {
      console.warn('WebSocket not connected to Node-RED, cannot send command');
    }
  }





  // Check if Node-RED is available
  isConnected() {
    return this.isNodeRedAvailable;
  }
}

// Export singleton instance
export const nodeRedApi = new NodeRedApiService();