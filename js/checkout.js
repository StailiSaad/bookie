// Checkout and Payment Logic

// Stripe publishable key (replace with your actual key)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY';

let stripe, elements, cardElement;

// Initialize Stripe
function initStripe() {
    try {
        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        elements = stripe.elements();
        
        // Create card element
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#111827',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    '::placeholder': {
                        color: '#9CA3AF'
                    }
                },
                invalid: {
                    color: '#EF4444'
                }
            }
        });
        
        // Mount card element
        const cardElementContainer = document.getElementById('card-element');
        if (cardElementContainer) {
            cardElement.mount('#card-element');
            
            // Handle real-time validation errors
            cardElement.on('change', (event) => {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });
        }
    } catch (error) {
        console.error('Stripe initialization error:', error);
    }
}

// Initialize checkout page
async function initCheckoutPage() {
    if (!requireAuth()) return;
    
    // Initialize Stripe
    initStripe();
    
    // Load order summary
    await loadOrderSummary();
    
    // Set up form submission
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

// Load order summary
async function loadOrderSummary() {
    const summaryContainer = document.getElementById('order-summary');
    if (!summaryContainer) return;
    
    const items = await getCartItems();
    
    if (items.length === 0) {
        summaryContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        document.getElementById('checkout-form')?.remove();
        return;
    }
    
    const subtotal = calculateCartTotal(items);
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + shipping;
    
    summaryContainer.innerHTML = `
        <h2>Order Summary</h2>
        <div class="summary-items">
            ${items.map(item => `
                <div class="summary-item">
                    <img src="${item.thumbnail}" alt="${item.title}">
                    <div class="summary-item-info">
                        <h4>${truncateText(item.title, 40)}</h4>
                        <p>${item.author}</p>
                        <p>Qty: ${item.quantity}</p>
                    </div>
                    <div class="summary-item-price">
                        ${formatPrice(item.price * item.quantity)}
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="summary-totals">
            <div class="summary-row">
                <span>Subtotal</span>
                <span>${formatPrice(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
            </div>
            <div class="summary-row summary-total">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
            </div>
        </div>
    `;
}

// Handle checkout form submission
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    const errorElement = document.getElementById('payment-error');
    
    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    errorElement.textContent = '';
    
    try {
        // Get form data
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            state: document.getElementById('state').value.trim(),
            zip: document.getElementById('zip').value.trim(),
            country: document.getElementById('country').value.trim()
        };
        
        // Validate form
        if (!validateCheckoutForm(formData)) {
            throw new Error('Please fill in all required fields');
        }
        
        // Get cart items
        const items = await getCartItems();
        if (items.length === 0) {
            throw new Error('Your cart is empty');
        }
        
        const subtotal = calculateCartTotal(items);
        const shipping = subtotal > 50 ? 0 : 5.99;
        const total = subtotal + shipping;
        
        // Create payment method with Stripe
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: formData.name,
                email: formData.email,
                address: {
                    line1: formData.address,
                    city: formData.city,
                    state: formData.state,
                    postal_code: formData.zip,
                    country: formData.country
                }
            }
        });
        
        if (error) {
            throw new Error(error.message);
        }
        
        // Create order in Firestore
        const orderId = await createOrder({
            items: items,
            totalAmount: total,
            shippingAddress: formData,
            paymentMethodId: paymentMethod.id
        });
        
        // Clear cart
        await clearCart();
        
        // Redirect to success page
        window.location.href = `order-success.html?orderId=${orderId}`;
        
    } catch (error) {
        console.error('Checkout error:', error);
        errorElement.textContent = error.message;
        submitButton.disabled = false;
        submitButton.textContent = 'Place Order';
    }
}

// Validate checkout form
function validateCheckoutForm(formData) {
    const required = ['name', 'email', 'address', 'city', 'state', 'zip', 'country'];
    
    for (const field of required) {
        if (!formData[field]) {
            return false;
        }
    }
    
    // Validate email
    if (!validateEmail(formData.email)) {
        return false;
    }
    
    return true;
}

// Create order in Firestore
async function createOrder(orderData) {
    try {
        const orderRef = await db.collection('orders').add({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            items: orderData.items,
            totalAmount: orderData.totalAmount,
            shippingAddress: orderData.shippingAddress,
            paymentMethodId: orderData.paymentMethodId,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return orderRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        throw new Error('Failed to create order. Please try again.');
    }
}

// Load user's orders
async function loadUserOrders() {
    if (!currentUser) return [];
    
    try {
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        return ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading orders:', error);
        return [];
    }
}

// Render user orders page
async function renderUserOrdersPage() {
    if (!requireAuth()) return;
    
    const ordersContainer = document.getElementById('user-orders');
    if (!ordersContainer) return;
    
    ordersContainer.innerHTML = '<div class="loading">Loading your orders...</div>';
    
    const orders = await loadUserOrders();
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-orders">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h2>No orders yet</h2>
                <p>Start shopping to see your orders here</p>
                <a href="books.html" class="btn btn-primary">Browse Books</a>
            </div>
        `;
        return;
    }
    
    ordersContainer.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h3>Order #${order.id.substring(0, 8)}</h3>
                    <p class="order-date">${order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                </div>
                <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
            <div class="order-items">
                ${order.items.slice(0, 3).map(item => `
                    <div class="order-item-mini">
                        <img src="${item.thumbnail}" alt="${item.title}">
                        <div>
                            <p class="item-title">${truncateText(item.title, 30)}</p>
                            <p class="item-qty">Qty: ${item.quantity}</p>
                        </div>
                    </div>
                `).join('')}
                ${order.items.length > 3 ? `<p class="more-items">+${order.items.length - 3} more items</p>` : ''}
            </div>
            <div class="order-footer">
                <div class="order-total">
                    <span>Total:</span>
                    <strong>${formatPrice(order.totalAmount)}</strong>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="viewOrderDetails('${order.id}')">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('checkout-form')) {
            initCheckoutPage();
        } else if (document.getElementById('user-orders')) {
            renderUserOrdersPage();
        }
    });
} else {
    if (document.getElementById('checkout-form')) {
        initCheckoutPage();
    } else if (document.getElementById('user-orders')) {
        renderUserOrdersPage();
    }
}
