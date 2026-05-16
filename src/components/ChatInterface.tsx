import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import {
  Send, Bot, User, Copy, Check,
  ChevronDown, Cpu, Loader2, Code2, Paperclip, Download, X,
  FileText, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { useI18n } from '../i18n';
import { loadAllApiKeys } from '../lib/apiKeysService';
import type { Database } from '../lib/database.types';
import { ArtifactPanel, extractArtifact } from './ArtifactPanel';
import type { Artifact } from './ArtifactPanel';
import type { FileAttachment } from '../lib/api';
import { TEMPLATES } from './Sidebar';

type Message = Database['public']['Tables']['messages']['Row'];
type Thread  = Database['public']['Tables']['threads']['Row'];

// ── Models ───────────────────────────────────────────────────────────────────

const ALL_MODELS = [
  // Gemini 3 generation (newest, free)
  { value: 'gemini-3-flash-preview',  label: 'AIVivien-3-preview',  provider: 'google', badge: 'Legújabb' },
  { value: 'gemini-3.1-flash-lite',   label: 'AIVivien-3.1-lite',   provider: 'google', badge: 'Ultra gyors' },
  // Gemini 2.5 generation (stable)
  { value: 'gemini-2.5-flash',        label: 'AIVivien 2.5 Flash',  provider: 'google', badge: '' },
  { value: 'gemini-2.5-flash-lite',   label: 'AIVivien-2.5-lite',   provider: 'google', badge: 'Gyors' },
  // OpenAI
  { value: 'gpt-4o',         label: 'GPT-4o',         provider: 'openai',    badge: '' },
  { value: 'gpt-4o-mini',    label: 'GPT-4o Mini',    provider: 'openai',    badge: '' },
  // Anthropic
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic', badge: '' },
  { value: 'claude-3-haiku-20240307',    label: 'Claude 3 Haiku',    provider: 'anthropic', badge: '' },
];

// ⛔ Forbidden models — NEVER show or use these
const FORBIDDEN_MODELS = new Set(['gemini-3.1-pro-preview', 'gemini-3-pro-image-preview']);

function filterModelsByKeys(keys: Record<string, string>) {
  return ALL_MODELS.filter(m => !!keys[m.provider] && !FORBIDDEN_MODELS.has(m.value));
}
function pickBestModel(models: typeof ALL_MODELS, preferred?: string | null): string {
  if (!models.length) return 'gemini-2.5-flash';
  if (preferred && models.some(m => m.value === preferred)) return preferred;
  return models[0].value;
}

// ── Task modes ───────────────────────────────────────────────────────────────

const TASK_MODES = [
  { id: 'quick',   label: 'Gyors',   icon: '⚡', title: 'Rövid, tömör válasz' },
  { id: 'plan',    label: 'Tervez',  icon: '📋', title: 'Részletes, strukturált terv' },
  { id: 'analyze', label: 'Elemez',  icon: '🔍', title: 'Mélyreható elemzés' },
  { id: 'code',    label: 'Kódol',   icon: '💻', title: 'Kód írás, hibakeresés, magyarázat' },
] as const;

type TaskModeId = typeof TASK_MODES[number]['id'];

// ── Props ────────────────────────────────────────────────────────────────────

interface ChatInterfaceProps {
  thread: Thread | null;
  messages: Message[];
  messagesLoading: boolean;
  onSendMessage: (content: string, model: string, attachment?: FileAttachment, taskMode?: TaskModeId) => Promise<void>;
  isSending: boolean;
  isThinking: boolean;
  aiAvatarUrl?: string;
  pendingTemplate?: string | null;
  onTemplateSent?: () => void;
  isAdmin?: boolean;
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator({ aiAvatarUrl }: { aiAvatarUrl?: string }) {
  return (
    <div className="flex gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
        {aiAvatarUrl
          ? <img src={aiAvatarUrl} alt="AI" className="w-full h-full object-cover" />
          : <Bot size={14} className="text-zinc-300" />}
      </div>
      <div className="px-4 py-3 bg-zinc-800 border border-zinc-700/50 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StreamingCursor() {
  return (
    <span className="inline-block w-[2px] h-[14px] bg-blue-400 ml-0.5 align-middle animate-pulse"
      style={{ animationDuration: '800ms' }} />
  );
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
// Handles **bold**, *italic*, `code`, and code blocks in assistant messages

function renderMarkdown(content: string, isStreaming: boolean, onArtifactClick?: (a: Artifact) => void) {
  const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const langMatch = part.match(/^```(\w+)\n/);
      const lang = langMatch?.[1] ?? 'code';
      const blockArtifact = extractArtifact(content);
      return (
        <button key={i}
          onClick={() => blockArtifact && onArtifactClick?.(blockArtifact)}
          className="inline-flex items-center gap-1.5 my-1 px-2.5 py-1 rounded-lg bg-zinc-700/60 hover:bg-zinc-700 border border-zinc-600/50 text-xs text-zinc-300 font-mono transition-colors cursor-pointer">
          <Code2 size={11} className="text-blue-400" />
          {lang} — kattints az előnézethez
        </button>
      );
    }
    // Inline formatting
    const lines = part.split('\n');
    return (
      <span key={i}>
        {lines.map((line, li) => {
          const formatted = line
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-zinc-700/60 rounded text-xs font-mono text-blue-300">$1</code>');
          return (
            <span key={li}>
              <span dangerouslySetInnerHTML={{ __html: formatted }} />
              {li < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}

// ── File attachment parser ─────────────────────────────────────────────────────
// Detects the "**Csatolt fájl: name**\n```\ncontent\n```\n\ntext" pattern in user messages
// and returns structured data so we can render a collapsible chip instead of the raw markdown.

const ATTACH_REGEX = /^\*\*Csatolt fájl: (.+?)\*\*\n```[^\n]*\n([\s\S]*?)\n```\n\n?([\s\S]*)$/;

function parseFileAttachment(content: string): { filename: string; fileContent: string; userText: string } | null {
  const match = content.match(ATTACH_REGEX);
  if (!match) return null;
  return { filename: match[1], fileContent: match[2], userText: match[3] };
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  message, isStreaming, onArtifactClick, aiAvatarUrl,
}: {
  message: Message; isStreaming?: boolean; onArtifactClick?: (a: Artifact) => void; aiAvatarUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [fileExpanded, setFileExpanded] = useState(false);
  const isUser = message.role === 'user';

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Try to detect an attachment block in user messages
  const parsedAttachment = isUser ? parseFileAttachment(message.content) : null;

  const renderContent = (content: string) => {
    if (isUser) {
      // If this message has an embedded file, show compact chip + user text
      if (parsedAttachment) {
        return (
          <div className="flex flex-col gap-2">
            {/* File chip */}
            <button
              onClick={() => setFileExpanded(v => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium hover:bg-blue-500/30 transition-colors w-fit"
            >
              <FileText size={12} className="shrink-0" />
              <span className="truncate max-w-[180px]">{parsedAttachment.filename}</span>
              <ChevronDown size={11} className={`shrink-0 transition-transform ${fileExpanded ? 'rotate-180' : ''}`} />
            </button>
            {/* Expandable file content */}
            {fileExpanded && (
              <pre className="text-[11px] bg-zinc-900/70 border border-zinc-700/60 rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap break-words text-zinc-300 font-mono leading-relaxed">
                {parsedAttachment.fileContent}
              </pre>
            )}
            {/* User's own message text */}
            {parsedAttachment.userText && (
              <span>
                {parsedAttachment.userText.split('\n').map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </span>
            )}
          </div>
        );
      }
      // Normal user message
      return content.split('\n').map((line, i, arr) => (
        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
      ));
    }
    return renderMarkdown(content, !!isStreaming, onArtifactClick);
  };

  return (
    <div className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-6`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 overflow-hidden
        ${isUser ? 'bg-blue-600' : 'bg-zinc-700 border border-zinc-600'}`}>
        {isUser
          ? <User size={14} className="text-white" />
          : aiAvatarUrl
            ? <img src={aiAvatarUrl} alt="AI" className="w-full h-full object-cover" />
            : <Bot size={14} className="text-zinc-300" />}
      </div>
      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-zinc-800/80 text-zinc-100 rounded-tl-sm border border-zinc-700/50 shadow-sm'}`}>
          {renderContent(message.content)}
          {isStreaming && !isUser && <StreamingCursor />}
        </div>
        <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''}`}>
          <button onClick={copy} className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>
          <span className="text-[10px] text-zinc-600">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Divider resize ─────────────────────────────────────────────────────────────

function useDividerResize(initial = 45) {
  const [panelPct, setPanelPct] = useState(initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((rect.width - (e.clientX - rect.left)) / rect.width) * 100;
      setPanelPct(Math.max(22, Math.min(72, pct)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);
  return { panelPct, containerRef, onDividerMouseDown: onMouseDown };
}

// ── PDF Download ──────────────────────────────────────────────────────────────

function downloadAsPdf(thread: Thread | null, messages: Message[]) {
  const win = window.open('', '_blank');
  if (!win) { alert('Engedélyezd a felugró ablakokat a PDF letöltéshez!'); return; }
  
  // Get only the last AI response
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant');
  if (!lastAiMessage) { alert('Nincs AI-válasz a letöltéshez.'); return; }
  
  const title = thread?.title ?? 'AI Response';
  const html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>${title}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; max-width: 820px; margin: 0 auto; color: #1a1a1a; background: #fff; }
      h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
      .meta { font-size: 12px; color: #64748b; margin-bottom: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
      .content { font-size: 14px; line-height: 1.8; white-space: pre-wrap; word-break: break-word; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
      .footer { font-size: 10px; color: #94a3b8; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
      @media print { body { padding: 20px; } }
    </style>
  </head><body>
    <h1>${title}</h1>
    <p class="meta">📄 Exportálva: ${new Date().toLocaleString('hu-HU')} · AI Vivien válasza</p>
    <div class="content">${lastAiMessage.content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>
    <div class="footer">Generated by AI Vivien • ${thread?.title || 'Untitled conversation'}</div>
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); }</script>
  </body></html>`;
  win.document.write(html);
  win.document.close();
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ChatInterface({
  thread, messages, messagesLoading, onSendMessage, isSending, isThinking, aiAvatarUrl,
  pendingTemplate, onTemplateSent, isAdmin = false,
}: ChatInterfaceProps) {
  const [input, setInput]               = useState('');
  const [availableModels, setAvailableModels] = useState<typeof ALL_MODELS>([]);
  const [model, setModel]               = useState('gemini-2.5-flash');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [menuPos, setMenuPos]           = useState({ top: 0, left: 0 });
  const [taskMode, setTaskMode]         = useState<TaskModeId>('quick');
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [attachment, setAttachment]     = useState<FileAttachment | null>(null);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const bottomRef      = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const modelBtnRef    = useRef<HTMLButtonElement>(null);
  const modelMenuRef   = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const { panelPct, containerRef, onDividerMouseDown } = useDividerResize(45);

  const suggestions = [
    t.ChatInterface.suggestions.projectPlan,
    t.ChatInterface.suggestions.explainConcept,
    t.ChatInterface.suggestions.generateCode,
    t.ChatInterface.suggestions.reviewText,
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isThinking]);

  // Auto-close preview panel + clear input when thread changes
  useEffect(() => {
    setActiveArtifact(null);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [thread?.id]);

  // Close model menu on outside click
  useEffect(() => {
    if (!showModelMenu) return;
    const handler = (e: MouseEvent) => {
      if (
        modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node) &&
        modelBtnRef.current && !modelBtnRef.current.contains(e.target as Node)
      ) {
        setShowModelMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showModelMenu]);

  // Load available models from admin API keys
  useEffect(() => {
    let cancelled = false;
    loadAllApiKeys().then(keys => {
      if (cancelled) return;
      const models = filterModelsByKeys(keys);
      setAvailableModels(models);
      setModel(pickBestModel(models, thread?.model));
      setModelsLoaded(true);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open artifact panel for last AI message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant') return;
    const artifact = extractArtifact(lastMsg.content);
    if (artifact) setActiveArtifact(artifact);
  }, [messages]);

  // Auto-send pending template message
  useEffect(() => {
    if (!pendingTemplate || isSending) return;
    onTemplateSent?.();
    const text = pendingTemplate;
    setInput('');
    onSendMessage(text, model);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTemplate]);

  // File picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        setAttachment({ name: file.name, mimeType: file.type, base64 });
        setAttachPreview(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const text = reader.result as string;
        setAttachment({ name: file.name, mimeType: file.type, text });
        setAttachPreview(null);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const clearAttachment = () => { setAttachment(null); setAttachPreview(null); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    let finalContent = text;
    if (attachment?.text) {
      finalContent = `**Csatolt fájl: ${attachment.name}**\n\`\`\`\n${attachment.text}\n\`\`\`\n\n${text}`;
    }

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const att = attachment;
    clearAttachment();
    await onSendMessage(finalContent, model, att?.base64 ? att : undefined, taskMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const currentModel = availableModels.find(m => m.value === model) ?? availableModels[0];
  const lastMsg = messages[messages.length - 1];
  const isLastStreaming = isSending && !isThinking && lastMsg?.role === 'assistant';

  const noApiKey = modelsLoaded && availableModels.length === 0;

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      <div ref={containerRef} className="flex flex-1 h-full overflow-hidden">

        {/* ── Chat column ── */}
        <div className="flex flex-col h-full overflow-hidden min-w-0"
          style={{ width: activeArtifact ? `${100 - panelPct}%` : '100%', transition: 'width 0ms' }}>

          {/* Header */}
          {thread && (
            <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
              <h1 className="text-sm font-medium text-zinc-200 truncate">{thread.title}</h1>
              {messages.length > 0 && (
                <button
                  onClick={() => downloadAsPdf(thread, messages)}
                  title="Letöltés PDF-ként"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0 ml-2"
                >
                  <Download size={13} />
                  PDF
                </button>
              )}
            </div>
          )}

          {/* No API key banner */}
          {noApiKey && (
            <div className="mx-4 mt-4 flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl shrink-0">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300">
                {isAdmin
                  ? 'Nincs API kulcs beállítva. Menj a Beállítások › Admin menübe és add meg a Google API kulcsot.'
                  : 'Az AI még nincs konfigurálva. Kérjük az adminisztrátort, hogy adja meg az API kulcsot.'}
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
            <div className="max-w-3xl mx-auto">
              {messages.length === 0 && !isSending ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-2">
                  {/* Logo */}
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center mb-5 shadow-lg overflow-hidden">
                    <img src="/logo.png" alt="AI Vivien" className="w-12 h-12 object-contain" />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                    {thread ? t.ChatInterface.startTheConversation : t.ChatInterface.whatCanIHelpWith}
                  </h2>
                  <p className="text-sm text-zinc-500 mb-6 max-w-sm">{t.ChatInterface.askMeAnything}</p>

                  {/* Task mode selector */}
                  <div className="flex flex-wrap justify-center gap-2 mb-7">
                    {TASK_MODES.map(mode => (
                      <button
                        key={mode.id}
                        title={mode.title}
                        onClick={() => setTaskMode(mode.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                          taskMode === mode.id
                            ? 'bg-zinc-700 border-zinc-500 text-zinc-100 shadow-sm'
                            : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <span>{mode.icon}</span>
                        <span>{mode.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Templates */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-2xl mb-5">
                    {TEMPLATES.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          if (thread) {
                            onSendMessage(tpl.prompt, model, undefined, taskMode);
                          } else {
                            setInput(tpl.prompt);
                            textareaRef.current?.focus();
                          }
                        }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 transition-all text-left group"
                      >
                        <span className={`p-1.5 rounded-md border shrink-0 ${tpl.color}`}>{tpl.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">{tpl.title}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">{tpl.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Quick suggestions */}
                  <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                        className="px-4 py-3.5 text-left text-xs text-zinc-400 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 rounded-xl transition-all leading-relaxed">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, idx) => (
                    <MessageBubble key={m.id} message={m}
                      isStreaming={isLastStreaming && idx === messages.length - 1}
                      onArtifactClick={setActiveArtifact} aiAvatarUrl={aiAvatarUrl} />
                  ))}
                  {isThinking && <TypingIndicator aiAvatarUrl={aiAvatarUrl} />}
                </>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="px-4 pb-4 shrink-0">
            <div className="max-w-3xl mx-auto">

              {/* Attachment preview */}
              {attachment && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-zinc-800/70 border border-zinc-700/60 rounded-xl">
                  {attachPreview
                    ? <img src={attachPreview} alt={attachment.name} className="w-10 h-10 rounded-lg object-cover border border-zinc-700" />
                    : <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                        {attachment.mimeType.startsWith('image/')
                          ? <ImageIcon size={16} className="text-zinc-400" />
                          : <FileText size={16} className="text-zinc-400" />}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-200 truncate">{attachment.name}</p>
                    <p className="text-[10px] text-zinc-500">{attachment.mimeType}</p>
                  </div>
                  <button onClick={clearAttachment} className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="relative bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden focus-within:border-zinc-500 transition-colors shadow-lg">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={t.ChatInterface.messagePlaceholder}
                  rows={1}
                  className="w-full px-4 pt-3.5 pb-12 text-sm bg-transparent text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none"
                  style={{ minHeight: '52px' }}
                  disabled={isSending}
                />

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {/* File attach */}
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      title="Fájl csatolása"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors">
                      <Paperclip size={14} />
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden"
                      accept="image/*,.txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.py,.pdf"
                      onChange={handleFileChange} />

                    {/* Task mode selector */}
                    <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-lg bg-zinc-700/40 border border-zinc-700/60">
                      {TASK_MODES.map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          title={mode.title}
                          onClick={() => setTaskMode(mode.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                            taskMode === mode.id
                              ? 'bg-zinc-600 text-zinc-100 shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/60'
                          }`}
                        >
                          <span>{mode.icon}</span>
                          <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Model selector – always visible (admin already set keys) */}
                    {!modelsLoaded ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-600">
                        <Loader2 size={12} className="animate-spin" /><span>Betöltés...</span>
                      </div>
                    ) : availableModels.length === 0 ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400">
                        <Cpu size={12} /><span>Nincs modell</span>
                      </div>
                    ) : (
                      <div className="relative z-50">
                        <button
                          ref={modelBtnRef}
                          type="button"
                          onClick={() => {
                            const rect = modelBtnRef.current?.getBoundingClientRect();
                            if (rect) setMenuPos({ top: window.innerHeight - rect.top + 4, left: rect.left });
                            setShowModelMenu(v => !v);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors">
                          <Cpu size={12} />
                          <span>{currentModel?.label ?? model}</span>
                          <ChevronDown size={11} />
                        </button>
                        {showModelMenu && (
                          <div
                            ref={modelMenuRef}
                            className="fixed bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-y-auto z-[9999] w-72 max-h-96"
                            style={{ bottom: menuPos.top, left: menuPos.left }}
                          >
                            <div className="p-1">
                              {availableModels.map(m => (
                                <button key={m.value} type="button"
                                  onClick={() => { setModel(m.value); setShowModelMenu(false); }}
                                  className={`w-full px-3 py-2 text-left text-xs transition-colors rounded-lg flex items-center justify-between ${
                                    model === m.value ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-300 hover:bg-zinc-800'
                                  }`}>
                                  <span>{m.label}</span>
                                  {m.badge && (
                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      {m.badge}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={handleSubmit as any}
                    disabled={!input.trim() || isSending}
                    className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
                    {isSending
                      ? <Loader2 size={14} className="animate-spin text-white" />
                      : <Send size={14} className="text-white" />}
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-zinc-600 mt-2">{t.ChatInterface.disclaimer}</p>
            </div>
          </div>
        </div>

        {/* ── Drag divider ── */}
        {activeArtifact && (
          <div onMouseDown={onDividerMouseDown}
            className="w-[5px] shrink-0 cursor-col-resize flex items-center justify-center group z-10 relative"
            style={{ background: 'transparent' }}>
            <div className="w-px h-full bg-zinc-800 group-hover:bg-zinc-500 transition-colors" />
            <div className="absolute flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-zinc-400" />)}
            </div>
          </div>
        )}

        {/* ── Artifact panel ── */}
        {activeArtifact && (
          <div className="flex flex-col h-full overflow-hidden"
            style={{ width: `${panelPct}%`, animation: 'slideInRight 180ms ease-out', borderLeft: '1px solid rgb(39 39 42 / 0.8)' }}>
            <ArtifactPanel artifact={activeArtifact} onClose={() => setActiveArtifact(null)} isStreaming={isLastStreaming} />
          </div>
        )}
      </div>
    </>
  );
}