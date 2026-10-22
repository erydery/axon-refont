import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/clerk-react';
import { AuthProvider } from './context/AuthContext';
import { router } from './index';
import { BrandLoader } from './components/BrandLoader';
import './index.css';
import './brand-theme.css';

const clerkKey =
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const app = clerkKey ? (
  <ClerkProvider publishableKey={clerkKey}>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </AuthProvider>
  </ClerkProvider>
) : (
  <BrandLoader message="Configurez NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY dans .env.local." />
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{app}</React.StrictMode>,
);
