import { SignInButton, SignUpButton, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const dashboardPreview = new URL('../../images/Capture.PNG', import.meta.url).href;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register';
  const clerk = useClerkAuth();
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <GraduationCap size={24} />
          </span>
          <span>
            AXON <small>LEARN</small>
          </span>
        </Link>
        <div className="auth-art">
          <div className="auth-rings" />
          <div className="auth-art-icon">
            <Zap size={48} />
          </div>
          <span className="auth-art-label">VOTRE ESPACE D’APPRENTISSAGE</span>
          <h2>
            {registering ? 'Construisez' : 'Reprenez'}
            <br />
            <em>{registering ? 'votre réussite.' : 'votre élan.'}</em>
          </h2>
          <p>
            {registering
              ? 'Cours, révisions et objectifs réunis au même endroit.'
              : 'Retrouvez vos cours, vos objectifs et votre progression.'}
          </p>
          <div className="auth-preview">
            <img src={dashboardPreview} alt="Aperçu du tableau de bord étudiant AXON" />
            <div className="auth-preview-caption">
              <span>
                <BookOpen size={14} /> TABLEAU DE BORD
              </span>
              <b>Votre semestre, en un coup d’œil.</b>
            </div>
          </div>
        </div>
        <div className="auth-visual-foot">
          CAMEROON · 2026 <span>SYSTÈME EN LIGNE</span>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-panel-top">
          <Link className="brand auth-mobile-brand" to="/">
            <span className="brand-icon">
              <GraduationCap size={22} />
            </span>
            <span>
              AXON <small>LEARN</small>
            </span>
          </Link>
          <Link to="/" className="back-link">
            <ArrowLeft size={16} /> Retour à l’accueil
          </Link>
        </div>
        <div className="auth-form-wrap">
          <span className="auth-kicker">
            {registering ? 'VOTRE PARCOURS COMMENCE ICI' : 'HEUREUX DE VOUS REVOIR'}
          </span>
          <h1>{registering ? 'Créer un compte.' : 'Bon retour.'}</h1>
          <p>
            {registering
              ? 'Rejoignez votre espace d’apprentissage.'
              : 'Retrouvez votre espace et continuez là où vous en étiez.'}
          </p>
          {clerk.isSignedIn ? (
            <Link className="button button-lime auth-submit" to="/dashboard">
              Ouvrir mon dashboard <ArrowRight size={18} />
            </Link>
          ) : registering ? (
            <SignUpButton mode="modal">
              <button className="button button-lime auth-submit">
                Créer mon compte <ArrowRight size={18} />
              </button>
            </SignUpButton>
          ) : (
            <SignInButton mode="modal">
              <button className="button button-lime auth-submit">
                Se connecter <ArrowRight size={18} />
              </button>
            </SignInButton>
          )}
          <div className="auth-provider-note">
            <ShieldCheck size={14} /> Authentification sécurisée par Clerk
          </div>
          <div className="auth-switch">
            {registering ? 'Vous avez déjà un compte ?' : 'Nouveau sur AXON ?'}{' '}
            <Link to={registering ? '/sign-in' : '/sign-up'}>
              {registering ? 'Se connecter' : 'Créer un compte'}
            </Link>
          </div>
          <div className="auth-secure">
            <ShieldCheck size={13} /> Connexion sécurisée · Vos données restent privées
          </div>
        </div>
      </div>
    </div>
  );
}
