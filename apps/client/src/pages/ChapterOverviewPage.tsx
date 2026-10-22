import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/http';
import type { Chapter } from '../types';
interface ChapterDetail extends Chapter {
  content: Record<string, any>;
}
const clean = (value: string = '') => value.replace(/[*#]/g, '').trim();
export function ChapterOverviewPage() {
  const { courseId, chapterId } = useParams();
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api<ChapterDetail>(`/learning/courses/${courseId}/chapters/${chapterId}`)
      .then(setChapter)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Chapitre indisponible.'))
      .finally(() => setLoading(false));
  }, [courseId, chapterId]);
  if (loading)
    return (
      <div className="loading-inline">
        <span className="spinner" />
        Chargement du chapitre…
      </div>
    );
  if (!chapter)
    return (
      <div className="empty-card">
        <h3>Chapitre introuvable</h3>
        <Link className="button button-quiet" to="/dashboard">
          Retour au dashboard
        </Link>
      </div>
    );
  const qcm = chapter.content?.exercices?.qcm?.length || 0;
  const reflections = chapter.content?.exercices?.reflexion?.length || 0;
  const count = qcm + reflections;
  const sections = chapter.content?.sections || [];
  return (
    <div className="chapter-overview">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft size={15} /> Retour au dashboard
      </Link>
      <span className="page-kicker">MODULE D’APPRENTISSAGE</span>
      <h1>{chapter.title}</h1>
      <div className="chapter-stats">
        <div>
          <Clock />
          <b>~25 MIN</b>
          <span>DURÉE ESTIMÉE</span>
        </div>
        <div>
          <BrainCircuit />
          <b>{count} TESTS</b>
          <span>ÉVALUATIONS</span>
        </div>
        <div>
          <Trophy />
          <b>+{count * 10} XP</b>
          <span>RÉCOMPENSE</span>
        </div>
      </div>
      <section className="program-card">
        <div className="settings-title">
          <Layers />
          <h2>Programme</h2>
        </div>
        {sections.length ? (
          sections.map((section: any, index: number) => (
            <article className="program-row" key={index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{clean(section.titre)}</h3>
                <p>
                  {clean(section.contenu || '').slice(0, 150)}
                  {(section.contenu || '').length > 150 ? '…' : ''}
                </p>
              </div>
            </article>
          ))
        ) : (
          <p className="muted-small">
            Le plan du chapitre sera disponible dans le contenu pédagogique.
          </p>
        )}
      </section>
      <section className="evaluation-card">
        <div>
          <FileText />
          <h2>Détails de l’évaluation</h2>
        </div>
        <p>
          Format hybride : QCM et exercices de réflexion. Terminez les questions pour valider ce
          chapitre.
        </p>
        <div className="evaluation-status">
          <span>STATUT</span>
          <b>{count} QUESTIONS PRÊTES</b>
        </div>
        <Link
          className="button button-dark"
          to={`/dashboard/courses/${courseId}/chapter/${chapterId}/view`}
        >
          Commencer le module <ChevronRight size={17} />
        </Link>
      </section>
    </div>
  );
}
