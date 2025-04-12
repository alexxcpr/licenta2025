import env from './config/env';
import { configureApp } from './config/express';

// Creează aplicația Express configurată
const app = configureApp();

// Pornește serverul
app.listen(env.port, () => {
  console.log(`⚡️ Server rulează la http://localhost:${env.port} în modul ${env.nodeEnv}`);
}); 