import { useState } from "react";
import { motion } from "framer-motion";
import { login, register } from "@/lib/auth";

interface Props {
  onAuth: (username: string) => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = mode === 'login'
      ? login(username, password)
      : register(username, password);

    if (result.success) {
      onAuth(username);
    } else {
      setError(result.error || 'Something went wrong');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <h1 className="text-5xl font-display font-bold text-foreground mb-2 text-center tracking-tight">
          Math<span className="text-primary">Sprint</span>
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-mono block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 font-mono text-foreground focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-mono block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 font-mono text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive text-xs font-mono"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-bold text-lg hover:opacity-90 transition-opacity"
          >
            {mode === 'login' ? 'Log In' : 'Register'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-primary hover:underline font-semibold"
          >
            {mode === 'login' ? 'Register' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
