// Admin Panel Logic

// Initialize admin panel
async function initAdminPanel() {
    // Check admin access
    if (!requireAdmin()) return;
    
    // Load dashboard stats
    await loadDashboardStats();
    
    // Load orders
    await loadOrders();
    
    // Set up event listeners
    setupAdminEventListeners();
}

// Load dashboard statistics
async function loadDashboardStats() {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer) return;
    
    try {
        const ordersSnapshot = await db.collection('orders').get();
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Calculate stats
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const shippedOrders = orders.filter(o => o.status === 'shipped').length;
        const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        
        // Render stats
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="background: #EFF6FF; color: #2563EB;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </div>
                <div class="stat-content">
                    <h3>${totalOrders}</h3>
                    <p>Total Orders</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: #FEF3C7; color: #F59E0B;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <div class="stat-content">
                    <h3>${pendingOrders}</h3>
                    <p>Pending Orders</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: #DBEAFE; color: #3B82F6;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                </div>
                <div class="stat-content">
                    <h3>${shippedOrders}</h3>
                    <p>Shipped Orders</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: #D1FAE5; color: #10B981;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <div class="stat-content">
                    <h3>${deliveredOrders}</h3>
                    <p>Delivered</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="background: #F3E8FF; color: #A855F7;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                </div>
                <div class="stat-content">
                    <h3>${formatPrice(totalRevenue)}</h3>
                    <p>Total Revenue</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        statsContainer.innerHTML = '<p class="error">Failed to load statistics</p>';
    }
}

// Load orders table
async function loadOrders(statusFilter = 'all') {
    const ordersContainer = document.getElementById('orders-table');
    if (!ordersContainer) return;
    
    // Show loading
    ordersContainer.innerHTML = '<div class="loading">Loading orders...</div>';
    
    try {
        let query = db.collection('orders').orderBy('createdAt', 'desc');
        
        if (statusFilter !== 'all') {
            query = query.where('status', '==', statusFilter);
        }
        
        const ordersSnapshot = await query.get();
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p class="no-orders">No orders found</p>';
            return;
        }
        
        // Render orders table
        ordersContainer.innerHTML = `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => renderOrderRow(order)).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = '<p class="error">Failed to load orders</p>';
    }
}

// Render single order row
function renderOrderRow(order) {
    const statusColors = {
        pending: '#F59E0B',
        confirmed: '#3B82F6',
        shipped: '#8B5CF6',
        delivered: '#10B981'
    };
    
    const statusColor = statusColors[order.status] || '#6B7280';
    const date = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A';
    const itemCount = order.items ? order.items.length : 0;
    
    return `
        <tr>
            <td><strong>${order.id.substring(0, 8)}</strong></td>
            <td>${order.userEmail || 'Unknown'}</td>
            <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
            <td><strong>${formatPrice(order.totalAmount || 0)}</strong></td>
            <td>
                <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor};">
                    ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
            </td>
            <td>${date}</td>
            <td>
                <button class="btn-icon" onclick="viewOrderDetails('${order.id}')" title="View Details">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                ${order.status !== 'delivered' ? `
                    <button class="btn-icon" onclick="updateOrderStatus('${order.id}', '${getNextStatus(order.status)}')" title="Update Status">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </button>
                ` : ''}
            </td>
        </tr>
    `;
}

// Get next status in workflow
function getNextStatus(currentStatus) {
    const statusFlow = {
        pending: 'confirmed',
        confirmed: 'shipped',
        shipped: 'delivered',
        delivered: 'delivered'
    };
    return statusFlow[currentStatus] || currentStatus;
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        
        if (!orderDoc.exists) {
            alert('Order not found');
            return;
        }
        
        const order = { id: orderDoc.id, ...orderDoc.data() };
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Order Details</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="order-detail-section">
                        <h3>Order Information</h3>
                        <p><strong>Order ID:</strong> ${order.id}</p>
                        <p><strong>Customer:</strong> ${order.userEmail || 'Unknown'}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
                        <p><strong>Total:</strong> ${formatPrice(order.totalAmount || 0)}</p>
                    </div>
                    
                    ${order.shippingAddress ? `
                        <div class="order-detail-section">
                            <h3>Shipping Address</h3>
                            <p>${order.shippingAddress.name || ''}</p>
                            <p>${order.shippingAddress.address || ''}</p>
                            <p>${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zip || ''}</p>
                            <p>${order.shippingAddress.country || ''}</p>
                        </div>
                    ` : ''}
                    
                    <div class="order-detail-section">
                        <h3>Items (${order.items ? order.items.length : 0})</h3>
                        <div class="order-items-list">
                            ${order.items ? order.items.map(item => `
                                <div class="order-item">
                                    <img src="${item.thumbnail}" alt="${item.title}">
                                    <div class="order-item-info">
                                        <h4>${item.title}</h4>
                                        <p>${item.author}</p>
                                        <p>Quantity: ${item.quantity} × ${formatPrice(item.price)}</p>
                                    </div>
                                </div>
                            `).join('') : '<p>No items</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    } catch (error) {
        console.error('Error viewing order details:', error);
        alert('Failed to load order details');
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    const statusNames = {
        confirmed: 'Confirm',
        shipped: 'Mark as Shipped',
        delivered: 'Mark as Delivered'
    };
    
    const action = statusNames[newStatus] || 'Update';
    
    if (!confirm(`${action} this order?`)) {
        return;
    }
    
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Reload orders and stats
        await loadOrders();
        await loadDashboardStats();
        
        alert('Order status updated successfully');
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status');
    }
}

// Set up event listeners
function setupAdminEventListeners() {
    // Status filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const status = btn.dataset.status;
            loadOrders(status);
        });
    });
    
    // Search orders
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchOrders, 300));
    }
}

// Search orders
async function searchOrders(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        loadOrders();
        return;
    }
    
    const ordersContainer = document.getElementById('orders-table');
    ordersContainer.innerHTML = '<div class="loading">Searching...</div>';
    
    try {
        const ordersSnapshot = await db.collection('orders').get();
        const orders = ordersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(order => 
                order.id.toLowerCase().includes(searchTerm) ||
                (order.userEmail && order.userEmail.toLowerCase().includes(searchTerm))
            );
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p class="no-orders">No orders found</p>';
            return;
        }
        
        ordersContainer.innerHTML = `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => renderOrderRow(order)).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error searching orders:', error);
        ordersContainer.innerHTML = '<p class="error">Search failed</p>';
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}
