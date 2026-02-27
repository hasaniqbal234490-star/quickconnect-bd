-- ============================================================
-- QuickConnect BD — Supabase SQL Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE (extends Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  unique_id TEXT NOT NULL UNIQUE,        -- XXX-XXX-XXX format
  avatar_url TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by unique_id
CREATE INDEX IF NOT EXISTS idx_profiles_unique_id ON public.profiles(unique_id);

-- ============================================================
-- CONVERSATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,        -- Array of 2 user IDs
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for fast array contains queries
CREATE INDEX IF NOT EXISTS idx_conversations_participants 
  ON public.conversations USING GIN(participant_ids);

-- Unique constraint: no duplicate conversations between same two users
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_pair
  ON public.conversations (
    LEAST(participant_ids[1]::TEXT, participant_ids[2]::TEXT),
    GREATEST(participant_ids[1]::TEXT, participant_ids[2]::TEXT)
  );

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT content_or_image CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON public.messages(conversation_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can view all profiles (needed for search), only edit own
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Conversations: users can only see conversations they're part of
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "conversations_insert" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE USING (auth.uid() = ANY(participant_ids));

-- Messages: users can only see messages in their conversations
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run this to create the chat-images bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "storage_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "storage_insert_authenticated" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-images' AND auth.role() = 'authenticated'
  );

-- ============================================================
-- REALTIME
-- Enable realtime for messages and conversations
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ============================================================
-- FUNCTION: auto-update last_seen
-- ============================================================
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen = NOW()
  WHERE id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_last_seen
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_last_seen();
