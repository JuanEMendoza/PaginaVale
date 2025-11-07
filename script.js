const API_URL = 'https://apipeluqueria-1.onrender.com/api/usuarios';
const ADMIN_ROLE = 'administrador';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const correoInput = document.getElementById('correo');
const contrasenaInput = document.getElementById('contrasena');
const errorMessage = document.getElementById('errorMessage');
const btnLogin = loginForm.querySelector('.btn-login');
const btnText = btnLogin.querySelector('.btn-text');
const btnLoading = btnLogin.querySelector('.btn-loading');

// Event listener
loginForm.addEventListener('submit', handleLogin);

async function handleLogin(e) {
    e.preventDefault();
    
    // Clear previous errors
    hideError();
    
    // Get form values
    const correo = correoInput.value.trim();
    const contrasena = contrasenaInput.value;
    
    // Validate inputs
    if (!correo || !contrasena) {
        showError('Por favor, completa todos los campos');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Fetch all users
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Error al conectar con el servidor');
        }
        
        const usuarios = await response.json();
        
        // Find user with matching credentials
        const usuario = usuarios.find(
            user => user.correo.toLowerCase() === correo.toLowerCase() 
            && user.contrasena === contrasena
        );
        
        // Check if user exists
        if (!usuario) {
            showError('Credenciales incorrectas');
            setLoadingState(false);
            return;
        }
        
        // Validate role
        if (usuario.rol !== ADMIN_ROLE) {
            showError('Acceso denegado. Solo administradores pueden iniciar sesión');
            setLoadingState(false);
            return;
        }
        
        // Check if user is active
        if (usuario.estado && usuario.estado.toLowerCase() !== 'activo') {
            showError('Tu cuenta no está activa. Contacta al administrador');
            setLoadingState(false);
            return;
        }
        
        // Success - Store user data and redirect
        localStorage.setItem('adminUser', JSON.stringify({
            id: usuario.id_usuario,
            nombre: usuario.nombre,
            correo: usuario.correo,
            telefono: usuario.telefono,
            rol: usuario.rol,
            timestamp: new Date().toISOString()
        }));
        
        // Simulate redirect to admin panel
        setTimeout(() => {
            setLoadingState(false);
            showSuccess('Inicio de sesión exitoso. Redirigiendo...');
            
            // Redirect to admin panel
            window.location.href = 'admin-panel.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Error al iniciar sesión. Por favor, intenta de nuevo');
        setLoadingState(false);
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.classList.remove('show');
}

function showSuccess(message) {
    errorMessage.style.background = '#d4edda';
    errorMessage.style.borderColor = '#c3e6cb';
    errorMessage.style.color = '#155724';
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function setLoadingState(loading) {
    if (loading) {
        btnLogin.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
    } else {
        btnLogin.disabled = false;
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
    }
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            // Optional: Validate timestamp or check session
            // For now, just log
            console.log('Usuario ya autenticado:', user);
        } catch (error) {
            localStorage.removeItem('adminUser');
        }
    }
});

// Clear form on page load
window.addEventListener('beforeunload', () => {
    loginForm.reset();
});

