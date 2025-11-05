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
  //const BASE_URL = 'https://pwa-backend-knbm.onrender.com1';
  const BASE_URL = 'https://pwa-backend-knbm.onrender.com';
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState(null);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  // Estados para panel de administración
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [adminNotificationTitle, setAdminNotificationTitle] = useState('');
  const [adminNotificationBody, setAdminNotificationBody] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [sendToAll, setSendToAll] = useState(false);

  const publicVapidKey = "BBR2W5ZrA8jgnh1dB_vbVAzu4PVS5t81sXyv_B-bdbkUCUd0d-ZglMsXTHcJTIRa7RY9erDAcm0NlkYkZnZ2DgY";
  
  // Verificar si el usuario es adminuser
  const isAdmin = user?.username === 'adminuser';

  // Función para solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabled(granted);
      if (granted) {
        await ensurePushSubscriptionSaved();
      }
      return granted;
    }
    return false;
  };

  // Función para solicitar al SW que muestre la notificación de carrito
  const showCartNotification = async (phoneName, quantity = 1) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker?.ready;
      const sw = reg?.active || navigator.serviceWorker?.controller;
      sw?.postMessage({
        type: 'SHOW_CART_ADDED',
        name: phoneName,
        quantity
      });
    } catch {}
  };


  useEffect(() => {
    // Si ya está concedido, asegurar que la suscripción esté guardada con el userId
    if (Notification.permission === 'granted') {
      ensurePushSubscriptionSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensurePushSubscriptionSaved() {
    try {
      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }
      const userData = localStorage.getItem('user');
      if (!userData) return;
      const currentUser = JSON.parse(userData);
      const userId = currentUser._id || currentUser.id;
      if (!userId) return;
      await fetch(`${BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription })
      });
      console.log('Suscripción guardada para usuario');
    } catch (e) {
      console.error('Error guardando suscripción:', e);
    }
  }
  
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
          window.location.reload()
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
        
        // Mostrar notificación de sincronización exitosa (siempre vía SW)
        (async () => {
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const reg = await navigator.serviceWorker?.ready;
              await reg?.showNotification('✅ Carrito sincronizado', {
                body: 'Los productos se han sincronizado correctamente con el servidor',
                icon: '/icon-192.svg',
                badge: '/icon-192.svg',
                tag: 'cart-sync-notification',
                requireInteraction: false,
                silent: false
              });
            } catch {}
          }
        })();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Abrir carrito si el SW envía la señal tras click en notificación
  useEffect(() => {
    const openCartOnMessage = (event) => {
      if (event.data && event.data.type === 'OPEN_CART') {
        setIsCartOpen(true);
        loadCart();
      }
    };
    navigator.serviceWorker?.addEventListener('message', openCartOnMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', openCartOnMessage);
  }, []);

  const cartCount = useMemo(() => {
    if (!cart || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [cart]);

  // Funciones para panel de administración
  const loadUsers = async () => {
    try {
      setAdminError('');
      setAdminLoading(true);
      const response = await fetch(`${BASE_URL}/api/admin/users?adminUsername=adminuser`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        setAdminError(data.message || 'Error al cargar usuarios');
      }
    } catch (err) {
      setAdminError('Error de conexión al cargar usuarios');
      console.error('Error cargando usuarios:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleOpenAdminPanel = () => {
    setIsAdminPanelOpen(true);
    loadUsers();
  };

  const handleToggleUser = (userId) => {
    if (sendToAll) return; // No permitir selección si está enviando a todos
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendNotifications = async () => {
    if (!adminNotificationTitle || !adminNotificationBody) {
      setAdminError('Por favor completa el título y mensaje');
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      setAdminError('Por favor selecciona al menos un usuario o marca "Enviar a todos"');
      return;
    }

    try {
      setAdminError('');
      setAdminSuccess('');
      setAdminLoading(true);
      
      const response = await fetch(`${BASE_URL}/api/admin/send-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUsername: 'adminuser',
          title: adminNotificationTitle,
          body: adminNotificationBody,
          userIds: sendToAll ? null : selectedUsers,
          sendToAll: sendToAll
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setAdminSuccess(`Notificaciones enviadas: ${data.sent} exitosas, ${data.failed} fallidas`);
        setAdminNotificationTitle('');
        setAdminNotificationBody('');
        setSelectedUsers([]);
        setSendToAll(false);
        setTimeout(() => {
          setAdminSuccess('');
        }, 5000);
      } else {
        setAdminError(data.message || 'Error al enviar notificaciones');
      }
    } catch (err) {
      setAdminError('Error de conexión al enviar notificaciones');
      console.error('Error enviando notificaciones:', err);
    } finally {
      setAdminLoading(false);
    }
  };

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
          {isAdmin && (
            <button
              className="btn"
              style={{ marginRight: '10px', backgroundColor: '#ff6b6b', color: 'white' }}
              onClick={handleOpenAdminPanel}
              title="Panel de administración"
            >
              ⚙️ Admin
            </button>
          )}
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

      {/* Panel de Administración */}
      {isAdminPanelOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setIsAdminPanelOpen(false)}>×</button>
            <div className="detail">
              <div className="detail-body">
                <h2>Panel de Administración - Enviar Notificaciones</h2>
                
                {adminError && <div className="error" style={{ marginBottom: '12px' }}>{adminError}</div>}
                {adminSuccess && <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' }}>{adminSuccess}</div>}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Título de la notificación:
                  </label>
                  <input
                    type="text"
                    value={adminNotificationTitle}
                    onChange={(e) => setAdminNotificationTitle(e.target.value)}
                    className="input"
                    placeholder="Ej: Nueva oferta disponible"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Mensaje:
                  </label>
                  <textarea
                    value={adminNotificationBody}
                    onChange={(e) => setAdminNotificationBody(e.target.value)}
                    className="input"
                    placeholder="Escribe el mensaje de la notificación..."
                    rows="4"
                    style={{ width: '100%', padding: '8px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={sendToAll}
                      onChange={(e) => {
                        setSendToAll(e.target.checked);
                        if (e.target.checked) setSelectedUsers([]);
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    <strong>Enviar a todos los usuarios con suscripciones</strong>
                  </label>
                </div>

                {!sendToAll && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Seleccionar usuarios ({selectedUsers.length} seleccionados):
                    </label>
                    {adminLoading ? (
                      <div className="loading">Cargando usuarios...</div>
                    ) : (
                      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                        {users.length === 0 ? (
                          <div className="empty">No hay usuarios registrados</div>
                        ) : (
                          users.map((u) => (
                            <label
                              key={u._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px',
                                cursor: 'pointer',
                                backgroundColor: selectedUsers.includes(u._id) ? '#e3f2fd' : 'transparent',
                                borderRadius: '4px',
                                marginBottom: '4px'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(u._id)}
                                onChange={() => handleToggleUser(u._id)}
                                style={{ marginRight: '8px' }}
                              />
                              <div style={{ flex: 1 }}>
                                <strong>{u.username}</strong> ({u.email})
                                <div style={{ fontSize: '0.85em', color: '#666' }}>
                                  {u.hasSubscriptions ? (
                                    <span style={{ color: '#28a745' }}>
                                      ✓ {u.subscriptionCount} dispositivo(s) suscrito(s)
                                    </span>
                                  ) : (
                                    <span style={{ color: '#dc3545' }}>Sin suscripciones</span>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="detail-actions" style={{ marginTop: '20px' }}>
                  <button
                    className="btn primary"
                    onClick={handleSendNotifications}
                    disabled={adminLoading || !adminNotificationTitle || !adminNotificationBody}
                  >
                    {adminLoading ? 'Enviando...' : '📤 Enviar Notificaciones'}
                  </button>
                  <button className="btn" onClick={() => setIsAdminPanelOpen(false)}>Cerrar</button>
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
