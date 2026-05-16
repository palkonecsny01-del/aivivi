// API handler for multiple LLM providers
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FileAttachment {
  name: string;
  mimeType: string;
  base64?: string;   // for images
  text?: string;     // for text files
}


async function callOpenAI(apiKey: string, messages: Message[], model: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: messages,
      max_tokens: 16384,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

async function callOpenAIStreaming(
  apiKey: string,
  messages: Message[],
  model: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: messages,
      max_tokens: 16384,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const json = JSON.parse(data);
          const text = json.choices?.[0]?.delta?.content;
          if (text) onChunk(text);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }
}

async function callGemini(apiKey: string, messages: Message[], model: string): Promise<string> {
  const systemPrompt = messages.find(m => m.role === 'system')?.content;
  const chatMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : m.role,
    parts: [{ text: m.content }],
  }));

  const body = {
    contents: chatMessages,
    generationConfig: {
      maxOutputTokens: 65536,
    },
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callGeminiStreaming(
  apiKey: string,
  messages: Message[],
  model: string,
  onChunk: (chunk: string) => void,
  attachment?: FileAttachment
): Promise<void> {
  const systemPrompt = messages.find(m => m.role === 'system')?.content;
  const chatMessages = messages.filter(m => m.role !== 'system');

  // Build Gemini message list; inject image into last user message if provided
  const geminiMessages = chatMessages.map((m, idx) => {
    const isLastUser = m.role === 'user' && idx === chatMessages.length - 1;
    if (isLastUser && attachment?.base64 && attachment.mimeType.startsWith('image/')) {
      return {
        role: 'user',
        parts: [
          { inline_data: { mime_type: attachment.mimeType, data: attachment.base64 } },
          { text: m.content },
        ],
      };
    }
    return {
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    };
  });

  const body = {
    contents: geminiMessages,
    generationConfig: {
      maxOutputTokens: 65536,
    },
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Gemini streaming error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No response body');

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const json = JSON.parse(raw);
          // Handle all parts (including thinking parts - skip those)
          const parts = json.candidates?.[0]?.content?.parts ?? [];
          for (const part of parts) {
            if (part.thought) continue; // skip thinking tokens
            if (part.text) onChunk(part.text);
          }
        } catch {
          // Ignore parse errors for partial lines
        }
      }
    }
  }
}

async function callAnthropic(apiKey: string, messages: Message[], model: string): Promise<string> {
  const systemPrompt = messages.find(m => m.role === 'system')?.content;
  const chatMessages = messages.filter(m => m.role !== 'system');

  const body = {
    model: model || 'claude-3-5-sonnet-20241022',
    max_tokens: 16384,
    messages: chatMessages,
    system: systemPrompt,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

export async function callLLM(
  messages: Message[],
  model: string
): Promise<string | null> {
  // Try providers in order
  const openaiKey = localStorage.getItem('planlabstudio_key_openai');
  if (openaiKey) {
    try {
      return await callOpenAI(openaiKey, messages, model);
    } catch (error) {
      console.error('OpenAI error:', error);
    }
  }

  const geminiKey = localStorage.getItem('planlabstudio_key_google');
  if (geminiKey) {
    try {
      return await callGemini(geminiKey, messages, model);
    } catch (error) {
      console.error('Gemini error:', error);
    }
  }

  const anthropicKey = localStorage.getItem('planlabstudio_key_anthropic');
  if (anthropicKey) {
    try {
      return await callAnthropic(anthropicKey, messages, model);
    } catch (error) {
      console.error('Anthropic error:', error);
    }
  }

  return null;
}

export async function callLLMStreaming(
  messages: Message[],
  model: string,
  onChunk: (chunk: string) => void,
  attachment?: FileAttachment
): Promise<void> {
  // Gemini streaming preferred
  const geminiKey = localStorage.getItem('planlabstudio_key_google');
  if (geminiKey) {
    try {
      return await callGeminiStreaming(geminiKey, messages, model, onChunk, attachment);
    } catch (error) {
      console.error('Gemini streaming error:', error);
      throw error;
    }
  }

  const openaiKey = localStorage.getItem('planlabstudio_key_openai');
  if (openaiKey) {
    try {
      return await callOpenAIStreaming(openaiKey, messages, model, onChunk);
    } catch (error) {
      console.error('OpenAI streaming error:', error);
      throw error;
    }
  }

  throw new Error('No API key available for streaming');
}