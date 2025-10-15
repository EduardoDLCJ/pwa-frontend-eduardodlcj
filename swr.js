const CACHE_NAME = 'pwa-v5';

// URLs críticas para cachear
const PRECACHE_URLS = [
   '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/tienda.png',
  '/vite.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/assets/index-CxQvZtMf.js',
  '/assets/index-BO3yHzmn.css',
  '/galaxyS24.png',
  '/rogphone9pro.png',
  '/google-pixel-10-pro.png',
  '/iphone16promax.jpg',
  '/pocox7pro.jpg',
  '/xiaomi-poco-x7.jpg',
  '/samsung-galaxy-s24.png',
];

// Instalar el service worker
self.addEventListener('install', (event) => {
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        
        // Intentar cachear cada URL individualmente
        const cachePromises = PRECACHE_URLS.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              } else {
                console.warn('[SW] ⚠ No se pudo cachear (status ' + response.status + '):', url);
                return null; // No fallar la instalación por un recurso
              }
            })
            .catch(err => {
              console.warn('[SW] ⚠ Error cacheando (continuando):', url, err.message);
              return null; // No fallar la instalación por un error de red
            });
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Error en instalación:', error);
      })
  );
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches viejos
      caches.keys().then((cacheNames) => {
        const deletePromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName));
        return Promise.all(deletePromises);
      }),
      // Tomar control inmediatamente
      self.clients.claim()
    ]).then(() => {
      // Procesar carritos pendientes al activar el SW si hay conexión
      if (navigator.onLine) {
        processPendingCarts();
      }
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  // Ignorar requests que no sean GET
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si no está en cache, intentar ir a la red
        if (navigator.onLine === false) {
          // Para la ruta raíz, servir index.html
          if (url.pathname === '/' || request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html').then((fallback) => {
              if (fallback) {
                return fallback;
              }
              return new Response('Sin conexión - Recurso no disponible', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          }
          
          return new Response('Recurso no disponible sin conexión', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        }

        return fetch(request);
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'PROCESS_PENDING_CARTS') {
    console.log('[SW] 📨 Solicitud de procesamiento de carritos pendientes');
    processPendingCarts();
  }
  
  if (event.data && event.data.type === 'SHOW_LOCAL_NOTIFICATION') {
    const { title, body, icon, data } = event.data.payload || {};
    self.registration.showNotification(title || 'Notificación', {
      body: body || '',
      icon: icon || '/icon-192.svg',
      data: data || {}
    });
  }
});

// Función para procesar la cola de carritos pendientes
async function processPendingCarts() {
  try {
    // Verificar si existe la función para obtener carritos pendientes
    if (typeof window !== 'undefined' && window.getPendingCarts) {
      const pendingCarts = await window.getPendingCarts();
      
      for (const cartData of pendingCarts) {
        try {
          const { baseUrl, payload } = cartData;
          
          const response = await fetch(`${baseUrl}/carrito`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            // Eliminar de la cola si se envió exitosamente
            if (window.removePendingCart) {
              await window.removePendingCart(cartData.id);
            }
            console.log('Carrito enviado exitosamente:', payload.userId);
            
            // Notificar a los clientes que el carrito se sincronizó
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
              client.postMessage({ type: 'CART_SYNCED', userId: payload.userId });
            });
          } else {
            console.warn('[SW] ⚠ Error enviando carrito:', response.status);
          }
        } catch (error) {
          console.error('[SW] ❌ Error procesando carrito:', error);
        }
      }
    }
  } catch (error) {
    console.error('[SW] ❌ Error procesando cola de carritos:', error);
  }
}

// Detectar cambios en el estado de la conexión
self.addEventListener('online', () => {
  console.log('[SW] 📡 Conexión restaurada - procesando cola de carritos');
  // Procesar carritos pendientes cuando se restaure la conexión
  processPendingCarts();
});

self.addEventListener('offline', () => {
  console.log('[SW] 📡 Sin conexión');
});

// SW cargado

// Manejar eventos Push
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Nueva notificación';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.svg',
      data: { url: data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    event.waitUntil(self.registration.showNotification('Nueva notificación', {
      body: 'Tienes un nuevo mensaje',
      icon: '/icon-192.svg'
    }));
  }
});

// Click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});