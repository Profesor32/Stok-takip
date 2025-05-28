// API URL
const API_URL = 'http://localhost:3000/api';

// DOM Elementleri
const favoritesList = document.getElementById('favoritesList');
const searchInput = document.getElementById('searchInput');
const sortByName = document.getElementById('sortByName');
const sortByDate = document.getElementById('sortByDate');
const sortByPrice = document.getElementById('sortByPrice');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userNameDisplay = document.getElementById('userNameDisplay');

// Kullanıcı durumu
let currentUser = null;
let authToken = localStorage.getItem('token');
let favorites = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Favori stokları yükle
    loadFavorites();

    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// UI Güncelleme
function updateUI() {
    if (currentUser) {
        userMenu.style.display = 'flex';
        userNameDisplay.textContent = currentUser.name;
    } else {
        userMenu.style.display = 'none';
    }
}

// Event Listener'ları Ayarla
function setupEventListeners() {
    searchInput.addEventListener('input', filterFavorites);
    sortByName.addEventListener('click', () => sortFavorites('name'));
    sortByDate.addEventListener('click', () => sortFavorites('date'));
    sortByPrice.addEventListener('click', () => sortFavorites('price'));
    logoutBtn.addEventListener('click', handleLogout);
}

// Favorileri Yükle
async function loadFavorites() {
    try {
        const response = await fetch('/api/favorites', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Favori stoklar alınamadı');
        }

        const data = await response.json();
        const tableBody = document.getElementById('favoritesTable');
        tableBody.innerHTML = '';

        data.favorites.forEach(favorite => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${favorite.stock_name}</td>
                <td>${favorite.stock_price.toFixed(2)} TL</td>
                <td>${favorite.stock_quantity}</td>
                <td>${new Date(favorite.added_at).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewStock(${favorite.stock_id})">Görüntüle</button>
                    <button class="btn btn-sm btn-danger" onclick="removeFromFavorites(${favorite.id})">Favorilerden Çıkar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Favori yükleme hatası:', error);
        showAlert('Favori stoklar yüklenirken bir hata oluştu', 'danger');
    }
}

// Stok detaylarını görüntüle
function viewStock(stockId) {
    window.location.href = `stock-details.html?id=${stockId}`;
}

// Favorilerden çıkar
async function removeFromFavorites(favoriteId) {
    try {
        const response = await fetch(`/api/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Favorilerden çıkarılamadı');
        }

        showAlert('Stok favorilerden çıkarıldı', 'success');
        loadFavorites(); // Listeyi yenile
    } catch (error) {
        console.error('Favori silme hatası:', error);
        showAlert('Stok favorilerden çıkarılırken bir hata oluştu', 'danger');
    }
}

// Çıkış yap
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Alert göster
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').insertAdjacentElement('afterbegin', alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Favorileri Filtrele
function filterFavorites() {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredFavorites = favorites.filter(favorite => 
        favorite.stock.name.toLowerCase().includes(searchTerm)
    );
    updateFavoritesList(filteredFavorites);
}

// Favorileri Sırala
function sortFavorites(criteria) {
    const sortedFavorites = [...favorites];
    
    switch (criteria) {
        case 'name':
            sortedFavorites.sort((a, b) => a.stock.name.localeCompare(b.stock.name));
            break;
        case 'date':
            sortedFavorites.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'price':
            sortedFavorites.sort((a, b) => b.stock.price - a.stock.price);
            break;
    }
    
    updateFavoritesList(sortedFavorites);
}

// Favori Ekleme/Çıkarma
async function toggleFavorite(stockId) {
    try {
        const response = await fetch(`${API_URL}/favorites/${stockId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(data.message);
            loadFavorites();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Favori işlemi hatası:', error);
        alert('Favori işlemi sırasında bir hata oluştu');
    }
}

// Çıkış Yap
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
} 