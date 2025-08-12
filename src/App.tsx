import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Thermometer, 
  Droplets, 
  Wind, 
  Volume2, 
  Users, 
  Lightbulb, 
  DoorOpen, 
  AlertTriangle,
  Settings,
  BarChart3,
  Shield,
  Bell,
  ChevronDown,
  Power,
  Lock,
  Unlock,
  Activity,
  User
} from 'lucide-react';
import { useNodeRedData } from './hooks/useNodeRedData';
import { useAuth } from './hooks/useAuth';
import { ConnectionStatus } from './components/ConnectionStatus';
import { AccessLogs } from './components/AccessLogs';
import { UserProfile } from './components/UserProfile';
import { UserPermissions, RoleBasedAccess } from './components/RoleBasedAccess';
import LoginForm from './components/Login';
// Import types from the hook
import type { SensorData, RoomControl, Alert } from './hooks/useNodeRedData';

// Components
const SensorCard: React.FC<{ sensor: SensorData }> = ({ sensor }) => {
  const getIcon = () => {
    switch (sensor.type) {
      case 'temperature': return <Thermometer className="w-5 h-5" />;
      case 'humidity': return <Droplets className="w-5 h-5" />;
      case 'co2': return <Wind className="w-5 h-5" />;
      case 'noise': return <Volume2 className="w-5 h-5" />;
      case 'presence': return <Users className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  console.log("sensor status", sensor);
  const getStatusColor = () => {
    switch (sensor.status) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'warning': return 'text-yellow-500 bg-yellow-50';
      default: return 'text-green-500 bg-green-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${getStatusColor()}`}>
          {getIcon()}
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor()}`}>
          {sensor.status.toUpperCase()}
        </div>
      </div>
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">
          {sensor.value} {sensor.unit}
        </div>
        <div className="text-sm text-gray-500 capitalize">
          {sensor.type.replace('co2', 'CO₂')}
        </div>
      </div>
      <div className="text-xs text-gray-400">
        {sensor.location}
      </div>
    </div>
  );
};

const RoomControlCard: React.FC<{ 
  control: RoomControl, 
  onToggle: (id: string) => void 
}> = ({ control, onToggle }) => {
  const getIcon = () => {
    switch (control.type) {
      case 'light': return <Lightbulb className="w-5 h-5" />;
      case 'door': return control.status ? <DoorOpen className="w-5 h-5" /> : <Lock className="w-5 h-5" />;
      case 'ac': return <Wind className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${control.status ? 'text-green-500 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
          {getIcon()}
        </div>
        <button
          onClick={() => onToggle(control.id)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            control.status 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          disabled={false} // You can add loading state here
        >
          <Power className="w-4 h-4" />
          {control.status ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="mb-2">
        <div className="text-lg font-semibold text-gray-900">
          {control.name}
        </div>
        {control.value && (
          <div className="text-sm text-gray-600">
            {control.type === 'light' ? `${control.value}% brightness` : `${control.value}°C`}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-400">
        {control.location}
      </div>
    </div>
  );
};

const AlertCard: React.FC<{ 
  alert: Alert, 
  onAcknowledge: (id: string) => void 
}> = ({ alert, onAcknowledge }) => {
  const getTypeColor = () => {
    switch (alert.type) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getTypeIcon = () => {
    switch (alert.type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 mb-4 ${getTypeColor()} ${alert.acknowledged ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {getTypeIcon()}
          <div>
            <div className="font-medium text-gray-900 mb-1">
              {alert.message}
            </div>
            <div className="text-sm text-gray-600">
              {alert.location} • {alert.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
};

const Sidebar: React.FC<{ 
  activeTab: string, 
  onTabChange: (tab: string) => void,
  userRole: string,
  onLogout?: () => void
}> = ({ activeTab, onTabChange, userRole, onLogout }) => {
  const { canRead } = useAuth();
  
  // const tabs = [
  //   { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  //   { id: 'sensors', label: 'Capteurs', icon: Thermometer, requiresPermission: { resource: 'sensors', action: 'read' } },
  //   { id: 'controls', label: 'Contrôles', icon: Settings, requiresPermission: { resource: 'controls', action: 'read' } },
  //   { id: 'alerts', label: 'Alertes', icon: Bell, requiresPermission: { resource: 'alerts', action: 'read' } },
  //   { id: 'access', label: 'Logs d\'accès', icon: Shield, requiresPermission: { resource: 'access_logs', action: 'read' } },
  //   { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  //   { id: 'profile', label: 'Profil', icon: User },
  //   { id: 'admin', label: 'Admin', icon: Shield, requiresPermission: { resource: 'users', action: 'read' } }
  // ];


  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'sensors', label: 'Capteurs', icon: Thermometer },
    { id: 'controls', label: 'Contrôles', icon: Settings },
    { id: 'alerts', label: 'Alertes', icon: Bell },
    { id: 'access', label: 'Logs d\'accès', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profil', icon: User },
    // Admin tab is always visible for now
    { id: 'admin', label: 'Admin', icon: Shield }
  ];
  
  const visibleTabs = tabs.filter(tab => {
    // if (!tab.requiresPermission) return true;
    // return canRead(tab.requiresPermission.resource);
    return true; // For now, show all tabs
  });

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-6 flex flex-col">
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Building2 className="w-8 h-8 text-blue-400" />
          <h1 className="text-xl font-bold">SmartBuilding</h1>
        </div>
        
        <nav className="space-y-2">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-2">Rôle actuel</div>
          <div className="text-sm text-gray-300 capitalize">{userRole}</div>
        </div>
      </div>

      <div className="mt-auto">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <Power className="w-5 h-5" />
            Déconnexion
          </button>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ 
  sensors: SensorData[], 
  controls: RoomControl[], 
  alerts: Alert[],
  isConnected: boolean
}> = ({ sensors, controls, alerts, isConnected }) => {
  const criticalAlerts = alerts.filter(a => a.type === 'critical' && !a.acknowledged);
  const tempSensors = sensors.filter(s => s.type === 'temperature');
  const humSensors = sensors.filter(s => s.type === 'humidity');
  const avgTemp = tempSensors.length > 0 ? tempSensors.reduce((acc, s) => acc + s.value, 0) / tempSensors.length : 0;
  const avgHumidity = humSensors.length > 0 ? humSensors.reduce((acc, s) => acc + s.value, 0) / humSensors.length : 0;
  const totalPeople = sensors.filter(s => s.type === 'presence').reduce((acc, s) => acc + s.value, 0);

    const toggleStatus = (id: string) => {
    // setControls(prev =>
    //   prev.map(control =>
    //     control.id === id ? { ...control, status: !control.status } : control
    //   )
    // );
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 ${!isConnected ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{avgTemp.toFixed(1)}°C</div>
              <div className="text-blue-100">Avg Temperature</div>
            </div>
            <Thermometer className="w-8 h-8 text-blue-200" />
          </div>
          {!isConnected && (
            <div className="mt-2 text-xs text-blue-200">Offline</div>
          )}
        </div>
        
        <div className={`bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 ${!isConnected ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{avgHumidity.toFixed(1)}%</div>
              <div className="text-green-100">Avg Humidity</div>
            </div>
            <Droplets className="w-8 h-8 text-green-200" />
          </div>
          {!isConnected && (
            <div className="mt-2 text-xs text-green-200">Offline</div>
          )}
        </div>
        
        <div className={`bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 ${!isConnected ? 'opacity-60' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{totalPeople}</div>
              <div className="text-purple-100">People Present</div>
            </div>
            <Users className="w-8 h-8 text-purple-200" />
          </div>
          {!isConnected && (
            <div className="mt-2 text-xs text-purple-200">Offline</div>
          )}
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{criticalAlerts.length}</div>
              <div className="text-red-100">Critical Alerts</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Sensor Data</h3>
          <div className="space-y-3">
            {sensors.slice(0, 5).map(sensor => (
              <div key={sensor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${sensor.status === 'critical' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {sensor.type === 'temperature' && <Thermometer className="w-4 h-4" />}
                    {sensor.type === 'humidity' && <Droplets className="w-4 h-4" />}
                    {sensor.type === 'co2' && <Wind className="w-4 h-4" />}
                    {sensor.type === 'noise' && <Volume2 className="w-4 h-4" />}
                    {sensor.type === 'presence' && <Users className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-medium">{sensor.location}</div>
                    <div className="text-sm text-gray-500 capitalize">{sensor.type.replace('co2', 'CO₂')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{sensor.value} {sensor.unit}</div>
                  <div className={`text-xs ${sensor.status === 'critical' ? 'text-red-600' : 'text-green-600'}`}>
                    {/* {sensor.status.toUpperCase()} */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-3">
            {controls.slice(0, 5).map(control => (
              <div key={control.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${control.status ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {control.type === 'light' && <Lightbulb className="w-4 h-4" />}
                    {control.type === 'door' && (control.status ? <DoorOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />)}
                    {control.type === 'ac' && <Wind className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-medium">{control.name}</div>
                    <div className="text-sm text-gray-500">{control.location}</div>
                  </div>
                </div>
                {/* <div className={`px-2 py-1 rounded text-xs font-medium ${
                  control.status 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {control.status ? 'ON' : 'OFF'}
                </div> */}
                <button
            onClick={() => toggleStatus(control.id)}
            className={`px-4 py-1 rounded-full text-sm font-semibold focus:outline-none transition-colors duration-200 ${
              control.status
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
            }`}
          >
            {control.status ? 'ON' : 'OFF'}
          </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginError, setLoginError] = useState<string | undefined>(undefined);

  // Use authentication hook
  const { setPermissions,setUser,user, loading: authLoading, getRoleDisplayName, login, logout } = useAuth();

  // Use the Node-RED data hook
  const {
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
  } = useNodeRedData();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Chargement de l'authentification...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Use the login function from useAuth and handle errors
    const handleLogin = async (result: any) => {
      
      // const result = await login(email, password);
      if (!result?.success) {
        setLoginError(result?.message || "Email ou mot de passe incorrect.");
      } else {
        console.log("Login successful:", result);
        setUser(result.user);
        // setPermissions(result.permissions || []);
        setActiveTab('dashboard');
        setLoginError(undefined);
    
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Building2 className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">SmartBuilding IoT</h1>
            <p className="text-gray-600">Tableau de bord intelligent</p>
          </div>
          <LoginForm onLoginSuccess={handleLogin} error={loginError} />
        </div>z
      </div>
    );
  }


  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Connecting to Node-RED...</span>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard sensors={sensors} controls={controls} alerts={alerts} isConnected={isConnected} />;
      
      case 'sensors':
        return (
          <RoleBasedAccess resource="sensors" action="read" showMessage>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Surveillance des capteurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensors.map(sensor => (
                  <SensorCard key={sensor.id} sensor={sensor} />
                ))}
              </div>
              {sensors.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Thermometer className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Aucune donnée de capteur disponible</p>
                  <p className="text-sm">Vérifiez votre connexion Node-RED</p>
                </div>
              )}
            </div>
          </RoleBasedAccess>
        );
      
      case 'controls':
        return (
          <RoleBasedAccess resource="controls" action="read" showMessage>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Contrôles des salles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {controls.map(control => (
                  <RoleBasedAccess key={control.id} resource="controls" action="write" fallback={
                    <RoomControlCard control={control} onToggle={() => {}} />
                  }>
                    <RoomControlCard control={control} onToggle={toggleControl} />
                  </RoleBasedAccess>
                ))}
              </div>
              {controls.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Aucun contrôle disponible</p>
                  <p className="text-sm">Vérifiez votre connexion Node-RED</p>
                </div>
              )}
            </div>
          </RoleBasedAccess>
        );
      
      case 'alerts':
        return (
          <RoleBasedAccess resource="alerts" action="read" showMessage>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Alertes système</h2>
              <div>
                {alerts.map(alert => (
                  <RoleBasedAccess key={alert.id} resource="alerts" action="acknowledge" fallback={
                    <AlertCard alert={alert} onAcknowledge={() => {}} />
                  }>
                    <AlertCard alert={alert} onAcknowledge={acknowledgeAlert} />
                  </RoleBasedAccess>
                ))}
              </div>
              {alerts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Aucune alerte</p>
                  <p className="text-sm">Tous les systèmes fonctionnent normalement</p>
                </div>
              )}
            </div>
          </RoleBasedAccess>
        );
      
      case 'access':
        return (
          <RoleBasedAccess resource="access_logs" action="read" showMessage>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Journaux d'accès</h2>
              <AccessLogs logs={accessLogs} />
            </div>
          </RoleBasedAccess>
        );
      
      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Profil utilisateur</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserProfile />
              <UserPermissions />
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analyses et rapports</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Consommation d'énergie</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Le graphique de consommation d'énergie apparaîtrait ici</p>
                    <p className="text-sm mt-1">Connectez-vous à Node-RED pour les données en direct</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Tendances d'occupation</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2" />
                    <p>Le graphique des tendances d'occupation apparaîtrait ici</p>
                    <p className="text-sm mt-1">Connectez-vous à Node-RED pour les données en direct</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'admin':
        return (
          <RoleBasedAccess resource="users" action="read" showMessage>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Panneau d'administration</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Gestion des utilisateurs</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Utilisateur Admin</div>
                        <div className="text-sm text-gray-500">admin@smartbuilding.com</div>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Administrateur</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Gestionnaire d'installations</div>
                        <div className="text-sm text-gray-500">technicien@smartbuilding.com</div>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Technicien</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">État du système</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>État de la base de données</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        systemStatus?.database === 'online' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {systemStatus?.database === 'online' ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Réseau de capteurs</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        systemStatus?.nodeRed === 'online' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {systemStatus?.nodeRed === 'online' ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>WebSocket Connection</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        isConnected 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isConnected ? 'Connecté' : 'Déconnecté'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Capteurs actifs</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {systemStatus?.sensors || sensors.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RoleBasedAccess>
        );
      
      default:
        return <Dashboard sensors={sensors} controls={controls} alerts={alerts} isConnected={isConnected} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userRole={getRoleDisplayName(user.role)}
        onLogout={logout}
      />
      <div className="flex-1 p-8">
        <ConnectionStatus 
          isConnected={isConnected} 
          error={error} 
          systemStatus={systemStatus} 
        />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;