self.addEventListener('install', event => {
    console.log('Service Worker installed');

        caches.open('v1')
        .then((cache) => {
            cache.addAll([
                '/src/App.jsx',
                '/src/App.css',
                '/main.jsx',
                '/index.html',
                '/src/components/Login.jsx',
                '/src/components/Dashboard.jsx',
                '/src/components/Login.css',
                '/src/components/Dashboard.css',
                '/src/index.css',
                '/src/main.jsx',
                '/src/assets/S25Ultra.jpg',
                '/src/assets/rogphone9pro.png',
                '/src/assets/google-pixel-10-pro.png',
                '/src/assets/iphone16promax.jpg',
                '/src/assets/pocox7pro.jpg',
                '/src/assets/galaxys24.png',
                '/src/assets/xiaomi-poco-x7.jpg'
            ]);
        });
   
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    
    //caches.delete('v1');
    caches.delete('dynamic');
});

self.addEventListener('fetch', event =>{
    console.log(event.request);
    if(event.request.method === 'GET'){
        const resp = fetch(event.request)
        .then(respuesta=>{
            caches.match(event.request)
            .then(cache=>{
                if(cache===undefined){
                    caches.open("dynamic_v1")
                    .then(cacheDyn=>{
                        cacheDyn.put(event.request, respuesta);
                    });
                }
            });
            return respuesta.clone();

        }).catch(error=>{
            return caches.match(event.request);
        });
    }

})