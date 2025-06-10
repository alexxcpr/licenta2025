// Configurarea URL-ului backend-ului
// Acest fișier va fi actualizat automat de scriptul de dezvoltare

export const BACKEND_CONFIG = {
  BASE_URL: 'http://localhost:5000/',
  API_URL: 'http://localhost:5000/api'
};

// Funcție helper pentru a obține URL-ul complet al API-ului
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = BACKEND_CONFIG.API_URL;
  return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}` : baseUrl;
};