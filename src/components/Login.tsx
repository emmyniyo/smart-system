import React, { useState } from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginFormProps {
  onLoginSuccess: (result: any) => void;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(error);

  const {login} = useAuth(); // Assuming useAuth provides a login function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(undefined);
    try {
      const user = await login(email, password);
      if (user) {
        onLoginSuccess(user); // Let parent handle dashboard redirect
      } else {
        setFormError("Identifiants invalides.");
      }
    } catch (err) {
      setFormError("Erreur de connexion au serveur.");
    } finally {
      setSubmitting(false);
    }
    // try {
    //   const res = await fetch('http://localhost:1880/api/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, password }),
    //   });
    //   const data = await res.json();

    //   if (data.success && data.user) {
    //     if (data.user.role === 'admin') {
    //       onLoginSuccess(data.user); // Let parent handle dashboard redirect
    //     } else if (data.user.role === 'technician') {
    //       window.location.href = 'http://localhost:1880/ui/#!/1?socketid=51tteHmOHdxQk3eDAAAD';
    //     } else {
    //       setFormError("Rôle non supporté.");
    //     }
    //   } else {
    //     setFormError(data.message || "Identifiants invalides.");
    //   }
    // } catch (err) {
    //   setFormError("Erreur de connexion au serveur.");
    // } finally {
    //   setSubmitting(false);
    // }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      autoComplete="off"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
        <input
          type="email"
          className="w-full border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 text-gray-900 bg-gray-50 transition"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
          required
          placeholder="Entrer votre email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <input
          type="password"
          className="w-full border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-3 py-2 text-gray-900 bg-gray-50 transition"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="Entrer votre mot de passe"
        />
      </div>
      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {formError || error}
        </div>
      )}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
        disabled={submitting}
      >
        {submitting && <Activity className="w-4 h-4 animate-spin" />}
        {submitting ? 'Connexion...' : 'Se connecter'}
      </button>
      <div className="text-xs text-gray-400 text-center mt-2">
        <span>Démo : </span>
        <span className="font-semibold text-gray-600">test@gmail.com</span> / <span className="font-semibold text-gray-600">test</span>
      </div>
    </form>
  );
};

export default LoginForm;