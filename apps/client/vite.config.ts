import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({ envDir: resolve(process.cwd(), '../..'), envPrefix: ['VITE_', 'NEXT_PUBLIC_'], plugins: [react()], server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } } });
