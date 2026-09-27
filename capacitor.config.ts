import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b3da1e8d6143409b8c307a48a6bff83f',
  appName: 'Smart Digital Hub',
  webDir: 'dist',
  server: {
    url: 'https://b3da1e8d-6143-409b-8c30-7a48a6bff83f.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
