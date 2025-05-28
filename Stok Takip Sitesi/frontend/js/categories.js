// Global variables
let categories = [];

// DOM Elements
const categoriesTableBody = document.getElementById('categoriesTableBody');
const totalCategories = document.getElementById('totalCategories');
const activeCategories = document.getElementById('activeCategories');
const totalProducts = document.getElementById('totalProducts');

// Modals
const addCategoryModal = new bootstrap.Modal(document.getElementById('addCategoryModal'));
const editCategoryModal = new bootstrap.Modal(document.getElementById('editCategoryModal'));

// Toast
const toast = new bootstrap.Toast(document.querySelector('.toast'));

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('addCategoryBtn').addEventListener('click', () => addCategoryModal.show());
    document.getElementById('addCategoryForm').addEventListener('submit', handleAddCategory);
    document.getElementById('editCategoryForm').addEventListener('submit', handleEditCategory);
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        updateStats();
        displayCategories();
    } catch (error) {
        showToast('Kategoriler yüklenirken bir hata oluştu', 'error');
    }
}

function updateStats() {
    totalCategories.textContent = categories.length;
    activeCategories.textContent = categories.filter(c => c.status).length;
    
    // Calculate total products across all categories
    const total = categories.reduce((sum, category) => sum + (category.productCount || 0), 0);
    totalProducts.textContent = total;
}

function displayCategories() {
    categoriesTableBody.innerHTML = categories.map(category => `
        <tr>
            <td>${category.name}</td>
            <td>${category.description || '-'}</td>
            <td>${category.productCount || 0}</td>
            <td>
                <span class="badge ${category.status ? 'bg-success' : 'bg-danger'}">
                    ${category.status ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Category Actions
async function handleAddCategory(event) {
    event.preventDefault();

    const categoryData = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value,
        status: true
    };

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });

        if (response.ok) {
            showToast('Kategori başarıyla eklendi', 'success');
            addCategoryModal.hide();
            event.target.reset();
            loadCategories();
        } else {
            throw new Error('Ekleme başarısız');
        }
    } catch (error) {
        showToast('Kategori eklenirken bir hata oluştu', 'error');
    }
}

async function editCategory(id) {
    try {
        const response = await fetch(`/api/categories/${id}`);
        const category = await response.json();

        document.getElementById('editCategoryName').value = category.name;
        document.getElementById('editCategoryDescription').value = category.description || '';
        document.getElementById('editCategoryStatus').checked = category.status;

        document.getElementById('editCategoryForm').dataset.categoryId = id;
        editCategoryModal.show();
    } catch (error) {
        showToast('Kategori bilgileri yüklenirken bir hata oluştu', 'error');
    }
}

async function handleEditCategory(event) {
    event.preventDefault();
    const categoryId = event.target.dataset.categoryId;

    const categoryData = {
        name: document.getElementById('editCategoryName').value,
        description: document.getElementById('editCategoryDescription').value,
        status: document.getElementById('editCategoryStatus').checked
    };

    try {
        const response = await fetch(`/api/categories/${categoryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });

        if (response.ok) {
            showToast('Kategori başarıyla güncellendi', 'success');
            editCategoryModal.hide();
            loadCategories();
        } else {
            throw new Error('Güncelleme başarısız');
        }
    } catch (error) {
        showToast('Kategori güncellenirken bir hata oluştu', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Kategori başarıyla silindi', 'success');
            loadCategories();
        } else {
            throw new Error('Silme başarısız');
        }
    } catch (error) {
        showToast('Kategori silinirken bir hata oluştu', 'error');
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