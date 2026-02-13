# 🚀 BookNest Implementation Guide

## Current Status

### ✅ Completed Components

1. **Architecture & Planning**
   - Complete technical architecture documented in `plans/bookstore-plan.md`
   - Database schema designed for Firestore
   - Tech stack finalized (Firebase + Google Books API + Stripe)

2. **JavaScript Modules** (All in `js/` folder)
   - `firebase-config.js` - Firebase initialization & auth state management
   - `books-api.js` - Google Books API integration with search, filters, sorting
   - `cart.js` - Full shopping cart functionality with Firestore sync
   - `auth.js` - Complete authentication (login, signup, Google OAuth, password reset)
   - `admin.js` - Admin panel logic with order management
   - `checkout.js` - Stripe payment integration & order creation

3. **Styles** (All in `css/` folder)
   - `styles.css` - Complete design system with responsive breakpoints
   - `components.css` - All component styles (auth, cart, checkout, admin, modals)

4. **HTML Pages**
   - `index.html` - ✅ Home page with hero, featured books, categories
   - `auth.html` - ✅ Login/Signup page with Google OAuth
   - `books.html` - ✅ Browse page with search, filters, sorting

### 🔨 Pages to Create

The following pages need to be created. Use the templates below:

1. **book-detail.html** - Individual book page
2. **cart.html** - Shopping cart page
3. **checkout.html** - Checkout & payment page
4. **admin.html** - Admin dashboard
5. **order-success.html** - Order confirmation page

---

## 📄 Page Templates

### 1. book-detail.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Details | BookNest</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <!-- Copy header from books.html -->
    
    <div class="book-detail-container">
        <div class="book-detail-layout">
            <div>
                <img id="book-image" class="book-detail-image" src="" alt="">
            </div>
            <div class="book-detail-info">
                <h1 id="book-title"></h1>
                <p class="book-detail-author" id="book-author"></p>
                <div class="book-detail-price" id="book-price"></div>
                <p class="book-detail-description" id="book-description"></p>
                
                <div class="book-detail-meta" id="book-meta"></div>
                
                <div class="book-actions">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="changeQty(-1)">-</button>
                        <span class="quantity-value" id="quantity">1</span>
                        <button class="quantity-btn" onclick="changeQty(1)">+</button>
                    </div>
                    <button class="btn btn-primary btn-lg" onclick="addToCartFromDetail()">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Copy footer from books.html -->
    
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="js/firebase-config.js"></script>
    <script src="js/books-api.js"></script>
    <script src="js/cart.js"></script>
    
    <script>
        let currentBook = null;
        let quantity = 1;
        
        async function loadBookDetail() {
            const params = new URLSearchParams(window.location.search);
            const bookId = params.get('id');
            
            if (!bookId) {
                window.location.href = 'books.html';
                return;
            }
            
            currentBook = await getBookById(bookId);
            
            if (!currentBook) {
                alert('Book not found');
                window.location.href = 'books.html';
                return;
            }
            
            document.getElementById('book-image').src = currentBook.thumbnail;
            document.getElementById('book-title').textContent = currentBook.title;
            document.getElementById('book-author').textContent = 'by ' + currentBook.authors.join(', ');
            document.getElementById('book-price').textContent = formatPrice(currentBook.price);
            document.getElementById('book-description').textContent = currentBook.description;
            
            document.getElementById('book-meta').innerHTML = `
                <div class="meta-item"><span class="meta-label">Publisher</span><span class="meta-value">${currentBook.publisher}</span></div>
                <div class="meta-item"><span class="meta-label">Published</span><span class="meta-value">${currentBook.publishedDate}</span></div>
                <div class="meta-item"><span class="meta-label">Pages</span><span class="meta-value">${currentBook.pageCount}</span></div>
                <div class="meta-item"><span class="meta-label">Language</span><span class="meta-value">${currentBook.language.toUpperCase()}</span></div>
            `;
            
            document.title = currentBook.title + ' | BookNest';
        }
        
        function changeQty(delta) {
            quantity = Math.max(1, quantity + delta);
            document.getElementById('quantity').textContent = quantity;
        }
        
        async function addToCartFromDetail() {
            if (currentBook) {
                await addToCart(currentBook, quantity);
            }
        }
        
        document.addEventListener('DOMContentLoaded', loadBookDetail);
    </script>
</body>
</html>
```

### 2. cart.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopping Cart | BookNest</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <!-- Copy header from books.html -->
    
    <div class="cart-container">
        <h1>Shopping Cart</h1>
        
        <div class="cart-layout">
            <div id="cart-items"></div>
            <div id="cart-summary"></div>
        </div>
        
        <div id="empty-cart" class="empty-cart" style="display: none;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h2>Your cart is empty</h2>
            <p>Add some books to get started!</p>
            <a href="books.html" class="btn btn-primary">Browse Books</a>
        </div>
    </div>
    
    <!-- Copy footer from books.html -->
    
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="js/firebase-config.js"></script>
    <script src="js/books-api.js"></script>
    <script src="js/cart.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (!currentUser) {
                setTimeout(() => {
                    if (!currentUser) {
                        window.location.href = 'auth.html?redirect=cart.html';
                    }
                }, 1000);
            } else {
                renderCartPage();
            }
        });
    </script>
</body>
</html>
```

