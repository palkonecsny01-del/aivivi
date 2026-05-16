import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];

export function useAgents(userId: string | undefined) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('agents')
      .select('*')
      .or(`user_id.eq.${userId},visibility.eq.public`)
      .order('created_at', { ascending: false });
    setAgents(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const createAgent = async (agent: Partial<Agent>) => {
    if (!userId) return null;
    const { data } = await supabase
      .from('agents')
      .insert({ ...agent, user_id: userId } as Database['public']['Tables']['agents']['Insert'])
      .select()
      .single();
    if (data) setAgents(prev => [data, ...prev]);
    return data;
  };

  const updateAgent = async (id: string, updates: Partial<Agent>) => {
    const { data } = await supabase
      .from('agents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (data) setAgents(prev => prev.map(a => a.id === id ? data : a));
    return data;
  };

  const deleteAgent = async (id: string) => {
    await supabase.from('agents').delete().eq('id', id);
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  return { agents, loading, createAgent, updateAgent, deleteAgent, refetch: fetchAgents };
}
