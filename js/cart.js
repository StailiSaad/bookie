// Shopping Cart Functionality with localStorage + Firestore backup

const CART_STORAGE_KEY = 'bookie_cart';

// Get cart from localStorage (works immediately)
function getLocalCart() {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : { items: [] };
}

// Save cart to localStorage
function saveLocalCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCountDisplay();
}

// Add item to cart (works offline)
function addToCart(book, quantity = 1) {
    const cart = getLocalCart();
    const existingIndex = cart.items.findIndex(item => item.id === book.id);
    
    if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
    } else {
        cart.items.push({
            id: book.id,
            bookId: book.id,
            title: book.title,
            author: book.author,
            authors: book.authors,
            thumbnail: book.thumbnail,
            price: book.price,
            currency: book.currency || 'USD',
            quantity: quantity
        });
    }
    
    saveLocalCart(cart);
    showCartNotification(book.title);
    return true;
}

// Remove item from cart
function removeFromCart(bookId) {
    const cart = getLocalCart();
    cart.items = cart.items.filter(item => item.id !== bookId && item.bookId !== bookId);
    saveLocalCart(cart);
    return true;
}

// Update item quantity
function updateCartQuantity(bookId, newQuantity) {
    const cart = getLocalCart();
    const itemIndex = cart.items.findIndex(item => item.id === bookId || item.bookId === bookId);
    
    if (itemIndex >= 0) {
        if (newQuantity <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = newQuantity;
        }
    }
    
    saveLocalCart(cart);
    return true;
}

// Get cart items
function getCart() {
    return getLocalCart();
}

// Get cart items (alias)
function getCartItems() {
    return getLocalCart().items;
}

// Calculate cart total
function calculateCartTotal(items) {
    return items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Clear cart
function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartCountDisplay();
}

// Get cart count
function getCartCount() {
    const cart = getLocalCart();
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

// Update cart count display
function updateCartCountDisplay() {
    const count = getCartCount();
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = count;
        cartBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Show cart notification
function showCartNotification(bookTitle) {
    // Remove existing notifications
    const existing = document.querySelector('.cart-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Added "${truncateText(bookTitle, 30)}" to cart</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCountDisplay();
});
