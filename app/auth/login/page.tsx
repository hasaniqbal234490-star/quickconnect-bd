'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push('/chat');
      router.refresh();
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Welcome back
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        আপনার একাউন্টে সাইন ইন করুন
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-blue-500 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </>
  );
}
