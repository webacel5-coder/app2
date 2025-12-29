
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.retrocodex.app',
  appName: 'Retro Codex',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
