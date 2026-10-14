import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, Bot, BrainCircuit, CalendarDays, ClipboardCheck, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, X, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
const links = [
  {to:'/dashboard',label:'Dashboard',icon:LayoutDashboard,end:true},
  {to:'/dashboard/course',label:'Explorer Courses',icon:BookOpen},
  {to:'/dashboard/planning',label:'Planning',icon:CalendarDays},
  {to:'/dashboard/revisions',label:'Mes révisions',icon:BrainCircuit},
  {to:'/dashboard/examens',label:'Mode examen',icon:ClipboardCheck},
  {to:'/dashboard/assistant',label:'Assistant Axon',icon:Bot},
  {to:'/dashboard/settings',label:'Paramètres',icon:Settings},
];
export function DashboardLayout() {
  const { user, signOut } = useAuth(); const navigate = useNavigate(); const [drawer, setDrawer] = useState(false); const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'night');
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggleTheme = () => { const next = theme === 'night' ? 'light' : 'night'; setTheme(next); localStorage.setItem('app-theme', next); };
  const logout = async () => { try { await signOut(); navigate('/'); } catch { toast.error('Déconnexion impossible.'); } };
  const nav = <><div className="sidebar-brand"><span className="brand-icon"><Zap size={23}/></span><div><b>AXON</b><small>INTELLECT</small></div><button className="theme-toggle" onClick={toggleTheme} aria-label="Changer le thème">{theme === 'night' ? <Sun size={18}/> : <Moon size={18}/>}</button></div><div className="side-label">Navigation</div><nav className="side-nav">{links.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} onClick={()=>setDrawer(false)} className={({isActive})=>`side-link ${isActive?'active':''}`}><Icon size={18}/><span>{label}</span><span className="side-indicator"/></NavLink>)}</nav><div className="sidebar-user"><div className="user-avatar">{(user?.name || user?.email || 'A')[0].toUpperCase()}</div><div className="user-meta"><b>{user?.name || 'Étudiant AXON'}</b><span>OPÉRATEUR</span></div><button className="logout-btn" onClick={logout} title="Déconnexion"><LogOut size={17}/></button></div></>;
  return <div className="dashboard-shell"><aside className="sidebar">{nav}</aside>{drawer && <div className="drawer-backdrop" onClick={()=>setDrawer(false)}><aside className="sidebar drawer-sidebar" onClick={(e)=>e.stopPropagation()}>{nav}<button className="drawer-close" onClick={()=>setDrawer(false)}><X/></button></aside></div>}<div className="dashboard-main"><header className="mobile-header"><button className="icon-button" onClick={()=>setDrawer(true)}><Menu/></button><span className="mobile-logo">AXON <small>INTELLECT</small></span><button className="icon-button" onClick={toggleTheme}>{theme==='night'?<Sun/>:<Moon/>}</button></header><main className="dashboard-content"><Outlet/></main></div></div>;
}
