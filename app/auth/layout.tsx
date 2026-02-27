import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}>
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          QuickConnect BD
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl border p-8 shadow-xl"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        {children}
      </div>
    </div>
  );
}
