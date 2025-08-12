import { useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  role: 'administrator' | 'technician' | 'employee' | 'guest';
  permissions: Record<string, string[]>;
  created_at: string;
  role_assigned_at?: string;
  role_updated_at?: string;
}

export interface Permission {
  role: string;
  resource: string;
  actions: string[];
}

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock authentication for demo purposes
  // In a real app, this would integrate with Supabase Auth
  const mockUser: UserProfile = {
    id: 'demo-user-123',
    email: 'admin@smartbuilding.com',
    role: 'administrator',
    permissions: {},
    created_at: new Date().toISOString(),
    role_assigned_at: new Date().toISOString(),
    role_updated_at: new Date().toISOString()
  };

  const mockPermissions: Permission[] = [
    { role: 'administrator', resource: 'sensors', actions: ['read', 'write', 'delete', 'manage'] },
    { role: 'administrator', resource: 'controls', actions: ['read', 'write', 'delete', 'manage'] },
    { role: 'administrator', resource: 'alerts', actions: ['read', 'write', 'delete', 'acknowledge', 'manage'] },
    { role: 'administrator', resource: 'access_logs', actions: ['read', 'write', 'delete', 'manage'] },
    { role: 'administrator', resource: 'system_status', actions: ['read', 'write', 'manage'] },
    { role: 'administrator', resource: 'users', actions: ['read', 'write', 'delete', 'manage'] },
  ];

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setError(null);
      // Optionally, check for persisted user here
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!user) return false;
    const resourcePermissions = permissions.find(
      p => p.role === user.role && p.resource === resource
    );
    return resourcePermissions?.actions.includes(action) || false;
  }, [user, permissions]);

  const canRead = useCallback((resource: string) => hasPermission(resource, 'read'), [hasPermission]);
  const canWrite = useCallback((resource: string) => hasPermission(resource, 'write'), [hasPermission]);
  const canDelete = useCallback((resource: string) => hasPermission(resource, 'delete'), [hasPermission]);
  const canManage = useCallback((resource: string) => hasPermission(resource, 'manage'), [hasPermission]);

  const getRoleDisplayName = (role: string): string => {
    const roleNames = {
      administrator: 'Administrateur',
      technician: 'Technicien',
      employee: 'Employé',
      guest: 'Invité'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string): string => {
    const roleColors = {
      administrator: 'bg-red-100 text-red-800',
      technician: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800',
      guest: 'bg-gray-100 text-gray-800'
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
  };

  // --- API login integration ---
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:1880/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (data.success && data.user) {
        // Map API user role to your app roles if needed
        let mappedRole = data.user.role;
        if (mappedRole === 'admin') mappedRole = 'administrator';
        // You may want to map permissions here as well if your API returns them

        const loginUser: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          // name: data.user.name,
          role: 'administrator', // Use mappedRole if needed
          permissions: {}, // Fill if your API returns permissions
          created_at: new Date().toISOString(),
        };

        console.log("this is the response from the useAuth: ", data);
        // setUser(loginUser);
        setPermissions(mockPermissions); // Or fetch from API if available

        // Redirect based on role
        if (data.user.role === 'technician') {
          window.location.href = 'http://localhost:1880/ui/#!/1?socketid=51tteHmOHdxQk3eDAAAD';
        }
        // For admin, stay in dashboard (handled by App)
        return {
          success: true, user: loginUser,
          permissions: mockPermissions  // Or fetch from API if available
         };
      } else {
        console.log('Login response:', data);
      
        setError(data.message || "Identifiants invalides.");
        return { success: false, message: data.message || "Identifiants invalides." };
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
      return { success: false, message: "Erreur de connexion au serveur." };
    } finally {
      setLoading(false);
    }
  }, [setUser, setPermissions]);

  // --- Logout ---
  const logout = useCallback(() => {
    setUser(null);
    setPermissions([]);
    setError(null);
    // Optionally, clear persisted user
  }, []);

  return {
    user,
    setUser,
    setPermissions,
    permissions,
    loading,
    hasPermission,
    error,
    login,
    logout,
    canRead,
    canWrite,
    canDelete,
    canManage,
    getRoleDisplayName,
    getRoleColor,
  };
};