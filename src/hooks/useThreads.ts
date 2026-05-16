import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Thread = Database['public']['Tables']['threads']['Row'];

export function useThreads(userId: string | undefined) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('threads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    setThreads(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = async (title = 'New Chat', model = 'gpt-4o-mini', agentId?: string) => {
    if (!userId) return null;
    const { data } = await supabase
      .from('threads')
      .insert({ user_id: userId, title, model, agent_id: agentId ?? null })
      .select()
      .single();
    if (data) setThreads(prev => [data, ...prev]);
    return data;
  };

  const deleteThread = async (threadId: string) => {
    await supabase.from('threads').delete().eq('id', threadId);
    setThreads(prev => prev.filter(t => t.id !== threadId));
  };

  const updateThreadTitle = async (threadId: string, title: string) => {
    await supabase.from('threads').update({ title, updated_at: new Date().toISOString() }).eq('id', threadId);
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title } : t));
  };

  return { threads, loading, createThread, deleteThread, updateThreadTitle, refetch: fetchThreads };
}
