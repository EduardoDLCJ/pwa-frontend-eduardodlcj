const CACHE_NAME = 'pwa-v5';
const RUNTIME_CACHE = 'runtime-v5';

// URLs críticas para cachear
const PRECACHE_URLS = [
   '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
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

// Patrones de recursos que deben ser cacheados automáticamente
const CACHE_PATTERNS = [
  /\/assets\/.*\.(js|css)$/,
  /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  /\/manifest\.json$/
];

// Función para verificar si un recurso debe ser cacheado automáticamente
function shouldAutoCache(url) {
  return CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Instalar el service worker
self.addEventListener('install', (event) => {
  console.log('[SW] 🔧 Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 📦 Abriendo cache:', CACHE_NAME);
        
        // Intentar cachear cada URL individualmente
        const cachePromises = PRECACHE_URLS.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                console.log('[SW] ✅ Cacheado:', url);
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
        console.log('[SW] ⚡ Activando inmediatamente...');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] 💥 Error en instalación:', error);
      })
  );
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] 🚀 Activando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches viejos
      caches.keys().then((cacheNames) => {
        const deletePromises = cacheNames
          .filter(cacheName => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map(cacheName => {
            console.log('[SW] 🗑 Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          });
        return Promise.all(deletePromises);
      }),
      // Tomar control inmediatamente
      self.clients.claim().then(() => {
        console.log('[SW] 👍 Tomando control de las páginas');
      })
    ]).then(() => {
      console.log('[SW] ✨ Service Worker activado y listo');
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

  console.log('[SW] 🌐 Fetch:', url.pathname);

  event.respondWith(
    // 1. Primero intentar desde cache
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] 📂 Desde cache:', url.pathname);
          
          // Actualizar cache en background (stale-while-revalidate) solo si hay conexión
          if (navigator.onLine !== false) {
            fetch(request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                  caches.open(RUNTIME_CACHE).then((cache) => {
                    console.log('[SW] 🔄 Actualizando cache:', url.pathname);
                    cache.put(request, networkResponse);
                  }).catch((err) => {
                    console.warn('[SW] ⚠ Error actualizando cache:', err);
                  });
                }
              })
              .catch((error) => {
                // Silenciar errores de actualización en background cuando no hay red
                console.log('[SW] 📡 Sin conexión para actualizar cache:', url.pathname);
              });
          }
          
          return cachedResponse;
        }

        // 2. Si no está en cache, intentar ir a la red
        if (navigator.onLine === false) {
          console.log('[SW] 📡 Sin conexión, buscando fallback para:', url.pathname);
          
          // Para la ruta raíz o rutas de navegación, servir index.html
          if (url.pathname === '/' || request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html').then((fallback) => {
              if (fallback) {
                console.log('[SW] 🏠 Sirviendo fallback: /index.html para', url.pathname);
                return fallback;
              }
              // Si no hay index.html en cache, crear una respuesta básica
              return new Response('Sin conexión - Recurso no disponible', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          }
          
          // Para otros recursos, devolver error controlado
          return new Response('Recurso no disponible sin conexión', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        }

        console.log('[SW] 🌍 Desde red:', url.pathname);
        return fetch(request)
          .then((networkResponse) => {
            // Verificar que sea una respuesta válida
            if (!networkResponse || networkResponse.status !== 200) {
              console.warn('[SW] ⚠ Respuesta no válida:', url.pathname, networkResponse?.status);
              return networkResponse;
            }

            // Cachear la respuesta solo si es un recurso que debe ser cacheado
            if (shouldAutoCache(url)) {
              const responseToCache = networkResponse.clone();
              
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  console.log('[SW] 💾 Guardando en cache:', url.pathname);
                  cache.put(request, responseToCache);
                })
                .catch((err) => {
                  console.error('[SW] ❌ Error guardando en cache:', err);
                });
            }

            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] 💥 Error de red:', url.pathname, error.message);
            
            // Intentar servir index.html para la ruta raíz o rutas de navegación
            if (url.pathname === '/' || request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html').then((fallback) => {
                if (fallback) {
                  console.log('[SW] 🏠 Sirviendo fallback: /index.html para', url.pathname);
                  return fallback;
                }
                // Crear respuesta de error controlada
                return new Response('Sin conexión - Página no disponible', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'text/html' }
                });
              });
            }
            
            // Para otros recursos, devolver error controlado
            return new Response('Recurso no disponible', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  console.log('[SW] 📨 Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(RUNTIME_CACHE).then(cache => {
      urls.forEach(url => {
        fetch(url).then(response => {
          if (response.ok) {
            cache.put(url, response);
            console.log('[SW] 📥 Cacheado bajo demanda:', url);
          }
        });
      });
    });
  }
});

// Detectar cambios en el estado de la conexión
self.addEventListener('online', () => {
  console.log('[SW] 🌐 Conexión restaurada');
});

self.addEventListener('offline', () => {
  console.log('[SW] 📡 Sin conexión');
});

// Log cuando el SW se inicia
console.log('[SW] 🎬 Service Worker cargado');