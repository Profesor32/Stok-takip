// DOM Elements
const categoriesTable = document.querySelector('#categoriesTable');
const categoryForm = document.querySelector('#categoryForm');
const categoryModal = new bootstrap.Modal(document.querySelector('#categoryModal'));
const saveCategoryBtn = document.querySelector('#saveCategory');

// Global variables
let categories = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupEventListeners();
});

// Functions
function setupEventListeners() {
    saveCategoryBtn.addEventListener('click', handleSaveCategory);
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
        updateCategoriesTable();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function updateCategoriesTable() {
    categoriesTable.innerHTML = categories.map(category => `
        <tr>
            <td>${category.name}</td>
            <td>${category.productCount || 0}</td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="editCategory(${category.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleSaveCategory() {
    try {
        const formData = {
            id: document.querySelector('#categoryId').value,
            name: document.querySelector('#categoryName').value,
            description: document.querySelector('#categoryDescription').value
        };

        const token = localStorage.getItem('token');
        const url = formData.id ? 
            `http://localhost:3000/api/categories/${formData.id}` : 
            'http://localhost:3000/api/categories';

        const response = await fetch(url, {
            method: formData.id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Kategori kaydedilemedi');
        }

        categoryModal.hide();
        showToast('Kategori başarıyla kaydedildi');
        loadCategories();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function editCategory(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Kategori bilgileri alınamadı');
        }

        const category = await response.json();
        
        document.querySelector('#categoryId').value = category.id;
        document.querySelector('#categoryName').value = category.name;
        document.querySelector('#categoryDescription').value = category.description;

        categoryModal.show();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function deleteCategory(id) {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Kategori silinemedi');
        }

        showToast('Kategori başarıyla silindi');
        loadCategories();
    } catch (error) {
        showToast(error.message, 'danger');
    }
} 