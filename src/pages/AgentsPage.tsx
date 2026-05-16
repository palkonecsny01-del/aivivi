import { useState } from 'react';
import {
  Bot, Plus, Search, Trash2, CreditCard as Edit2, Globe, Lock, Eye, Zap,
  MoreVertical, MessageSquare
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useI18n } from '../i18n';
import type { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];

const MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  { value: 'gemini-2.5-flash', label: 'AiLabStudio - Ai Vivien - 2.5' },
];

const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-700',
  'from-rose-500 to-rose-700',
  'from-cyan-500 to-cyan-700',
  'from-violet-500 to-violet-700',
];

function getAgentColor(id: string) {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface AgentFormData {
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  visibility: string;
}

const defaultForm: AgentFormData = {
  name: '',
  description: '',
  system_prompt: '',
  model: 'gpt-4o-mini',
  visibility: 'private',
};

interface AgentsPageProps {
  agents: Agent[];
  userId: string;
  onCreateAgent: (data: AgentFormData) => Promise<void>;
  onUpdateAgent: (id: string, data: Partial<AgentFormData>) => Promise<void>;
  onDeleteAgent: (id: string) => Promise<void>;
  onChatWithAgent: (agent: Agent) => void;
}

export function AgentsPage({
  agents,
  userId,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onChatWithAgent,
}: AgentsPageProps) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<AgentFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine' | 'public'>('all');
  const { t } = useI18n();

  const VISIBILITIES = [
    { value: 'private', label: t.Agent.private },
    { value: 'public', label: t.Agent.public },
    { value: 'readonly', label: t.Agent.readOnly },
  ];

  const filtered = agents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'mine' && a.user_id === userId) ||
      (filter === 'public' && a.visibility === 'public');
    return matchSearch && matchFilter;
  });

  const openCreate = () => {
    setEditingAgent(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      description: agent.description,
      system_prompt: agent.system_prompt,
      model: agent.model,
      visibility: agent.visibility,
    });
    setShowModal(true);
    setOpenMenu(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingAgent) {
      await onUpdateAgent(editingAgent.id, form);
    } else {
      await onCreateAgent(form);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await onDeleteAgent(id);
    setDeleteConfirm(null);
  };

  const VisibilityBadge = ({ v }: { v: string }) => {
    const icons = { private: <Lock size={10} />, public: <Globe size={10} />, readonly: <Eye size={10} /> };
    const colors = { private: 'bg-zinc-700 text-zinc-400', public: 'bg-emerald-900/40 text-emerald-400', readonly: 'bg-blue-900/40 text-blue-400' };
    const labels = { private: t.Agent.private, public: t.Agent.public, readonly: t.Agent.readOnly };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[v as keyof typeof colors] ?? colors.private}`}>
        {icons[v as keyof typeof icons]}
        {labels[v as keyof typeof labels] ?? v}
      </span>
    );
  };

  const filterLabels = { all: t.Agent.all, mine: t.Agent.mine, public: t.Agent.publicFilter };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-1">{t.Agent.title}</h1>
            <p className="text-sm text-zinc-500">{t.Agent.buildAndManage}</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={15} />
            {t.Agent.newAgent}
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-zinc-800/60 border border-zinc-700/60 rounded-lg p-1">
            {(['all', 'mine', 'public'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.Agent.searchAgents}
              className="w-full pl-8 pr-3 py-2 text-sm bg-zinc-800/60 border border-zinc-700/60 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Agents grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
              <Bot size={28} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium mb-1">
              {search ? t.Agent.noAgentsFound : t.Agent.noAgents}
            </p>
            <p className="text-sm text-zinc-600 mb-6">
              {search ? t.Agent.tryDifferentSearch : t.Agent.createFirst}
            </p>
            {!search && (
              <Button onClick={openCreate} variant="secondary">
                <Plus size={15} />
                {t.Agent.newAgent}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(agent => (
              <div
                key={agent.id}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-black/20"
              >
                {/* Menu */}
                {agent.user_id === userId && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setOpenMenu(openMenu === agent.id ? null : agent.id)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {openMenu === agent.id && (
                      <div className="absolute right-0 top-8 w-36 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-10">
                        <button
                          onClick={() => openEdit(agent)}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <Edit2 size={12} /> {t.Common.edit}
                        </button>
                        <button
                          onClick={() => { setDeleteConfirm(agent.id); setOpenMenu(null); }}
                          className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                        >
                          <Trash2 size={12} /> {t.Common.delete}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAgentColor(agent.id)} flex items-center justify-center mb-4 shadow-lg`}>
                  <Bot size={22} className="text-white" />
                </div>

                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-zinc-100 mb-1 truncate pr-6">{agent.name}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {agent.description || t.Agent.noDescription}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <VisibilityBadge v={agent.visibility} />
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Zap size={10} />
                    {MODELS.find(m => m.value === agent.model)?.label ?? agent.model}
                  </span>
                </div>

                <button
                  onClick={() => onChatWithAgent(agent)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/30 hover:border-blue-600 transition-all"
                >
                  <MessageSquare size={12} />
                  {t.Agent.chatWithAgent}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingAgent ? t.Common.editAgent : t.Agent.newAgent}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label={t.Agent.name}
            placeholder={t.Agent.namePlaceholder}
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          <Input
            label={t.Agent.descriptionLabel}
            placeholder={t.Agent.descriptionPlaceholder}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
          <Textarea
            label={t.Agent.systemPrompt}
            placeholder={t.Agent.systemPromptPlaceholder}
            value={form.system_prompt}
            onChange={e => setForm(p => ({ ...p, system_prompt: e.target.value }))}
            rows={5}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t.Agent.model}
              options={MODELS}
              value={form.model}
              onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
            />
            <Select
              label={t.Agent.visibility}
              options={VISIBILITIES}
              value={form.visibility}
              onChange={e => setForm(p => ({ ...p, visibility: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>{t.Common.cancel}</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.name.trim()}>
              {editingAgent ? t.Agent.saveChanges : t.Common.create}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t.Common.delete}
        size="sm"
      >
        <p className="text-sm text-zinc-400 mb-6">
          {t.Agent.deleteConfirm} {t.Agent.thisActionCannotBeUndone}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{t.Common.cancel}</Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            {t.Common.delete}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
