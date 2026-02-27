import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ConversationView from '@/components/chat/ConversationView';

interface Props {
  params: { id: string };
}

export default async function ConversationPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // Fetch conversation + other user profile
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!conversation) notFound();

  const otherUserId = conversation.participant_ids.find((id: string) => id !== user.id);

  const { data: otherUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', otherUserId)
    .single();

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(50);

  return (
    <ConversationView
      conversationId={params.id}
      currentUserId={user.id}
      otherUser={otherUser}
      initialMessages={messages || []}
    />
  );
}
