import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient.js';
import Button from '../components/ui/Button.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const emailTrimmed = email.trim();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: emailTrimmed, password });
      if (authError) throw authError;
      navigate('/scan');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600">
                ShipIQ
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                Home
              </Link>
              <Link to="/signup" className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 hover:scale-105 transition-all duration-200 shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-xl border bg-white dark:bg-slate-800 p-8 shadow-lg hover:scale-105 transition-all duration-200"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-slate-900 dark:text-white">Welcome back</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="text"
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              className="mt-1 w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button disabled={loading} type="submit" className="w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400 text-center">
          Don't have an account? <Link to="/signup" className="text-emerald-500 hover:text-emerald-600 hover:underline">Sign up</Link>
        </p>
      </motion.div>
      </div>
    </div>
  );
}


