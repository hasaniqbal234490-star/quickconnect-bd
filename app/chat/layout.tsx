import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatShell from '@/components/chat/ChatShell';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <ChatShell profile={profile}>{children}</ChatShell>;
}
