const fs = require('fs');
const path = require('path');

// Calea către fișierul de configurare al clientului
const CLIENT_CONFIG_PATH = path.join(__dirname, '../../client/my-app/config/backend.ts');

// Funcție pentru a reseta configurația la localhost
function resetToLocalhost() {
  const configContent = `// Configurarea URL-ului backend-ului
// Acest fișier va fi actualizat automat de scriptul de dezvoltare

export const BACKEND_CONFIG = {
  BASE_URL: 'http://localhost:5000',
  API_URL: 'http://localhost:5000/api'
};

// Funcție helper pentru a obține URL-ul complet al API-ului
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = BACKEND_CONFIG.API_URL;
  return endpoint ? \`\${baseUrl}\${endpoint.startsWith('/') ? endpoint : \`/\${endpoint}\`}\` : baseUrl;
};`;

  try {
    fs.writeFileSync(CLIENT_CONFIG_PATH, configContent, 'utf8');
    console.log('✅ Configurația a fost resetată la localhost:5000');
  } catch (error) {
    console.error('❌ Eroare la resetarea configurației:', error.message);
    process.exit(1);
  }
}

console.log('🔄 Resetez configurația la localhost...');
resetToLocalhost();
console.log('🎉 Gata! Acum aplicația va folosi http://localhost:5000'); 