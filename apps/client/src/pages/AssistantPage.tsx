import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Bot,
  BookOpen,
  ChevronRight,
  MessageSquarePlus,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/http';
import { useAuth } from '../hooks/useAuth';
import type { AssistantConversation, AssistantMessage, DashboardData } from '../types';
import { MarkdownContent } from '../components/MarkdownContent';

interface ConversationData extends AssistantConversation {
  messages: AssistantMessage[];
}
export function AssistantPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [active, setActive] = useState<ConversationData | null>(null);
  const [draft, setDraft] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  async function loadList() {
    try {
      const [list, profile] = await Promise.all([
        api<AssistantConversation[]>('/assistant/conversations'),
        api<DashboardData>('/learning/dashboard'),
      ]);
      setConversations(list);
      setDashboard(profile);
      if (list.length && !selectedId) setSelectedId(list[0].id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de charger Axon.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void loadList();
  }, []);
  useEffect(() => {
    if (!selectedId) {
      setActive(null);
      return;
    }
    let cancelled = false;
    api<ConversationData>(`/assistant/conversations/${selectedId}`)
      .then((data) => {
        if (!cancelled) setActive(data);
      })
      .catch((error) => {
        if (!cancelled)
          toast.error(error instanceof Error ? error.message : 'Conversation indisponible.');
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [active?.messages.length, busy]);
  async function newConversation() {
    setBusy(true);
    try {
      const conversation = await api<AssistantConversation>('/assistant/conversations', {
        method: 'POST',
        body: JSON.stringify({ chapterId: chapterId ? Number(chapterId) : null }),
      });
      setConversations((list) => [conversation, ...list]);
      setSelectedId(conversation.id);
      setActive({ ...conversation, messages: [] });
      setChapterId('');
      setSidebarOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Création de conversation impossible.');
    } finally {
      setBusy(false);
    }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !active || busy) return;
    const optimistic: AssistantMessage = {
      id: -Date.now(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setActive((current) =>
      current ? { ...current, messages: [...current.messages, optimistic] } : current,
    );
    setDraft('');
    setBusy(true);
    try {
      const result = await api<{
        userMessage: AssistantMessage;
        assistantMessage: AssistantMessage;
        title: string;
      }>(`/assistant/conversations/${active.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      setActive((current) =>
        current
          ? {
              ...current,
              title: result.title,
              messages: [
                ...current.messages.filter((message) => message.id !== optimistic.id),
                result.userMessage,
                result.assistantMessage,
              ],
            }
          : current,
      );
      setConversations((list) =>
        list.map((item) =>
          item.id === active.id
            ? { ...item, title: result.title, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
    } catch (error) {
      setActive((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter((message) => message.id !== optimistic.id),
            }
          : current,
      );
      setDraft(text);
      toast.error(error instanceof Error ? error.message : 'Axon n’a pas pu répondre.');
    } finally {
      setBusy(false);
    }
  }
  async function removeConversation(id: number) {
    try {
      await api(`/assistant/conversations/${id}`, { method: 'DELETE' });
      const remaining = conversations.filter((item) => item.id !== id);
      setConversations(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setActive(null);
      toast.success('Conversation supprimée.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Suppression impossible.');
    }
  }
  return (
    <div className={`assistant-workspace ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className={`assistant-sidebar ${sidebarOpen ? '' : 'hidden-on-mobile'}`}>
        <div className="assistant-brand">
          <span className="assistant-brand-icon">
            <Sparkles size={18} />
          </span>
          <div>
            <b>AXON</b>
            <small>INTELLIGENCE</small>
          </div>
          <button className="assistant-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={17} />
          </button>
        </div>
        <button
          className="button button-lime assistant-new"
          disabled={busy || loading}
          onClick={() => void newConversation()}
        >
          <MessageSquarePlus size={16} /> Nouvelle conversation
        </button>
        <label className="assistant-context-select">
          <span>
            <BookOpen size={13} /> CONTEXTE OPTIONNEL
          </span>
          <select value={chapterId} onChange={(event) => setChapterId(event.target.value)}>
            <option value="">Tous mes cours</option>
            {dashboard?.courses.map((course) => (
              <optgroup key={course.id} label={course.title}>
                {course.chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <span className="page-kicker assistant-history-label">HISTORIQUE</span>
        <div className="assistant-conversation-list">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`assistant-conversation-link ${selectedId === conversation.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedId(conversation.id);
                setSidebarOpen(false);
              }}
            >
              <MessageSquarePlus size={14} />
              <span>{conversation.title}</span>
              <i
                onClick={(event) => {
                  event.stopPropagation();
                  void removeConversation(conversation.id);
                }}
                title="Supprimer"
              >
                <Trash2 size={13} />
              </i>
            </button>
          ))}
          {!conversations.length && (
            <p className="assistant-no-history">Vos conversations enregistrées apparaîtront ici.</p>
          )}
        </div>
        <div className="assistant-user">
          <span>{(user?.name || user?.email || 'A')[0].toUpperCase()}</span>
          <div>
            <b>{user?.name || 'Étudiant AXON'}</b>
            <small>ESPACE PRIVÉ</small>
          </div>
        </div>
      </aside>
      <section className="assistant-chat-panel">
        <header className="assistant-chat-header">
          <button
            className="square-action assistant-menu-button"
            onClick={() => setSidebarOpen((value) => !value)}
          >
            <ChevronRight size={17} />
          </button>
          <span className="assistant-header-icon">
            <Bot size={20} />
          </span>
          <div>
            <b>AXON · TUTEUR IA</b>
            <small>
              {active?.chapterId ? 'CONTEXTUALISÉ AU CHAPITRE' : 'VOTRE ASSISTANT PÉDAGOGIQUE'}
            </small>
          </div>
          <span className="assistant-online">
            <i /> CONNECTÉ
          </span>
        </header>
        {!active ? (
          <div className="assistant-welcome">
            <div className="assistant-welcome-icon">
              <Sparkles size={25} />
            </div>
            <span className="page-kicker">AXON INTELLIGENCE</span>
            <h1>
              Bonjour{user?.name ? ` ${user.name.split(' ')[0]}` : ''}.<br />
              <em>Qu’allez-vous apprendre ?</em>
            </h1>
            <p>
              Créez une conversation pour poser une question sur vos cours. L’historique sera
              enregistré dans votre compte.
            </p>
            <button
              className="button button-lime"
              onClick={() => void newConversation()}
              disabled={busy}
            >
              <Plus size={16} /> Démarrer une conversation
            </button>
          </div>
        ) : (
          <>
            <div className="assistant-messages" ref={scrollRef}>
              {active.messages.length === 0 && (
                <div className="assistant-start-message">
                  <span className="assistant-bubble-icon">
                    <Bot size={15} />
                  </span>
                  <div>
                    <span className="assistant-author">
                      AXON · {active.chapterId ? 'CHAPITRE' : 'TUTEUR'}
                    </span>
                    <p>
                      Salut ! Je suis Axon, votre tuteur pédagogique. Posez votre question et je
                      m’appuierai sur{' '}
                      {active.chapterId ? 'le chapitre sélectionné' : 'les cours de votre cursus'}{' '}
                      pour vous répondre. Je n’invente pas les informations qui ne figurent pas dans
                      mes sources.
                    </p>
                  </div>
                </div>
              )}
              {active.messages.map((message) => (
                <article key={message.id} className={`assistant-message ${message.role}`}>
                  <span className="assistant-message-avatar">
                    {message.role === 'assistant' ? (
                      <Bot size={15} />
                    ) : (
                      (user?.name || 'A')[0].toUpperCase()
                    )}
                  </span>
                  <div>
                    <span className="assistant-author">
                      {message.role === 'assistant' ? 'AXON' : 'VOUS'} ·{' '}
                      {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="assistant-markdown">
                      <MarkdownContent>{message.content}</MarkdownContent>
                    </div>
                  </div>
                </article>
              ))}
              {busy && (
                <div className="assistant-thinking">
                  <span className="spinner" /> Axon prépare une réponse basée sur votre cursus…
                </div>
              )}
            </div>
            <form className="assistant-composer" onSubmit={send}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={8000}
                placeholder="Posez une question sur votre cours…"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send(event);
                  }
                }}
                disabled={busy}
              />
              <div>
                <span>ENTRÉE POUR ENVOYER · MAJ + ENTRÉE POUR UN SAUT DE LIGNE</span>
                <button
                  className="button button-lime"
                  disabled={busy || !draft.trim()}
                  aria-label="Envoyer le message"
                >
                  {busy ? 'Réflexion…' : 'Envoyer'} <Send size={14} />
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
