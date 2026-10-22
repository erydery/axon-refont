import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Check, Layers, List, Play, Target, X, Zap } from 'lucide-react';
import { api } from '../services/http';
import type { DashboardData, Course } from '../types';
import { UnfollowCourseModal } from '../components/UnfollowCourseModal';
import toast from 'react-hot-toast';
export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Course | null>(null);
  const load = async () => {
    try {
      const response = await api<DashboardData>('/learning/dashboard');
      setData(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de charger le dashboard.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const totals = useMemo(() => {
    const chapters = data?.courses.flatMap((c) => c.chapters) ?? [];
    const completed = chapters.filter((c) => c.isCompleted).length;
    const answers = data?.answers ?? [];
    return {
      chapters: chapters.length,
      completed,
      accuracy: answers.length
        ? Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100)
        : 0,
    };
  }, [data]);
  if (loading) return <Loading />;
  if (!data) return <div className="empty-state">Données indisponibles</div>;
  return (
    <div className="page-stack">
      <div className="dashboard-welcome">
        <div>
          <span className="page-kicker">VOTRE ESPACE D’APPRENTISSAGE</span>
          <h1>
            Bonjour, <em>{(data.user.name || 'Étudiant').split(' ')[0]}.</em>
          </h1>
          <p>{data.option?.name || 'Votre parcours est prêt à être configuré.'}</p>
        </div>
        <div className="welcome-mark">
          <Zap size={34} />
          <span>
            AXON
            <br />
            LEARN
          </span>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card stat-highlight">
          <span className="stat-icon">
            <Target />
          </span>
          <span className="stat-label">PRÉCISION GLOBALE</span>
          <strong>
            {totals.accuracy}
            <small>%</small>
          </strong>
          <span className="stat-foot">Sur l’ensemble de vos évaluations</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Layers />
          </span>
          <span className="stat-label">CHAPITRES VALIDÉS</span>
          <strong>
            {totals.completed}
            <small> / {totals.chapters}</small>
          </strong>
          <div className="stat-progress">
            <i
              style={{
                width: `${totals.chapters ? (totals.completed / totals.chapters) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="stat-foot">Votre progression académique</span>
        </div>
        <div className="stat-card stat-wide">
          <div>
            <span className="stat-label">COURS EN COURS</span>
            <strong>{data.courses.length.toString().padStart(2, '0')}</strong>
            <span className="stat-foot">Modules actifs dans votre cursus</span>
          </div>
          <BookOpen className="stat-watermark" size={72} />
        </div>
      </div>
      <div className="section-title-row">
        <div>
          <span className="page-kicker">VOTRE PROGRAMME</span>
          <h2>
            Mes cours <span>({data.courses.length})</span>
          </h2>
        </div>
        <Link className="text-link" to="/dashboard/course">
          Explorer les cours <ArrowUpRight size={16} />
        </Link>
      </div>
      {data.courses.length === 0 ? (
        <div className="empty-card">
          <BookOpen size={35} />
          <h3>Aucun cours actif</h3>
          <p>Explorez les cours et construisez votre programme personnalisé.</p>
          <Link className="button button-lime" to="/dashboard/course">
            Explorer les cours <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="course-grid">
          {data.courses.map((course) => {
            const done = course.chapters.filter((ch) => ch.isCompleted).length;
            const percent = course.chapters.length
              ? Math.round((done / course.chapters.length) * 100)
              : 0;
            const next = course.chapters.find((ch) => !ch.isCompleted) || course.chapters[0];
            return (
              <article className="course-card" key={course.id}>
                <div className="course-card-head">
                  <span className="course-icon">
                    <BookOpen size={20} />
                  </span>
                  <span className="course-percent">{percent}%</span>
                </div>
                <span className="course-meta">
                  {data.option?.name || 'CURSUS AXON'} · {course.chapters.length} CHAPITRES
                </span>
                <h3>{course.title}</h3>
                <div className="course-progress">
                  <i style={{ width: `${percent}%` }} />
                </div>
                <div className="course-card-footer">
                  <span>
                    {done} / {course.chapters.length} terminés
                  </span>
                  <div className="course-actions">
                    <button
                      className="square-action"
                      title="Voir les chapitres"
                      onClick={() => setSelected(course)}
                    >
                      <List size={16} />
                    </button>
                    {next && (
                      <Link
                        className="continue-btn"
                        to={`/dashboard/courses/${course.id}/chapter/${next.id}`}
                      >
                        <Play size={14} fill="currentColor" /> Continuer
                      </Link>
                    )}
                    <UnfollowCourseModal course={course} onUnfollow={load} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              <X />
            </button>
            <span className="page-kicker">INDEX DU MODULE</span>
            <h2>{selected.title}</h2>
            <div className="chapter-list">
              {selected.chapters.map((chapter, i) => (
                <Link
                  key={chapter.id}
                  to={`/dashboard/courses/${selected.id}/chapter/${chapter.id}`}
                  onClick={() => setSelected(null)}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <b>{chapter.title}</b>
                  {chapter.isCompleted ? <Check size={16} /> : <Play size={13} />}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Loading() {
  return (
    <div className="screen-loader">
      <span className="spinner" />
      Chargement du parcours
    </div>
  );
}
