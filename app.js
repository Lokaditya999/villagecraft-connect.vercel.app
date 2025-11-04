// app.js - FIXED VERSION

// WARNING: Ensure your server is running at http://localhost:3000
const API_BASE_URL = 'http://localhost:3000';

// --- DOM ELEMENTS ---
let iconCart, cart, closeCartBtn, listProductHTML, listCartHTML, totalQuantityHTML, toast;

// --- STATE ---
let listCart = []; 

// --- INITIALIZE DOM ELEMENTS ---
function initializeDOMElements() {
    iconCart = document.querySelector('.iconCart');
    cart = document.querySelector('.cart');
    closeCartBtn = document.querySelector('.close'); 
    listProductHTML = document.querySelector('.listProduct');
    listCartHTML = document.querySelector('.listCart');
    totalQuantityHTML = document.querySelector('.totalQuantity');
    toast = document.getElementById('toast');
}

// --- CART VISUAL TOGGLE ---
function setupCartToggle() {
    if (iconCart) {
        iconCart.addEventListener('click', function(){
            if (cart) cart.classList.toggle('active');
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', function (){ 
            if (cart) cart.classList.remove('active');
        });
    }
}

// --- PRODUCT CATEGORY UTILITY ---
function getCategoryFromURL() {
    const filename = window.location.pathname.split('/').pop();
    const categoryMap = {
        'index1.html': 'water-usage',
        'index2.html': 'kitchen-usage', 
        'index3.html': 'jute-products',
        'index4.html': 'ceramic-products'
    };
    return categoryMap[filename] || 'water-usage';
}

// --- PERSISTENCE & SYNCHRONIZATION ---
function saveCartToLocalStorage() {
    localStorage.setItem('vcc_cart', JSON.stringify(listCart));
}

