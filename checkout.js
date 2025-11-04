// checkout.js - UPDATED VERSION

let listCart = [];

function checkCart(){
    const storedCart = localStorage.getItem('vcc_cart');
    if(storedCart){
        listCart = JSON.parse(storedCart);
    }
    if (!Array.isArray(listCart)) {
        listCart = [];
    }
}

function addCartToHTML(){
    let listCartHTML = document.querySelector('.returnCart .list');
    let totalQuantityHTML = document.querySelector('.totalQuantity');
    let totalPriceHTML = document.querySelector('.totalPrice');
    
    if (!listCartHTML || !totalQuantityHTML || !totalPriceHTML) return;
    
    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice = 0;
    
    const validCartItems = listCart.filter(product => product);

    if(validCartItems.length > 0){
        validCartItems.forEach(product => {
            let newCart = document.createElement('div');
            newCart.classList.add('item');
            newCart.innerHTML = 
                `<img src="${product.image || 'default-product.jpg'}" alt="${product.name}">
                <div class="info">
                    <div class="name">${product.name}</div>
                    <div class="price">$${product.price || 0}/1 product</div>
                </div>
                <div class="quantity">${product.quantity}</div>
                <div class="returnPrice">$${(product.price * product.quantity).toFixed(2)}</div>`;
            listCartHTML.appendChild(newCart);
            totalQuantity += product.quantity;
            totalPrice += (product.price * product.quantity);
        });
    } else {
        listCartHTML.innerHTML = '<p style="text-align: center; width: 100%; padding: 20px;">Your cart is empty.</p>';
    }
    
    totalQuantityHTML.innerText = totalQuantity;
    totalPriceHTML.innerText = '$' + totalPrice.toFixed(2);
}

// Initialize checkout
checkCart();
addCartToHTML();

// Add checkout button handler
document.addEventListener('DOMContentLoaded', function() {
    const checkoutBtn = document.querySelector('.buttonCheckout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (listCart.length === 0) {
                alert('Your cart is empty!');
                return;
            }
            
            const isLoggedIn = localStorage.getItem('vcc_isLoggedIn') === 'true';
            if (!isLoggedIn) {
                alert('Please log in to complete your purchase.');
                window.location.href = 'login.html';
                return;
            }
            
            alert('Order placed successfully! Thank you for your purchase.');
            
            // Clear cart after successful order
            listCart = [];
            localStorage.removeItem('vcc_cart');
            addCartToHTML();
        });
    }
});