// Configurarea URL-ului backend-ului
// Acest fișier va fi actualizat automat de scriptul de dezvoltare

export const BACKEND_CONFIG = {
  BASE_URL: 'https://licenta2025.onrender.com',
  API_URL: 'https://licenta2025.onrender.com/api'
};

// Funcție helper pentru a obține URL-ul complet al API-ului
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = BACKEND_CONFIG.API_URL;
  return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}` : baseUrl;
};