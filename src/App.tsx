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

// ÚJ IMPORTOK A CSOMAGVÁLTÁSHOZ ÉS A TOKENEKHEZ
import { TokenProvider } from './contexts/TokenContext';
import { PricingPage } from './pages/PricingPage';

type Page = 'chat' | 'agents' | 'settings' | 'pricing'; // Kiegészítve 'pricing'-al
type Agent = Database['public']['Tables']['agents']['Row'];

// Task mode instructions injected into the system prompt
const TASK_MODE_INSTRUCTIONS: Record<string, string> = {
  quick:   '',
  plan:    'Részletes, strukturált, lépésről-lépésre haladó választ adj. Használj számozást és fejezeteket. Minden lépésnél magyarázd el az okát is.',
  analyze: 'Mélyreható elemzést adj. Vedd figyelembe az összes szempontot, erőket és gyengeségeket egyaránt. Mutass rá rejtett összefüggésekre és lehetőségekre is.',
  code:    'Programozási feladatnál dolgozol. Írj tiszta, kommentezett, production-ready kódot. Magyarázd el a logikát, mutasd meg a lehetséges hibákat és alternatív megközelítéseket is. Kódot mindig kódblokk formátumban adj.',
};

function MainApp() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<Page>('chat');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
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

  // Load admin flag from profiles (is_admin column OR role = 'admin')
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.is_admin || data?.role === 'admin') setIsAdmin(true);
      });
  }, [user]);

  // Keep aiAvatarUrl in sync with localStorage (set by SettingsPage)
  useEffect(() => {
    const handler = () =>
      setAiAvatarUrl(localStorage.getItem('planlabstudio_ai_avatar_url') ?? '');
    window.addEventListener('planlabstudio_avatar_changed', handler);
    return () => window.removeEventListener('planlabstudio_avatar_changed', handler);
  }, []);

  const handleNewThread = useCallback(async (agentId?: string) => {
    if (!user) return;
    // Use first available model based on stored keys; never hardcode gpt-4o-mini
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

    // Load and inject global admin system prompt
    const adminSystemPrompt = await loadAdminSystemPrompt();
    const taskInstruction = taskMode ? (TASK_MODE_INSTRUCTIONS[taskMode] ?? '') : '';
    // Developer info: AI only mentions it when explicitly asked
    const developerInfo = 'FEJLESZTŐI INFORMÁCIÓ (CSAK AKKOR OSZD MEG, HA VALAKI KIFEJEZETTEN KÉRDEZI): A rendszert Paul Martinez fejlesztette. Ha rákérdeznek a fejlesztőre, a készítőre vagy a rendszer hátterére, akkor és csak akkor említheted meg ezt. Weboldala: www.paulmartinez.hu – ezt mindig sima szövegként írd, SOHA ne kattintható linkként, ne markdown formátumban. Ha senki nem kérdez a fejlesztőről, ezt az információt ne hozd szóba.';
    const fullSystemPrompt = [adminSystemPrompt, taskInstruction, developerInfo].filter(Boolean).join('\n\n');
    if (fullSystemPrompt) {
      allMessages.unshift({ role: 'system', content: fullSystemPrompt });
    }

    // Also check for agent-specific system prompt (agent takes precedence if both exist)
    const thread = threads.find(t => t.id === threadId);
    const agent = thread?.agent_id ? agents.find(a => a.id === thread.agent_id) : null;
    if (agent?.system_prompt) {
      // Remove global prompt if agent has its own
      allMessages.splice(0, 1);
      allMessages.unshift({ role: 'system', content: agent.system_prompt });
    }

    const hasApiKey = localStorage.getItem('planlabstudio_key_openai') || 
                      localStorage.getItem('planlabstudio_key_google') || 
                      localStorage.getItem('planlabstudio_key_anthropic');

    if (hasApiKey) {
      try {
        // 1. Show thinking dots (before first chunk arrives)
        setIsThinking(true);

        let fullResponse = '';
        let streamingStarted = false;

        // 2. Stream chunks — only create the optimistic bubble on the FIRST chunk
        //    so there is never an empty bubble alongside the typing indicator
        await callLLMStreaming(allMessages, model || 'gemini-2.5-flash', (chunk) => {
          if (!streamingStarted) {
            setIsThinking(false);        // hide typing dots
            beginStreamingMessage();     // create optimistic bubble with first content
            streamingStarted = true;
          }
          fullResponse += chunk;
          appendToStreamingMessage(chunk);
        }, attachment);

        // 3. Remove the local placeholder
        removeStreamingMessage();

        // 4. Single INSERT with the complete response — this is what persists
        if (fullResponse) {
          await addMessage(threadId, 'assistant', fullResponse);
        }

        // 5. Re-sync from DB to guarantee UI matches what is actually persisted
        await refetchMessages();
      } catch (error) {
        console.error('Streaming error:', error);
        setIsThinking(false);
        removeStreamingMessage();
        await addMessage(threadId, 'assistant', 'Hiba: nem sikerült a válasz. Ellenőrizd az API kulcsodat a Beállítások > API Kulcsok menüben.');
        await refetchMessages();
      }
    } else {
      const demoResponses = [
        `I received your message: "${content}"\n\nTo enable real AI responses, please add your API key in **Settings > API Keys**.`,
        `Thank you! This is AI Vivien — your AI workspace.\n\nConfigure your API keys in Settings to unlock real AI capabilities.`,
        `I'm ready to help! Add your API key in **Settings > API Keys** to start using real AI models.`,
      ];
      const reply = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      await addMessage(threadId, 'assistant', reply);
    }

    await supabase.from('threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);
    await refetchThreads();
    setIsThinking(false);
    setIsSending(false);
  }, [user, activeThreadId, threads, messages, agents, createThread, addMessage, beginStreamingMessage, appendToStreamingMessage, removeStreamingMessage, updateThreadTitle, refetchThreads]);

  const handleChatWithAgent = useCallback(async (agent: Agent) => {
    await handleNewThread(agent.id);
  }, [handleNewThread]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const userName = user.email?.split('@')[0] ?? 'User';

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
            userId={user.id}
            onCreateAgent={createAgent}
            onUpdateAgent={updateAgent}
            onDeleteAgent={deleteAgent}
            onChatWithAgent={handleChatWithAgent}
          />
        )}
        {activePage === 'settings' && (
          <SettingsPage
            userEmail={user.email ?? ''}
            userName={userName}
            isAdmin={isAdmin}
          />
        )}
        {/* ÚJ ÁRAZÁSI/CSOMAGVÁLTÓ OLDAL INTEGRÁCIÓJA */}
        {activePage === 'pricing' && (
          <PricingPage />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        {/* KÖRNYEZET BEÉPÍTÉSE, HOGY A TOKENMETER NE HALJON MEG */}
        <TokenProvider>
          <MainApp />
        </TokenProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;