import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const dashboardPreview = new URL('../../images/Capture.PNG', import.meta.url).href;
const assistantPreview = new URL('../../images/bot.PNG', import.meta.url).href;
const planningPreview = new URL('../../images/planing.PNG', import.meta.url).href;
gsap.registerPlugin(ScrollTrigger, useGSAP);
const features = [
  {
    icon: BookOpen,
    title: 'Cours structurés',
    text: 'Accédez à vos chapitres segmentés par filière avec une clarté totale.',
  },
  {
    icon: Zap,
    title: 'QCM interactifs',
    text: 'Testez vos connaissances avec des quiz basés sur vos cours réels.',
  },
  {
    icon: BarChart3,
    title: 'Suivi de progression',
    text: 'Visualisez votre avance dans chaque matière et identifiez vos points faibles.',
  },
  {
    icon: Search,
    title: 'Recherche intelligente',
    text: 'Retrouvez instantanément une notion dans votre parcours.',
  },
  {
    icon: MessageSquare,
    title: 'Assistant IA',
    text: 'Posez vos questions. Votre mentor IA vous répond en temps réel.',
  },
  {
    icon: Activity,
    title: 'Mode examen',
    text: 'Une interface minimaliste et intense pour les révisions de dernière minute.',
  },
];
export function LandingPage() {
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const landingRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress);
  const portal = user ? (user.hasOnboarded ? '/dashboard' : '/onboarding') : '/sign-up';
  const isSignedIn = Boolean(user);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      gsap.utils.toArray<HTMLElement>('.gsap-reveal').forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 36 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 88%',
              once: true,
            },
          },
        );
      });

      gsap.fromTo(
        '.feature-card',
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.feature-grid',
            start: 'top 82%',
            once: true,
          },
        },
      );

      gsap.fromTo(
        '.metric-row',
        { autoAlpha: 0, x: 24 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.55,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.impact-metrics',
            start: 'top 82%',
            once: true,
          },
        },
      );
    },
    { scope: landingRef },
  );

  return (
    <div className="landing" ref={landingRef}>
      <motion.div className="scroll-progress" style={{ scaleX }} />
      <nav className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <GraduationCap size={24} />
          </span>
          <span>
            AXON <small>LEARN</small>
          </span>
        </Link>
        <div className="nav-links">
          <a href="#parcours">Concept</a>
          <a href="#features">Outils IA</a>
          <a href="#stats">Impact</a>
        </div>
        <div className="nav-actions">
          {isSignedIn ? (
            <Link className="pill-btn" to={portal}>
              Accéder au portail <ArrowRight size={15} />
            </Link>
          ) : (
            <Link className="pill-btn" to="/sign-in">
              Se connecter
            </Link>
          )}
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Menu"
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <div className="mobile-nav">
            <a href="#parcours" onClick={() => setMenu(false)}>
              Concept
            </a>
            <a href="#features" onClick={() => setMenu(false)}>
              Outils IA
            </a>
            <a href="#stats" onClick={() => setMenu(false)}>
              Impact
            </a>
            <Link to={portal}>Commencer</Link>
          </div>
        )}
      </nav>
      <main>
        <section className="hero">
          <div className="hero-glow" />
          <motion.div
            className="hero-content"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.13 } } }}
          >
            <motion.div className="eyebrow" variants={rise}>
              <Sparkles size={14} /> Neural Learning Interface · v2.0
            </motion.div>
            <motion.h1 variants={rise}>
              Maîtrisez
              <br />
              <span>votre année.</span>
            </motion.h1>
            <motion.p variants={rise}>
              L'application de suivi qui transforme vos cours universitaires en un parcours de
              réussite guidé par l'IA.
            </motion.p>
            <motion.div variants={rise} className="hero-cta">
              <Link className="button button-lime" to={portal}>
                {isSignedIn ? 'Aller au dashboard' : 'Commencer maintenant'}{' '}
                <ArrowRight size={18} />
              </Link>
              <a className="subtle-link" href="#features">
                Découvrir la plateforme <span>↓</span>
              </a>
            </motion.div>
            <motion.div variants={rise} className="hero-meta">
              <span>
                <i /> Conçu pour apprendre
              </span>
              <span>01 / 03</span>
            </motion.div>
          </motion.div>
          <motion.aside
            className="hero-product-visual"
            aria-label="Aperçu de la plateforme AXON"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-product-window">
              <div className="hero-product-toolbar">
                <span className="hero-product-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>AXON · ESPACE APPRENANT</span>
                <span className="hero-product-live">
                  <i /> EN LIGNE
                </span>
              </div>
              <div className="hero-product-screen">
                <img
                  src={dashboardPreview}
                  alt="Tableau de bord AXON avec progression et cours de l’étudiant"
                  fetchPriority="high"
                />
              </div>
              <div className="hero-product-footer">
                <span>
                  <b>Votre parcours.</b> Vos outils. Un seul espace.
                </span>
                <span className="hero-product-footer-icon">
                  <BookOpen size={15} /> AXON LEARN
                </span>
              </div>
            </div>
            <motion.div
              className="hero-product-float hero-product-assistant"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img src={assistantPreview} alt="" />
              <span>
                <b>Assistant AXON</b>
                <small>Un mentor à vos côtés</small>
              </span>
              <Sparkles size={17} />
            </motion.div>
            <motion.div
              className="hero-product-float hero-product-planning"
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            >
              <img src={planningPreview} alt="" />
              <span>
                <b>Planning intelligent</b>
                <small>Gardez le cap cette semaine</small>
              </span>
              <ArrowRight size={16} />
            </motion.div>
          </motion.aside>
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-side-note">CAMEROON · 2026</div>
        </section>
        <section className="intro-section" id="parcours">
          <div className="intro-copy gsap-reveal">
            <span className="section-kicker">Focus réussite</span>
            <h2>
              Votre savoir,
              <br />
              <em>simplifié.</em>
            </h2>
            <p className="intro-quote">
              « Ne vous perdez plus dans vos chapitres. AXON organise votre semestre et génère les
              supports dont vous avez besoin. »
            </p>
            <div className="mini-stats">
              <div>
                <b>24/7</b>
                <span>Disponibilité</span>
              </div>
              <div>
                <b>PRO</b>
                <span>Contenu académique</span>
              </div>
            </div>
          </div>
          <div className="dashboard-art gsap-reveal">
            <div className="art-grid" />
            <div className="art-frame">
              <div className="art-window">
                <div className="art-bar">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="art-title">MY LEARNING SPACE</div>
                <div className="art-course">
                  <BookOpen />
                  <div>
                    <b>Sciences & méthodes</b>
                    <span>Progression du module</span>
                    <div className="tiny-progress">
                      <i />
                    </div>
                  </div>
                </div>
                <div className="art-course">
                  <Target />
                  <div>
                    <b>Objectif de la semaine</b>
                    <span>3 chapitres terminés</span>
                  </div>
                </div>
                <div className="art-score">
                  <strong>82%</strong>
                  <span>FOCUS SCORE</span>
                </div>
              </div>
              <div className="floating-chip">
                <Zap size={14} /> Votre rythme est excellent
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="features-section">
          <div className="section-heading gsap-reveal">
            <span className="section-kicker">Expérience apprenant</span>
            <h2>
              Précision <em>académique.</em>
            </h2>
            <p>Tout ce qu’il faut pour progresser, réuni dans un seul espace.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }, i) => (
              <motion.article className="feature-card" key={title}>
                <span className="feature-icon">
                  <Icon size={22} />
                </span>
                <span className="feature-index">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.article>
            ))}
          </div>
        </section>
        <section id="stats" className="impact-section">
          <div className="impact-copy gsap-reveal">
            <span className="section-kicker">Votre progression</span>
            <h2>
              Explosez
              <br />
              vos scores.
            </h2>
            <p>L'IA ne remplace pas l'étudiant, elle le rend imbattable.</p>
            <Link className="button button-dark" to={portal}>
              {user ? 'Ouvrir le portail' : 'Commencer l’aventure'} <ArrowRight size={18} />
            </Link>
          </div>
          <div className="impact-metrics">
            <span className="metric-label">
              <ShieldCheck size={15} /> VOTRE PERFORMANCE EN UN COUP D’ŒIL
            </span>
            <Metric label="Focus révision" value="+45%" />
            <Metric label="Rétention du savoir" value="x2.4" />
            <Metric label="Précision QCM" value="98%" />
          </div>
          <div className="impact-watermark">
            <Users size={220} />
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Link to="/" className="footer-logo">
          AXON
        </Link>
        <span>THE NEURAL EDGE OF EDUCATION · CAMEROON 2026</span>
        <span>APPRENDRE AVEC INTENTION.</span>
      </footer>
    </div>
  );
}
const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="metric-line">
        <i />
      </div>
    </div>
  );
}
