import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Eye,
  Filter,
  Layers,
  Loader2,
  Play,
  Search,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/http';
import type { Course, DashboardData } from '../types';
export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [profile, setProfile] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('TOUTES LES FILIÈRES');
  const [option, setOption] = useState('TOUTES LES OPTIONS');
  const [level, setLevel] = useState('TOUS LES NIVEAUX');
  const [details, setDetails] = useState<Course | null>(null);
  const [confirm, setConfirm] = useState<Course | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  async function load() {
    try {
      const [c, d] = await Promise.all([
        api<Course[]>('/catalog/courses'),
        api<DashboardData>('/learning/dashboard'),
      ]);
      setCourses(c);
      setProfile(d);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de synchronisation système.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const sectors = [
    'TOUTES LES FILIÈRES',
    ...Array.from(new Set(courses.map((c) => c.option?.sector?.name).filter(Boolean) as string[])),
  ];
  const options = [
    'TOUTES LES OPTIONS',
    ...Array.from(
      new Set(
        courses
          .filter((c) => sector === 'TOUTES LES FILIÈRES' || c.option?.sector?.name === sector)
          .map((c) => c.option?.name)
          .filter(Boolean) as string[],
      ),
    ),
  ];
  const levels = [
    'TOUS LES NIVEAUX',
    ...Array.from(new Set(courses.map((c) => c.level?.name).filter(Boolean) as string[])),
  ];
  const filtered = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.title.toLowerCase().includes(query.toLowerCase()) &&
          (sector === 'TOUTES LES FILIÈRES' || c.option?.sector?.name === sector) &&
          (option === 'TOUTES LES OPTIONS' || c.option?.name === option) &&
          (level === 'TOUS LES NIVEAUX' || c.level?.name === level),
      ),
    [courses, query, sector, option, level],
  );
  const activeIds = new Set(profile?.courses.map((c) => c.id) ?? []);
  const isFollowing = (c: Course) => activeIds.has(c.id);
  async function follow() {
    if (!confirm) return;
    setBusy(true);
    try {
      await api(`/learning/courses/${confirm.id}/follow`, { method: 'POST' });
      toast.success('Cours ajouté à votre programme.');
      setConfirm(null);
      setLoading(true);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Inscription impossible.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack explore-page">
      <header className="explore-heading">
        <span className="page-kicker">BIBLIOTHÈQUE ACADÉMIQUE</span>
        <h1>
          Explorer <em>les cours.</em>
        </h1>
        <p>Parcourez les modules disponibles et composez votre programme.</p>
      </header>
      <section className="filter-panel">
        <div className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="RECHERCHER UN MODULE…"
          />
        </div>
        <div className="filter-row">
          {[
            { label: 'Filière', icon: Filter, value: sector, set: setSector, list: sectors },
            { label: 'Spécialité', icon: Layers, value: option, set: setOption, list: options },
            { label: 'Niveau', icon: BarChart3, value: level, set: setLevel, list: levels },
          ].map(({ label, icon: Icon, value, set, list }) => (
            <label key={label} className="filter-select">
              <span>
                <Icon size={13} />
                {label}
              </span>
              <select value={value} onChange={(e) => set(e.target.value)}>
                {list.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>
      {loading ? (
        <div className="loading-inline">
          <Loader2 className="spin" /> Chargement du catalogue…
        </div>
      ) : filtered.length ? (
        <div className="catalog-grid">
          {filtered.map((course) => (
            <article className="catalog-card" key={course.id}>
              <div className="catalog-top">
                <span className="course-icon">
                  <BookOpen />
                </span>
                <span className="level-tag">{course.level?.name || 'NIVEAU À DÉFINIR'}</span>
                {isFollowing(course) && <CheckCircle2 className="enrolled-check" size={19} />}
              </div>
              <div className="catalog-course-meta">
                {course.option?.sector?.name || 'AXON LEARNING'}
              </div>
              <h3>{course.title}</h3>
              <p>
                {course.chapters.length} chapitre{course.chapters.length === 1 ? '' : 's'} ·{' '}
                {course.option?.name || 'Cours académique'}
              </p>
              <div className="catalog-actions">
                <button className="button button-quiet" onClick={() => setDetails(course)}>
                  <Eye size={15} /> Détails
                </button>
                <button
                  className="button button-lime"
                  disabled={isFollowing(course)}
                  onClick={() => setConfirm(course)}
                >
                  <Play size={14} fill="currentColor" />
                  {isFollowing(course) ? 'Inscrit' : 'Suivre'}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <Search />
          <h3>Aucun cours trouvé</h3>
          <p>Modifiez vos filtres ou votre recherche.</p>
        </div>
      )}
      <AnimatePresence>
        {details && (
          <div className="modal-backdrop" onClick={() => setDetails(null)}>
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setDetails(null)}>
                <X />
              </button>
              <span className="page-kicker">PROGRAMME DU MODULE</span>
              <h2>{details.title}</h2>
              <p className="modal-description">
                {details.description ||
                  `${details.chapters.length} chapitres structurés pour votre progression.`}
              </p>
              <div className="chapter-list">
                {details.chapters
                  .slice()
                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                  .map((chapter, i) => (
                    <button key={chapter.id} onClick={() => setPreview(chapter)}>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <b>{chapter.title}</b>
                      <Eye size={15} />
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div className="modal-card preview-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreview(null)}>
              <X />
            </button>
            <span className="page-kicker">APERÇU DU CHAPITRE</span>
            <h2>{preview.title}</h2>
            <p>
              {preview.description ||
                'Un contenu pédagogique structuré pour vous accompagner dans votre apprentissage.'}
            </p>
            <button className="button button-quiet" onClick={() => setPreview(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
      <AnimatePresence>
        {confirm && (
          <div className="modal-backdrop" onClick={() => setConfirm(null)}>
            <motion.div
              className="modal-card confirm-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setConfirm(null)}>
                <X />
              </button>
              <span className="course-icon">
                <BookOpen />
              </span>
              <h2>Ajouter ce module ?</h2>
              <p>Le cours « {confirm.title} » sera ajouté à votre espace de travail.</p>
              <div className="modal-actions">
                <button className="button button-quiet" onClick={() => setConfirm(null)}>
                  Annuler
                </button>
                <button className="button button-lime" disabled={busy} onClick={follow}>
                  {busy ? 'Synchronisation…' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
