import { GraduationCap, Sparkles } from 'lucide-react';

interface BrandLoaderProps {
  message?: string;
}

export function BrandLoader({
  message = 'Préparation de votre espace d’apprentissage',
}: BrandLoaderProps) {
  return (
    <div className="axon-loader" role="status" aria-live="polite">
      <div className="axon-loader-card">
        <div className="axon-loader-mark" aria-hidden="true">
          <span className="axon-loader-orbit axon-loader-orbit-outer" />
          <span className="axon-loader-orbit axon-loader-orbit-inner" />
          <span className="axon-loader-icon">
            <GraduationCap size={28} strokeWidth={1.8} />
          </span>
          <Sparkles className="axon-loader-sparkle" size={15} />
        </div>
        <span className="axon-loader-wordmark">
          AXON <small>LEARN</small>
        </span>
        <span className="axon-loader-caption">{message}</span>
        <span className="axon-loader-track" aria-hidden="true">
          <span />
        </span>
        <span className="axon-loader-status">Connexion sécurisée en cours</span>
      </div>
    </div>
  );
}
