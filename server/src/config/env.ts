import dotenv from 'dotenv';

// Încarcă variabilele de mediu
dotenv.config();

// Exportă variabilele de mediu configurate
export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Adaugă aici alte variabile de mediu pe care le vei folosi
}; 