### 3. checkout.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout | BookNest</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <!-- Copy header from books.html -->
    
    <div class="checkout-container">
        <h1>Checkout</h1>
        
        <div class="checkout-layout">
            <div>
                <div class="checkout-section">
                    <h2>Shipping Information</h2>
                    <form id="checkout-form">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" class="form-input" id="name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" id="email" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Address</label>
                            <input type="text" class="form-input" id="address" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">City</label>
                            <input type="text" class="form-input" id="city" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">State</label>
                            <input type="text" class="form-input" id="state" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">ZIP Code</label>
                            <input type="text" class="form-input" id="zip" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Country</label>
                            <input type="text" class="form-input" id="country" value="US" required>
                        </div>
                        
                        <h2 style="margin-top: 32px;">Payment Information</h2>
                        <div id="card-element"></div>
                        <div id="card-errors" class="form-error"></div>
                        <div id="payment-error" class="form-error"></div>
                        
                        <button type="submit" class="btn btn-primary btn-block btn-lg" id="submit-payment">
                            Place Order
                        </button>
                    </form>
                </div>
            </div>
            
            <div id="order-summary" class="order-summary"></div>
        </div>
    </div>
    
    <!-- Copy footer from books.html -->
    
    <script src="https://js.stripe.com/v3/"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="js/firebase-config.js"></script>
    <script src="js/books-api.js"></script>
    <script src="js/cart.js"></script>
    <script src="js/checkout.js"></script>
</body>
</html>
```

### 4. admin.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel | BookNest</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <!-- Copy header from books.html -->
    
    <div class="admin-container">
        <div class="admin-header">
            <h1>Admin Dashboard</h1>
            <p>Manage orders and view statistics</p>
        </div>
        
        <div id="dashboard-stats"></div>
        
        <div class="orders-section">
            <div class="orders-header">
                <h2>Orders</h2>
                <div class="filter-buttons">
                    <button class="filter-btn active" data-status="all">All</button>
                    <button class="filter-btn" data-status="pending">Pending</button>
                    <button class="filter-btn" data-status="confirmed">Confirmed</button>
                    <button class="filter-btn" data-status="shipped">Shipped</button>
                    <button class="filter-btn" data-status="delivered">Delivered</button>
                </div>
            </div>
            
            <div style="margin: 20px 0;">
                <input type="text" class="form-input" id="order-search" placeholder="Search by order ID or customer email...">
            </div>
            
            <div id="orders-table"></div>
        </div>
    </div>
    
    <!-- Copy footer from books.html -->
    
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
    <script src="js/firebase-config.js"></script>
    <script src="js/books-api.js"></script>
    <script src="js/admin.js"></script>
</body>
</html>
```

### 5. order-success.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed | BookNest</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body>
    <!-- Copy header from books.html -->
    
    <div class="cart-container">
        <div class="empty-cart">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h1>Order Confirmed!</h1>
            <p>Thank you for your purchase. Your order has been received and is being processed.</p>
            <p id="order-id" style="color: var(--text-secondary); margin: 16px 0;"></p>
            <div style="display: flex; gap: 16px; justify-content: center; margin-top: 32px;">
                <a href="books.html" class="btn btn-primary">Continue Shopping</a>
                <a href="index.html" class="btn btn-secondary">Back to Home</a>
            </div>
        </div>
    </div>
    
    <!-- Copy footer from books.html -->
    
    <script>
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get('orderId');
        if (orderId) {
            document.getElementById('order-id').textContent = `Order ID: ${orderId}`;
        }
    </script>
</body>
</html>
```

---

## 🔧 Quick Setup Checklist

### Step 1: Firebase Configuration
1. Create Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password + Google)
3. Enable Cloud Firestore
4. Copy config to `js/firebase-config.js`
5. Set Firestore security rules (see README.md)

### Step 2: Stripe Configuration
1. Create Stripe account at https://dashboard.stripe.com/
2. Get test publishable key
3. Update `js/checkout.js` with your key

### Step 3: Create Admin User
1. Sign up through the website
2. Go to Firebase Console > Firestore
3. Find your user in `users` collection
4. Change `role` from `"customer"` to `"admin"`

### Step 4: Test the Website
1. Run local server: `python -m http.server 8000`
2. Open http://localhost:8000
3. Test all features:
   - Sign up / Login
   - Search books
   - Add to cart
   - Checkout (use test card: 4242 4242 4242 4242)
   - View orders in admin panel

---

## 📝 Notes

- All JavaScript logic is already implemented in the `js/` folder
- All styles are complete in the `css/` folder
- Just create the HTML pages using the templates above
- Copy the header and footer from `books.html` to maintain consistency
- The Google Books API requires no API key for basic usage
- Stripe test mode uses card number 4242 4242 4242 4242

---

## 🎯 Next Steps

1. Create the 5 remaining HTML pages using templates above
2. Configure Firebase with your credentials
3. Configure Stripe with your test key
4. Create first admin user
5. Test all functionality
6. Deploy to Firebase Hosting or any static host

**Estimated time to complete**: 30-60 minutes

Good luck! 🚀
