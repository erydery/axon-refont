import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RotateCcw,
  Trophy,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/http';
import type { Chapter } from '../types';
import { ChatAI } from '../components/ChatAI';

import { MarkdownContent } from '../components/MarkdownContent';
import { MermaidChart } from '../components/MermaidChart';
import { StatisticalChart } from '../components/StatisticalChart';
interface ReaderData extends Chapter {
  content: Record<string, any>;
  chapters: Chapter[];
}
interface Qcm {
  id?: number;
  question: string;
  options: string[];
  reponse: string;
  explication?: string;
}
export function ChapterReaderPage() {
  const { courseId, chapterId } = useParams();
  const [chapter, setChapter] = useState<ReaderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'reading' | 'practice' | 'results'>('reading');
  const [practiceMode, setPracticeMode] = useState<'qcm' | 'reflexion'>('qcm');
  const [activeSection, setActiveSection] = useState('intro');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{ exerciseId?: number; isCorrect: boolean }[]>([]);
  const [reflectionIndex, setReflectionIndex] = useState(0);
  const [reflection, setReflection] = useState('');
  const [feedback, setFeedback] = useState<{
    note: number;
    feedback: string;
  } | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api<ReaderData>(`/learning/courses/${courseId}/chapters/${chapterId}`)
      .then(setChapter)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Chapitre indisponible.'))
      .finally(() => setLoading(false));
  }, [courseId, chapterId]);
  const content = chapter?.content || {};
  const sections = content.sections || [];
  const qcm: Qcm[] = content.exercices?.qcm || [];
  const reflections = content.exercices?.reflexion || [];
  const next =
    chapter?.chapters?.[chapter.chapters.findIndex((c) => c.id === Number(chapterId)) + 1];
  useEffect(() => {
    function scroll() {
      const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reader-section]'));
      const active = items.find(
        (item) =>
          item.getBoundingClientRect().top > 80 &&
          item.getBoundingClientRect().top < innerHeight * 0.55,
      );
      if (active) setActiveSection(active.id);
    }
    window.addEventListener('scroll', scroll);
    return () => window.removeEventListener('scroll', scroll);
  }, [step]);
  const percentage = qcm.length ? Math.round((score / qcm.length) * 100) : 100;
  async function finish() {
    setSaving(true);
    try {
      await api(`/learning/chapters/${chapterId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ results }),
      });
      toast.success('Progression enregistrée.');
      setStep('results');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }
  function answer(option: string) {
    if (validated) return;
    const item = qcm[current];
    const correct = option === item.reponse;
    setSelected(option);
    setValidated(true);
    if (correct) setScore((s) => s + 1);
    setResults((r) => [...r, { exerciseId: item.id, isCorrect: correct }]);
  }
  async function reviewReflection() {
    if (!reflection.trim()) return;
    setAnalysing(true);
    try {
      const item = reflections[reflectionIndex];
      setFeedback(
        await api('/ai/answer', {
          method: 'POST',
          body: JSON.stringify({
            enonce: item.enonce,
            solution: item.solution,
            userResponse: reflection,
          }),
        }),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Correction indisponible.');
    } finally {
      setAnalysing(false);
    }
  }
  function nextReflection() {
    if (reflectionIndex < reflections.length - 1) {
      setReflectionIndex((i) => i + 1);
      setReflection('');
      setFeedback(null);
    } else void finish();
  }
  function reset() {
    setStep('reading');
    setCurrent(0);
    setSelected(null);
    setValidated(false);
    setScore(0);
    setResults([]);
    setReflectionIndex(0);
    setReflection('');
    setFeedback(null);
  }
  if (loading)
    return (
      <div className="reader-loading">
        <Loader2 className="spin" />
        Chargement du contenu
      </div>
    );
  if (!chapter)
    return (
      <div className="empty-card">
        <h3>Contenu introuvable</h3>
        <Link to="/dashboard">Retour</Link>
      </div>
    );
  return (
    <div className="reader-shell">
      <header className="reader-topbar">
        <Link to="/dashboard" className="reader-back">
          <ArrowLeft size={16} />
          <span>ESPACE APPRENANT</span>
        </Link>
        <div className="reader-top-title">{chapter.title}</div>
        <span className="reader-top-count">{step === 'reading' ? 'LECTURE' : 'ÉVALUATION'}</span>
      </header>
      <div className="reader-progress">
        <i
          style={{
            width: step === 'reading' ? '0%' : step === 'practice' ? '55%' : '100%',
          }}
        />
      </div>
      <div className="reader-body">
        <main className="reader-content">
          {step === 'reading' ? (
            <article className="lesson-content">
              <div className="lesson-eyebrow">
                <span>CHAPITRE {String(chapter.order || 1).padStart(2, '0')}</span>
                <i /> LEÇON INTERACTIVE
              </div>
              <section id="intro" data-reader-section className="lesson-section">
                <h1>{chapter.title}</h1>
                <h2>Introduction</h2>
                <Markdown>
                  {content.introduction ||
                    chapter.description ||
                    'Bienvenue dans ce chapitre. Parcourez les sections ci-dessous puis lancez l’évaluation pour valider vos acquis.'}
                </Markdown>
              </section>
              {sections.map((section: any, index: number) => (
                <section
                  key={index}
                  id={`section-${index}`}
                  data-reader-section
                  className="lesson-section"
                >
                  <span className="section-number">
                    SECTION {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2>{section.titre}</h2>
                  {section.graphique && <MermaidChart chart={section.graphique} />}
                  {section.donnees_stats && <StatisticalChart data={section.donnees_stats} />}
                  <Markdown>{section.contenu || ''}</Markdown>
                </section>
              ))}
              {content.conclusion && (
                <section id="conclusion" data-reader-section className="lesson-conclusion">
                  <span className="page-kicker">SYNTHÈSE EXPERT</span>
                  <Markdown>{content.conclusion}</Markdown>
                </section>
              )}
              <button
                className="button button-lime lesson-start"
                onClick={() => {
                  setPracticeMode(qcm.length ? 'qcm' : 'reflexion');
                  setStep(qcm.length || reflections.length ? 'practice' : 'results');
                }}
              >
                Démarrer l’évaluation <ArrowRight size={17} />
              </button>
            </article>
          ) : step === 'practice' ? (
            <div className="exercise-stage">
              {practiceMode === 'reflexion' && (
                <button
                  className="button button-quiet reflection-skip"
                  onClick={() => void finish()}
                  disabled={saving}
                >
                  Ignorer les réflexions et valider <CheckCircle2 size={16} />
                </button>
              )}
              {practiceMode === 'qcm' && qcm.length > 0 ? (
                <section className="exercise-card">
                  <div className="exercise-top">
                    <span>
                      QCM {current + 1} / {qcm.length}
                    </span>
                    <div className="quiz-dots">
                      {qcm.map((_, i) => (
                        <i className={i <= current ? 'done' : ''} key={i} />
                      ))}
                    </div>
                  </div>
                  <h2>{qcm[current]?.question}</h2>
                  <div className="answer-list">
                    {qcm[current]?.options?.map((option: string, index: number) => {
                      const correct = option === qcm[current].reponse;
                      return (
                        <button
                          key={index}
                          disabled={validated}
                          className={`answer-option ${validated ? (correct ? 'correct' : selected === option ? 'incorrect' : 'muted') : ''}`}
                          onClick={() => answer(option)}
                        >
                          <span>{String.fromCharCode(65 + index)}</span>
                          <b>{option}</b>
                          {validated && correct && <CheckCircle2 size={18} />}
                        </button>
                      );
                    })}
                  </div>
                  {validated && (
                    <div className="explanation">
                      <Zap size={15} />
                      <div>
                        <span>EXPLICATION</span>
                        <p>
                          {qcm[current]?.explication ||
                            'Continuez à votre rythme et passez à la question suivante.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="exercise-footer">
                    <button
                      className="button button-quiet"
                      onClick={() => setPracticeMode('reflexion')}
                      disabled={!reflections.length}
                    >
                      Questions de réflexion (facultatif) <ChevronRight size={16} />
                    </button>
                    <button
                      className="button button-lime"
                      disabled={!validated || saving}
                      onClick={() => {
                        if (current < qcm.length - 1) {
                          setCurrent((c) => c + 1);
                          setValidated(false);
                          setSelected(null);
                        } else void finish();
                      }}
                    >
                      {current < qcm.length - 1
                        ? 'Suivant'
                        : saving
                          ? 'Enregistrement…'
                          : 'Terminer le chapitre'}{' '}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
              ) : (
                <section className="exercise-card reflection-card">
                  <div className="exercise-top">
                    <span>
                      CHALLENGE {reflectionIndex + 1} / {reflections.length}
                    </span>
                    <span className="page-kicker">RÉFLEXION</span>
                  </div>
                  <h2>
                    {reflections[reflectionIndex]?.enonce ||
                      'Partagez ce que vous avez retenu de ce chapitre.'}
                  </h2>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    disabled={analysing || !!feedback}
                    placeholder="Écrivez votre analyse ici…"
                  />
                  {feedback && (
                    <div className="feedback-box">
                      <span>
                        FEEDBACK AXON <b>{feedback.note} / 10</b>
                      </span>
                      <p>{feedback.feedback}</p>
                    </div>
                  )}
                  <div className="exercise-footer">
                    <button
                      className="button button-quiet"
                      onClick={() => setPracticeMode('qcm')}
                      disabled={!qcm.length}
                    >
                      <ChevronRight className="flip" size={16} /> Retour au QCM
                    </button>
                    {feedback ? (
                      <button
                        className="button button-lime"
                        onClick={() =>
                          reflectionIndex < reflections.length - 1
                            ? nextReflection()
                            : void finish()
                        }
                      >
                        {reflectionIndex < reflections.length - 1
                          ? 'Challenge suivant'
                          : 'Terminer'}{' '}
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        className="button button-lime"
                        onClick={reviewReflection}
                        disabled={analysing || !reflection.trim()}
                      >
                        {analysing ? 'Axon analyse…' : 'Lancer l’analyse'} <Zap size={15} />
                      </button>
                    )}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="results-card">
              <div className="results-trophy">
                <Trophy size={38} />
              </div>
              <span className="page-kicker">ANALYSE DE VOS PERFORMANCES</span>
              <h1>Session terminée.</h1>
              <p>Le chapitre et votre progression sont enregistrés.</p>
              <div className="result-stats">
                <div>
                  <span>PRÉCISION QCM</span>
                  <b>{percentage}%</b>
                </div>
                <div>
                  <span>RÉPONSES JUSTES</span>
                  <b>
                    {score}
                    <small> / {qcm.length}</small>
                  </b>
                </div>
              </div>
              <div className="result-actions">
                <button className="button button-quiet" onClick={reset}>
                  <RotateCcw size={15} /> Revoir le cours
                </button>
                {next ? (
                  <Link
                    className="button button-lime"
                    to={`/dashboard/courses/${courseId}/chapter/${next.id}`}
                  >
                    Chapitre suivant <ArrowRight size={16} />
                  </Link>
                ) : (
                  <Link className="button button-lime" to="/dashboard">
                    Retour au dashboard <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </main>
        {step === 'reading' && (
          <aside className="reader-outline">
            <span className="page-kicker">NAVIGATION</span>
            <button
              className={activeSection === 'intro' ? 'active' : ''}
              onClick={() =>
                document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              <span>00</span>Introduction
            </button>
            {sections.map((s: any, i: number) => (
              <button
                key={i}
                className={activeSection === `section-${i}` ? 'active' : ''}
                onClick={() =>
                  document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <span>{String(i + 1).padStart(2, '0')}</span>
                {s.titre}
              </button>
            ))}
            {content.conclusion && (
              <button
                onClick={() =>
                  document.getElementById('conclusion')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <span>✦</span>Synthèse
              </button>
            )}
          </aside>
        )}
      </div>
      {step === 'reading' && <ChatAI chapterTitle={chapter.title} chapterContent={content} />}
    </div>
  );
}
function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown-content">
      <MarkdownContent>{children}</MarkdownContent>
    </div>
  );
}
