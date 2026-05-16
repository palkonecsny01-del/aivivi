import { useState, useEffect, useRef, useCallback } from 'react';
import { Code, Eye, X, Copy, Check, RefreshCw, Download, Maximize2, Minimize2 } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CodeBlock {
  language: string;
  code: string;
}

export interface Artifact {
  language: string;
  code: string;
  title?: string;
  blocks: CodeBlock[];
  previewHtml: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PREVIEWABLE_LANGS = new Set(['html', 'css', 'javascript', 'js', 'jsx', 'tsx']);
const SUPPORTED_LANGS = new Set([
  'html', 'css', 'javascript', 'js', 'jsx', 'tsx', 'typescript', 'ts',
  'python', 'py', 'sql', 'json', 'bash', 'sh', 'yaml', 'yml',
  'xml', 'markdown', 'md', 'rust', 'go', 'java', 'c', 'cpp', 'cs',
  'php', 'ruby', 'rb', 'swift', 'kotlin',
]);

const LANG_COLORS: Record<string, string> = {
  html: 'text-orange-400 bg-orange-400/10',
  css: 'text-sky-400 bg-sky-400/10',
  javascript: 'text-yellow-400 bg-yellow-400/10',
  js: 'text-yellow-400 bg-yellow-400/10',
  jsx: 'text-cyan-400 bg-cyan-400/10',
  tsx: 'text-cyan-400 bg-cyan-400/10',
  typescript: 'text-blue-400 bg-blue-400/10',
  ts: 'text-blue-400 bg-blue-400/10',
  python: 'text-green-400 bg-green-400/10',
  py: 'text-green-400 bg-green-400/10',
  sql: 'text-purple-400 bg-purple-400/10',
  json: 'text-amber-400 bg-amber-400/10',
  bash: 'text-zinc-300 bg-zinc-700/80',
  sh: 'text-zinc-300 bg-zinc-700/80',
};

// ── Keyboard-event bridge injected into every srcdoc ─────────────────────────
// This snippet re-dispatches postMessage keyboard events from the parent
// and also dispatches them into focused elements so calculator-style apps work.
const KEYBOARD_BRIDGE = `
<script>
(function(){
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.__source !== 'planlabstudio_parent') return;
    var d = e.data;
    if (d.type === 'keydown' || d.type === 'keyup' || d.type === 'keypress') {
      var init = {
        key: d.key, code: d.code, keyCode: d.keyCode, which: d.keyCode,
        shiftKey: d.shiftKey, ctrlKey: d.ctrlKey, altKey: d.altKey,
        metaKey: d.metaKey, bubbles: true, cancelable: true
      };
      var targets = [document.activeElement, document.body, document];
      var dispatched = false;
      targets.forEach(function(t) {
        if (t && !dispatched) {
          try { t.dispatchEvent(new KeyboardEvent(d.type, init)); dispatched = true; } catch(e2){}
        }
      });
    }
  });
  // Auto-focus body so tab/arrow keys work immediately
  document.addEventListener('DOMContentLoaded', function() {
    if (document.body) document.body.setAttribute('tabindex', '-1');
  });
})();
</script>
`;

// ── Multi-file combiner ──────────────────────────────────────────────────────

function extractAllBlocks(content: string): CodeBlock[] {
  const regex = /```(\w+)\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const lang = match[1].toLowerCase();
    const code = match[2].trim();
    if (SUPPORTED_LANGS.has(lang) && code.length >= 5) {
      blocks.push({ language: lang, code });
    }
  }
  return blocks;
}

function buildPreviewHtml(blocks: CodeBlock[]): string {
  const byLang: Record<string, string[]> = {};
  for (const b of blocks) {
    (byLang[b.language] ??= []).push(b.code);
  }

  const htmlParts = byLang['html'] ?? [];
  const cssParts  = byLang['css'] ?? [];
  const jsParts   = [
    ...(byLang['javascript'] ?? []),
    ...(byLang['js'] ?? []),
    ...(byLang['jsx'] ?? []),
    ...(byLang['tsx'] ?? []),
  ];

  if (htmlParts.length === 1 && cssParts.length === 0 && jsParts.length === 0) {
    // Inject keyboard bridge into existing HTML
    const src = htmlParts[0];
    if (/<\/head>/i.test(src)) return src.replace(/<\/head>/i, KEYBOARD_BRIDGE + '</head>');
    if (/<body/i.test(src))    return src.replace(/<body/i, KEYBOARD_BRIDGE + '<body');
    return KEYBOARD_BRIDGE + src;
  }

  let headExtra = '';
  let bodyContent = '';

  for (const html of htmlParts) {
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    if (headMatch || bodyMatch) {
      headExtra  += headMatch ? headMatch[1] : '';
      bodyContent += bodyMatch ? bodyMatch[1] : html;
    } else {
      bodyContent += html;
    }
  }

  const styleBlock  = cssParts.length ? `<style>\n${cssParts.join('\n\n')}\n</style>` : '';
  const scriptBlock = jsParts.length
    ? `<script>
(function() {
  'use strict';
  try {
${jsParts.join('\n\n')}
  } catch (e) {
    document.body.insertAdjacentHTML('beforeend',
      '<div style="color:red;padding:12px;font-family:monospace;font-size:13px">Runtime error: ' + e.message + '</div>'
    );
  }
})();
<\/script>`
    : '';

  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
  ${KEYBOARD_BRIDGE}
  ${styleBlock}
  ${headExtra}
</head>
<body>
${bodyContent}
${scriptBlock}
</body>
</html>`;
}

// ── Public extractor ─────────────────────────────────────────────────────────

export function extractArtifact(content: string): Artifact | null {
  const blocks = extractAllBlocks(content);
  if (blocks.length === 0) return null;

  const previewHtml = buildPreviewHtml(blocks);
  const canPreview = blocks.some(b => PREVIEWABLE_LANGS.has(b.language));
  if (!canPreview && blocks.length === 1 && blocks[0].code.length < 20) return null;

  const primary =
    blocks.find(b => b.language === 'html') ??
    blocks.find(b => b.language === 'js' || b.language === 'javascript') ??
    blocks.find(b => PREVIEWABLE_LANGS.has(b.language)) ??
    blocks[0];

  return {
    language: primary.language,
    code: primary.code,
    title: blocks.length > 1 ? `${blocks.length} files` : undefined,
    blocks,
    previewHtml,
  };
}

// ── Download artifact as HTML file ───────────────────────────────────────────

function downloadHtml(artifact: Artifact) {
  const blob = new Blob([artifact.previewHtml], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'artifact.html';
  a.click();
  URL.revokeObjectURL(url);
}

// ── ArtifactPanel component ──────────────────────────────────────────────────

interface ArtifactPanelProps {
  artifact: Artifact;
  onClose: () => void;
  isStreaming?: boolean;
}

export function ArtifactPanel({ artifact, onClose, isStreaming }: ArtifactPanelProps) {
  const canPreview  = artifact.blocks.some(b => PREVIEWABLE_LANGS.has(b.language));
  const [activeTab, setActiveTab]       = useState<'preview' | 'code'>(canPreview ? 'preview' : 'code');
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [copied, setCopied]             = useState(false);
  const [previewKey, setPreviewKey]     = useState(0);
  const [fullscreen, setFullscreen]     = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(canPreview ? 'preview' : 'code');
    setActiveBlockIdx(0);
  }, [artifact.language, canPreview]);

