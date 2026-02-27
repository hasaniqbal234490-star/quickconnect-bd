'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Send, Image as ImageIcon, Loader2, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { compressImage, formatTime } from '@/lib/utils';
import type { Message, User } from '@/types';

interface Props {
  conversationId: string;
  currentUserId: string;
  otherUser: User;
  initialMessages: Message[];
}

export default function ConversationView({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const { data: newMsg } = await supabase
          .from('messages')
          .select('*, sender:profiles!sender_id(*)')
          .eq('id', payload.new.id)
          .single();
        if (newMsg) {
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            return exists ? prev : [...prev, newMsg];
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, supabase]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      message_type: 'text',
    });

    if (!error) {
      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId);
    }
    setSending(false);
  };

  const sendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const compressed = await compressImage(file);
      const path = `${conversationId}/${Date.now()}.webp`;

      const { error: uploadErr } = await supabase.storage
        .from('chat-images')
        .upload(path, compressed, { contentType: 'image/webp' });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(path);

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        image_url: publicUrl,
        message_type: 'image',
      });

      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
      }).eq('id', conversationId);
    } catch (err) {
      console.error('Image upload error:', err);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shadow-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <button onClick={() => router.push('/chat')}
          className="md:hidden p-1 -ml-1 rounded-lg"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600
          flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {otherUser?.avatar_url ? (
            <Image src={otherUser.avatar_url} alt="" width={40} height={40}
              className="rounded-full object-cover w-full h-full" />
          ) : otherUser?.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {otherUser?.username}
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {otherUser?.unique_id}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center pt-10">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Start the conversation! Say hello 👋
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isSent = msg.sender_id === currentUserId;
          const showTime = i === 0 ||
            new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 5 * 60 * 1000;

          return (
            <div key={msg.id}>
              {showTime && (
                <div className="text-center my-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-xs lg:max-w-md ${isSent ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'} overflow-hidden shadow-sm`}
                  style={{
                    background: isSent ? 'var(--bubble-sent)' : 'var(--bubble-received)',
                    color: isSent ? 'var(--bubble-sent-text)' : 'var(--bubble-received-text)',
                  }}>
                  {msg.message_type === 'image' && msg.image_url ? (
                    <div className="relative">
                      <Image
                        src={msg.image_url}
                        alt="Shared image"
                        width={300}
                        height={200}
                        className="object-cover max-h-64 w-full"
                      />
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 p-1.5 bg-black/40 rounded-lg text-white hover:bg-black/60 transition">
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={sendImage}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          </button>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 rounded-xl text-sm outline-none border transition max-h-32"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-10 h-10 flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
