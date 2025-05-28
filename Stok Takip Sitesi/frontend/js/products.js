// Global variables
let products = [];
let categories = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentProduct = null;
let filteredProducts = [];
let currentView = 'list';

// DOM Elements
const productsTable = document.getElementById('productsTable');
const productsGrid = document.getElementById('productsGrid');
const productsList = document.getElementById('productsList');
const searchInput = document.querySelector('.search-box input');
const categoryFilter = document.getElementById('categoryFilter');
const stockFilter = document.getElementById('stockFilter');
const sortFilter = document.getElementById('sortFilter');
const resetFilters = document.getElementById('resetFilters');
const addProductForm = document.getElementById('addProductForm');
const editProductForm = document.getElementById('editProductForm');
const saveProductBtn = document.getElementById('saveProduct');
const updateProductBtn = document.getElementById('updateProduct');
const totalProducts = document.getElementById('totalProducts');
const lowStockCount = document.getElementById('lowStockCount');
const outOfStockCount = document.getElementById('outOfStockCount');
const totalValue = document.getElementById('totalValue');
const viewGridBtn = document.getElementById('viewGrid');
const viewListBtn = document.getElementById('viewList');

// Modals
const productDetailsModal = new bootstrap.Modal(document.getElementById('productDetailsModal'));
const addProductModal = new bootstrap.Modal(document.getElementById('addProductModal'));
const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategories();
    setupEventListeners();
});

function setupEventListeners() {
    // View Toggle
    viewGridBtn.addEventListener('click', () => switchView('grid'));
    viewListBtn.addEventListener('click', () => switchView('list'));

    // Search
    searchInput.addEventListener('input', debounce(filterProducts, 300));

    // Filters
    categoryFilter.addEventListener('change', filterProducts);
    stockFilter.addEventListener('change', filterProducts);
    sortFilter.addEventListener('change', filterProducts);

    // Reset filters
    resetFilters.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        stockFilter.value = '';
        sortFilter.value = 'name_asc';
        filterProducts();
    });

    // Add product form
    saveProductBtn.addEventListener('click', () => {
        const formData = new FormData(addProductForm);
        const product = Object.fromEntries(formData.entries());
        addProduct(product);
    });

    // Edit product form
    updateProductBtn.addEventListener('click', () => {
        const formData = new FormData(editProductForm);
        const product = Object.fromEntries(formData.entries());
        updateProduct(product);
    });
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'danger');
            return;
        }
        
        products = data;
        filteredProducts = [...products];
        updateStats();
        updateProductsView();
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Ürünler yüklenirken bir hata oluştu', 'danger');
    }
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'danger');
            return;
        }
        
        categories = data;
        
        // Update category filters
        updateCategoryFilter(categories);
        
        // Update category selects in forms
        document.querySelectorAll('select[name="categoryId"]').forEach(select => {
            select.innerHTML = '<option value="">Kategori Seçin</option>' + categoryOptions;
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Kategoriler yüklenirken bir hata oluştu', 'danger');
    }
}

// Update category filter
function updateCategoryFilter(categories) {
    const options = categories.map(category => 
        `<option value="${category.id}">${category.name}</option>`
    ).join('');
    
    categoryFilter.innerHTML = `
        <option value="">Tüm Kategoriler</option>
        ${options}
    `;
}

// Filter products
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryId = categoryFilter.value;
    const stockStatus = stockFilter.value;
    const sortBy = sortFilter.value;
    
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            product.code.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryId || product.categoryId === parseInt(categoryId);
        const matchesStock = !stockStatus || getStockStatus(product) === stockStatus;
        
        return matchesSearch && matchesCategory && matchesStock;
    });
    
    // Sort products
    sortProducts(sortBy);
    
    // Update view
    updateProductsView();
}

// Sort products
function sortProducts(sortBy) {
    const [field, order] = sortBy.split('_');
    
    filteredProducts.sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];
        
        if (field === 'price' || field === 'stock') {
            valueA = parseFloat(valueA);
            valueB = parseFloat(valueB);
        }
        
        if (order === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
}

// Update products view
function updateProductsView() {
    if (currentView === 'grid') {
        updateProductsGrid();
    } else {
        updateProductsList();
    }
}

