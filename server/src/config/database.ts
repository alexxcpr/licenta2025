// Acest fișier este pregătit pentru configurarea bazei de date (MongoDB/Mongoose)
// Trebuie să instalezi mongoose pentru a-l utiliza

// import mongoose from 'mongoose';
// import env from './env';

/**
 * Conectează aplicația la baza de date MongoDB
 */
export const connectDatabase = async () => {
  try {
    // Exemplu pentru MongoDB cu Mongoose
    /*
    const conn = await mongoose.connect(env.databaseUrl);
    console.log(`MongoDB conectat: ${conn.connection.host}`);
    */
    
    console.log('Configurare bază de date pregătită. Instalează mongoose pentru a o activa.');
  } catch (error) {
    console.error('Eroare la conectarea la baza de date:', error);
    process.exit(1);
  }
};

export default {
  connectDatabase
}; 