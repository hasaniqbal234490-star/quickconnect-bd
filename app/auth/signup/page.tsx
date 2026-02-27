'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Copy, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generateUniqueId } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedId] = useState(() => generateUniqueId());
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(generatedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    // Sign up with Supabase Auth
    const { data, error: signupErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, unique_id: generatedId },
      },
    });

    if (signupErr) {
      setError(signupErr.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Insert profile
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        username,
        unique_id: generatedId,
      });

      if (profileErr) {
        setError(profileErr.message);
        setLoading(false);
        return;
      }

      router.push('/chat');
      router.refresh();
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Create Account
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        নতুন একাউন্ট তৈরি করুন
      </p>

      {/* Unique ID preview */}
      <div className="rounded-xl p-4 mb-6 border-2 border-blue-200 dark:border-blue-800"
        style={{ background: 'var(--accent-light)' }}>
        <p className="text-xs font-medium mb-2 text-blue-600 dark:text-blue-400">
          Your Unique QuickConnect ID
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold tracking-wider text-blue-700 dark:text-blue-300">
            {generatedId}
          </span>
          <button onClick={copyId}
            className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition text-blue-600">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs mt-2 text-blue-500 dark:text-blue-400">
          Save this ID — others will use it to find and connect with you.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={2}
              maxLength={30}
              placeholder="Your name"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

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
              minLength={8}
              placeholder="Min. 8 characters"
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
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-500 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </>
  );
}
