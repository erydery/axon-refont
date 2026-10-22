import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, Palette, Save, ShieldCheck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/http';
import { useAuth } from '../hooks/useAuth';
import type { DashboardData, Level, Option } from '../types';
const themes = ['light', 'dark'];
export function SettingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [theme, setTheme] = useState(
    localStorage.getItem('app-theme') === 'dark' || localStorage.getItem('app-theme') === 'night'
      ? 'dark'
      : 'light',
  );
  const [visuals, setVisuals] = useState(() =>
    JSON.parse(localStorage.getItem('app-visuals') || '{"highContrast":false,"grayscale":false}'),
  );
  const [optionId, setOptionId] = useState(user?.optionId || 0);
  const [levelId, setLevelId] = useState(user?.levelId || 0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([
      api<DashboardData>('/learning/dashboard'),
      api<Option[]>('/catalog/options'),
      api<Level[]>('/catalog/levels'),
    ])
      .then(([d, o, l]) => {
        setData(d);
        setOptions(o);
        setLevels(l);
        setOptionId(d.user.optionId || 0);
        setLevelId(d.user.levelId || 0);
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : 'Chargement des paramètres impossible.'),
      );
  }, []);
  function changeTheme(next: string) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('app-theme', next);
    window.dispatchEvent(new CustomEvent('axon-theme-change', { detail: next }));
  }
  async function save() {
    if (!optionId || !levelId) {
      toast.error('Choisissez une filière et un niveau.');
      return;
    }
    const ids = data?.courses.map((c) => c.id) ?? [];
    if (!ids.length) {
      toast.error('Ajoutez au moins un cours pour enregistrer votre cursus.');
      return;
    }
    setBusy(true);
    try {
      await api('/learning/onboarding', {
        method: 'PUT',
        body: JSON.stringify({ optionId, levelId, selectedCourseIds: ids }),
      });
      localStorage.setItem('app-visuals', JSON.stringify(visuals));
      toast.success('Paramètres synchronisés.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Synchronisation impossible.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack settings-page">
      <header className="explore-heading settings-heading">
        <div>
          <span className="page-kicker">SYSTEM CONTROL PANEL</span>
          <h1>
            Settings <em>Core.</em>
          </h1>
          <p>
            <Zap size={14} /> Préférences et configuration de votre espace AXON
          </p>
        </div>
        <button className="button button-lime" onClick={save} disabled={busy}>
          {busy ? (
            'Synchronisation…'
          ) : (
            <>
              <Save size={16} /> Synchroniser
            </>
          )}
        </button>
      </header>
      <div className="settings-layout">
        <div className="settings-main">
          <section className="settings-card">
            <div className="settings-title">
              <span className="settings-icon">
                <Zap />
              </span>
              <div>
                <span className="page-kicker">PROFIL ACADÉMIQUE</span>
                <h2>Configuration</h2>
              </div>
            </div>
            <div className="settings-form-grid">
              <label>
                Filière
                <select value={optionId} onChange={(e) => setOptionId(Number(e.target.value))}>
                  <option value={0}>Sélectionner…</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Niveau
                <select value={levelId} onChange={(e) => setLevelId(Number(e.target.value))}>
                  <option value={0}>Sélectionner…</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="settings-card">
            <div className="settings-title">
              <span className="settings-icon purple">
                <Palette />
              </span>
              <div>
                <span className="page-kicker">PERSONNALISATION</span>
                <h2>Interface UI</h2>
              </div>
              <span className="theme-pill">{theme}</span>
            </div>
            <div className="theme-grid">
              {themes.map((t) => (
                <button
                  key={t}
                  onClick={() => changeTheme(t)}
                  className={`theme-option theme-${t} ${theme === t ? 'chosen' : ''}`}
                >
                  <i>
                    <b />
                    <b />
                    <b />
                  </i>
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
        <aside className="settings-side">
          <section className="visual-card">
            <div className="settings-title">
              <Eye />
              <h3>Visual Engine</h3>
            </div>
            <SettingToggle
              label="High contrast"
              checked={visuals.highContrast}
              onChange={(v) => setVisuals({ ...visuals, highContrast: v })}
            />
            <SettingToggle
              label="Grayscale"
              checked={visuals.grayscale}
              onChange={(v) => setVisuals({ ...visuals, grayscale: v })}
            />
          </section>
          <section className="active-courses-card">
            <div className="settings-title">
              <CheckCircle2 />
              <h3>Flux actifs</h3>
              <span>{data?.courses.length ?? 0}</span>
            </div>
            {data?.courses.length ? (
              data.courses.map((c) => (
                <div className="active-course" key={c.id}>
                  <b>{c.title}</b>
                  <span>{c.chapters.length} chapitres</span>
                </div>
              ))
            ) : (
              <p className="muted-small">Aucun cours actif.</p>
            )}
          </section>
          <section className="secure-card">
            <ShieldCheck />
            <span>
              <b>Cloud Sync Active</b>
              <small>Votre compte : {user?.email}</small>
            </span>
          </section>
        </aside>
      </div>
    </div>
  );
}
function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="setting-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i />
    </label>
  );
}
