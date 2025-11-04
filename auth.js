// auth.js - UPDATED FOR BACKEND
console.log('🔐 auth.js loaded successfully!');

const API_BASE = 'http://localhost:3000';

// ==================== AUTH FUNCTIONS ====================
async function handleRegister(e) {
    console.log('🔄 Register button clicked');
    if (e) e.preventDefault();
    
    // Get form values
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const type = document.getElementById('reg-type').value;
    
    console.log('📝 Form data:', { name, email, type });
    
    // Simple validation
    if (!name || !email || !password || !type) {
        alert('❌ Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        alert('❌ Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#register-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;
    
    try {
        // Send registration request to backend
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                type: type
            })
        });
        
        const result = await response.json();
        console.log('📡 Server response:', result);
        
        if (result.success) {
            // Store user data in localStorage
            localStorage.setItem('vcc_token', result.token);
            localStorage.setItem('vcc_isLoggedIn', 'true');
            localStorage.setItem('vcc_username', result.user.name);
            localStorage.setItem('vcc_useremail', result.user.email);
            localStorage.setItem('vcc_usertype', result.user.type);
            localStorage.setItem('vcc_userid', result.user.id);
            
            alert('✅ Registration Successful! Welcome ' + result.user.name);
            
            // Clear form
            document.getElementById('register-form').reset();
            
            // Redirect to home page
            window.location.href = 'index.html';
            
        } else {
            alert('❌ Registration failed: ' + result.message);
        }
        
    } catch (error) {
        console.error('💥 Registration error:', error);
        alert('🚫 Network error! Make sure:\n1. Backend server is running on localhost:3000\n2. MongoDB is running\n3. Check browser console for details');
    } finally {
        // Restore button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleLogin(e) {
    console.log('🔄 Login button clicked');
    if (e) e.preventDefault();
    
    // Get form values
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('📝 Login data:', { email });
    
    // Simple validation
    if (!email || !password) {
        alert('❌ Please fill in all fields');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        // Send login request to backend
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const result = await response.json();
        console.log('📡 Server response:', result);
        
        if (result.success) {
            // Store user data in localStorage
            localStorage.setItem('vcc_token', result.token);
            localStorage.setItem('vcc_isLoggedIn', 'true');
            localStorage.setItem('vcc_username', result.user.name);
            localStorage.setItem('vcc_useremail', result.user.email);
            localStorage.setItem('vcc_usertype', result.user.type);
            localStorage.setItem('vcc_userid', result.user.id);
            
            alert('✅ Login Successful! Welcome back ' + result.user.name);
            
            // Clear form
            document.getElementById('login-form').reset();
            
            // Redirect to home page
            window.location.href = 'index.html';
            
        } else {
            alert('❌ Login failed: ' + result.message);
        }
        
    } catch (error) {
        console.error('💥 Login error:', error);
        alert('🚫 Network error! Make sure:\n1. Backend server is running on localhost:3000\n2. Check browser console for details');
    } finally {
        // Restore button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    console.log('🚪 Logging out...');
    
    // Clear all stored data
    localStorage.removeItem('vcc_token');
    localStorage.removeItem('vcc_isLoggedIn');
    localStorage.removeItem('vcc_username');
    localStorage.removeItem('vcc_useremail');
    localStorage.removeItem('vcc_usertype');
    localStorage.removeItem('vcc_userid');
    localStorage.removeItem('vcc_cart');
    
    // Call logout API
    fetch(`${API_BASE}/logout`, { 
        method: 'POST' 
    }).catch(err => console.log('Logout API call failed:', err));
    
    alert('👋 Logged out successfully');
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// ... (keep the rest of your existing modal and UI functions unchanged)
// ==================== MODAL FUNCTIONS ====================
function openModal(type) {
    console.log('📂 Opening modal:', type);
    const modal = document.getElementById(type + '-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(type) {
    console.log('📂 Closing modal:', type);
    const modal = document.getElementById(type + '-modal');
    if (modal) {
        modal.style.display = 'none';
        // Clear form
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

function switchModal(to) {
    console.log('🔄 Switching to modal:', to);
    if (to === 'login') {
        closeModal('register');
        openModal('login');
    } else {
        closeModal('login');
        openModal('register');
    }
}

// ==================== UI UPDATE FUNCTIONS ====================
function updateAuthUI() {
    console.log('🔄 Updating UI with login status');
    
    const headerRight = document.querySelector('.header-right');
    const welcomeBanner = document.getElementById('welcome-banner');
    const isLoggedIn = localStorage.getItem('vcc_isLoggedIn') === 'true';
    const username = localStorage.getItem('vcc_username');
    
    console.log('📊 Login status:', { isLoggedIn, username });
    
    // Update header
    if (headerRight) {
        if (isLoggedIn && username) {
            headerRight.innerHTML = `
                <a href="#" class="icon-btn"><i class="fas fa-shopping-cart"></i></a>
                <span style="margin-right:16px; color:#0e0f11; font-weight:600;">
                    Hi, ${username}!
                </span>
                <a href="#" onclick="handleLogout()" class="btn-secondary">Logout</a>
            `;
        } else {
            headerRight.innerHTML = `
                <a href="#" class="icon-btn"><i class="fas fa-shopping-cart"></i></a>
                <a href="login.html" class="btn-secondary">Login</a>
                <a href="register.html" class="btn-primary">Register</a>
            `;
        }
    }
    
    // Update welcome banner
    if (welcomeBanner) {
        if (isLoggedIn && username) {
            welcomeBanner.innerHTML = `
                <h3>Welcome back, ${username}!</h3>
                <p>Continue exploring authentic handmade crafts.</p>
            `;
            welcomeBanner.style.display = 'block';
        } else {
            welcomeBanner.style.display = 'none';
        }
    }
}

// ==================== INITIALIZATION ====================
function initializeAuth() {
    console.log('🚀 Initializing authentication...');
    
    // Attach event listeners to forms
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    
    if (registerForm) {
        console.log('✅ Found register form, attaching handler');
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (loginForm) {
        console.log('✅ Found login form, attaching handler');
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Set up modal close events
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                const modalId = this.id.replace('-modal', '');
                closeModal(modalId);
            }
        });
    });
    
    // Update UI on page load
    updateAuthUI();
    
    console.log('✅ Authentication initialized successfully');
}

// ==================== GLOBAL FUNCTIONS ====================
// Make functions available globally
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.updateAuthUI = updateAuthUI;

// ==================== START AUTH SYSTEM ====================
// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, starting auth system...');
    initializeAuth();
});

console.log('🔐 VillageCraft Auth System Ready!');