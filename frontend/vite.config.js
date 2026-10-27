import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from frontend folder and parent
  const env = loadEnv(mode, process.cwd(), '');

  const backendTarget =
    env.BACKEND_URL ||
    env.VITE_BACKEND_URL ||
    env.SERVER_URL ||
    env.VITE_SERVER_URL ||
    'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: false,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
