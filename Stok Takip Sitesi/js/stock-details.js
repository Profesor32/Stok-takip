// API URL
const API_URL = 'http://localhost:3000/api';

// DOM Elementleri
const stockName = document.getElementById('stockName');
const stockPrice = document.getElementById('stockPrice');
const stockDate = document.getElementById('stockDate');
const stockNotes = document.getElementById('stockNotes');
const priceHistory = document.getElementById('priceHistory');
const editStockForm = document.getElementById('editStockForm');
const updatePriceForm = document.getElementById('updatePriceForm');
const editStockModal = new bootstrap.Modal(document.getElementById('editStockModal'));
const updatePriceModal = new bootstrap.Modal(document.getElementById('updatePriceModal'));
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userNameDisplay = document.getElementById('userNameDisplay');

// Kullanıcı durumu
let currentUser = null;
let authToken = localStorage.getItem('token');
let currentStockId = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        currentUser = JSON.parse(localStorage.getItem('user'));
        updateUI();
        
        // URL'den stok ID'sini al
        const urlParams = new URLSearchParams(window.location.search);
        currentStockId = urlParams.get('id');
        
        if (currentStockId) {
            loadStockDetails();
            loadPriceHistory();
        } else {
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'index.html';
    }
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

// Stok Detaylarını Yükle
async function loadStockDetails() {
    try {
        const response = await fetch(`${API_URL}/stocks/${currentStockId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const stock = await response.json();
            updateStockDetails(stock);
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Stok detayları yükleme hatası:', error);
        alert('Stok detayları yüklenirken bir hata oluştu');
    }
}

// Stok Detaylarını Güncelle
function updateStockDetails(stock) {
    stockName.textContent = stock.name;
    stockPrice.textContent = `${stock.price} TL`;
    stockDate.textContent = new Date(stock.created_at).toLocaleString();
    stockNotes.textContent = stock.notes || '-';
    
    // Düzenleme formunu doldur
    document.getElementById('editName').value = stock.name;
    document.getElementById('editPrice').value = stock.price;
    document.getElementById('editNotes').value = stock.notes || '';
}

// Fiyat Geçmişini Yükle
async function loadPriceHistory() {
    try {
        const response = await fetch(`${API_URL}/stocks/${currentStockId}/history`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const history = await response.json();
            updatePriceHistory(history);
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Fiyat geçmişi yükleme hatası:', error);
        alert('Fiyat geçmişi yüklenirken bir hata oluştu');
    }
}

// Fiyat Geçmişini Güncelle
function updatePriceHistory(history) {
    priceHistory.innerHTML = '';
    
    history.forEach((record, index) => {
        const historyElement = document.createElement('div');
        historyElement.className = 'list-group-item';
        
        // Fiyat değişimini hesapla
        let priceChange = '';
        if (index < history.length - 1) {
            const change = record.price - history[index + 1].price;
            const changeClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';
            const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '→';
            priceChange = `<span class="${changeClass} ms-2">${changeIcon} ${Math.abs(change)} TL</span>`;
        }
        
        historyElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${record.price} TL</h6>
                    <small class="text-muted">${new Date(record.created_at).toLocaleString()}</small>
                </div>
                ${priceChange}
            </div>
        `;
        priceHistory.appendChild(historyElement);
    });
}

// Stok Düzenleme
editStockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const stockData = {
        name: document.getElementById('editName').value,
        price: document.getElementById('editPrice').value,
        notes: document.getElementById('editNotes').value
    };
    
    try {
        const response = await fetch(`${API_URL}/stocks/${currentStockId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(stockData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Stok başarıyla güncellendi');
            editStockModal.hide();
            loadStockDetails();
            loadPriceHistory();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Stok güncelleme hatası:', error);
        alert('Stok güncellenirken bir hata oluştu');
    }
});

// Fiyat Güncelleme
updatePriceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPrice = document.getElementById('newPrice').value;
    
    try {
        const response = await fetch(`${API_URL}/stocks/${currentStockId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ price: newPrice })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Fiyat başarıyla güncellendi');
            updatePriceModal.hide();
            loadStockDetails();
            loadPriceHistory();
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Fiyat güncelleme hatası:', error);
        alert('Fiyat güncellenirken bir hata oluştu');
    }
});

// Stok Silme
async function deleteStock() {
    if (!confirm('Bu stoku silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/stocks/${currentStockId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            alert('Stok başarıyla silindi');
            window.location.href = 'index.html';
        } else {
            const data = await response.json();
            alert(data.error);
        }
    } catch (error) {
        console.error('Stok silme hatası:', error);
        alert('Stok silinirken bir hata oluştu');
    }
}

// Favori Ekleme/Çıkarma
async function toggleFavorite() {
    try {
        const response = await fetch(`${API_URL}/favorites/${currentStockId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error('Favori işlemi hatası:', error);
        alert('Favori işlemi sırasında bir hata oluştu');
    }
}

// Modal Fonksiyonları
function editStock() {
    editStockModal.show();
}

function updatePrice() {
    document.getElementById('newPrice').value = stockPrice.textContent.replace(' TL', '');
    updatePriceModal.show();
}

// Çıkış Yap
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}); 