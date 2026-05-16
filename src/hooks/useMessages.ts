import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];

// Fake ID prefix for optimistic (local-only) messages
const OPTIMISTIC_PREFIX = 'optimistic-';

export function useMessages(threadId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
    setLoading(false);
  }, [threadId]);

  useEffect(() => {
    fetchMessages();

    if (threadId) {
      const channel = supabase
        .channel(`messages-thread-${threadId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
          (payload) => {
            setMessages(prev => {
              // Replace matching optimistic message (same role + similar timing) or just append
              const realMsg = payload.new as Message;
              const hasOptimistic = prev.some(m => m.id.startsWith(OPTIMISTIC_PREFIX) && m.role === realMsg.role);
              if (hasOptimistic) {
                // Remove the optimistic placeholder — real message will be added
                return [...prev.filter(m => !(m.id.startsWith(OPTIMISTIC_PREFIX) && m.role === realMsg.role)), realMsg];
              }
              // Avoid duplicates (addMessage already added it locally)
              if (prev.some(m => m.id === realMsg.id)) return prev;
              return [...prev, realMsg];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [threadId, fetchMessages]);

  /** Save a real message to DB and add to local state. */
  const addMessage = async (threadId: string, role: string, content: string): Promise<Message | null> => {
    const { data } = await supabase
      .from('messages')
      .insert({ thread_id: threadId, role, content })
      .select()
      .single();
    if (data) setMessages(prev => [...prev, data]);
    return data;
  };

  /**
   * Add a LOCAL-ONLY optimistic assistant message that streams in.
   * This is NEVER saved to DB directly — call addMessage() with the
   * completed content afterwards.
   */
  const beginStreamingMessage = (): string => {
    const id = `${OPTIMISTIC_PREFIX}${Date.now()}`;
    const placeholder: Message = {
      id,
      thread_id: threadId ?? '',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, placeholder]);
    return id;
  };

  /** Append a text chunk to the last optimistic (streaming) assistant message. */
  const appendToStreamingMessage = (chunk: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.id.startsWith(OPTIMISTIC_PREFIX) && last.role === 'assistant') {
        return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
      }
      return prev;
    });
  };

  /** Remove the optimistic placeholder (call this after the real DB insert). */
  const removeStreamingMessage = () => {
    setMessages(prev => prev.filter(m => !m.id.startsWith(OPTIMISTIC_PREFIX)));
  };

  // Keep for any legacy callers
  const appendToLastAssistantMessage = appendToStreamingMessage;

  return {
    messages,
    loading,
    addMessage,
    beginStreamingMessage,
    appendToStreamingMessage,
    removeStreamingMessage,
    appendToLastAssistantMessage,
    refetch: fetchMessages,
  };
}
