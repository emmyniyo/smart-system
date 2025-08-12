# IoT Smart Building Dashboard

A professional-grade web dashboard for monitoring and controlling IoT smart building systems, with built-in Supabase backend and Node-RED integration support.

## Features

- **Real-time Sensor Monitoring**: Temperature, humidity, CO₂, noise, and presence sensors
- **Room Controls**: Lights, doors, AC systems with remote control capabilities
- **Alert Management**: Real-time notifications with acknowledgment system
- **Access Logs**: Security monitoring and access tracking
- **Analytics Dashboard**: Historical data visualization and trends
- **Admin Panel**: System monitoring and user management
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Backend Options

### Option 1: Supabase Backend (Recommended)

The dashboard comes with a complete Supabase backend that provides:

- **PostgreSQL Database**: Fully configured with IoT-optimized schema
- **REST API**: Auto-generated API endpoints for all operations
- **Real-time Subscriptions**: Live data updates via WebSocket
- **Edge Functions**: Custom API logic for complex operations
- **Authentication**: Built-in user management (optional)
- **Row Level Security**: Secure data access policies

#### Supabase Setup:

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com and create a new project
   # Note your project URL and anon key
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your Supabase URL and anon key to .env
   ```

3. **Deploy Database Schema**
   - The migration file will automatically create all necessary tables
   - Sample data is included for immediate testing

4. **API Endpoints Available**:
   ```
   GET  /functions/v1/sensors              - Get all sensor data
   POST /functions/v1/sensors              - Update sensor data
   GET  /functions/v1/sensors/{id}/history - Get sensor history
   GET  /functions/v1/controls             - Get room controls
   PUT  /functions/v1/controls/{id}        - Update control status
   GET  /functions/v1/alerts               - Get alerts
   POST /functions/v1/alerts/{id}/acknowledge - Acknowledge alert
   GET  /functions/v1/access-logs          - Get access logs
   GET  /functions/v1/system-status        - Get system status
   ```

### Option 2: Node-RED Integration

This dashboard is designed to work with Node-RED as the backend integration layer. Node-RED handles:

- Database connections (MySQL, PostgreSQL, etc.)
- IoT device communication (MQTT, HTTP, WebSocket)
- Data processing and transformation
- Real-time data streaming to the dashboard

#### Required Node-RED Endpoints

The dashboard expects the following HTTP API endpoints:

```
GET  /api/sensors              - Get all sensor data
GET  /api/sensors/{id}/history - Get sensor historical data
GET  /api/controls             - Get all room controls
PUT  /api/controls/{id}        - Update room control status
GET  /api/alerts               - Get all alerts
POST /api/alerts/{id}/acknowledge - Acknowledge an alert
GET  /api/access-logs          - Get access logs
GET  /api/system/status        - Get system status
```

#### WebSocket Integration

Real-time updates are handled via WebSocket connection on `/ws` endpoint.

Expected message formats:

```javascript
// Sensor update
{
  "type": "sensor_update",
  "payload": {
    "id": "temp-room1",
    "type": "temperature",
    "value": 23.5,
    "unit": "°C",
    "location": "Conference Room A",
    "timestamp": "2025-01-27T10:30:00Z",
    "status": "normal"
  }
}

// Control update
{
  "type": "control_update",
  "payload": {
    "id": "light-room1",
    "status": true,
    "value": 75
  }
}

// New alert
{
  "type": "new_alert",
  "payload": {
    "id": "alert-001",
    "type": "critical",
    "message": "CO₂ levels exceed safe threshold",
    "location": "Server Room",
    "timestamp": "2025-01-27T10:30:00Z",
    "acknowledged": false
  }
}
```

## Quick Start with Supabase

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd iot-smart-building-dashboard
   npm install
   ```

2. **Set up Supabase** (click "Connect to Supabase" button in the top right)

3. **Start Development**
   ```bash
   npm run dev
   ```

## Setup Instructions

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd iot-smart-building-dashboard
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # For Supabase: Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   # For Node-RED: Add VITE_NODE_RED_API_URL and VITE_NODE_RED_WS_URL
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Configure Node-RED** (if using Node-RED option)
   - Set up your Node-RED flows to provide the required API endpoints
   - Configure WebSocket node for real-time updates
   - Connect to your MySQL database and IoT devices

The dashboard will automatically detect whether you're using Supabase or Node-RED based on your environment configuration.

## Node-RED Flow Examples

### Basic Sensor Data Flow
```
[MQTT In] → [Function: Parse Data] → [MySQL Insert] → [WebSocket Out]
```

### Control Command Flow
```
[HTTP In: PUT /api/controls/:id] → [Function: Validate] → [MQTT Out] → [HTTP Response]
```

### Alert Processing Flow
```
[Function: Check Thresholds] → [Switch: Alert Level] → [MySQL Insert] → [WebSocket Out]
```

## Database Schema

The dashboard expects the following data structure (adapt to your database):

### Sensors Table
```sql
CREATE TABLE sensors (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('temperature', 'humidity', 'co2', 'noise', 'presence'),
  value DECIMAL(10,2),
  unit VARCHAR(10),
  location VARCHAR(100),
  timestamp TIMESTAMP,
  status ENUM('normal', 'warning', 'critical')
);
```

### Controls Table
```sql
CREATE TABLE controls (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('light', 'door', 'ac'),
  name VARCHAR(100),
  location VARCHAR(100),
  status BOOLEAN,
  value INT
);
```

### Alerts Table
```sql
CREATE TABLE alerts (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('info', 'warning', 'critical'),
  message TEXT,
  location VARCHAR(100),
  timestamp TIMESTAMP,
  acknowledged BOOLEAN DEFAULT FALSE
);
```

## Customization

### Adding New Sensor Types
1. Update the `SensorData` interface in `src/hooks/useNodeRedData.ts`
2. Add new icons and styling in `SensorCard` component
3. Update Node-RED flows to handle new sensor types

### Custom Themes
Modify the Tailwind CSS classes in components to match your brand colors and styling preferences.

### Additional Features
The modular architecture makes it easy to add new features:
- Energy monitoring dashboards
- Predictive maintenance alerts
- Integration with building management systems
- Mobile app notifications

## Production Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy Static Files**
   Deploy the `dist` folder to your web server

3. **Configure Node-RED**
   - Set up production Node-RED instance
   - Configure SSL/TLS for WebSocket connections
   - Set up proper authentication and authorization

## Troubleshooting

### Connection Issues
- Verify Node-RED is running and accessible
- Check CORS settings in Node-RED
- Ensure WebSocket endpoint is properly configured

### Data Not Updating
- Check Node-RED flows are active
- Verify database connections
- Monitor browser console for errors

### Performance Issues
- Implement data pagination for large datasets
- Add caching layers in Node-RED
- Optimize WebSocket message frequency

## Support

For issues and questions:
1. Check the browser console for errors
2. Verify Node-RED flow configurations
3. Test API endpoints directly
4. Check database connectivity

## License

MIT License - see LICENSE file for details