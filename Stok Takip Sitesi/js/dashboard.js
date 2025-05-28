// DOM Elements
const totalProducts = document.querySelector('#totalProducts');
const totalCategories = document.querySelector('#totalCategories');
const totalOrders = document.querySelector('#totalOrders');
const totalFavorites = document.querySelector('#totalFavorites');
const recentOrders = document.querySelector('#recentOrders');
const lowStockProducts = document.querySelector('#lowStockProducts');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

// Functions
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Load stats
        const statsResponse = await fetch('http://localhost:3000/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!statsResponse.ok) {
            throw new Error('Stats yüklenemedi');
        }

        const stats = await statsResponse.json();
        updateStats(stats);

        // Load recent orders
        const ordersResponse = await fetch('http://localhost:3000/api/dashboard/recent-orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!ordersResponse.ok) {
            throw new Error('Siparişler yüklenemedi');
        }

        const orders = await ordersResponse.json();
        updateRecentOrders(orders);

        // Load low stock products
        const productsResponse = await fetch('http://localhost:3000/api/dashboard/low-stock', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!productsResponse.ok) {
            throw new Error('Ürünler yüklenemedi');
        }

        const products = await productsResponse.json();
        updateLowStockProducts(products);
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function updateStats(stats) {
    totalProducts.textContent = stats.totalProducts;
    totalCategories.textContent = stats.totalCategories;
    totalOrders.textContent = stats.totalOrders;
    totalFavorites.textContent = stats.totalFavorites;
}

function updateRecentOrders(orders) {
    recentOrders.innerHTML = orders.map(order => `
        <tr>
            <td>${order.orderNumber}</td>
            <td>${order.customerName}</td>
            <td>${new Date(order.date).toLocaleDateString('tr-TR')}</td>
            <td>${order.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            <td>
                <span class="badge bg-${getStatusBadgeClass(order.status)}">
                    ${getStatusText(order.status)}
                </span>
            </td>
        </tr>
    `).join('');
}

function updateLowStockProducts(products) {
    lowStockProducts.innerHTML = products.map(product => `
        <tr>
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td>
                <span class="badge bg-${getStockBadgeClass(product.stock)}">
                    ${getStockText(product.stock)}
                </span>
            </td>
        </tr>
    `).join('');
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'pending':
            return 'warning';
        case 'processing':
            return 'info';
        case 'completed':
            return 'success';
        case 'cancelled':
            return 'danger';
        default:
            return 'secondary';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Beklemede';
        case 'processing':
            return 'İşleniyor';
        case 'completed':
            return 'Tamamlandı';
        case 'cancelled':
            return 'İptal Edildi';
        default:
            return status;
    }
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