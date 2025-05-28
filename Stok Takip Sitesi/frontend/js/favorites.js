// === Favorites Management ===
import api from './api.js';

// === Load Favorites ===
async function loadFavorites() {
    try {
        const stocks = await api.getStocks({ favorite: true });
        renderFavorites(stocks);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function renderFavorites(stocks) {
    const favoritesList = document.getElementById('favoritesList');
    const template = document.getElementById('stockCardTemplate');
    
    favoritesList.innerHTML = '';
    
    if (stocks.length === 0) {
        favoritesList.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-star fa-3x text-muted mb-3"></i>
                <h4>Henüz favori stok eklenmemiş</h4>
                <p class="text-muted">Sık kullandığınız stokları favorilere ekleyerek hızlıca erişebilirsiniz.</p>
            </div>
        `;
        return;
    }
    
    stocks.forEach(stock => {
        const clone = template.content.cloneNode(true);
        
        // Set stock data
        clone.querySelector('.stock-name').textContent = stock.name;
        clone.querySelector('.stock-price').textContent = `₺${stock.price.toFixed(2)}`;
        clone.querySelector('.stock-category').textContent = stock.category.name;
        clone.querySelector('.stock-quantity').textContent = stock.quantity;
        clone.querySelector('.stock-unit').textContent = stock.unit;
        clone.querySelector('.stock-description').textContent = stock.description;
        clone.querySelector('.last-update').textContent = new Date(stock.updated_at).toLocaleString();
        
        // Set stock ID for actions
        const card = clone.querySelector('.stock-card');
        card.dataset.stockId = stock.id;
        
        // Add favorite class
        card.querySelector('.favorite-btn').classList.add('active');
        
        favoritesList.appendChild(clone);
    });
}

// === Toggle Favorite ===
async function toggleFavorite(button) {
    const card = button.closest('.stock-card');
    const stockId = card.dataset.stockId;
    
    try {
        if (button.classList.contains('active')) {
            await api.removeFavorite(stockId);
            button.classList.remove('active');
            showToast('Favorilerden çıkarıldı', 'info');
        } else {
            await api.addFavorite(stockId);
            button.classList.add('active');
            showToast('Favorilere eklendi', 'success');
        }
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// === Sync Favorites ===
async function syncFavorites() {
    try {
        await api.syncFavorites();
        showToast('Favoriler senkronize edildi', 'success');
        loadFavorites();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
    // Load favorites when favorites page is shown
    const favoritesPage = document.getElementById('favoritesPage');
    if (favoritesPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!favoritesPage.classList.contains('d-none')) {
                        loadFavorites();
                    }
                }
            });
        });
        
        observer.observe(favoritesPage, { attributes: true });
    }
});

// Global variables
let favorites = [];
let categories = [];

// DOM Elements
const favoritesGrid = document.getElementById('favoritesGrid');
const categoryFilter = document.getElementById('categoryFilter');
const stockFilter = document.getElementById('stockFilter');
const searchFilter = document.getElementById('searchFilter');
const totalFavorites = document.getElementById('totalFavorites');
const lowStockCount = document.getElementById('lowStockCount');
const outOfStockCount = document.getElementById('outOfStockCount');
const emptyState = document.getElementById('emptyState');

// Modals
const productDetailsModal = new bootstrap.Modal(document.getElementById('productDetailsModal'));

// Toast
const toast = new bootstrap.Toast(document.querySelector('.toast'));

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadFavorites();
    setupEventListeners();
});

function setupEventListeners() {
    // Filter events
    categoryFilter.addEventListener('change', filterFavorites);
    stockFilter.addEventListener('change', filterFavorites);
    searchFilter.addEventListener('input', filterFavorites);

    // Button events
    document.getElementById('removeFromFavoritesBtn').addEventListener('click', handleRemoveFromFavorites);
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        updateCategoryFilter();
    } catch (error) {
        showToast('Kategoriler yüklenirken bir hata oluştu', 'error');
    }
}

function updateCategoryFilter() {
    const categoryOptions = categories.map(category => 
        `<option value="${category.id}">${category.name}</option>`
    ).join('');

    categoryFilter.innerHTML = `<option value="">Tümü</option>${categoryOptions}`;
}

// Load Favorites
async function loadFavorites() {
    try {
        const response = await fetch('/api/favorites');
        favorites = await response.json();
        updateStats();
        displayFavorites();
    } catch (error) {
        showToast('Favoriler yüklenirken bir hata oluştu', 'error');
    }
}

function updateStats() {
    totalFavorites.textContent = favorites.length;
    
    const lowStock = favorites.filter(f => f.product.stock <= f.product.minStock && f.product.stock > 0).length;
    const outOfStock = favorites.filter(f => f.product.stock === 0).length;

    lowStockCount.textContent = lowStock;
    outOfStockCount.textContent = outOfStock;

    // Show/hide empty state
    emptyState.classList.toggle('d-none', favorites.length > 0);
}

function displayFavorites() {
    const filteredFavorites = filterFavorites();
    
    favoritesGrid.innerHTML = filteredFavorites.map(favorite => `
        <div class="col-md-4">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">${favorite.product.name}</h5>
                        <span class="badge ${getStockBadgeClass(favorite.product)}">
                            ${favorite.product.stock} adet
                        </span>
                    </div>
                    <p class="text-secondary mb-2">Kod: ${favorite.product.code}</p>
                    <p class="text-secondary mb-2">Kategori: ${getCategoryName(favorite.product.categoryId)}</p>
                    <p class="text-secondary mb-3">Fiyat: ₺${favorite.product.price.toFixed(2)}</p>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-primary btn-sm" onclick="viewProduct(${favorite.product.id})">
                            <i class="fas fa-eye me-1"></i>Detaylar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="removeFromFavorites(${favorite.id})">
                            <i class="fas fa-heart-broken me-1"></i>Kaldır
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Bilinmiyor';
}

function getStockBadgeClass(product) {
    if (product.stock === 0) return 'bg-danger';
    if (product.stock <= product.minStock) return 'bg-warning';
    return 'bg-success';
}

function filterFavorites() {
    const category = categoryFilter.value;
    const stock = stockFilter.value;
    const search = searchFilter.value.toLowerCase();

    const filtered = favorites.filter(favorite => {
        const matchesCategory = !category || favorite.product.categoryId === parseInt(category);
        const matchesStock = !stock || 
            (stock === 'inStock' && favorite.product.stock > favorite.product.minStock) ||
            (stock === 'lowStock' && favorite.product.stock <= favorite.product.minStock && favorite.product.stock > 0) ||
            (stock === 'outOfStock' && favorite.product.stock === 0);
        const matchesSearch = !search || 
            favorite.product.name.toLowerCase().includes(search) ||
            favorite.product.code.toLowerCase().includes(search);

        return matchesCategory && matchesStock && matchesSearch;
    });

    displayFavorites();
    return filtered;
}

// Product Actions
async function viewProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`);
        const product = await response.json();

        document.getElementById('productName').textContent = product.name;
        document.getElementById('productCode').textContent = product.code;
        document.getElementById('productCategory').textContent = getCategoryName(product.categoryId);
        document.getElementById('productStock').textContent = product.stock;
        document.getElementById('productPrice').textContent = `₺${product.price.toFixed(2)}`;
        document.getElementById('productSupplier').textContent = product.supplier || '-';
        document.getElementById('productBarcode').textContent = product.barcode || '-';
        document.getElementById('productDescription').textContent = product.description || '-';

        // Load stock history
        const historyResponse = await fetch(`/api/products/${id}/history`);
        const history = await historyResponse.json();
        
        document.getElementById('stockHistoryBody').innerHTML = history.map(record => `
            <tr>
                <td>${new Date(record.date).toLocaleString()}</td>
                <td>${record.quantity}</td>
                <td>${record.type}</td>
                <td>${record.reference || '-'}</td>
            </tr>
        `).join('');

        // Store favorite ID for removal
        const favorite = favorites.find(f => f.product.id === id);
        document.getElementById('productDetailsModal').dataset.favoriteId = favorite.id;

        productDetailsModal.show();
    } catch (error) {
        showToast('Ürün detayları yüklenirken bir hata oluştu', 'error');
    }
}

async function handleRemoveFromFavorites() {
    const favoriteId = document.getElementById('productDetailsModal').dataset.favoriteId;
    await removeFromFavorites(favoriteId);
    productDetailsModal.hide();
}

async function removeFromFavorites(favoriteId) {
    if (!confirm('Bu ürünü favorilerden çıkarmak istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`/api/favorites/${favoriteId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Ürün favorilerden çıkarıldı', 'success');
            loadFavorites();
        } else {
            throw new Error('İşlem başarısız');
        }
    } catch (error) {
        showToast('Ürün favorilerden çıkarılırken bir hata oluştu', 'error');
    }
}

// Utility Functions
function showToast(message, type = 'info') {
    const toastElement = document.querySelector('.toast');
    const toastBody = toastElement.querySelector('.toast-body');
    
    toastElement.classList.remove('bg-info', 'bg-success', 'bg-danger');
    toastElement.classList.add(`bg-${type}`);
    
    toastBody.textContent = message;
    toast.show();
} 