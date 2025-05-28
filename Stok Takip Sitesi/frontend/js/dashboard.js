// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeSalesChart();
    initializeCategoryChart();
    
    // Load recent orders
    loadRecentOrders();
    
    // Load low stock products
    loadLowStockProducts();
});

// Initialize sales chart
function initializeSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
            datasets: [{
                label: 'Satışlar',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: '#000',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₺' + value.toLocaleString('tr-TR');
                        }
                    }
                }
            }
        }
    });
}

// Initialize category chart
function initializeCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Elektronik', 'Giyim', 'Ev & Yaşam', 'Spor', 'Diğer'],
            datasets: [{
                data: [30, 25, 20, 15, 10],
                backgroundColor: [
                    '#000',
                    '#333',
                    '#666',
                    '#999',
                    '#ccc'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Load recent orders
function loadRecentOrders() {
    // Simulated data - replace with actual API call
    const recentOrders = [
        {
            orderNo: 'ORD-001',
            customer: 'Ahmet Yılmaz',
            date: '2024-03-15',
            amount: 1250,
            status: 'Tamamlandı'
        },
        {
            orderNo: 'ORD-002',
            customer: 'Ayşe Demir',
            date: '2024-03-14',
            amount: 850,
            status: 'İşleniyor'
        },
        {
            orderNo: 'ORD-003',
            customer: 'Mehmet Kaya',
            date: '2024-03-13',
            amount: 2100,
            status: 'Kargoda'
        }
    ];

    const tableBody = document.getElementById('recentOrdersTableBody');
    tableBody.innerHTML = '';

    recentOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderNo}</td>
            <td>${order.customer}</td>
            <td>${formatDate(order.date)}</td>
            <td>₺${order.amount.toLocaleString('tr-TR')}</td>
            <td><span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// Load low stock products
function loadLowStockProducts() {
    // Simulated data - replace with actual API call
    const lowStockProducts = [
        {
            code: 'PRD-001',
            name: 'iPhone 13 Pro',
            category: 'Elektronik',
            stock: 5,
            status: 'Kritik'
        },
        {
            code: 'PRD-002',
            name: 'Nike Spor Ayakkabı',
            category: 'Spor',
            stock: 3,
            status: 'Kritik'
        },
        {
            code: 'PRD-003',
            name: 'Samsung TV',
            category: 'Elektronik',
            stock: 2,
            status: 'Kritik'
        }
    ];

    const tableBody = document.getElementById('lowStockTableBody');
    tableBody.innerHTML = '';

    lowStockProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.stock}</td>
            <td><span class="badge bg-${getStockStatusColor(product.status)}">${product.status}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
}

function getStatusColor(status) {
    switch (status) {
        case 'Tamamlandı':
            return 'success';
        case 'İşleniyor':
            return 'warning';
        case 'Kargoda':
            return 'info';
        default:
            return 'secondary';
    }
}

function getStockStatusColor(status) {
    switch (status) {
        case 'Kritik':
            return 'danger';
        case 'Düşük':
            return 'warning';
        default:
            return 'success';
    }
} 