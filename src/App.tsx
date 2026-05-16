import { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './i18n';
import { AuthPage } from './pages/AuthPage';
import { AgentsPage } from './pages/AgentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Sidebar } from './components/Sidebar';
import type { ConversationTemplate } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { useThreads } from './hooks/useThreads';
import { useMessages } from './hooks/useMessages';
import { useAgents } from './hooks/useAgents';
import { supabase } from './lib/supabase';
import { callLLMStreaming, type FileAttachment } from './lib/api';
import { loadAdminSystemPrompt } from './lib/apiKeysService';
import type { Database } from './lib/database.types';
import { Loader2 } from 'lucide-react';

import { TokenProvider, useTokens } from './contexts/TokenContext';
import { PricingPage } from './pages/PricingPage';

type Page = 'chat' | 'agents' | 'settings' | 'pricing';
type Agent = Database['public']['Tables']['agents']['Row'];

const TASK_MODE_INSTRUCTIONS: Record<string, string> = {
  quick:   '',
  plan:    'Részletes, strukturált, lépésről-lépésre haladó választ adj. Használj számozást és fejezeteket. Minden lépésnél magyarázd el az okát is.',
  analyze: 'Mélyreható elemzést adj. Vedd figyelembe az összes szempontot, erőket és gyengeségeket egyaránt. Mutass rá rejtett összefüggésre és lehetőségekre is.',
  code:    'Programozási feladatnál dolgozol. Írj tiszta, kommentezett, production-ready kódot. Magyarázd el a logikát, mutasd meg a lehetséges hibákat és alternatív megközelítéseket is. Kódot mindig kódblokk formátumban adj.',
};

function MainWorkspace() {
  const { user } = useAuth();
  const { setAdminMode, addTokens } = useTokens();

  // Az utolsó megtekintett oldal visszaállítása frissítéskor
  const [activePage, setActivePageState] = useState<Page>(() => {
    return (localStorage.getItem('vivien_active_page') as Page) || 'chat';
  });

  // Az utolsó aktív chat visszaállítása frissítéskor
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(() => {
    return localStorage.getItem('vivien_active_thread_id');
  });

  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [aiAvatarUrl, setAiAvatarUrl] = useState<string>(() =>
    localStorage.getItem('planlabstudio_ai_avatar_url') ?? ''
  );

  const { threads, createThread, deleteThread, updateThreadTitle, refetch: refetchThreads } = useThreads(user?.id);
  const { messages, loading: messagesLoading, addMessage, beginStreamingMessage, appendToStreamingMessage, removeStreamingMessage, refetch: refetchMessages } = useMessages(activeThreadId);
  const { agents, createAgent, updateAgent, deleteAgent } = useAgents(user?.id);

  const activeThread = threads.find(t => t.id === activeThreadId) ?? null;

  // Saját mentési burkoló függvények a perzisztenciához
  const setActivePage = (page: Page) => {
    setActivePageState(page);
    localStorage.setItem('vivien_active_page', page);
  };

  const setActiveThreadId = (id: string | null) => {
    setActiveThreadIdState(id);
    if (id) {
      localStorage.setItem('vivien_active_thread_id', id);
    } else {
      localStorage.removeItem('vivien_active_thread_id');
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const adminStatus = data?.is_admin || data?.role === 'admin';
        setIsAdmin(adminStatus);
        setAdminMode(adminStatus); // Ennek a hívásnak a hatására vált át Admin-ra!
      });
  }, [user, setAdminMode]);

  useEffect(() => {
    const handler = () =>
      setAiAvatarUrl(localStorage.getItem('planlabstudio_ai_avatar_url') ?? '');
    window.addEventListener('planlabstudio_avatar_changed', handler);
    return () => window.removeEventListener('planlabstudio_avatar_changed', handler);
  }, []);

  const handleNewThread = useCallback(async (agentId?: string) => {
    if (!user) return;
    const googleKey = localStorage.getItem('planlabstudio_key_google');
    const openaiKey = localStorage.getItem('planlabstudio_key_openai');
    const anthropicKey = localStorage.getItem('planlabstudio_key_anthropic');
    const defaultModel = googleKey ? 'gemini-2.5-flash'
      : openaiKey ? 'gpt-4o'
      : anthropicKey ? 'claude-3-5-sonnet-20241022'
      : 'gemini-2.5-flash';
    const thread = await createThread('New Chat', defaultModel, agentId);
    if (thread) {
      setActiveThreadId(thread.id);
      setActivePage('chat');
    }
  }, [user, createThread]);

  const handleSelectThread = useCallback((id: string) => {
    setActiveThreadId(id);
    setActivePage('chat');
  }, []);

  const handleDeleteThread = useCallback(async (id: string) => {
    await deleteThread(id);
    if (activeThreadId === id) setActiveThreadId(null);
  }, [deleteThread, activeThreadId]);

  const handleNewThreadWithTemplate = useCallback(async (template: ConversationTemplate) => {
    if (!user) return;
    const googleKey = localStorage.getItem('planlabstudio_key_google');
    const openaiKey = localStorage.getItem('planlabstudio_key_openai');
    const anthropicKey = localStorage.getItem('planlabstudio_key_anthropic');
    const defaultModel = googleKey ? 'gemini-2.5-flash'
      : openaiKey ? 'gpt-4o'
      : anthropicKey ? 'claude-3-5-sonnet-20241022'
      : 'gemini-2.5-flash';
    const thread = await createThread(template.title, defaultModel);
    if (thread) {
      setActiveThreadId(thread.id);
      setActivePage('chat');
      setPendingTemplate(template.prompt);
    }
  }, [user, createThread]);

  const handleSendMessage = useCallback(async (content: string, model: string, attachment?: FileAttachment, taskMode?: string) => {
    if (!user) return;

    const inputTokens = Math.ceil(content.length / 4);
    addTokens(inputTokens);

    let threadId = activeThreadId;

    if (!threadId) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      const thread = await createThread(title, model);
      if (!thread) return;
      threadId = thread.id;
      setActiveThreadId(threadId);
    } else {
      const currentThread = threads.find(t => t.id === threadId);
      if (currentThread?.title === 'New Chat' && messages.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await updateThreadTitle(threadId, title);
      }
    }

    setIsSending(true);
    await addMessage(threadId, 'user', content);

    const allMessages = [
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      { role: 'user' as const, content },
    ];

    const adminSystemPrompt = await loadAdminSystemPrompt();
    const taskInstruction = taskMode ? (TASK_MODE_INSTRUCTIONS[taskMode] ?? '') : '';
    const developerInfo = 'FEJLESZTŐI INFORMÁCIÓ (CSAK AKKOR OSZD MEG, HA VALAKI KIFEJEZETTEN KÉRDEZI): A rendszert Paul Martinez fejlesztette. Weboldala: www.paulmartinez.hu';
    const fullSystemPrompt = [adminSystemPrompt, taskInstruction, developerInfo].filter(Boolean).join('\n\n');
    if (fullSystemPrompt) {
      allMessages.unshift({ role: 'system', content: fullSystemPrompt });
    }

    const thread = threads.find(t => t.id === threadId);
    const agent = thread?.agent_id ? agents.find(a => a.id === thread.agent_id) : null;
    if (agent?.system_prompt) {
      allMessages.splice(0, 1);
      allMessages.unshift({ role: 'system', content: agent.system_prompt });
    }

    const hasApiKey = localStorage.getItem('planlabstudio_key_openai') || 
                      localStorage.getItem('planlabstudio_key_google') || 
                      localStorage.getItem('planlabstudio_key_anthropic');

    if (hasApiKey) {
      try {
        setIsThinking(true);
        let fullResponse = '';
        let streamingStarted = false;

        await callLLMStreaming(allMessages, model || 'gemini-2.5-flash', (chunk) => {
          if (!streamingStarted) {
            setIsThinking(false);
            beginStreamingMessage();
            streamingStarted = true;
          }
          fullResponse += chunk;
          appendToStreamingMessage(chunk);
        }, attachment);

        removeStreamingMessage();

        if (fullResponse) {
          const outputTokens = Math.ceil(fullResponse.length / 4);
          addTokens(outputTokens);
          await addMessage(threadId, 'assistant', fullResponse);
        }
        await refetchMessages();
      } catch (error) {
        console.error('Streaming error:', error);
        setIsThinking(false);
        removeStreamingMessage();
        await addMessage(threadId, 'assistant', 'Hiba történt a generálás során.');
        await refetchMessages();
      }
    } else {
      const reply = `Kérlek állítsd be az API kulcsodat a Beállításokban!`;
      await addMessage(threadId, 'assistant', reply);
    }

    await supabase.from('threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);
    await refetchThreads();
    setIsThinking(false);
    setIsSending(false);
  }, [user, activeThreadId, threads, messages, agents, createThread, addMessage, beginStreamingMessage, appendToStreamingMessage, removeStreamingMessage, updateThreadTitle, refetchThreads, addTokens]);

  const handleChatWithAgent = useCallback(async (agent: Agent) => {
    await handleNewThread(agent.id);
  }, [handleNewThread]);

  const userName = user?.email?.split('@')[0] ?? 'User';

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewThread={() => handleNewThread()}
        onNewThreadWithTemplate={handleNewThreadWithTemplate}
        onDeleteThread={handleDeleteThread}
        onRenameThread={updateThreadTitle}
        activePage={activePage}
        onNavigate={setActivePage}
        userName={userName}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activePage === 'chat' && (
          <ChatInterface
            thread={activeThread}
            messages={messages}
            messagesLoading={messagesLoading}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            isThinking={isThinking}
            aiAvatarUrl={aiAvatarUrl}
            isAdmin={isAdmin}
            pendingTemplate={pendingTemplate}
            onTemplateSent={() => setPendingTemplate(null)}
          />
        )}
        {activePage === 'agents' && (
          <AgentsPage
            agents={agents}
            userId={user!.id}
            onCreateAgent={createAgent}
            onUpdateAgent={updateAgent}
            onDeleteAgent={deleteAgent}
            onChatWithAgent={handleChatWithAgent}
          />
        )}
        {activePage === 'settings' && (
          <SettingsPage
            userEmail={user!.email ?? ''}
            userName={userName}
            isAdmin={isAdmin}
          />
        )}
        {activePage === 'pricing' && (
          <PricingPage />
        )}
      </main>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <TokenProvider>
      <MainWorkspace />
    </TokenProvider>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;