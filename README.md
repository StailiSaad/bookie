# Bookie - Online Bookstore

A fully functional e-commerce website for buying books online. Built with modern web technologies.

![Bookie](https://via.placeholder.com/800x400/2563EB/FFFFFF?text=Bookie)

## ⚠️ DEMO WEBSITE NOTICE

**This is a DEMO website for educational and demonstration purposes only.**

- ❌ NO real products will be delivered
- ❌ NO real payments are processed
- ❌ Do NOT enter real credit card information

The payment methods shown are for demonstration purposes only. We are not responsible for any unauthorized transactions.

## 🚀 Features

- 📚 Browse books from Google Books API
- 🔍 Search and filter books by category and price
- 👤 User authentication (Google Sign-In, Email/Password)
- 🛒 Shopping cart with localStorage
- 💳 Multiple payment options (Card, PayPal, Cash on Delivery)
- 📦 Order management system
- 👑 Admin dashboard for managing orders
- 📱 Fully responsive design
- ✨ Beautiful animations and modern UI

## 🛠️ Technologies Used

| Category | Technology |
|----------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Firebase (Auth, Firestore) |
| Database | Google Books API, localStorage |
| Hosting | Any static hosting (Netlify, Vercel, GitHub Pages) |

## 📁 Project Structure

```
ecommerce-website/
├── index.html              # Homepage
├── books.html              # Browse books page
├── book-detail.html        # Individual book page
├── cart.html              # Shopping cart
├── checkout.html          # Payment page
├── auth.html              # Login/Signup
├── admin.html             # Admin dashboard
├── order-success.html     # Order confirmation
├── css/
│   ├── styles.css         # Main styles
│   └── components.css     # Component styles
├── js/
│   ├── firebase-config.js # Firebase configuration
│   ├── auth.js            # Authentication
│   ├── cart.js            # Shopping cart
│   ├── books-api.js       # Google Books API
│   └── admin.js           # Admin panel
└── images/                # Image assets
```

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/booknest.git
cd booknest
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication**:
   - Email/Password
   - Google Sign-In
4. Enable **Cloud Firestore** Database
5. Copy your Firebase config

### 3. Update Firebase Configuration

Edit `js/firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    // ... other config
};
```

### 4. Run Locally

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000
```

Open http://localhost:8000 in your browser.

## 🎨 Design

- **Color Scheme**: Royal Blue (#2563EB) with Amber (#F59E0B) accents
- **Typography**: Inter (body) + Playfair Display (headings)
- **Animations**: Smooth transitions, hover effects, loading states

## 📋 Pages

| Page | Description |
|------|-------------|
| Home | Hero section, featured books, categories |
| Browse | Search, filter, sort books |
| Book Detail | Full description, add to cart |
| Cart | View items, update quantities |
| Checkout | Shipping info, payment selection |
| Auth | Login/Signup forms |
| Admin | Order management dashboard |

## 🔐 Setting Up Admin Access

1. Sign up/login with Google
2. Go to Firebase Console → Firestore Database
3. Find `users` collection
4. Find your user document
5. Edit and change `role` to `"admin"`
6. Refresh the page to access admin dashboard

## ⚡ API Reference

- **Google Books API**: https://developers.google.com/books/docs/v1/overview
- **Firebase**: https://firebase.google.com/docs

## 📄 License

MIT License - Feel free to use this project for learning and development.

## 👨‍💻 Author

Created for demonstration purposes.

---

**Note**: This is a demo project. Do not enter real payment information.
