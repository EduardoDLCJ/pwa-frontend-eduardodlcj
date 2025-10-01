import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/swr.js')
      .then((registration) => {
        console.log('SW registered successfully:', registration)
        
        // Verificar si hay actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                console.log('Nueva versión disponible. Recargando...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error('SW registration failed', err)
      })
  })
}

// Detectar si la app es instalable
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA es instalable!');
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar botón de instalación si está disponible
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Usuario ${outcome} la instalación`);
        deferredPrompt = null;
      }
    });
  }
});

window.addEventListener('appinstalled', () => {
  console.log('PWA instalada exitosamente!');
  deferredPrompt = null;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
