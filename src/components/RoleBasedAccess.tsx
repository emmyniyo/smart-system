import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface RoleBasedAccessProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  resource,
  action,
  children,
  fallback,
  showMessage = false
}) => {
  const { hasPermission, user, getRoleDisplayName } = useAuth();

  const hasAccess = hasPermission(resource, action);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showMessage) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">
              Accès restreint
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              Votre rôle ({user ? getRoleDisplayName(user.role) : 'Non connecté'}) ne permet pas 
              l'action "{action}" sur "{resource}".
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Composant pour afficher les permissions d'un utilisateur
export const UserPermissions: React.FC = () => {
  const { user, permissions, getRoleDisplayName } = useAuth();

  if (!user) return null;

  const userPermissions = permissions.filter(p => p.role === user.role);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Permissions - {getRoleDisplayName(user.role)}
        </h3>
      </div>

      <div className="space-y-4">
        {userPermissions.map((permission) => (
          <div key={`${permission.role}-${permission.resource}`} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 capitalize">
              {permission.resource.replace('_', ' ')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {permission.actions.map((action) => (
                <span
                  key={action}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {userPermissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune permission spécifique assignée</p>
        </div>
      )}
    </div>
  );
};