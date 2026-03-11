-- Migration to add title field to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS title TEXT;
