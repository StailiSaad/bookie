// Google Books API Integration

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';
const MAX_RESULTS = 40;

// Book categories for filtering
const BOOK_CATEGORIES = [
    'Fiction',
    'Non-Fiction',
    'Science',
    'History',
    'Biography',
    'Business',
    'Self-Help',
    'Technology',
    'Art',
    'Cooking',
    'Travel',
    'Mystery',
    'Romance',
    'Fantasy',
    'Science Fiction'
];

// Search books by query
async function searchBooks(query, startIndex = 0) {
    try {
        const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=${MAX_RESULTS}&startIndex=${startIndex}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        
        const data = await response.json();
        return {
            books: data.items ? data.items.map(transformBookData) : [],
            totalItems: data.totalItems || 0
        };
    } catch (error) {
        console.error('Error searching books:', error);
        return { books: [], totalItems: 0 };
    }
}

// Get books by category
async function getBooksByCategory(category, startIndex = 0) {
    return searchBooks(`subject:${category}`, startIndex);
}

// Get book by ID
async function getBookById(bookId) {
    try {
        const url = `${GOOGLE_BOOKS_API}/${bookId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Book not found');
        }
        
        const data = await response.json();
        return transformBookData(data);
    } catch (error) {
        console.error('Error fetching book:', error);
        return null;
    }
}

// Get featured/bestseller books
async function getFeaturedBooks() {
    const queries = [
        'bestseller fiction',
        'bestseller non-fiction',
        'new releases'
    ];
    
    try {
        const results = await Promise.all(
            queries.map(query => searchBooks(query))
        );
        
        // Combine and shuffle results
        const allBooks = results.flatMap(r => r.books);
        return shuffleArray(allBooks).slice(0, 12);
    } catch (error) {
        console.error('Error fetching featured books:', error);
        return [];
    }
}

// Transform Google Books API data to our format
function transformBookData(item) {
    const volumeInfo = item.volumeInfo || {};
    const saleInfo = item.saleInfo || {};
    
    // Generate price if not available
    const price = saleInfo.listPrice?.amount || generatePrice(volumeInfo);
    
    return {
        id: item.id,
        title: volumeInfo.title || 'Unknown Title',
        authors: volumeInfo.authors || ['Unknown Author'],
        author: (volumeInfo.authors || ['Unknown Author'])[0],
        description: volumeInfo.description || 'No description available.',
        thumbnail: getThumbnail(volumeInfo),
        categories: volumeInfo.categories || ['General'],
        category: (volumeInfo.categories || ['General'])[0],
        publishedDate: volumeInfo.publishedDate || 'Unknown',
        publisher: volumeInfo.publisher || 'Unknown Publisher',
        pageCount: volumeInfo.pageCount || 0,
        language: volumeInfo.language || 'en',
        rating: volumeInfo.averageRating || 0,
        ratingsCount: volumeInfo.ratingsCount || 0,
        price: price,
        currency: saleInfo.listPrice?.currencyCode || 'USD',
        isbn: getISBN(volumeInfo),
        previewLink: volumeInfo.previewLink || '',
        infoLink: volumeInfo.infoLink || ''
    };
}

// Get best quality thumbnail
function getThumbnail(volumeInfo) {
    const imageLinks = volumeInfo.imageLinks;
    
    if (!imageLinks) {
        return 'https://placehold.co/400x600/2563EB/FFFFFF?text=No+Cover';
    }
    
    // Try to get the best available image
    let thumbnail = imageLinks.large || 
           imageLinks.medium || 
           imageLinks.thumbnail || 
           imageLinks.smallThumbnail;
    
    if (!thumbnail) {
        return 'https://placehold.co/400x600/2563EB/FFFFFF?text=No+Cover';
    }
    
    // Replace HTTP with HTTPS
    thumbnail = thumbnail.replace('http://', 'https://');
    
    // Fix Google Books image URL issues - replace zoom=1 with zoom=2 for better quality
    thumbnail = thumbnail.replace('zoom=1', 'zoom=2');
    
    // Remove edge-specific sizing that might break
    thumbnail = thumbnail.replace(/&edge=curl/g, '');
    
    return thumbnail;
}

// Get ISBN
function getISBN(volumeInfo) {
    const identifiers = volumeInfo.industryIdentifiers || [];
    const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
    const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
    return isbn13?.identifier || isbn10?.identifier || '';
}

// Generate deterministic price based on book properties
function generatePrice(volumeInfo) {
    const pageCount = volumeInfo.pageCount || 200;
    const categories = volumeInfo.categories || [];
    
    // Base price on page count
    let basePrice = 9.99;
    
    if (pageCount > 500) {
        basePrice = 24.99;
    } else if (pageCount > 300) {
        basePrice = 19.99;
    } else if (pageCount > 200) {
        basePrice = 14.99;
    }
    
    // Adjust for category
    const premiumCategories = ['Business', 'Technology', 'Science', 'Medical'];
    const isPremium = categories.some(cat => 
        premiumCategories.some(pc => cat.includes(pc))
    );
    
    if (isPremium) {
        basePrice *= 1.5;
    }
    
    // Round to .99
    return Math.floor(basePrice) + 0.99;
}

// Filter books by price range
function filterByPriceRange(books, minPrice, maxPrice) {
    return books.filter(book => 
        book.price >= minPrice && book.price <= maxPrice
    );
}

// Filter books by category
function filterByCategory(books, category) {
    if (!category || category === 'all') return books;
    
    return books.filter(book => 
        book.categories.some(cat => 
            cat.toLowerCase().includes(category.toLowerCase())
        )
    );
}

// Sort books
function sortBooks(books, sortBy) {
    const sorted = [...books];
    
    switch (sortBy) {
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'rating':
            return sorted.sort((a, b) => b.rating - a.rating);
        case 'newest':
            return sorted.sort((a, b) => 
                new Date(b.publishedDate) - new Date(a.publishedDate)
            );
        case 'title':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        default:
            return sorted;
    }
}

// Utility: Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Format price for display
function formatPrice(price, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(price);
}

// Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}