function getCartFromLocalStorage() {
    try {
        const storedCart = localStorage.getItem('vcc_cart');
        if (storedCart) {
            listCart = JSON.parse(storedCart);
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        listCart = [];
    }
}

// --- RENDER FUNCTIONS ---
function addDataToHTML() {
    if (!listProductHTML) {
        console.error('listProductHTML element not found');
        return;
    }
    
    listProductHTML.innerHTML = '';

    // Check if window.products is available
    if (window.products && Array.isArray(window.products) && window.products.length > 0) {
        console.log('Loading products:', window.products.length);
        
        window.products.forEach(product => {
            const newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.dataset.id = product.id;
            
            newProduct.innerHTML = `
                <img src="${product.image}" alt="${product.name}" onerror="this.src='default-product.jpg'">
                <h2>${product.name}</h2>
                <div class="price">$${product.price}</div>
                <button onclick="addCart(${product.id})">Add To Cart</button>
                
                <div class="details-card">
                    <h2>${product.name}</h2>
                    <p>by ${product.artisan}</p>
                    <p>Price: $${product.price}</p>
                    <p>${product.description}</p>
                </div>
            `;

            listProductHTML.appendChild(newProduct);
        });
    } else {
        listProductHTML.innerHTML = `
            <div style="text-align: center; width: 100%; padding: 40px; color: #666;">
                <p>No products found for this category.</p>
                <p>Products data: ${window.products ? 'Exists but empty' : 'Not loaded'}</p>
            </div>
        `;
        console.warn('No products data found:', window.products);
    }
}

function addCartToHTML() {
    if (!listCartHTML || !totalQuantityHTML) {
        console.error('Cart HTML elements not found');
        return;
    }
    
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    
    // Filter out invalid cart items
    listCart = listCart.filter(item => item && item.id && item.quantity > 0);

    if (listCart.length > 0) {
        listCart.forEach(cartItem => {
            // Find product from window.products or use cartItem data
            const product = window.products ? window.products.find(p => p.id === cartItem.id) : null;
            
            const newCart = document.createElement('div');
            newCart.classList.add('item');
            newCart.dataset.id = cartItem.id;
            
            newCart.innerHTML = `
                <img src="${product ? product.image : cartItem.image || 'default-product.jpg'}" alt="${cartItem.name}">
                <div class="content">
                    <div class="name">${cartItem.name || `Product ${cartItem.id}`}</div>
                    <div class="price">$${cartItem.price || 0} / ${cartItem.quantity} items</div>
                </div>
                <div class="quantity">
                    <button onclick="changeQuantity(${cartItem.id}, '-')">-</button>
                    <span class="value">${cartItem.quantity}</span>
                    <button onclick="changeQuantity(${cartItem.id}, '+')">+</button>
                </div>
            `;
            listCartHTML.appendChild(newCart);
            totalQuantity += cartItem.quantity;
        });
    } else {
        listCartHTML.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                Your cart is empty
            </div>
        `;
    }
    
    totalQuantityHTML.innerText = totalQuantity;
    
    // Add shake animation to cart icon when items are added
    if (totalQuantity > 0 && iconCart) {
        iconCart.classList.add('shake');
        setTimeout(() => {
            iconCart.classList.remove('shake');
        }, 500);
    }
}

// --- CART LOGIC ---
function addCart(productId) {
    // Check if user is logged in
    const token = localStorage.getItem('vcc_token');
    if (!token) {
        showToast("Please log in to add products to the cart.");
        if (typeof openModal === 'function') {
            openModal('login');
        }
        return;
    }

    // Check if products data is available
    if (!window.products || !Array.isArray(window.products)) {
        showToast("Product data not loaded. Please refresh the page.");
        return;
    }

    const productToAdd = window.products.find(p => p.id === productId);
    if (!productToAdd) {
        showToast("Product not found.");
        return;
    }

    let cartIndex = listCart.findIndex(item => item && item.id === productId);

    if (cartIndex === -1) {
        // Add new item to cart
        listCart.push({ 
            id: productToAdd.id, 
            quantity: 1,
            name: productToAdd.name,
            price: productToAdd.price,
            image: productToAdd.image
        }); 
    } else {
        // Increase quantity of existing item
        listCart[cartIndex].quantity++;
    }
    
    saveCartToLocalStorage();
    addCartToHTML();
    showToast(`${productToAdd.name} added to cart!`);
}

function changeQuantity(productId, type) {
    const cartIndex = listCart.findIndex(item => item && item.id === productId);
    if (cartIndex === -1) return;

    if (type === '+') {
        listCart[cartIndex].quantity++;
    } else if (type === '-') {
        listCart[cartIndex].quantity--;

        // Remove item if quantity becomes 0
        if (listCart[cartIndex].quantity <= 0) {
            listCart.splice(cartIndex, 1);
        }
    }
    
    saveCartToLocalStorage();
    addCartToHTML();
}

// --- UTILITIES ---
function showToast(message) {
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        if (toast) toast.style.opacity = '0';
    }, 2000);
}

// --- INITIALIZATION ---
function initApp() {
    console.log('Initializing VillageCraft app...');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Setup cart toggle functionality
    setupCartToggle();
    
    // Load cart from localStorage
    getCartFromLocalStorage();
    
    // Wait for products data to be available
    const checkProductsLoaded = setInterval(() => {
        if (window.products !== undefined) {
            clearInterval(checkProductsLoaded);
            console.log('Products data loaded:', window.products);
            
            // Render products and cart
            addDataToHTML();
            addCartToHTML();
            
            // Update auth UI if the function exists
            if (typeof updateAuthUI === 'function') {
                updateAuthUI();
            }
        }
    }, 100); // Check every 100ms
    
    // Timeout after 5 seconds if products never load
    setTimeout(() => {
        clearInterval(checkProductsLoaded);
        if (window.products === undefined) {
            console.error('Products data failed to load after 5 seconds');
            if (listProductHTML) {
                listProductHTML.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #d9534f;">
                        <h3>Error Loading Products</h3>
                        <p>Please refresh the page or check your connection.</p>
                    </div>
                `;
            }
        }
    }, 5000);
}

// Make functions globally available
window.addCart = addCart;
window.changeQuantity = changeQuantity;
window.initApp = initApp;

// Initialize the app when script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing app...');
    initApp();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('DOM already ready, initializing app immediately...');
    initApp();
}