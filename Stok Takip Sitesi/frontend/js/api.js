// API endpoint'leri
const API_URL = 'http://localhost:3000/api';

// API istekleri için yardımcı fonksiyonlar
const api = {
    // Kullanıcı işlemleri
    async register(userData) {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        return response.json();
    },

    async login(credentials) {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        return response.json();
    },

    async getProfile() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    // Stok işlemleri
    async getStocks() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/stocks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    async addStock(stockData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/stocks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(stockData)
        });
        return response.json();
    },

    async updateStock(id, stockData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/stocks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(stockData)
        });
        return response.json();
    },

    async deleteStock(id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/stocks/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    // Favori işlemleri
    async getFavorites() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/favorites`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    },

    async toggleFavorite(stockId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/favorites/${stockId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.json();
    }
};