// Update products grid
function updateProductsGrid() {
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="col-md-3 mb-4">
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image || 'img/products/default.jpg'}" alt="${product.name}">
                    <div class="product-overlay">
                        <button class="btn btn-primary btn-sm" onclick="addToCart(${product.id})">
                            Sepete Ekle
                        </button>
                    </div>
                </div>
                <div class="product-details">
                    <h6>${product.name}</h6>
                    <p class="price">${formatCurrency(product.price)}</p>
                    <div class="product-stats">
                        <span><i class="fas fa-shopping-cart"></i> ${product.salesCount || 0}</span>
                        <span><i class="fas fa-star"></i> ${product.rating || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Update products list
function updateProductsList() {
    const tbody = productsList.querySelector('tbody');
    tbody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td>${product.code}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${product.image || 'img/products/default.jpg'}" alt="${product.name}" 
                         class="rounded me-2" width="40" height="40">
                    <span>${product.name}</span>
                </div>
            </td>
            <td>${getCategoryName(product.categoryId)}</td>
            <td>${product.stock}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${getStockStatusBadge(product)}</td>
            <td>
                <button class="btn btn-sm btn-primary me-1" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Get stock status badge
function getStockStatusBadge(product) {
    const status = getStockStatus(product);
    const badges = {
        in: '<span class="badge bg-success">Stokta</span>',
        low: '<span class="badge bg-warning">Kritik</span>',
        out: '<span class="badge bg-danger">Tükendi</span>'
    };
    return badges[status];
}

// Switch view
function switchView(view) {
    currentView = view;
    viewGridBtn.classList.toggle('active', view === 'grid');
    viewListBtn.classList.toggle('active', view === 'list');
    productsGrid.style.display = view === 'grid' ? 'flex' : 'none';
    productsList.style.display = view === 'list' ? 'block' : 'none';
    updateProductsView();
}

// Add product
async function addProduct(product) {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'danger');
            return;
        }
        
        showToast('Ürün başarıyla eklendi');
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        addProductForm.reset();
        loadProducts();
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('Ürün eklenirken bir hata oluştu', 'danger');
    }
}

// Edit product
function editProduct(id) {
    currentProduct = products.find(p => p.id === id);
    
    if (!currentProduct) {
        showToast('Ürün bulunamadı', 'danger');
        return;
    }
    
    // Fill form
    const form = editProductForm;
    form.elements['id'].value = currentProduct.id;
    form.elements['code'].value = currentProduct.code;
    form.elements['name'].value = currentProduct.name;
    form.elements['categoryId'].value = currentProduct.categoryId;
    form.elements['price'].value = currentProduct.price;
    form.elements['stock'].value = currentProduct.stock;
    form.elements['minStock'].value = currentProduct.minStock;
    form.elements['description'].value = currentProduct.description || '';
    form.elements['supplier'].value = currentProduct.supplier || '';
    form.elements['barcode'].value = currentProduct.barcode || '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
    modal.show();
}

// Update product
async function updateProduct(product) {
    try {
        const response = await fetch(`/api/products/${product.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'danger');
            return;
        }
        
        showToast('Ürün başarıyla güncellendi');
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        loadProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Ürün güncellenirken bir hata oluştu', 'danger');
    }
}

// Delete product
async function deleteProduct(id) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error, 'danger');
            return;
        }
        
        showToast('Ürün başarıyla silindi');
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Ürün silinirken bir hata oluştu', 'danger');
    }
}

// Helper functions
function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '-';
}

function getStockStatus(product) {
    if (product.stock <= 0) return 'out';
    if (product.stock <= product.minStock) return 'low';
    return 'in';
}

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

function updateStats() {
    totalProducts.textContent = products.length;
    lowStockCount.textContent = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
    outOfStockCount.textContent = products.filter(p => p.stock === 0).length;
    totalValue.textContent = '₺' + products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2);
}

async function viewProduct(id) {
    try {
        const response = await fetch(`/api/products/${id}`);
        const product = await response.json();
        
        // Update modal content
        document.getElementById('productImage').src = product.image || 'img/no-image.png';
        document.getElementById('productName').textContent = product.name;
        document.getElementById('productCode').textContent = product.code;
        document.getElementById('productCategory').textContent = categories.find(c => c.id === product.categoryId)?.name || '-';
        document.getElementById('productStock').textContent = product.stock;
        document.getElementById('productPrice').textContent = '₺' + product.price.toFixed(2);
        document.getElementById('productSupplier').textContent = product.supplier || '-';
        document.getElementById('productBarcode').textContent = product.barcode || '-';
        document.getElementById('productDescription').textContent = product.description || '-';
        
        // Load stock history
        const historyResponse = await fetch(`/api/products/${id}/history`);
        const history = await historyResponse.json();
        
        document.getElementById('stockHistoryBody').innerHTML = history.map(item => `
            <tr>
                <td>${new Date(item.date).toLocaleDateString()}</td>
                <td>${item.quantity}</td>
                <td>${item.type}</td>
                <td>${item.reference || '-'}</td>
            </tr>
        `).join('');
        
        // Show modal
        productDetailsModal.show();
    } catch (error) {
        showToast('Ürün detayları yüklenirken bir hata oluştu', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.querySelector('.toast');
    const toastBody = toast.querySelector('.toast-body');
    
    toast.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    toast.classList.add(`bg-${type}`);
    
    toastBody.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Add to cart
async function addToCart(productId) {
    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });
        
        if (!response.ok) throw new Error('Ürün sepete eklenemedi');
        
        showToast('success', 'Ürün sepete eklendi');
        // TODO: Update cart count
    } catch (error) {
        showToast('error', 'Ürün sepete eklenirken bir hata oluştu');
        console.error('Error adding to cart:', error);
    }
} 