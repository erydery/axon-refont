import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bot,
  BrainCircuit,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/course', label: 'Explorer Courses', icon: BookOpen },
  { to: '/dashboard/planning', label: 'Planning', icon: CalendarDays },
  { to: '/dashboard/revisions', label: 'Mes révisions', icon: BrainCircuit },
  { to: '/dashboard/examens', label: 'Mode examen', icon: ClipboardCheck },
  { to: '/dashboard/assistant', label: 'Assistant Axon', icon: Bot },
  { to: '/dashboard/settings', label: 'Paramètres', icon: Settings },
];
export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('app-theme') === 'dark' || localStorage.getItem('app-theme') === 'night'
      ? 'dark'
      : 'light',
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const syncTheme = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (next === 'light' || next === 'dark') setTheme(next);
    };
    window.addEventListener('axon-theme-change', syncTheme);
    return () => window.removeEventListener('axon-theme-change', syncTheme);
  }, [theme]);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('app-theme', next);
  };
  const logout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch {
      toast.error('Déconnexion impossible.');
    }
  };
  const themeButton = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Mode sombre activé' : 'Mode clair activé'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
  const nav = (
    <>
      <div className="sidebar-brand">
        <span className="brand-icon">
          <Zap size={23} />
        </span>
        <div>
          <b>AXON</b>
          <small>INTELLECT</small>
        </div>
        {themeButton}
      </div>
      <div className="side-label">Navigation</div>
      <nav className="side-nav">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setDrawer(false)}
            className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
            <span className="side-indicator" />
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="user-avatar">{(user?.name || user?.email || 'A')[0].toUpperCase()}</div>
        <div className="user-meta">
          <b>{user?.name || 'Étudiant AXON'}</b>
          <span>OPÉRATEUR</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Déconnexion">
          <LogOut size={17} />
        </button>
      </div>
    </>
  );
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">{nav}</aside>
      {drawer && (
        <div className="drawer-backdrop" onClick={() => setDrawer(false)}>
          <aside className="sidebar drawer-sidebar" onClick={(e) => e.stopPropagation()}>
            {nav}
            <button className="drawer-close" onClick={() => setDrawer(false)}>
              <X />
            </button>
          </aside>
        </div>
      )}
      <div className="dashboard-main">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setDrawer(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu />
          </button>
          <span className="mobile-logo">
            AXON <small>INTELLECT</small>
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </header>
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
