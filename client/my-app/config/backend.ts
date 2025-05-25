// Configurarea URL-ului backend-ului
// Acest fișier va fi actualizat automat de scriptul de dezvoltare

export const BACKEND_CONFIG = {
  BASE_URL: 'https://28ad-86-126-172-143.ngrok-free.app',
  API_URL: 'https://28ad-86-126-172-143.ngrok-free.app/api'
};

// Funcție helper pentru a obține URL-ul complet al API-ului
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = BACKEND_CONFIG.API_URL;
  return endpoint ? `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}` : baseUrl;
};