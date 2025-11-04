// Cart functionality with localStorage persistence
let cart = JSON.parse(localStorage.getItem('villagecraft_cart')) || [];

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    updateCartModal();
    initialize3DEffects();
});

function addToCart(productName, price, image) {
    // Check if item already exists in cart
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            name: productName, 
            price: price, 
            image: image,
            quantity: 1 
        });
    }
    
    // Save to localStorage
    localStorage.setItem('villagecraft_cart', JSON.stringify(cart));
    
    // Update UI
    updateCartCount();
    updateCartModal();
    
    // Show notification
    showNotification(`${productName} added to cart!`);
    
    console.log('Cart contents:', cart);
}

function removeFromCart(productName) {
    cart = cart.filter(item => item.name !== productName);
    localStorage.setItem('villagecraft_cart', JSON.stringify(cart));
    updateCartCount();
    updateCartModal();
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function updateCartModal() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        if (cartTotal) cartTotal.textContent = '$0';
        return;
    }
    
    let itemsHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        itemsHTML += `
            <div class="cart-item">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <div class="item-price">$${item.price} x ${item.quantity}</div>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        total += item.price * item.quantity;
    });
    
    cartItems.innerHTML = itemsHTML;
    if (cartTotal) cartTotal.textContent = `$${total}`;
}

function showNotification(message) {
    const notification = document.getElementById('cartNotification');
    const notificationText = document.getElementById('notificationText');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    window.location.href = 'checkout.html';
}

// 3D Image Effects
function initialize3DEffects() {
    document.querySelectorAll('.product-image-container').forEach(container => {
        container.addEventListener('mousemove', (e) => {
            const image = container.querySelector('.product-image');
            const containerRect = container.getBoundingClientRect();
            
            // Calculate mouse position relative to container center
            const centerX = containerRect.left + containerRect.width / 2;
            const centerY = containerRect.top + containerRect.height / 2;
            
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            // Calculate rotation based on mouse position
            const rotateY = (mouseX / (containerRect.width / 2)) * 10;
            const rotateX = -(mouseY / (containerRect.height / 2)) * 10;
            
            // Apply transformation
            image.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(20px) scale(1.05)`;
        });
        
        container.addEventListener('mouseleave', () => {
            const image = container.querySelector('.product-image');
            // Smoothly return to original position
            image.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0) scale(1)';
        });
    });
}

// Cart modal functionality
const cartIcon = document.getElementById('cartIcon');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');

if (cartIcon && cartModal && closeCart) {
    cartIcon.addEventListener('click', () => {
        cartModal.classList.add('open');
    });
    
    closeCart.addEventListener('click', () => {
        cartModal.classList.remove('open');
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        if (cartModal.classList.contains('open') && 
            !cartModal.contains(e.target) && 
            !cartIcon.contains(e.target)) {
            cartModal.classList.remove('open');
        }
    });
}