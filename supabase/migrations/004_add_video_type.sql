-- Add 'video' as a valid message type
-- This migration updates the messages table constraint to allow video messages

ALTER TABLE public.messages 
  DROP CONSTRAINT IF EXISTS messages_type_check;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_type_check 
  CHECK (type IN ('text', 'audio', 'video'));
