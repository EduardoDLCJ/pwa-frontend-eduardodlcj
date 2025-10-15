import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/swr.js')
      .then((registration) => {
        console.log('SW registered successfully:', registration)
        // Intentar suscripción push si ya hay permiso
        if (Notification.permission === 'granted') {
          subscribeUserToPush(registration).catch(console.error)
        }
        
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

const dbRequest = window.indexedDB.open('pwa-db', 2);
dbRequest.onupgradeneeded = (event) => {
  const database = event.target.result;
  if (!database.objectStoreNames.contains('tabla')) {
    database.createObjectStore('tabla', { autoIncrement: true });
  }
  if (!database.objectStoreNames.contains('pending-cart')) {
    database.createObjectStore('pending-cart', { keyPath: 'id', autoIncrement: true });
  }
};
dbRequest.onerror = (event) => {
  console.error('IndexedDB error:', event.target.error);
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('pwa-db', 2);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('tabla')) {
        database.createObjectStore('tabla', { autoIncrement: true });
      }
      if (!database.objectStoreNames.contains('pending-cart')) {
        database.createObjectStore('pending-cart', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

window.enqueuePendingCart = async function enqueuePendingCart(record) {
  try {
    const db = await openDb();
    const tx = db.transaction('pending-cart', 'readwrite');
    const store = tx.objectStore('pending-cart');
    store.add({ ...record, createdAt: Date.now() });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.error('enqueuePendingCart error:', err);
  }
};

async function readAllPendingCart() {
  const db = await openDb();
  const tx = db.transaction('pending-cart', 'readonly');
  const store = tx.objectStore('pending-cart');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deletePendingCartById(id) {
  const db = await openDb();
  const tx = db.transaction('pending-cart', 'readwrite');
  const store = tx.objectStore('pending-cart');
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function flushPendingCartInternal() {
  try {
    if (navigator.onLine === false) return;
    const all = await readAllPendingCart();
    for (const rec of all) {
      const { baseUrl, payload, id } = rec;
      if (!baseUrl || !payload) {
        await deletePendingCartById(id);
        continue;
      }
      try {
        const res = await fetch(`${baseUrl}/carrito`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          await deletePendingCartById(id);
        }
      } catch (e) {
        // sigue en cola
      }
    }
  } catch (err) {
    console.error('flushPendingCart error:', err);
  }
}

window.flushPendingCart = flushPendingCartInternal;

// Funciones para el Service Worker
window.getPendingCarts = readAllPendingCart;
window.removePendingCart = deletePendingCartById;

window.addEventListener('online', () => {
  flushPendingCartInternal();
});

// Intentar despachar cola al iniciar
flushPendingCartInternal();

// Obtener clave pública VAPID del backend
async function getVapidPublicKey(baseUrl) {
  const res = await fetch(`${baseUrl}/notificaciones/vapidPublicKey`);
  if (!res.ok) throw new Error('No se pudo obtener VAPID public key');
  const data = await res.json();
  return data.publicKey;
}

// Convertir Base64URL a Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Suscribir usuario a Push y enviar la suscripción al backend
async function subscribeUserToPush(registration) {
  try {
    const BASE_URL = 'https://pwa-backend-knbm.onrender.com';
    const vapidPublicKey = await getVapidPublicKey(BASE_URL);
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    await fetch(`${BASE_URL}/notificaciones/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    return subscription;
  } catch (err) {
    console.error('Error suscribiendo a Push:', err);
    throw err;
  }
}

// Exponer función para UI
window.requestPushPermissionAndSubscribe = async function requestPushPermissionAndSubscribe() {
  try {
    if (!('serviceWorker' in navigator)) throw new Error('SW no soportado');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('Permiso de notificaciones no concedido');
      return null;
    }
    const registration = await navigator.serviceWorker.ready;
    const sub = await subscribeUserToPush(registration);
    alert('Notificaciones activadas');
    return sub;
  } catch (err) {
    alert('No se pudo activar notificaciones: ' + (err?.message || err));
    return null;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
