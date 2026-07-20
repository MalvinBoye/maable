-- ─── notifications ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('friend_request', 'friend_accepted')),
  from_user_id UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  data         JSONB       NOT NULL DEFAULT '{}',
  read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_select_own"        ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_insert_from_self"  ON public.notifications FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "notif_update_own"        ON public.notifications FOR UPDATE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS notifications_user_unread
  ON public.notifications (user_id, read)
  WHERE read = FALSE;

-- ─── messages ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_message CHECK (sender_id <> recipient_id)
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Sender and recipient can read the conversation
CREATE POLICY "messages_select_involved" ON public.messages
  FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Can only send to accepted friends
CREATE POLICY "messages_insert_friends_only" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = auth.uid() AND f.addressee_id = recipient_id) OR
          (f.addressee_id = auth.uid() AND f.requester_id = recipient_id)
        )
    )
  );

-- Recipient can mark messages as read
CREATE POLICY "messages_update_recipient" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE INDEX IF NOT EXISTS messages_conversation
  ON public.messages (
    LEAST(sender_id, recipient_id),
    GREATEST(sender_id, recipient_id),
    created_at
  );

-- Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
