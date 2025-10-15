import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import s25 from '../assets/S25Ultra.jpg';
import rog9 from '../assets/rogphone9pro.png';
import pixel10 from '../assets/google-pixel-10-pro.png';
import iphone16 from '../assets/iphone16promax.jpg';
import pocoX7 from '../assets/pocox7pro.jpg';
import galaxyS24 from '../assets/galaxys24.png';
import pocoX7Alt from '../assets/xiaomi-poco-x7.jpg';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  //const BASE_URL = 'https://pwa-backend-knbm.onrender.com';
  const BASE_URL = 'https://pwa-backend-knbm.onrender.com';
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState(null);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const publicVapidKey = "BBR2W5ZrA8jgnh1dB_vbVAzu4PVS5t81sXyv_B-bdbkUCUd0d-ZglMsXTHcJTIRa7RY9erDAcm0NlkYkZnZ2DgY";

  // Función para solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabled(granted);
      return granted;
    }
    return false;
  };

  // Función para mostrar notificación cuando se agrega al carrito
  const showCartNotification = (phoneName, quantity = 1) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🛒 Producto agregado al carrito', {
        body: `${phoneName} (${quantity} unidad${quantity > 1 ? 'es' : ''}) se agregó a tu carrito`,
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'cart-notification',
        requireInteraction: false,
        silent: false
      });

      // Cerrar la notificación después de 3 segundos
      setTimeout(() => {
        notification.close();
      }, 3000);

      // Opcional: agregar click handler para abrir el carrito
      notification.onclick = () => {
        window.focus();
        setIsCartOpen(true);
        loadCart();
        notification.close();
      };
    }
  };


  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });
  
        await fetch(`${BASE_URL}/api/subscribe`, {
          method: "POST",
          body: JSON.stringify(subscription),
          headers: { "Content-Type": "application/json" },
        });
  
        console.log("Suscripción enviada al servidor");
      });
    }
  }, []);
  
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  
  useEffect(() => {
    // Verificar si hay usuario logueado
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));

    // Verificar estado inicial de notificaciones
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const phones = useMemo(
    () => [
      {
        id: 's25u',
        name: 'Samsung Galaxy S25 Ultra',
        brand: 'Samsung',
        price: 1399,
        image: s25,
        storage: '256/512GB',
        ram: '12GB',
        battery: '5000 mAh',
        display: '6.8" QHD+ 120Hz',
        camera: '200MP + 50MP + 12MP',
        soc: 'Snapdragon 8 Elite',
        weight: '232 g',
      },
      {
        id: 's24',
        name: 'Samsung Galaxy S24',
        brand: 'Samsung',
        price: 899,
        image: galaxyS24,
        storage: '128/256GB',
        ram: '8GB',
        battery: '4000 mAh',
        display: '6.2" FHD+ 120Hz',
        camera: '50MP + 12MP + 10MP',
        soc: 'Snapdragon 8 Gen 3',
        weight: '167 g',
      },
      {
        id: 'rog9',
        name: 'ASUS ROG Phone 9 Pro',
        brand: 'ASUS',
        price: 1199,
        image: rog9,
        storage: '256/512GB',
        ram: '16GB',
        battery: '5500 mAh',
        display: '6.78" FHD+ 165Hz',
        camera: '50MP + 13MP + 8MP',
        soc: 'Snapdragon 8 Gen 3',
        weight: '239 g',
      },
      {
        id: 'pixel10',
        name: 'Google Pixel 10 Pro',
        brand: 'Google',
        price: 1099,
        image: pixel10,
        storage: '256/512GB',
        ram: '12GB',
        battery: '5100 mAh',
        display: '6.7" QHD+ 120Hz',
        camera: '50MP + 48MP + 12MP',
        soc: 'Tensor G4',
        weight: '212 g',
      },
      {
        id: 'ip16',
        name: 'iPhone 16 Pro Max',
        brand: 'Apple',
        price: 1499,
        image: iphone16,
        storage: '256/512GB/1TB',
        ram: '8GB',
        battery: '4685 mAh',
        display: '6.9" 120Hz ProMotion',
        camera: '48MP + 12MP + 12MP',
        soc: 'A18 Pro',
        weight: '225 g',
      },
      {
        id: 'pocox7',
        name: 'POCO X7 Pro',
        brand: 'Xiaomi',
        price: 449,
        image: pocoX7,
        storage: '256GB',
        ram: '12GB',
        battery: '5000 mAh',
        display: '6.67" FHD+ 120Hz',
        camera: '64MP + 8MP + 2MP',
        soc: 'Dimensity 8300-Ultra',
        weight: '187 g',
      },
      {
        id: 'pocox7-alt',
        name: 'POCO X7',
        brand: 'Xiaomi',
        price: 349,
        image: pocoX7Alt,
        storage: '128/256GB',
        ram: '8GB',
        battery: '5100 mAh',
        display: '6.67" FHD+ 120Hz',
        camera: '64MP + 8MP + 2MP',
        soc: 'Snapdragon 7s Gen 2',
        weight: '181 g',
      },
    ],
    []
  );

  const brands = useMemo(() => ['Samsung', 'ASUS', 'Google', 'Apple', 'Xiaomi'], []);

  const filtered = useMemo(() => {
    return phones.filter((p) => {
      const matchesQuery = `${p.name} ${p.brand}`.toLowerCase().includes(query.toLowerCase());
      const matchesBrand = !brandFilter || p.brand === brandFilter;
      const matchesPrice = !priceFilter ||
        (priceFilter === 'lt500' && p.price < 500) ||
        (priceFilter === '500to1000' && p.price >= 500 && p.price <= 1000) ||
        (priceFilter === 'gt1000' && p.price >= 1000);
      return matchesQuery && matchesBrand && matchesPrice;
    });
  }, [phones, query, brandFilter, priceFilter]);

  const openDetail = (phone) => {
    setSelectedPhone(phone);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedPhone(null);
  };

  const handleBuy = (phone) => {
    alert(`Compra simulada: ${phone.name} por $${phone.price}`);
  };

  const handleAddToCart = async (phone, quantity = 1) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        navigate('/login');
        return;
      }
      const currentUser = JSON.parse(userData);
      const userId = currentUser._id || currentUser.id;
      if (!userId) {
        alert('No se encontró el ID de usuario. Inicia sesión nuevamente.');
        return;
      }

      const payload = {
        userId,
        items: [
          {
            productId: phone.id,
            quantity
          }
        ]
      };

      // Siempre encolar en IndexedDB - el SW se encargará del envío
      if (window.enqueuePendingCart) {
        await window.enqueuePendingCart({ baseUrl: BASE_URL, payload });
        
        if (navigator.onLine === false) {
          alert('Sin conexión. Se guardó en cola y se enviará al reconectar.');
        } else {
          alert('Producto agregado al carrito');
        }

        // Mostrar notificación del navegador
        showCartNotification(phone.name, quantity);
        
        // No cargar carrito del servidor inmediatamente ya que el SW lo sincronizará
        // Solo actualizar el contador local si es posible
        if (cart && Array.isArray(cart.items)) {
          const existingItem = cart.items.find(item => item.productId === phone.id);
          if (existingItem) {
            existingItem.quantity = (Number(existingItem.quantity) || 0) + quantity;
          } else {
            cart.items.push({ productId: phone.id, quantity });
          }
          setCart({ ...cart });
        }
      } else {
        alert('Error: No se pudo acceder al almacenamiento local');
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      alert(error.message || 'Error al agregar al carrito');
    }
  };

  const getCurrentUserId = () => {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    const currentUser = JSON.parse(userData);
    return currentUser._id || currentUser.id || null;
  };

  const loadCart = async () => {
    try {
      setCartError('');
      setIsCartLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setCart(null);
        setIsCartLoading(false);
        return;
      }
      const res = await fetch(`${BASE_URL}/carrito/${userId}`);
      if (res.status === 404) {
        setCart({ userId, items: [], updatedAt: new Date().toISOString() });
        setIsCartLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Error al obtener el carrito');
      }
      setCart(data);
    } catch (err) {
      console.error('Error cargando carrito:', err);
      setCartError(err.message || 'Error al obtener el carrito');
    } finally {
      setIsCartLoading(false);
    }
  };

  useEffect(() => {
    // cargar carrito al tener usuario
    if (user) {
      loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Escuchar mensajes del Service Worker para actualizar el carrito
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'CART_SYNCED') {
        // Recargar carrito cuando el SW sincronice exitosamente
        loadCart();
        
        // Mostrar notificación de sincronización exitosa
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('✅ Carrito sincronizado', {
            body: 'Los productos se han sincronizado correctamente con el servidor',
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            tag: 'cart-sync-notification',
            requireInteraction: false,
            silent: false
          });

          setTimeout(() => {
            notification.close();
          }, 3000);
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const cartCount = useMemo(() => {
    if (!cart || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [cart]);

  if (!user) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <button 
            id="install-button" 
            className="install-btn" 
            style={{display: 'none', marginRight: '10px'}}
            title="Instalar aplicación"
          >
            📱 Instalar App
          </button>
          <button
            className="btn"
            style={{ marginRight: '10px' }}
            onClick={() => { setIsCartOpen(true); loadCart(); }}
            aria-label={`Abrir carrito con ${cartCount} artículos`}
          >
            🛒 Carrito{cartCount > 0 ? ` (${cartCount})` : ''}
          </button>
          <button
            className="btn"
            style={{ marginRight: '10px' }}
            onClick={requestNotificationPermission}
            title={notificationsEnabled ? "Notificaciones habilitadas" : "Habilitar notificaciones"}
          >
            {notificationsEnabled ? '🔔' : '🔕'} Notificaciones
          </button>
          <span>Bienvenido, {user.username}</span>
          <button onClick={handleLogout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>Catálogo de teléfonos</h2>
          <p>Explora modelos, compra y compara especificaciones.</p>
        </div>

        <section className="filters">
          <input
            type="text"
            placeholder="Buscar por modelo o marca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            aria-label="Buscar"
          />
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="select"
            aria-label="Marca"
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="select"
            aria-label="Precio"
          >
            <option value="">Todos los precios</option>
            <option value="lt500">Menos de $500</option>
            <option value="500to1000">$500 - $1000</option>
            <option value="gt1000">Más de $1000</option>
          </select>
        </section>

        <section className="catalog-grid">
          {filtered.map((phone) => (
            <article key={phone.id} className="phone-card">
              <div className="phone-media">
                <img src={phone.image} alt={phone.name} loading="lazy" />
                <span className="price-tag">${phone.price}</span>
              </div>
              <div className="phone-body">
                <h3 className="phone-title">{phone.name}</h3>
                <p className="phone-brand">{phone.brand}</p>
                <ul className="specs-inline">
                  <li>{phone.display}</li>
                  <li>{phone.ram} / {phone.storage}</li>
                  <li>{phone.battery}</li>
                </ul>
                <div className="card-actions">
                  <button className="btn primary" onClick={() => handleBuy(phone)}>Comprar</button>
                  <button className="btn" onClick={() => handleAddToCart(phone, 1)}>Agregar al carrito</button>
                  <button className="btn ghost" onClick={() => openDetail(phone)}>Ver detalles</button>
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="empty">No se encontraron resultados.</div>
          )}
        </section>
      </main>

      {isDetailOpen && selectedPhone && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <button className="modal-close" aria-label="Cerrar" onClick={closeDetail}>×</button>
            <div className="detail">
              <div className="detail-media">
                <img src={selectedPhone.image} alt={selectedPhone.name} />
              </div>
              <div className="detail-body">
                <h2>{selectedPhone.name}</h2>
                <div className="detail-price">${selectedPhone.price}</div>
                <div className="chips">
                  <span className="chip">{selectedPhone.brand}</span>
                  <span className="chip">{selectedPhone.soc}</span>
                  <span className="chip">{selectedPhone.weight}</span>
                </div>
                <table className="specs-table">
                  <tbody>
                    <tr><th>Pantalla</th><td>{selectedPhone.display}</td></tr>
                    <tr><th>RAM / Almacenamiento</th><td>{selectedPhone.ram} / {selectedPhone.storage}</td></tr>
                    <tr><th>Batería</th><td>{selectedPhone.battery}</td></tr>
                    <tr><th>Cámaras</th><td>{selectedPhone.camera}</td></tr>
                    <tr><th>Chip</th><td>{selectedPhone.soc}</td></tr>
                    <tr><th>Peso</th><td>{selectedPhone.weight}</td></tr>
                  </tbody>
                </table>
                <div className="detail-actions">
                  <button className="btn primary" onClick={() => handleBuy(selectedPhone)}>Comprar ahora</button>
                  <button className="btn" onClick={() => handleAddToCart(selectedPhone, 1)}>Agregar al carrito</button>
                  <button className="btn" onClick={closeDetail}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <button className="modal-close" aria-label="Cerrar" onClick={() => setIsCartOpen(false)}>×</button>
            <div className="detail">
              <div className="detail-body">
                <h2>Tu carrito</h2>
                {isCartLoading && <div className="loading">Cargando carrito...</div>}
                {cartError && <div className="error">{cartError}</div>}
                {!isCartLoading && !cartError && (
                  <>
                    {(!cart || cart.items.length === 0) && (
                      <div className="empty">No hay productos en tu carrito.</div>
                    )}
                    {cart && cart.items.length > 0 && (
                      <table className="specs-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.items.map((item, idx) => {
                            const phone = phones.find(p => p.id === item.productId);
                            const name = phone?.name || item.productId;
                            const price = phone?.price || 0;
                            const quantity = Number(item.quantity) || 0;
                            const subtotal = price * quantity;
                            return (
                              <tr key={`${item.productId}-${idx}`}>
                                <td>{name}</td>
                                <td>{quantity}</td>
                                <td>{price > 0 ? `$${price}` : '-'}</td>
                                <td>{price > 0 ? `$${subtotal}` : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
                <div className="detail-actions" style={{ marginTop: '12px' }}>
                  <button className="btn" onClick={() => setIsCartOpen(false)}>Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
