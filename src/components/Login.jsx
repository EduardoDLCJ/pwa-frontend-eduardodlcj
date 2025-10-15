import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validación básica
    if (!formData.email || !formData.password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://pwa-backend-knbm.onrender.com/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Login exitoso
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log(data.user);
        navigate('/dashboard');
      } else {
        // Error del servidor
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión. Verifica que el servidor esté ejecutándose.');
    } finally {
      setLoading(false);
    }
  };


  const prueba = () => {
    const request = window.indexedDB.open('pwa-db', 1);
    request.onsuccess = (event) => {
      const database = event.target.result;
        const transaction = database.transaction('tabla', 'readwrite');
        const store = transaction.objectStore('tabla');
        const addRequest = store.add({ name: 'Prueba', age: 20 });    
  }
}

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <button type="button" className="login-button" onClick={prueba}>Prueba</button>
        </form>

        <div className="demo-credentials">
          <p><strong>Conectado a tu API:</strong></p>
          <p>Usa las credenciales de tu base de datos</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
