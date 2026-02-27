import { MessageCircle } from 'lucide-react';

export default function ChatIndexPage() {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center"
      style={{ background: 'var(--bg-primary)' }}>
      <MessageCircle className="w-16 h-16 mb-4 opacity-20" style={{ color: 'var(--text-primary)' }} />
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        Select a conversation
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Choose a contact or search by 9-digit ID to start chatting
      </p>
    </div>
  );
}
