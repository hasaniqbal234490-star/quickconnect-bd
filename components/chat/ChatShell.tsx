'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MessageCircle, Search, Plus, Sun, Moon, LogOut,
  UserPlus, X, Loader2, Copy, Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/components/ui/ThemeProvider';
import { formatTime, isValidUniqueId } from '@/lib/utils';
import type { User, Conversation } from '@/types';

interface Props {
  profile: User;
  children: React.ReactNode;
}

export default function ChatShell({ profile, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactId, setContactId] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        last_message:messages(content, image_url, message_type, created_at)
      `)
      .contains('participant_ids', [profile.id])
      .order('last_message_at', { ascending: false });

    if (!data) return;

    // Enrich with other user info
    const enriched = await Promise.all(
      data.map(async (conv) => {
        const otherId = conv.participant_ids.find((id: string) => id !== profile.id);
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, unique_id, last_seen')
          .eq('id', otherId)
          .single();
        return { ...conv, other_user: otherUser };
      })
    );

    setConversations(enriched);
  }, [profile.id, supabase]);

  useEffect(() => {
    loadConversations();

    // Real-time subscription
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => loadConversations())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadConversations, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleAddContact = async () => {
    setAddError('');
    setAddSuccess('');
    if (!isValidUniqueId(contactId)) {
      setAddError('Invalid ID format. Use XXX-XXX-XXX');
      return;
    }
    if (contactId === profile.unique_id) {
      setAddError("You can't add yourself.");
      return;
    }
    setAddLoading(true);

    // Find user by unique_id
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('unique_id', contactId)
      .single();

    if (!targetUser) {
      setAddError('No user found with that ID.');
      setAddLoading(false);
      return;
    }

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .contains('participant_ids', [profile.id, targetUser.id])
      .single();

    if (existing) {
      router.push(`/chat/${existing.id}`);
      setShowAddContact(false);
      setAddLoading(false);
      return;
    }

    // Create new conversation
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        participant_ids: [profile.id, targetUser.id],
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      setAddError(error.message);
    } else {
      setAddSuccess(`Connected with ${targetUser.username}!`);
      loadConversations();
      setTimeout(() => {
        setShowAddContact(false);
        setContactId('');
        setAddSuccess('');
        router.push(`/chat/${newConv.id}`);
      }, 1000);
    }
    setAddLoading(false);
  };

  const copyMyId = () => {
    navigator.clipboard.writeText(profile.unique_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredConvs = conversations.filter(c =>
    c.other_user?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeId = pathname.split('/chat/')[1];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div className={`${activeId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r`}
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>

        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {profile.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {profile.username}
              </p>
              <button onClick={copyMyId}
                className="flex items-center gap-1 text-xs transition-colors"
                style={{ color: 'var(--text-secondary)' }}>
                <span className="font-mono">{profile.unique_id}</span>
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout}
              className="p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search + Add */}
        <div className="p-3 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-secondary)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none border"
              style={{ background: 'var(--bg-tertiary)', borderColor: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
          <button onClick={() => setShowAddContact(true)}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20"
                style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {conversations.length === 0
                  ? 'No chats yet. Tap + to add a contact.'
                  : 'No results found.'}
              </p>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <Link key={conv.id} href={`/chat/${conv.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-90 ${
                  activeId === conv.id ? 'border-r-2 border-blue-600' : ''
                }`}
                style={{
                  background: activeId === conv.id ? 'var(--accent-light)' : 'transparent',
                }}>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
                  flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {conv.other_user?.avatar_url ? (
                    <Image src={conv.other_user.avatar_url} alt="" width={44} height={44}
                      className="rounded-full object-cover w-full h-full" />
                  ) : (
                    conv.other_user?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-sm truncate"
                      style={{ color: 'var(--text-primary)' }}>
                      {conv.other_user?.username}
                    </span>
                    {conv.last_message_at && (
                      <span className="text-xs flex-shrink-0 ml-1"
                        style={{ color: 'var(--text-secondary)' }}>
                        {formatTime(conv.last_message_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {conv.last_message?.message_type === 'image' ? '📷 Image' :
                      conv.last_message?.content || 'Say hello!'}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`${activeId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {children}
      </div>

      {/* Add contact modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Add Contact
              </h3>
              <button onClick={() => { setShowAddContact(false); setContactId(''); setAddError(''); }}
                style={{ color: 'var(--text-secondary)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Enter the 9-digit ID of the person you want to connect with.
            </p>
            <input
              value={contactId}
              onChange={e => setContactId(e.target.value)}
              placeholder="000-000-000"
              maxLength={11}
              className="w-full px-4 py-2.5 rounded-lg border text-center font-mono text-lg outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            {addError && <p className="text-red-500 text-sm mb-3">{addError}</p>}
            {addSuccess && <p className="text-green-500 text-sm mb-3">{addSuccess}</p>}
            <button
              onClick={handleAddContact}
              disabled={addLoading || !contactId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
