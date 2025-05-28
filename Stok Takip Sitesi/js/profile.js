// API URL
const API_URL = 'http://localhost:3000/api';

// DOM Elementleri
const profileForm = document.getElementById('profileForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const totalStocksSpan = document.getElementById('totalStocks');
const totalFavoritesSpan = document.getElementById('totalFavorites');
const lastLoginSpan = document.getElementById('lastLogin');
const stockHistoryDiv = document.getElementById('stockHistory');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userNameDisplay = document.getElementById('userNameDisplay');

// Kullanıcı durumu
let currentUser = null;
let authToken = localStorage.getItem('token');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Kullanıcı bilgilerini yükle
    loadUserProfile();
    loadRecentStocks();

    // Event listeners
    document.getElementById('editProfileBtn').addEventListener('click', showEditProfileModal);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// Kullanıcı profilini yükle
async function loadUserProfile() {
    try {
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Profil bilgileri alınamadı');
        }

        const data = await response.json();
        document.getElementById('username').value = data.username;
        document.getElementById('email').value = data.email;
    } catch (error) {
        console.error('Profil yükleme hatası:', error);
        showAlert('Profil bilgileri yüklenirken bir hata oluştu', 'danger');
    }
}

// Son eklenen stokları yükle
async function loadRecentStocks() {
    try {
        const response = await fetch('/api/stocks/recent', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Stok bilgileri alınamadı');
        }

        const data = await response.json();
        const tableBody = document.getElementById('recentStocksTable');
        tableBody.innerHTML = '';

        data.stocks.forEach(stock => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stock.name}</td>
                <td>${stock.price.toFixed(2)} TL</td>
                <td>${stock.quantity}</td>
                <td>${new Date(stock.created_at).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewStock(${stock.id})">Görüntüle</button>
                    <button class="btn btn-sm btn-success" onclick="addToFavorites(${stock.id})">Favorilere Ekle</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Stok yükleme hatası:', error);
        showAlert('Stok bilgileri yüklenirken bir hata oluştu', 'danger');
    }
}

// Profil düzenleme modalını göster
function showEditProfileModal() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    document.getElementById('newUsername').value = document.getElementById('username').value;
    document.getElementById('newEmail').value = document.getElementById('email').value;
    modal.show();
}

// Profil bilgilerini kaydet
async function saveProfile() {
    const newUsername = document.getElementById('newUsername').value;
    const newEmail = document.getElementById('newEmail').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword && newPassword !== confirmPassword) {
        showAlert('Şifreler eşleşmiyor', 'danger');
        return;
    }

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                username: newUsername,
                email: newEmail,
                password: newPassword
            })
        });

        if (!response.ok) {
            throw new Error('Profil güncellenemedi');
        }

        const data = await response.json();
        document.getElementById('username').value = data.username;
        document.getElementById('email').value = data.email;
        
        bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
        showAlert('Profil başarıyla güncellendi', 'success');
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        showAlert('Profil güncellenirken bir hata oluştu', 'danger');
    }
}

// Stok detaylarını görüntüle
function viewStock(stockId) {
    window.location.href = `stock-details.html?id=${stockId}`;
}

// Favorilere ekle
async function addToFavorites(stockId) {
    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ stock_id: stockId })
        });

        if (!response.ok) {
            throw new Error('Favorilere eklenemedi');
        }

        showAlert('Stok favorilere eklendi', 'success');
    } catch (error) {
        console.error('Favori ekleme hatası:', error);
        showAlert('Stok favorilere eklenirken bir hata oluştu', 'danger');
    }
}

// Çıkış yap
function logout() {
    localStorage.removeItem('token');
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

// UI Güncelleme
function updateUI() {
    if (currentUser) {
        userMenu.style.display = 'flex';
        userNameDisplay.textContent = currentUser.name;
    } else {
        userMenu.style.display = 'none';
    }
}

// İstatistikleri Yükle
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/users/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            totalStocksSpan.textContent = stats.totalStocks;
            totalFavoritesSpan.textContent = stats.totalFavorites;
            lastLoginSpan.textContent = new Date(stats.lastLogin).toLocaleString();
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
        alert('İstatistikler yüklenirken bir hata oluştu');
    }
}

// Stok Geçmişini Yükle
async function loadStockHistory() {
    try {
        const response = await fetch(`${API_URL}/users/stocks`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const stocks = await response.json();
            updateStockHistory(stocks);
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Stok geçmişi yükleme hatası:', error);
        alert('Stok geçmişi yüklenirken bir hata oluştu');
    }
}

// Stok Geçmişini Güncelle
function updateStockHistory(stocks) {
    stockHistoryDiv.innerHTML = '';
    
    stocks.forEach(stock => {
        const stockElement = document.createElement('div');
        stockElement.className = 'list-group-item';
        stockElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${stock.name}</h6>
                    <small class="text-muted">${new Date(stock.created_at).toLocaleString()}</small>
                </div>
                <div>
                    <span class="badge bg-primary rounded-pill">${stock.price}</span>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteStock(${stock.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        stockHistoryDiv.appendChild(stockElement);
    });
}

// Profil Güncelleme
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const profileData = {
        name: nameInput.value,
        email: emailInput.value
    };
    
    if (currentPasswordInput.value && newPasswordInput.value) {
        profileData.currentPassword = currentPasswordInput.value;
        profileData.newPassword = newPasswordInput.value;
    }
    
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Profil başarıyla güncellendi');
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUI();
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        alert('Profil güncellenirken bir hata oluştu');
    }
});

// Stok Silme
async function deleteStock(id) {
    if (!confirm('Bu stoku silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/stocks/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            loadStats();
            loadStockHistory();
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Stok silme hatası:', error);
        alert('Stok silinirken bir hata oluştu');
    }
} 