  useEffect(() => {
    if (!isStreaming) setPreviewKey(k => k + 1);
  }, [isStreaming]);

  // Auto-focus iframe when switching to preview so keyboard works immediately
  useEffect(() => {
    if (activeTab === 'preview' && iframeRef.current) {
      const timer = setTimeout(() => {
        iframeRef.current?.focus();
        // Also try focusing inside the iframe's body
        try {
          iframeRef.current?.contentDocument?.body?.focus();
        } catch {}
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, previewKey]);

  // Forward keyboard events from parent → iframe via postMessage
  // This enables calculator-style apps that listen to document keydown
  const forwardKey = useCallback((e: KeyboardEvent) => {
    if (activeTab !== 'preview') return;
    // Don't steal events from real focused inputs in the parent
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    iframeRef.current?.contentWindow?.postMessage({
      __source: 'planlabstudio_parent',
      type: e.type,
      key: e.key, code: e.code, keyCode: e.keyCode,
      shiftKey: e.shiftKey, ctrlKey: e.ctrlKey,
      altKey: e.altKey, metaKey: e.metaKey,
    }, '*');
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener('keydown', forwardKey);
    window.addEventListener('keyup', forwardKey);
    return () => {
      window.removeEventListener('keydown', forwardKey);
      window.removeEventListener('keyup', forwardKey);
    };
  }, [forwardKey]);

  const copy = async () => {
    const code = artifact.blocks[activeBlockIdx]?.code ?? artifact.code;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const langColor  = LANG_COLORS[artifact.language] ?? 'text-zinc-400 bg-zinc-800';
  const activeBlock = artifact.blocks[activeBlockIdx];

  const panel = (
    <div
      ref={wrapperRef}
      className={`flex flex-col bg-zinc-950 min-w-0 ${fullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className={`shrink-0 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${langColor}`}>
            {artifact.blocks.length > 1 ? `${artifact.blocks.length} files` : artifact.language}
          </span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              streaming…
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {canPreview && (
            <>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'preview' ? 'bg-zinc-700/80 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <Eye size={11} /> Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'code' ? 'bg-zinc-700/80 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <Code size={11} /> Code
              </button>
            </>
          )}
          {activeTab === 'preview' && canPreview && (
            <button
              onClick={() => setPreviewKey(k => k + 1)}
              title="Refresh"
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/60"
            >
              <RefreshCw size={12} />
            </button>
          )}
          {canPreview && (
            <button
              onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? 'Kicsinyítés' : 'Teljes képernyő'}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/60"
            >
              {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}
          <button
            onClick={() => downloadHtml(artifact)}
            title="Letöltés HTML-ként"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/60"
          >
            <Download size={12} />
          </button>
          <button onClick={copy} title="Copy" className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/60">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          </button>
          <button onClick={onClose} title="Close" className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800/60">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* File tabs */}
      {activeTab === 'code' && artifact.blocks.length > 1 && (
        <div className="flex gap-1 px-3 py-1.5 border-b border-zinc-800/60 overflow-x-auto no-scrollbar shrink-0">
          {artifact.blocks.map((b, i) => (
            <button
              key={i}
              onClick={() => setActiveBlockIdx(i)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                activeBlockIdx === i ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
              }`}
            >
              {LANG_COLORS[b.language] ? (
                <span className={`mr-1.5 inline-block w-1.5 h-1.5 rounded-full ${LANG_COLORS[b.language]?.split(' ')[0].replace('text-', 'bg-')}`} />
              ) : null}
              {b.language}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-hidden relative"
        onClick={() => {
          // Clicking anywhere in the preview wrapper focuses the iframe
          if (activeTab === 'preview') {
            iframeRef.current?.focus();
            try { iframeRef.current?.contentDocument?.body?.focus(); } catch {}
          }
        }}
      >
        {activeTab === 'preview' && canPreview && (
          <iframe
            ref={iframeRef}
            key={previewKey}
            srcDoc={artifact.previewHtml}
            className="w-full h-full border-0 outline-none"
            style={{ background: '#fff' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-pointer-lock allow-downloads"
            title="Preview"
            tabIndex={0}
          />
        )}

        {activeTab === 'code' && (
          <div className="h-full overflow-auto no-scrollbar">
            <pre className="p-5 text-[12.5px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
              <code>{activeBlock?.code ?? artifact.code}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Keyboard hint when preview is active */}
      {activeTab === 'preview' && canPreview && (
        <div className="shrink-0 px-3 py-1.5 border-t border-zinc-800/60 flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">
            ⌨️ Kattints az előnézetbe a billentyűzetes interakcióhoz
          </span>
        </div>
      )}
    </div>
  );

  return panel;
}