// === App State ===
let currentUser = null;
let categories = [];
let stocks = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// === API Functions ===
const API_URL = 'http://localhost:8000/api';

// Authentication Functions
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function logout() {
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) throw new Error('Çıkış yapılırken bir hata oluştu');

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Category Functions
async function getCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        return [];
    }
}

async function createCategory(data) {
    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

async function updateCategory(id, data) {
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

async function deleteCategory(id) {
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// Stock Functions
async function getStocks() {
    try {
        const response = await fetch(`${API_URL}/stocks`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        return [];
    }
}

async function createStock(data) {
    try {
        const response = await fetch(`${API_URL}/stocks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

async function updateStock(id, data) {
    try {
        const response = await fetch(`${API_URL}/stocks/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

async function deleteStock(id) {
    try {
        const response = await fetch(`${API_URL}/stocks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

async function toggleFavorite(id) {
    try {
        const response = await fetch(`${API_URL}/stocks/${id}/favorite`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// Dashboard Functions
async function getDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        return {
            total_stocks: 0,
            total_categories: 0,
            low_stocks: 0,
            total_value: 0
        };
    }
}

// === UI Functions ===
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    
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
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');

    document.querySelector('.page-title').textContent = 
        document.querySelector(`[data-page="${page}"]`).textContent.trim();

    document.querySelector('.sidebar').classList.remove('active');
}

// === Category Management ===
async function loadCategories() {
    try {
        categories = await getCategories();
        const tbody = document.getElementById('categoriesTableBody');
        tbody.innerHTML = '';

        categories.forEach(category => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.description || '-'}</td>
                <td>${new Date(category.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editCategory(${category.id})">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteCategory(${category.id})">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showToast('Kategoriler yüklenirken bir hata oluştu', 'error');
    }
}

async function addCategory() {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const saveBtn = document.getElementById('saveCategoryBtn');

    form.reset();
    modal.classList.add('active');

    saveBtn.onclick = async () => {
        try {
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                description: formData.get('description')
            };

            await createCategory(data);
            modal.classList.remove('active');
            showToast('Kategori başarıyla eklendi', 'success');
            loadCategories();
        } catch (error) {
            showToast('Kategori eklenirken bir hata oluştu', 'error');
        }
    };
}

async function editCategory(id) {
    try {
        const category = categories.find(c => c.id === id);
        const modal = document.getElementById('categoryModal');
        const form = document.getElementById('categoryForm');
        const saveBtn = document.getElementById('saveCategoryBtn');

        form.name.value = category.name;
        form.description.value = category.description || '';

        modal.classList.add('active');

        saveBtn.onclick = async () => {
            try {
                const formData = new FormData(form);
                const data = {
                    name: formData.get('name'),
                    description: formData.get('description')
                };

                await updateCategory(id, data);
                modal.classList.remove('active');
                showToast('Kategori başarıyla güncellendi', 'success');
                loadCategories();
            } catch (error) {
                showToast('Kategori güncellenirken bir hata oluştu', 'error');
            }
        };
    } catch (error) {
        showToast('Kategori bilgileri yüklenirken bir hata oluştu', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
        await deleteCategory(id);
        showToast('Kategori başarıyla silindi', 'success');
        loadCategories();
    } catch (error) {
        showToast('Kategori silinirken bir hata oluştu', 'error');
    }
}

// === Stock Management ===
async function loadStocks() {
    try {
        stocks = await getStocks();
        const tbody = document.getElementById('stocksTableBody');
        tbody.innerHTML = '';

        stocks.forEach(stock => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <button class="btn btn-sm ${stock.is_favorite ? 'btn-warning' : 'btn-secondary'}" 
                            onclick="toggleFavorite(${stock.id})">
                        <span class="material-icons">${stock.is_favorite ? 'star' : 'star_border'}</span>
                    </button>
                </td>
                <td>${stock.id}</td>
                <td>${stock.name}</td>
                <td>${stock.category_name}</td>
                <td>${stock.quantity}</td>
                <td>${stock.unit}</td>
                <td>₺${stock.price}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="editStock(${stock.id})">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteStock(${stock.id})">
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showToast('Stoklar yüklenirken bir hata oluştu', 'error');
    }
}

async function addStock() {
    try {
        categories = await getCategories();
        const categorySelect = document.getElementById('stockCategory');
        categorySelect.innerHTML = categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');

        const modal = document.getElementById('stockModal');
        const form = document.getElementById('stockForm');
        const saveBtn = document.getElementById('saveStockBtn');

        form.reset();
        modal.classList.add('active');

        saveBtn.onclick = async () => {
            try {
                const formData = new FormData(form);
                const data = {
                    name: formData.get('name'),
                    category_id: formData.get('category'),
                    quantity: parseFloat(formData.get('quantity')),
                    unit: formData.get('unit'),
                    min_quantity: parseFloat(formData.get('minQuantity')),
                    price: parseFloat(formData.get('price')),
                    description: formData.get('description'),
                    is_favorite: formData.get('favorite') === 'on'
                };

                await createStock(data);
                modal.classList.remove('active');
                showToast('Stok başarıyla eklendi', 'success');
                loadStocks();
            } catch (error) {
                showToast('Stok eklenirken bir hata oluştu', 'error');
            }
        };
    } catch (error) {
        showToast('Kategoriler yüklenirken bir hata oluştu', 'error');
    }
}

async function editStock(id) {
    try {
        const [stock, categories] = await Promise.all([
            stocks.find(s => s.id === id),
            getCategories()
        ]);

        const modal = document.getElementById('stockModal');
        const form = document.getElementById('stockForm');
        const saveBtn = document.getElementById('saveStockBtn');

        const categorySelect = document.getElementById('stockCategory');
        categorySelect.innerHTML = categories.map(category => 
            `<option value="${category.id}" ${category.id === stock.category_id ? 'selected' : ''}>
                ${category.name}
            </option>`
        ).join('');

        form.name.value = stock.name;
        form.quantity.value = stock.quantity;
        form.unit.value = stock.unit;
        form.minQuantity.value = stock.min_quantity;
        form.price.value = stock.price;
        form.description.value = stock.description || '';
        form.favorite.checked = stock.is_favorite;

        modal.classList.add('active');

        saveBtn.onclick = async () => {
            try {
                const formData = new FormData(form);
                const data = {
                    name: formData.get('name'),
                    category_id: formData.get('category'),
                    quantity: parseFloat(formData.get('quantity')),
                    unit: formData.get('unit'),
                    min_quantity: parseFloat(formData.get('minQuantity')),
                    price: parseFloat(formData.get('price')),
                    description: formData.get('description'),
                    is_favorite: formData.get('favorite') === 'on'
                };

                await updateStock(id, data);
                modal.classList.remove('active');
                showToast('Stok başarıyla güncellendi', 'success');
                loadStocks();
            } catch (error) {
                showToast('Stok güncellenirken bir hata oluştu', 'error');
            }
        };
    } catch (error) {
        showToast('Stok bilgileri yüklenirken bir hata oluştu', 'error');
    }
}

async function deleteStock(id) {
    if (!confirm('Bu stok kaydını silmek istediğinizden emin misiniz?')) return;

    try {
        await deleteStock(id);
        showToast('Stok başarıyla silindi', 'success');
        loadStocks();
    } catch (error) {
        showToast('Stok silinirken bir hata oluştu', 'error');
    }
}

async function toggleFavorite(id) {
    try {
        await toggleFavorite(id);
        loadStocks();
    } catch (error) {
        showToast('Favori durumu güncellenirken bir hata oluştu', 'error');
    }
}

// === Dashboard Functions ===
async function loadDashboardStats() {
    try {
        const stats = await getDashboardStats();
        
        document.querySelector('.stat-value:nth-child(1)').textContent = stats.total_stocks;
        document.querySelector('.stat-value:nth-child(2)').textContent = stats.total_categories;
        document.querySelector('.stat-value:nth-child(3)').textContent = stats.low_stocks;
        document.querySelector('.stat-value:nth-child(4)').textContent = `₺${stats.total_value}`;
    } catch (error) {
        showToast('İstatistikler yüklenirken bir hata oluştu', 'error');
    }
}

// === Event Listeners ===
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token && window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
        return;
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            if (page === 'logout') {
                logout();
            } else {
                navigateTo(page);
            }
        });
    });

    // Mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // Modal close buttons
    document.querySelectorAll('.close-btn, [data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });

    // Load initial data
    if (document.getElementById('dashboard')) {
        loadDashboardStats();
    }
    if (document.getElementById('categoriesTableBody')) {
        loadCategories();
    }
    if (document.getElementById('stocksTableBody')) {
        loadStocks();
    }

    // Add buttons
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', addCategory);
    }

    const addStockBtn = document.getElementById('addStockBtn');
    if (addStockBtn) {
        addStockBtn.addEventListener('click', addStock);
    }

    // Check if sidebar state is stored
    const sidebarState = localStorage.getItem('sidebarState');
    if (sidebarState === 'collapsed') {
        document.querySelector('.sidebar').classList.remove('active');
        document.querySelector('.content').classList.add('expanded');
    }

    // Sidebar toggle
    const sidebarCollapse = document.getElementById('sidebarCollapse');
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
            document.querySelector('.content').classList.toggle('expanded');
            
            // Store sidebar state
            localStorage.setItem('sidebarState', 
                document.querySelector('.sidebar').classList.contains('active') ? 'expanded' : 'collapsed'
            );
        });
    }

    // Handle active menu items
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('#sidebar .components li a');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (currentPath.endsWith(href)) {
            item.parentElement.classList.add('active');
        } else {
            item.parentElement.classList.remove('active');
        }
    });

    // Handle responsive sidebar
    function handleResponsiveSidebar() {
        if (window.innerWidth < 768) {
            document.querySelector('.sidebar').classList.remove('active');
            document.querySelector('.content').classList.add('expanded');
        } else {
            const sidebarState = localStorage.getItem('sidebarState');
            if (sidebarState === 'expanded') {
                document.querySelector('.sidebar').classList.add('active');
                document.querySelector('.content').classList.remove('expanded');
            }
        }
    }

    // Initial check
    handleResponsiveSidebar();

    // Listen for window resize
    window.addEventListener('resize', handleResponsiveSidebar);

    updateCartBadge();
    updateFavoritesBadge();
    loadFeaturedProducts();
    loadCategories();
    initializeSearch();
});

// === Search Functionality ===
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            const products = document.querySelectorAll('.product-card');
            
            products.forEach(product => {
                const name = product.querySelector('h6').textContent.toLowerCase();
                const category = product.querySelector('.product-stats span:last-child').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || category.includes(searchTerm)) {
                    product.style.display = '';
                } else {
                    product.style.display = 'none';
                }
            });
        }, 300));
    }
}

// === Cart Functions ===
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
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

function updateCartBadge() {
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
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

function updateFavoritesBadge() {
    if (favoritesBadge) {
        favoritesBadge.textContent = favorites.length;
    }
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// === Product Loading Functions ===
async function loadFeaturedProducts() {
    try {
        const response = await fetch('/api/products/featured');
        const products = await response.json();
        
        const productsContainer = document.getElementById('featuredProducts');
        if (productsContainer) {
            productsContainer.innerHTML = products.map(product => `
                <div class="col-md-3">
                    <div class="product-card">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}">
                            <div class="product-overlay">
                                <button class="btn btn-light" onclick="addToCart(${JSON.stringify(product)})">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                                <button class="btn btn-light ms-2" onclick="toggleFavorite(${JSON.stringify(product)})">
                                    <i class="fas fa-heart"></i>
                                </button>
                            </div>
                        </div>
                        <div class="product-details">
                            <h6>${product.name}</h6>
                            <div class="price">${formatCurrency(product.price)}</div>
                            <div class="product-stats">
                                <span>Stok: ${product.stock}</span>
                                <span>Kategori: ${product.category}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        showToast('Ürünler yüklenirken bir hata oluştu', 'danger');
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();
        
        const categoriesContainer = document.getElementById('categories');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = categories.map(category => `
                <div class="col-md-4">
                    <a href="products.html?category=${category.id}" class="category-card">
                        <img src="${category.image}" alt="${category.name}">
                        <div class="category-overlay">
                            ${category.name}
                        </div>
                    </a>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Kategoriler yüklenirken bir hata oluştu', 'danger');
    }
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

// === Export Functions ===
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleFavorite = toggleFavorite;
window.formatCurrency = formatCurrency;
window.showToast = showToast;

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
    // const productForm = document.getElementById('productForm'); // Bu sayfada yok
    // const categoryForm = document.getElementById('categoryForm'); // Bu sayfada yok

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    // if (productForm) { productForm.addEventListener('submit', handleProductSubmit); }
    // if (categoryForm) { categoryForm.addEventListener('submit', handleCategorySubmit); }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

async function loadInitialData() {
    // Ana sayfada sadece ürünleri yüklüyoruz
    if (productList) {
        await loadProducts();
    }
    // Ana sayfada kategoriler listeleniyorsa yükle
    if (categoryList) {
         await loadCategories();
    }
}

function checkAuth() {
    console.log('Checking authentication...');
    const token = localStorage.getItem('token');
    console.log('Token:', token);

    // Kullanıcı giriş yapmamışsa ve mevcut sayfa login veya register değilse login sayfasına yönlendir
    if (!token) {
        const currentPath = window.location.pathname;
        console.log('Current Path:', currentPath);
        if (!currentPath.includes('login.html') && !currentPath.includes('register.html')) {
            console.log('No token, redirecting to login.html');
            window.location.href = 'login.html';
        } else {
            console.log('No token, but already on login/register page.');
        }
        return;
    }

    // Kullanıcı giriş yapmışsa ve mevcut sayfa login veya register ise ana sayfaya yönlendir
    const currentPath = window.location.pathname;
    if (token && (currentPath.includes('login.html') || currentPath.includes('register.html'))) {
         console.log('Token exists, on login/register page, redirecting to /');
         window.location.href = '/'; // Ana sayfaya yönlendir
         return;
    }

    // Token varsa, kullanıcı bilgilerini çek ve UI'ı güncelle
    console.log('Token exists, fetching user info...');
    fetch(`${API_URL}/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            // Token geçersizse veya süresi dolmuşsa
            console.error('Auth error: Invalid token', response.status);
            throw new Error('Authentication failed');
        }
        return response.json();
    })
    .then(data => {
        currentUser = data;
        console.log('User authenticated:', currentUser);
        updateUI();
    })
    .catch(error => {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        currentUser = null; // Kullanıcı durumunu sıfırla
        updateUI(); // UI'ı misafir kullanıcı olarak güncelle
        // Eğer ana sayfada auth hatası olursa login'e yönlendirme (isteğe bağlı)
        const currentPath = window.location.pathname;
        if (!currentPath.includes('login.html') && !currentPath.includes('register.html')) {
             console.log('Auth failed on non-auth page, redirecting to login.html');
             window.location.href = 'login.html';
        }
    });
}

// ... (Diğer fonksiyonlar aynı kalacak) 