const { spawn } = require('child_process');
const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

// Căile către fișierele de configurare
const CLIENT_CONFIG_PATH = path.join(__dirname, '../../client/my-app/config/backend.ts');

// Funcție pentru a actualiza fișierul de configurare al clientului
function updateClientConfig(ngrokUrl) {
  const configContent = `// Configurarea URL-ului backend-ului
// Acest fișier va fi actualizat automat de scriptul de dezvoltare

export const BACKEND_CONFIG = {
  BASE_URL: '${ngrokUrl}',
  API_URL: '${ngrokUrl}/api'
};

// Funcție helper pentru a obține URL-ul complet al API-ului
export const getApiUrl = (endpoint: string = '') => {
  const baseUrl = BACKEND_CONFIG.API_URL;
  return endpoint ? \`\${baseUrl}\${endpoint.startsWith('/') ? endpoint : \`/\${endpoint}\`}\` : baseUrl;
};`;

  try {
    fs.writeFileSync(CLIENT_CONFIG_PATH, configContent, 'utf8');
    console.log(`✅ Configurația clientului a fost actualizată cu URL-ul: ${ngrokUrl}`);
  } catch (error) {
    console.error('❌ Eroare la actualizarea configurației clientului:', error.message);
  }
}

// Funcție pentru a porni serverul
function startServer() {
  console.log('🚀 Pornesc serverul Express...');
  
  const serverProcess = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Eroare la pornirea serverului:', error.message);
    process.exit(1);
  });

  return serverProcess;
}

// Funcție pentru a porni ngrok
async function startNgrok() {
  try {
    console.log('🌐 Pornesc ngrok pentru portul 5000...');
    const url = await ngrok.connect({
      port: 5000,
      region: 'eu' // Folosim regiunea europeană pentru latență mai mică
    });
    
    console.log(`✅ Ngrok pornit cu succes!`);
    console.log(`🔗 URL public: ${url}`);
    
    return url;
  } catch (error) {
    console.error('❌ Eroare la pornirea ngrok:', error.message);
    throw error;
  }
}

// Funcția principală
async function main() {
  try {
    console.log('🔄 Pornesc dezvoltarea cu ngrok...\n');

    // 1. Pornim serverul Express
    const serverProcess = startServer();
    console.log('✅ Serverul Express a fost pornit!\n');

    // Așteptăm 5 secunde pentru ca serverul să fie complet gata
    console.log('⏳ Aștept 5 secunde pentru ca serverul să pornească complet...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Pornim ngrok
    const ngrokUrl = await startNgrok();
    console.log('✅ Ngrok a fost pornit cu succes!\n');

    // 3. Actualizăm configurația clientului
    updateClientConfig(ngrokUrl);

    console.log('\n🎉 Totul este gata!');
    console.log(`📱 URL pentru Expo Go: ${ngrokUrl}`);
    console.log(`🖥️  URL local: http://localhost:5000`);
    console.log('\n📋 Pentru a testa API-ul:');
    console.log(`   curl ${ngrokUrl}/api`);
    console.log('\n⚠️  Pentru a opri: Ctrl+C\n');

    // Gestionăm închiderea aplicației
    process.on('SIGINT', async () => {
      console.log('\n🛑 Opresc serviciile...');
      
      try {
        // Oprim ngrok
        await ngrok.kill();
        console.log('✅ Ngrok oprit');
      } catch (error) {
        console.error('❌ Eroare la oprirea ngrok:', error.message);
      }

      // Oprim serverul
      if (serverProcess) {
        serverProcess.kill();
        console.log('✅ Server oprit');
      }

      // Resetăm configurația la localhost
      updateClientConfig('http://localhost:5000');
      console.log('✅ Configurația resetată la localhost');

      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await ngrok.kill();
      if (serverProcess) {
        serverProcess.kill();
      }
      updateClientConfig('http://localhost:5000');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Eroare în procesul principal:', error.message);
    process.exit(1);
  }
}

// Rulăm funcția principală
main(); 