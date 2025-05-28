// DOM Elements
const searchInput = document.querySelector('#searchInput');
const categoryFilter = document.querySelector('#categoryFilter');
const stockFilter = document.querySelector('#stockFilter');
const sortBy = document.querySelector('#sortBy');
const productsTable = document.querySelector('#productsTable');
const productForm = document.querySelector('#productForm');
const productModal = new bootstrap.Modal(document.querySelector('#productModal'));
const saveProductBtn = document.querySelector('#saveProduct');

// Global variables
let products = [];
let categories = [];
let currentPage = 1;
const itemsPerPage = 10;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    setupEventListeners();
});

// Functions
function setupEventListeners() {
    // Search and filter events
    searchInput.addEventListener('input', debounce(loadProducts, 300));
    categoryFilter.addEventListener('change', loadProducts);
    stockFilter.addEventListener('change', loadProducts);
    sortBy.addEventListener('change', loadProducts);

    // Form events
    saveProductBtn.addEventListener('click', handleSaveProduct);
}

async function loadCategories() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/categories', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Kategoriler yüklenemedi');
        }

        categories = await response.json();
        updateCategoryFilters();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function updateCategoryFilters() {
    const options = categories.map(category => 
        `<option value="${category.id}">${category.name}</option>`
    ).join('');

    categoryFilter.innerHTML = '<option value="">Tümü</option>' + options;
    document.querySelector('#productCategory').innerHTML = options;
}

async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const search = searchInput.value;
        const category = categoryFilter.value;
        const stock = stockFilter.value;
        const sort = sortBy.value;

        const queryParams = new URLSearchParams({
            search,
            category,
            stock,
            sort,
            page: currentPage,
            limit: itemsPerPage
        });

        const response = await fetch(`http://localhost:3000/api/products?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ürünler yüklenemedi');
        }

        const data = await response.json();
        products = data.products;
        updateProductsTable();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function updateProductsTable() {
    productsTable.innerHTML = products.map(product => `
        <tr>
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${getCategoryName(product.categoryId)}</td>
            <td>${product.stock}</td>
            <td>${product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            <td>
                <span class="badge bg-${getStockBadgeClass(product.stock)}">
                    ${getStockText(product.stock)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getCategoryName(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Bilinmiyor';
}

function getStockBadgeClass(stock) {
    if (stock <= 0) return 'danger';
    if (stock <= 5) return 'warning';
    return 'success';
}

function getStockText(stock) {
    if (stock <= 0) return 'Stok Yok';
    if (stock <= 5) return 'Az Stok';
    return 'Stokta';
}

async function handleSaveProduct() {
    try {
        const formData = {
            id: document.querySelector('#productId').value,
            code: document.querySelector('#productCode').value,
            name: document.querySelector('#productName').value,
            categoryId: document.querySelector('#productCategory').value,
            stock: parseInt(document.querySelector('#productStock').value),
            price: parseFloat(document.querySelector('#productPrice').value),
            description: document.querySelector('#productDescription').value
        };

        const token = localStorage.getItem('token');
        const url = formData.id ? 
            `http://localhost:3000/api/products/${formData.id}` : 
            'http://localhost:3000/api/products';

        const response = await fetch(url, {
            method: formData.id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Ürün kaydedilemedi');
        }

        productModal.hide();
        showToast('Ürün başarıyla kaydedildi');
        loadProducts();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function editProduct(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ürün bilgileri alınamadı');
        }

        const product = await response.json();
        
        document.querySelector('#productId').value = product.id;
        document.querySelector('#productCode').value = product.code;
        document.querySelector('#productName').value = product.name;
        document.querySelector('#productCategory').value = product.categoryId;
        document.querySelector('#productStock').value = product.stock;
        document.querySelector('#productPrice').value = product.price;
        document.querySelector('#productDescription').value = product.description;

        productModal.show();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function deleteProduct(id) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Ürün silinemedi');
        }

        showToast('Ürün başarıyla silindi');
        loadProducts();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

// Utility functions
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