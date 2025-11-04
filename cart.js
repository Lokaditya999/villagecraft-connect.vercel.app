// Universal Cart Functionality - Include this on all pages
class UniversalCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('vcc_cart')) || [];
        this.init();
    }

    init() {
        this.setupCartModal();
        this.updateCartCount();
        this.loadCartStyles();
        this.setupLoginCheck();
    }

    loadCartStyles() {
        // Inject cart styles if not already present
        if (!document.getElementById('cart-styles')) {
            const styles = `
                /* Cart Modal Styles */
                .cart-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 400px;
                    height: 100vh;
                    background: white;
                    box-shadow: -5px 0 15px rgba(0,0,0,0.1);
                    z-index: 2000;
                    flex-direction: column;
                }

                .cart-modal.open {
                    display: flex;
                }

                .cart-header {
                    background: #49d8b9;
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .cart-header h3 {
                    margin: 0;
                    color: white;
                }

                .close-cart {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                }

                .cart-items {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                }

                .cart-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 0;
                    border-bottom: 1px solid #eee;
                }

                .cart-item:last-child {
                    border-bottom: none;
                }

                .item-details h4 {
                    margin: 0 0 5px 0;
                    color: #333;
                }

                .item-price {
                    color: #49d8b9;
                    font-weight: bold;
                }

                .remove-item {
                    background: none;
                    border: none;
                    color: #e74c3c;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .cart-footer {
                    padding: 20px;
                    border-top: 1px solid #eee;
                }

                .cart-total {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: #333;
                }

                .checkout-btn {
                    background: #49d8b9;
                    color: white;
                    border: none;
                    padding: 12px;
                    width: 100%;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.3s;
                }

                .checkout-btn:hover {
                    background: #3bc4a7;
                }

                .empty-cart {
                    text-align: center;
                    padding: 40px 20px;
                    color: #888;
                }

                .empty-cart i {
                    font-size: 3rem;
                    margin-bottom: 15px;
                    opacity: 0.3;
                }

                /* Cart Icon Styles */
                .cart-icon {
                    position: relative;
                    cursor: pointer;
                }

                .cart-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    font-size: 0.7rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }

                /* Login Required Overlay */
                .login-required-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255,255,255,0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                }

                .login-required-overlay i {
                    font-size: 2rem;
                    color: #49d8b9;
                    margin-bottom: 10px;
                }

                .login-required-overlay p {
                    margin-bottom: 15px;
                    color: #666;
                }

                @media (max-width: 768px) {
                    .cart-modal {
                        width: 100%;
                    }
                }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.id = 'cart-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    setupCartModal() {
        // Create cart modal HTML if not exists
        if (!document.getElementById('cartModal')) {
            const cartModalHTML = `
                <div class="cart-modal" id="cartModal">
                    <div class="cart-header">
                        <h3>Your Cart</h3>
                        <button class="close-cart" id="closeCart"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="cart-items" id="cartItems">
                        <div class="empty-cart">
                            <i class="fas fa-shopping-cart"></i>
                            <p>Your cart is empty</p>
                        </div>
                    </div>
                    <div class="cart-footer">
                        <div class="cart-total">
                            <span>Total:</span>
                            <span id="cartTotal">R0</span>
                        </div>
                        <button class="checkout-btn" onclick="universalCart.proceedToCheckout()">Proceed to Checkout</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', cartModalHTML);
        }

        // Setup event listeners
        const cartIcon = document.getElementById('cartIcon');
        const cartModal = document.getElementById('cartModal');
        const closeCart = document.getElementById('closeCart');

        if (cartIcon) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => {
                this.closeCart();
            });
        }

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (cartModal && cartModal.classList.contains('open') && 
                !cartModal.contains(e.target) && 
                !(cartIcon && cartIcon.contains(e.target))) {
                this.closeCart();
            }
        });
    }

    setupLoginCheck() {
        // Check login status and update UI
        this.updateLoginUI();
        
        // Listen for storage changes (for when user logs in/out in another tab)
        window.addEventListener('storage', (e) => {
            if (e.key === 'vcc_isLoggedIn') {
                this.updateLoginUI();
                this.updateCartCount();
                this.updateCartModal();
            }
        });
    }

    updateLoginUI() {
        const isLoggedIn = this.isUserLoggedIn();
        const loginBtn = document.querySelector('.btn-secondary');
        
        if (loginBtn) {
            if (isLoggedIn) {
                const userName = localStorage.getItem('vcc_userName') || 'User';
                loginBtn.textContent = `Welcome, ${userName}`;
                loginBtn.style.background = '#49d8b9';
                loginBtn.onclick = () => {
                    this.logout();
                };
            } else {
                loginBtn.textContent = 'Login';
                loginBtn.style.background = '#222';
                loginBtn.onclick = () => {
                    openModal('login');
                };
            }
        }
    }

    isUserLoggedIn() {
        return localStorage.getItem('vcc_isLoggedIn') === 'true';
    }

    addToCart(productName, price, image) {
        // Check if user is logged in
        if (!this.isUserLoggedIn()) {
            this.showLoginRequired();
            return false;
        }

        // Check if item already exists in cart
        const existingItem = this.cart.find(item => item.name === productName);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({ 
                name: productName, 
                price: price, 
                image: image,
                quantity: 1 
            });
        }
        
        // Save to localStorage with user-specific key
        this.saveCartToStorage();
        
        // Update UI
        this.updateCartCount();
        this.updateCartModal();
        
        // Show notification
        this.showNotification(`${productName} added to cart!`);
        
        console.log('Cart contents:', this.cart);
        return true;
    }

    removeFromCart(productName) {
        this.cart = this.cart.filter(item => item.name !== productName);
        this.saveCartToStorage();
        this.updateCartCount();
        this.updateCartModal();
    }

    saveCartToStorage() {
        // Save cart to localStorage with user-specific key
        const userId = localStorage.getItem('vcc_userEmail') || 'guest';
        const cartKey = `vcc_cart_${userId}`;
        localStorage.setItem(cartKey, JSON.stringify(this.cart));
        
        // Also save to general cart for backward compatibility
        localStorage.setItem('vcc_cart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        // Load cart from localStorage with user-specific key
        const userId = localStorage.getItem('vcc_userEmail') || 'guest';
        const cartKey = `vcc_cart_${userId}`;
        this.cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        
        // If no user-specific cart, try general cart
        if (this.cart.length === 0) {
            this.cart = JSON.parse(localStorage.getItem('vcc_cart')) || [];
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    updateCartModal() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems) return;
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = 'R0';
            return;
        }
        
        let itemsHTML = '';
        let total = 0;
        
        this.cart.forEach(item => {
            itemsHTML += `
                <div class="cart-item">
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <div class="item-price">R${item.price} x ${item.quantity}</div>
                    </div>
                    <button class="remove-item" onclick="universalCart.removeFromCart('${item.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            total += item.price * item.quantity;
        });
        
        cartItems.innerHTML = itemsHTML;
        if (cartTotal) cartTotal.textContent = `R${total}`;
    }

    openCart() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.add('open');
        }
    }

    closeCart() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.remove('open');
        }
    }

    showNotification(message) {
        // Create a simple notification
        alert(message);
    }

    showLoginRequired() {
        alert('Please login to add items to cart');
        if (typeof openModal === 'function') {
            openModal('login');
        }
    }

    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!');
            return;
        }

        // Check if user is logged in
        if (!this.isUserLoggedIn()) {
            this.showLoginRequired();
            return;
        }

        // Redirect to checkout page
        window.location.href = 'checkout.html';
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('vcc_isLoggedIn');
            localStorage.removeItem('vcc_userEmail');
            localStorage.removeItem('vcc_userName');
            localStorage.removeItem('vcc_userType');
            
            // Clear cart for logged out user
            this.cart = [];
            this.saveCartToStorage();
            
            this.updateLoginUI();
            this.updateCartCount();
            this.updateCartModal();
            
            alert('Logged out successfully!');
            location.reload();
        }
    }

    // Clear cart (useful after successful order)
    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartCount();
        this.updateCartModal();
    }

    // Initialize cart when user logs in
    initializeUserCart() {
        this.loadCartFromStorage();
        this.updateCartCount();
        this.updateCartModal();
    }
}

// Initialize universal cart
const universalCart = new UniversalCart();

// Export for global access
window.universalCart = universalCart;