import Link from 'next/link';
import { MessageCircle, Shield, Zap, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}>
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            QuickConnect BD
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            কানেক্ট করুন, কথা বলুন
          </p>
        </div>
      </div>

      {/* Tagline */}
      <p className="text-center text-lg mb-10 max-w-md" style={{ color: 'var(--text-secondary)' }}>
        A lightweight, privacy-first messenger built for Bangladesh and the world. Connect using your unique 9-digit ID.
      </p>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 w-full max-w-2xl">
        {[
          { icon: Shield, title: 'Privacy First', desc: 'Connect via unique ID only. No public directory.' },
          { icon: Zap, title: 'Data Efficient', desc: 'Auto image compression saves your mobile data.' },
          { icon: Globe, title: 'Bilingual', desc: 'Full support for Bengali and English.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl p-4 text-center border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <Icon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <Link href="/auth/signup"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl text-center transition-colors">
          Get Started
        </Link>
        <Link href="/auth/login"
          className="flex-1 font-semibold py-3 px-6 rounded-xl text-center border transition-colors hover:bg-opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>
          Sign In
        </Link>
      </div>

      <p className="mt-8 text-xs" style={{ color: 'var(--text-secondary)' }}>
        Made with ❤️ for Bangladesh
      </p>
    </main>
  );
}
