import React from 'react';
import { User, Shield, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const UserProfile: React.FC = () => {
  const { user, getRoleDisplayName, getRoleColor, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user.email}</h3>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
              {getRoleDisplayName(user.role)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">ID Utilisateur:</span>
          <span className="font-mono text-xs text-gray-800">{user.id.slice(0, 8)}...</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Membre depuis:</span>
          <span className="text-gray-800">
            {new Date(user.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>

        {user.role_assigned_at && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Rôle assigné:</span>
            <span className="text-gray-800">
              {new Date(user.role_assigned_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
};