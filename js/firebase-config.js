// Firebase Configuration and Initialization
// Replace these values with your actual Firebase project credentials

const firebaseConfig = {
    apiKey: "AIzaSyAqwMuKUC4UQRF9sLq6xBYtvoV3omsEvuM",
    authDomain: "booknest-19c32.firebaseapp.com",
    projectId: "booknest-19c32",
    storageBucket: "booknest-19c32.firebasestorage.app",
    messagingSenderId: "178115097881",
    appId: "1:178115097881:web:5bba1adea6ec0083e9c188"
};

// Initialize Firebase
let app, auth, db;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Auth state observer
let currentUser = null;

auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    
    if (user) {
        console.log('User logged in:', user.email);
        
        // Get user role from Firestore
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                currentUser.role = userDoc.data().role || 'customer';
            } else {
                // Create user document if it doesn't exist
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    role: 'customer',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                currentUser.role = 'customer';
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            currentUser.role = 'customer';
        }
        
        updateUIForAuthState(true);
    } else {
        console.log('User logged out');
        updateUIForAuthState(false);
    }
});

// Update UI based on auth state
function updateUIForAuthState(isLoggedIn) {
    const authButton = document.getElementById('auth-button');
    const cartIcon = document.getElementById('cart-icon');
    const adminLink = document.getElementById('admin-link');
    
    if (authButton) {
        if (isLoggedIn) {
            authButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>${currentUser.displayName || 'Account'}</span>
            `;
            authButton.onclick = () => showAccountMenu();
        } else {
            authButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                <span>Login</span>
            `;
            authButton.onclick = () => window.location.href = 'auth.html';
        }
    }
    
    // Show/hide admin link
    if (adminLink) {
        adminLink.style.display = (isLoggedIn && currentUser.role === 'admin') ? 'block' : 'none';
    }
    
    // Update cart count
    if (isLoggedIn && cartIcon) {
        updateCartCount();
    }
}

// Show account dropdown menu
function showAccountMenu() {
    const menu = document.createElement('div');
    menu.className = 'account-menu';
    menu.innerHTML = `
        <div class="account-menu-item" onclick="window.location.href='orders.html'">My Orders</div>
        ${currentUser.role === 'admin' ? '<div class="account-menu-item" onclick="window.location.href=\'admin.html\'">Admin Panel</div>' : ''}
        <div class="account-menu-item" onclick="handleLogout()">Logout</div>
    `;
    
    // Position menu below auth button
    const authButton = document.getElementById('auth-button');
    const rect = authButton.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 10}px`;
    menu.style.right = '20px';
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== authButton) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Logout handler
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
}

// Update cart count badge
async function updateCartCount() {
    if (!currentUser) return;
    
    try {
        const cartDoc = await db.collection('carts').doc(currentUser.uid).get();
        const cartBadge = document.getElementById('cart-count');
        
        if (cartDoc.exists && cartBadge) {
            const items = cartDoc.data().items || [];
            const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Helper: Check if user is admin
function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// Helper: Require authentication
function requireAuth() {
    if (!currentUser) {
        window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    return true;
}

// Helper: Require admin role
function requireAdmin() {
    if (!requireAuth()) return false;
    
    if (!isAdmin()) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}
