// === App State ===
let currentUser = null;
let authToken = localStorage.getItem('token');
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let products = [];
let categories = [];

// === API Configuration ===
const API_URL = 'http://localhost:3000/api';

// === DOM Elements ===
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const userNameDisplay = document.getElementById('userNameDisplay');
const cartBadge = document.querySelector('.cart-badge');
const favoritesBadge = document.querySelector('.favorites-badge');
const productList = document.getElementById('productList');
const categoryList = document.getElementById('categoryList');
const searchInput = document.querySelector('.search-box input');

// === Bootstrap Modals ===
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));

// === Event Listeners ===
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

// === Initialization Functions ===
function initializeApp() {
    checkAuth();
    updateUI();
    updateCartBadge();
    updateFavoritesBadge();
}

function setupEventListeners() {
    // Auth buttons
    if (loginBtn) loginBtn.addEventListener('click', () => loginModal.show());
    if (registerBtn) registerBtn.addEventListener('click', () => registerModal.show());
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const productForm = document.getElementById('productForm');
    const categoryForm = document.getElementById('categoryForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

async function loadInitialData() {
    try {
        await Promise.all([
            loadProducts(),
            loadCategories()
        ]);
    } catch (error) {
        showToast('Veriler yüklenirken bir hata oluştu', 'error');
    }
}

// === Authentication Functions ===
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUI();
            loginModal.hide();
            showToast('Giriş başarılı!', 'success');
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Giriş yapılırken bir hata oluştu', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
            registerModal.hide();
            loginModal.show();
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Kayıt olurken bir hata oluştu', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    authToken = null;
    updateUI();
    showToast('Çıkış yapıldı', 'info');
}

// === Product Management Functions ===
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            products = await response.json();
            renderProducts();
        } else {
            throw new Error('Ürünler yüklenemedi');
        }
    } catch (error) {
        showToast('Ürünler yüklenirken bir hata oluştu', 'error');
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Lütfen önce giriş yapın', 'warning');
        return;
    }
    
    const formData = new FormData(e.target);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        category_id: parseInt(formData.get('category')),
        image: formData.get('image')
    };
    
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            showToast('Ürün başarıyla eklendi', 'success');
            productModal.hide();
            loadProducts();
        } else {
            const data = await response.json();
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Ürün eklenirken bir hata oluştu', 'error');
    }
}

// === Category Management Functions ===
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            categories = await response.json();
            renderCategories();
        } else {
            throw new Error('Kategoriler yüklenemedi');
        }
    } catch (error) {
        showToast('Kategoriler yüklenirken bir hata oluştu', 'error');
    }
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Lütfen önce giriş yapın', 'warning');
        return;
    }
    
    const formData = new FormData(e.target);
    const categoryData = {
        name: formData.get('name'),
        description: formData.get('description')
    };
    
    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
            showToast('Kategori başarıyla eklendi', 'success');
            categoryModal.hide();
            loadCategories();
        } else {
            const data = await response.json();
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Kategori eklenirken bir hata oluştu', 'error');
    }
}

// === Cart Functions ===
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showToast('Stok miktarı yetersiz!', 'warning');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartBadge();
    showToast('Ürün sepete eklendi', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    showToast('Ürün sepetten çıkarıldı', 'info');
}

function updateCartQuantity(productId, quantity) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        const product = products.find(p => p.id === productId);
        if (quantity <= product.stock) {
            cartItem.quantity = quantity;
            saveCart();
            updateCartBadge();
        } else {
            showToast('Stok miktarı yetersiz!', 'warning');
        }
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartBadge() {
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    }
}

// === Favorites Functions ===
function toggleFavorite(product) {
    const index = favorites.findIndex(item => item.id === product.id);
    
    if (index === -1) {
        favorites.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        });
        showToast('Ürün favorilere eklendi', 'success');
    } else {
        favorites.splice(index, 1);
        showToast('Ürün favorilerden çıkarıldı', 'info');
    }
    
    saveFavorites();
    updateFavoritesBadge();
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function updateFavoritesBadge() {
    if (favoritesBadge) {
        favoritesBadge.textContent = favorites.length;
    }
}

// === Search Function ===
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        const name = product.querySelector('.product-title').textContent.toLowerCase();
        const description = product.querySelector('.product-description').textContent.toLowerCase();
        const category = product.querySelector('.product-category').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || 
            description.includes(searchTerm) || 
            category.includes(searchTerm)) {
            product.style.display = '';
        } else {
            product.style.display = 'none';
        }
    });
}

// === UI Update Functions ===
function updateUI() {
    if (currentUser) {
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userNameDisplay.textContent = currentUser.name;
    } else {
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

function renderProducts() {
    if (!productList) return;
    
    productList.innerHTML = products.map(product => `
        <div class="col-md-4 mb-4">
            <div class="product-card">
                <img src="${product.image}" class="product-image" alt="${product.name}">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-category">${product.category_name}</div>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-stock">Stok: ${product.stock}</div>
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="addToCart(${JSON.stringify(product)})">
                            <i class="fas fa-cart-plus"></i> Sepete Ekle
                        </button>
                        <button class="btn btn-outline-warning" onclick="toggleFavorite(${JSON.stringify(product)})">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategories() {
    if (!categoryList) return;
    
    categoryList.innerHTML = categories.map(category => `
        <div class="col-md-3 mb-3">
            <div class="category-card">
                <h4>${category.name}</h4>
                <p>${category.description || ''}</p>
                <div class="category-actions">
                    <button class="btn btn-sm btn-primary" onclick="filterByCategory(${category.id})">
                        Ürünleri Göster
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// === Utility Functions ===
function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
}

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

function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// === Export Functions ===
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleFavorite = toggleFavorite;
window.formatCurrency = formatCurrency;
window.showToast = showToast; 