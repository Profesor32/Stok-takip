// DOM Elements
const searchInput = document.querySelector('#searchInput');
const statusFilter = document.querySelector('#statusFilter');
const dateFilter = document.querySelector('#dateFilter');
const sortBy = document.querySelector('#sortBy');
const ordersTable = document.querySelector('#ordersTable');
const orderModal = new bootstrap.Modal(document.querySelector('#orderModal'));
const updateStatusBtn = document.querySelector('#updateStatus');

// Global variables
let orders = [];
let currentOrder = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    setupEventListeners();
});

// Functions
function setupEventListeners() {
    // Search and filter events
    searchInput.addEventListener('input', debounce(loadOrders, 300));
    statusFilter.addEventListener('change', loadOrders);
    dateFilter.addEventListener('change', loadOrders);
    sortBy.addEventListener('change', loadOrders);

    // Modal events
    updateStatusBtn.addEventListener('click', handleUpdateStatus);
}

async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const search = searchInput.value;
        const status = statusFilter.value;
        const date = dateFilter.value;
        const sort = sortBy.value;

        const queryParams = new URLSearchParams({
            search,
            status,
            date,
            sort
        });

        const response = await fetch(`http://localhost:3000/api/orders?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Siparişler yüklenemedi');
        }

        orders = await response.json();
        updateOrdersTable();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function updateOrdersTable() {
    ordersTable.innerHTML = orders.map(order => `
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
            <td>
                <button class="btn btn-sm btn-info" onclick="viewOrder(${order.id})">
                    <i class="fas fa-eye"></i>
                </button>
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

async function viewOrder(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/orders/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Sipariş detayları alınamadı');
        }

        currentOrder = await response.json();
        updateOrderModal();
        orderModal.show();
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

function updateOrderModal() {
    if (!currentOrder) return;

    // Order info
    document.querySelector('#orderNumber').textContent = currentOrder.orderNumber;
    document.querySelector('#orderDate').textContent = new Date(currentOrder.date).toLocaleDateString('tr-TR');
    document.querySelector('#orderStatus').textContent = getStatusText(currentOrder.status);

    // Customer info
    document.querySelector('#customerName').textContent = currentOrder.customerName;
    document.querySelector('#customerEmail').textContent = currentOrder.customerEmail;
    document.querySelector('#customerPhone').textContent = currentOrder.customerPhone;

    // Order items
    document.querySelector('#orderItems').innerHTML = currentOrder.items.map(item => `
        <tr>
            <td>${item.productName}</td>
            <td>${item.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
            <td>${item.quantity}</td>
            <td>${(item.price * item.quantity).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
        </tr>
    `).join('');

    // Delivery address
    document.querySelector('#deliveryAddress').textContent = currentOrder.deliveryAddress;

    // Order summary
    const subtotal = currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    document.querySelector('#subtotal').textContent = subtotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    document.querySelector('#tax').textContent = tax.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    document.querySelector('#total').textContent = total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

async function handleUpdateStatus() {
    if (!currentOrder) return;

    const newStatus = prompt('Yeni durumu seçin:', currentOrder.status);
    if (!newStatus) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/orders/${currentOrder.id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Sipariş durumu güncellenemedi');
        }

        showToast('Sipariş durumu güncellendi');
        orderModal.hide();
        loadOrders();
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