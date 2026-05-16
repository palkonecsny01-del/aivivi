// API Keys management service using Supabase
// Admin keys are stored in app_settings (readable by all users)
// Regular users CANNOT set keys – only admins can

import { supabase } from './supabase';

// ── Simple encode/decode ──────────────────────────────────────────────────────
function encode(text: string): string { return btoa(text); }
function decode(encoded: string): string {
  try { return atob(encoded); } catch { return ''; }
}

// ── Admin-only: save an API key to app_settings (shared with all users) ───────
export async function saveAdminApiKey(provider: string, apiKey: string): Promise<void> {
  const settingKey = `admin_api_key_${provider}`;
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: settingKey, value: encode(apiKey), updated_at: new Date().toISOString() });

  if (error) {
    console.error('Failed to save admin API key:', error);
    throw error;
  }

  // Also cache locally so the current session picks it up immediately
  localStorage.setItem(`planlabstudio_key_${provider}`, apiKey);
}

// ── Admin-only: delete a key from app_settings ────────────────────────────────
export async function deleteAdminApiKey(provider: string): Promise<void> {
  const settingKey = `admin_api_key_${provider}`;
  await supabase.from('app_settings').delete().eq('key', settingKey);
  localStorage.removeItem(`planlabstudio_key_${provider}`);
}

// ── Load all admin keys from app_settings (all authenticated users can do this) ─
export async function loadAdminApiKeys(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .like('key', 'admin_api_key_%');

    if (error || !data) return {};

    const keys: Record<string, string> = {};
    data.forEach((row: any) => {
      const provider = row.key.replace('admin_api_key_', '');
      const decrypted = decode(row.value);
      if (decrypted) {
        keys[provider] = decrypted;
        localStorage.setItem(`planlabstudio_key_${provider}`, decrypted);
      }
    });
    return keys;
  } catch (err) {
    console.error('Failed to load admin API keys:', err);
    return {};
  }
}

// ── Save admin system prompt ──────────────────────────────────────────────────
export async function saveAdminSystemPrompt(prompt: string): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'admin_system_prompt', value: prompt, updated_at: new Date().toISOString() });

  if (error) throw error;
}

// ── Load admin system prompt ──────────────────────────────────────────────────
export async function loadAdminSystemPrompt(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_system_prompt')
      .single();

    if (error || !data) return '';
    return data.value ?? '';
  } catch {
    return '';
  }
}

// ── Legacy per-user key functions (kept for migration compat) ─────────────────
export async function saveApiKey(provider: string, apiKey: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_api_keys')
    .upsert({ user_id: user.id, provider, encrypted_key: encode(apiKey), updated_at: new Date().toISOString() }, { onConflict: 'user_id,provider' });

  if (error) console.error('Failed to save API key:', error);
  localStorage.setItem(`planlabstudio_key_${provider}`, apiKey);
}

export async function getApiKey(provider: string): Promise<string | null> {
  const local = localStorage.getItem(`planlabstudio_key_${provider}`);
  if (local) return local;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single();

    if (!data) return null;
    const dec = decode(data.encrypted_key);
    if (dec) localStorage.setItem(`planlabstudio_key_${provider}`, dec);
    return dec || null;
  } catch { return null; }
}

export async function loadAllApiKeys(): Promise<Record<string, string>> {
  // Always prefer admin keys (shared with all users)
  return loadAdminApiKeys();
}

export async function deleteApiKey(provider: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('user_api_keys').delete().eq('user_id', user.id).eq('provider', provider);
  localStorage.removeItem(`planlabstudio_key_${provider}`);
}