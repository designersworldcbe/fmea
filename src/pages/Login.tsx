import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // WARNING: This is a hardcoded credential check for a specific user.
    // This is not a production-secure authentication mechanism.
    if (email !== 'gokul@gkcorpz.com') {
      setError('Access denied. Only gokul@gkcorpz.com is allowed.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white rounded-lg py-2 font-bold hover:bg-emerald-700 transition-all flex items-center justify-center"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
        </button>
      </form>
    </div>
  );
}
