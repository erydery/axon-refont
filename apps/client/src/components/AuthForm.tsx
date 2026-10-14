import { SignInButton, SignUpButton, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { ArrowLeft, ArrowRight, GraduationCap, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register';
  const clerk = useClerkAuth();
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Link className="brand" to="/"><span className="brand-icon"><GraduationCap size={24} /></span><span>AXON <small>LEARN</small></span></Link>
        <div className="auth-art"><div className="auth-rings" /><div className="auth-art-icon"><Zap size={48} /></div><span className="auth-art-label">NEURAL LEARNING INTERFACE</span><h2>Le savoir<br /><em>en mouvement.</em></h2><p>Une année claire. Un parcours maîtrisé.</p></div>
        <div className="auth-visual-foot">CAMEROON · 2026 <span>SYSTÈME EN LIGNE</span></div>
      </div>
      <div className="auth-panel">
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Retour à l’accueil</Link>
        <div className="auth-form-wrap">
          <span className="auth-kicker">{registering ? 'VOTRE PARCOURS COMMENCE ICI' : 'HEUREUX DE VOUS REVOIR'}</span>
          <h1>{registering ? 'Créer un compte.' : 'Bon retour.'}</h1>
          <p>{registering ? 'Rejoignez votre espace d’apprentissage.' : 'Connectez-vous pour reprendre votre progression.'}</p>
          {clerk.isSignedIn
            ? <Link className="button button-lime auth-submit" to="/dashboard">Ouvrir mon dashboard <ArrowRight size={18} /></Link>
            : registering
              ? <SignUpButton mode="modal"><button className="button button-lime auth-submit">Créer mon compte <ArrowRight size={18} /></button></SignUpButton>
              : <SignInButton mode="modal"><button className="button button-lime auth-submit">Se connecter <ArrowRight size={18} /></button></SignInButton>}
          <div className="auth-provider-note"><ShieldCheck size={14} /> Authentification sécurisée par Clerk</div>
          <div className="auth-switch">{registering ? 'Vous avez déjà un compte ?' : 'Nouveau sur AXON ?'} <Link to={registering ? '/sign-in' : '/sign-up'}>{registering ? 'Se connecter' : 'Créer un compte'}</Link></div>
          <div className="auth-secure"><ShieldCheck size={13} /> Connexion sécurisée · Vos données restent privées</div>
        </div>
      </div>
    </div>
  );
}
