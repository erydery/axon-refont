import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Activity, ArrowRight, BarChart3, BookOpen, GraduationCap, Menu, MessageSquare, Search, ShieldCheck, Sparkles, Target, Users, X, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
const features = [
  { icon: BookOpen, title: 'Cours structurés', text: 'Accédez à vos chapitres segmentés par filière avec une clarté totale.' },
  { icon: Zap, title: 'QCM interactifs', text: 'Testez vos connaissances avec des quiz basés sur vos cours réels.' },
  { icon: BarChart3, title: 'Suivi de progression', text: 'Visualisez votre avance dans chaque matière et identifiez vos points faibles.' },
  { icon: Search, title: 'Recherche intelligente', text: 'Retrouvez instantanément une notion dans votre parcours.' },
  { icon: MessageSquare, title: 'Assistant IA', text: 'Posez vos questions. Votre mentor IA vous répond en temps réel.' },
  { icon: Activity, title: 'Mode examen', text: 'Une interface minimaliste et intense pour les révisions de dernière minute.' },
];
export function LandingPage() {
  const { user } = useAuth(); const [menu, setMenu] = useState(false); const { scrollYProgress } = useScroll(); const scaleX = useSpring(scrollYProgress);
  const portal = user ? (user.hasOnboarded ? '/dashboard' : '/onboarding') : '/sign-up';
  const isSignedIn = Boolean(user);
  return <div className="landing">
    <motion.div className="scroll-progress" style={{ scaleX }} />
    <nav className="landing-nav"><Link to="/" className="brand"><span className="brand-icon"><GraduationCap size={24} /></span><span>AXON <small>LEARN</small></span></Link>
      <div className="nav-links"><a href="#parcours">Concept</a><a href="#features">Outils IA</a><a href="#stats">Impact</a></div>
      <div className="nav-actions">{isSignedIn ? <Link className="pill-btn" to={portal}>Accéder au portail <ArrowRight size={15}/></Link> : <Link className="pill-btn" to="/sign-in">Se connecter</Link>}<button className="icon-button mobile-menu" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X/> : <Menu/>}</button></div>
      {menu && <div className="mobile-nav"><a href="#parcours" onClick={() => setMenu(false)}>Concept</a><a href="#features" onClick={() => setMenu(false)}>Outils IA</a><a href="#stats" onClick={() => setMenu(false)}>Impact</a><Link to={portal}>Commencer</Link></div>}
    </nav>
    <main>
      <section className="hero"><div className="hero-glow"/><motion.div className="hero-content" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: .13 } } }}>
        <motion.div className="eyebrow" variants={rise}><Sparkles size={14}/> Neural Learning Interface · v2.0</motion.div>
        <motion.h1 variants={rise}>Maîtrisez<br/><span>votre année.</span></motion.h1>
        <motion.p variants={rise}>L'application de suivi qui transforme vos cours universitaires en un parcours de réussite guidé par l'IA.</motion.p>
        <motion.div variants={rise} className="hero-cta"><Link className="button button-lime" to={portal}>{isSignedIn ? 'Aller au dashboard' : 'Commencer maintenant'} <ArrowRight size={18}/></Link><a className="subtle-link" href="#features">Découvrir la plateforme <span>↓</span></a></motion.div>
        <motion.div variants={rise} className="hero-meta"><span><i/> Conçu pour apprendre</span><span>01 / 03</span></motion.div>
      </motion.div><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-side-note">CAMEROON · 2026</div>
      </section>
      <section className="intro-section" id="parcours"><div className="intro-copy"><span className="section-kicker">🎯 Focus réussite</span><h2>Votre savoir,<br/><em>simplifié.</em></h2><p className="intro-quote">« Ne vous perdez plus dans vos chapitres. AXON organise votre semestre et génère les supports dont vous avez besoin. »</p><div className="mini-stats"><div><b>24/7</b><span>Disponibilité</span></div><div><b>PRO</b><span>Contenu académique</span></div></div></div><div className="dashboard-art"><div className="art-grid"/><div className="art-frame"><div className="art-window"><div className="art-bar"><i/><i/><i/></div><div className="art-title">MY LEARNING SPACE</div><div className="art-course"><BookOpen/><div><b>Sciences & méthodes</b><span>Progression du module</span><div className="tiny-progress"><i/></div></div></div><div className="art-course"><Target/><div><b>Objectif de la semaine</b><span>3 chapitres terminés</span></div></div><div className="art-score"><strong>82%</strong><span>FOCUS SCORE</span></div></div><div className="floating-chip"><Zap size={14}/> Votre rythme est excellent</div></div></div></section>
      <section id="features" className="features-section"><div className="section-heading"><span className="section-kicker">🚀 Expérience apprenant</span><h2>Précision <em>académique.</em></h2><p>Tout ce qu’il faut pour progresser, réuni dans un seul espace.</p></div><div className="feature-grid">{features.map(({icon: Icon,title,text}, i)=><motion.article className="feature-card" key={title} initial={{opacity:0,y:22}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.06}}><span className="feature-icon"><Icon size={22}/></span><span className="feature-index">0{i+1}</span><h3>{title}</h3><p>{text}</p></motion.article>)}</div></section>
      <section id="stats" className="impact-section"><div className="impact-copy"><span className="section-kicker">⚡ Power up</span><h2>Explosez<br/>vos scores.</h2><p>L'IA ne remplace pas l'étudiant, elle le rend imbattable.</p><Link className="button button-dark" to={portal}>{user ? 'Ouvrir le portail' : 'Commencer l’aventure'} <ArrowRight size={18}/></Link></div><div className="impact-metrics"><span className="metric-label"><ShieldCheck size={15}/> VOTRE PERFORMANCE EN UN COUP D’ŒIL</span><Metric label="Focus révision" value="+45%"/><Metric label="Rétention du savoir" value="x2.4"/><Metric label="Précision QCM" value="98%"/></div><div className="impact-watermark"><Users size={220}/></div></section>
    </main><footer className="landing-footer"><Link to="/" className="footer-logo">AXON</Link><span>THE NEURAL EDGE OF EDUCATION · CAMEROON 2026</span><span>APPRENDRE AVEC INTENTION.</span></footer>
  </div>;
}
const rise = { hidden: {opacity:0,y:24}, show: {opacity:1,y:0,transition:{duration:.65,ease:[.22,1,.36,1] as const}} };
function Metric({label,value}:{label:string;value:string}) { return <div className="metric-row"><span>{label}</span><strong>{value}</strong><div className="metric-line"><i/></div></div>; }
