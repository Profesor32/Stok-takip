// DOM Elements
const filterForm = document.getElementById('filterForm');
const addOrderForm = document.getElementById('addOrderForm');
const updateStatusForm = document.getElementById('updateStatusForm');
const ordersTableBody = document.getElementById('ordersTableBody');
const pagination = document.getElementById('pagination');
const addOrderItemBtn = document.getElementById('addOrderItemBtn');
const orderItems = document.getElementById('orderItems');
const printOrderBtn = document.getElementById('printOrderBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

// State
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let orderToUpdate = null;

// Check Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    loadUserInfo();
    loadOrders();
}

// Load User Info
async function loadUserInfo() {
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to load user info');
        const data = await response.json();
        userName.textContent = `${data.firstName} ${data.lastName}`;
    } catch (error) {
        showToast('Kullanıcı bilgileri yüklenemedi', 'error');
    }
}

// Load Orders
async function loadOrders() {
    try {
        const queryParams = new URLSearchParams({
            page: currentPage,
            ...currentFilters
        });

        const response = await fetch(`/api/orders?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load orders');
        const data = await response.json();

        // Update state
        currentPage = data.currentPage;
        totalPages = data.totalPages;

        // Render orders
        renderOrders(data.orders);
        updatePagination();

    } catch (error) {
        showToast('Siparişler yüklenemedi', 'error');
    }
}

// Render Orders
function renderOrders(orders) {
    ordersTableBody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.orderNumber}</td>
            <td>${order.customer.firstName} ${order.customer.lastName}</td>
            <td>${formatDate(order.createdAt)}</td>
            <td>${formatPrice(order.total)}</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-primary" onclick="viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-success" onclick="updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update Pagination
function updatePagination() {
    const pages = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    if (startPage > 1) {
        pages.push(`
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1)">1</a>
            </li>
            ${startPage > 2 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
        `);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(`
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `);
    }

    if (endPage < totalPages) {
        pages.push(`
            ${endPage < totalPages - 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a>
            </li>
        `);
    }

    pagination.innerHTML = pages.join('');
}

// Change Page
function changePage(page) {
    currentPage = page;
    loadOrders();
}

// View Order
async function viewOrder(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load order details');
        const order = await response.json();

        // Update modal content
        document.getElementById('viewCustomerName').textContent = `${order.customer.firstName} ${order.customer.lastName}`;
        document.getElementById('viewCustomerEmail').textContent = order.customer.email;
        document.getElementById('viewCustomerPhone').textContent = order.customer.phone;
        document.getElementById('viewCustomerAddress').textContent = order.customer.address;
        document.getElementById('viewOrderNumber').textContent = order.orderNumber;
        document.getElementById('viewOrderDate').textContent = formatDate(order.createdAt);
        document.getElementById('viewOrderStatus').innerHTML = getStatusBadge(order.status);
        document.getElementById('viewPaymentMethod').textContent = getPaymentMethodName(order.paymentMethod);
        document.getElementById('viewOrderNotes').textContent = order.notes || 'Not bulunmuyor';

        // Render order items
        document.getElementById('viewOrderItems').innerHTML = order.items.map(item => `
            <tr>
                <td>${item.product.name}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.price * item.quantity)}</td>
            </tr>
        `).join('');

        document.getElementById('viewOrderTotal').textContent = formatPrice(order.total);

        // Show modal
        const viewOrderModal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
        viewOrderModal.show();

    } catch (error) {
        showToast('Sipariş detayları yüklenemedi', 'error');
    }
}

// Update Order Status
function updateOrderStatus(orderId) {
    orderToUpdate = orderId;
    const updateStatusModal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
    updateStatusModal.show();
}

// Add Order Item
function addOrderItem() {
    const itemHtml = `
        <div class="card mb-3 order-item">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-5 mb-3">
                        <label class="form-label">Ürün</label>
                        <select class="form-select" name="productId" required>
                            <option value="">Seçiniz</option>
                            <!-- Products will be loaded dynamically -->
                        </select>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label">Adet</label>
                        <input type="number" class="form-control" name="quantity" min="1" value="1" required>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label">Birim Fiyat</label>
                        <input type="number" class="form-control" name="price" step="0.01" required>
                    </div>
                    <div class="col-md-1 d-flex align-items-end">
                        <button type="button" class="btn btn-outline-danger" onclick="removeOrderItem(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    orderItems.insertAdjacentHTML('beforeend', itemHtml);
    loadProducts();
}

// Remove Order Item
function removeOrderItem(button) {
    button.closest('.order-item').remove();
}

// Load Products
async function loadProducts() {
    try {
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load products');
        const products = await response.json();

        // Update all product selects
        document.querySelectorAll('select[name="productId"]').forEach(select => {
            if (select.options.length <= 1) {
                products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = product.name;
                    option.dataset.price = product.price;
                    select.appendChild(option);
                });
            }
        });

    } catch (error) {
        showToast('Ürünler yüklenemedi', 'error');
    }
}

// Event Listeners
filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(filterForm);
    currentFilters = Object.fromEntries(formData.entries());
    currentPage = 1;
    loadOrders();
});

filterForm.addEventListener('reset', () => {
    currentFilters = {};
    currentPage = 1;
    loadOrders();
});

addOrderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!addOrderForm.checkValidity()) {
        e.stopPropagation();
        addOrderForm.classList.add('was-validated');
        return;
    }

    try {
        const formData = new FormData(addOrderForm);
        const orderData = {
            customer: {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address')
            },
            items: Array.from(document.querySelectorAll('.order-item')).map(item => ({
                productId: item.querySelector('[name="productId"]').value,
                quantity: parseInt(item.querySelector('[name="quantity"]').value),
                price: parseFloat(item.querySelector('[name="price"]').value)
            })),
            paymentMethod: formData.get('paymentMethod'),
            shippingCompany: formData.get('shippingCompany'),
            notes: formData.get('notes')
        };

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) throw new Error('Failed to create order');

        showToast('Sipariş başarıyla oluşturuldu', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addOrderModal')).hide();
        addOrderForm.reset();
        addOrderForm.classList.remove('was-validated');
        orderItems.innerHTML = '';
        loadOrders();

    } catch (error) {
        showToast('Sipariş oluşturulamadı', 'error');
    }
});

updateStatusForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!updateStatusForm.checkValidity()) {
        e.stopPropagation();
        updateStatusForm.classList.add('was-validated');
        return;
    }

    try {
        const formData = new FormData(updateStatusForm);
        const statusData = {
            status: formData.get('status'),
            note: formData.get('note')
        };

        const response = await fetch(`/api/orders/${orderToUpdate}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(statusData)
        });

        if (!response.ok) throw new Error('Failed to update order status');

        showToast('Sipariş durumu güncellendi', 'success');
        bootstrap.Modal.getInstance(document.getElementById('updateStatusModal')).hide();
        updateStatusForm.reset();
        updateStatusForm.classList.remove('was-validated');
        loadOrders();

    } catch (error) {
        showToast('Sipariş durumu güncellenemedi', 'error');
    }
});

addOrderItemBtn.addEventListener('click', addOrderItem);

printOrderBtn.addEventListener('click', () => {
    window.print();
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// Helper Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(price);
}

function getStatusBadge(status) {
    const statusMap = {
        pending: { text: 'Beklemede', class: 'bg-warning' },
        processing: { text: 'İşleniyor', class: 'bg-info' },
        shipped: { text: 'Kargoda', class: 'bg-primary' },
        delivered: { text: 'Teslim Edildi', class: 'bg-success' },
        cancelled: { text: 'İptal Edildi', class: 'bg-danger' }
    };

    const statusInfo = statusMap[status] || { text: status, class: 'bg-secondary' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function getPaymentMethodName(method) {
    const methodMap = {
        creditCard: 'Kredi Kartı',
        bankTransfer: 'Havale/EFT',
        cash: 'Nakit'
    };
    return methodMap[method] || method;
}

function showToast(message, type = 'info') {
    const toast = document.querySelector('.toast');
    const toastBody = toast.querySelector('.toast-body');
    const toastIcon = toast.querySelector('.toast-header i');

    toastBody.textContent = message;
    toast.classList.remove('bg-success', 'bg-danger', 'bg-info');
    toast.classList.add(`bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'}`);

    toastIcon.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2`;

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Initialize
checkAuth();

// Orders functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load orders
    loadOrders();
    
    // Initialize filters
    initializeFilters();
    
    // Initialize add order modal
    initializeAddOrderModal();
});

// Load orders
function loadOrders() {
    showLoading();
    
    // Simulated API call - replace with actual API call
    setTimeout(() => {
        const orders = [
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
        
        displayOrders(orders);
        hideLoading();
    }, 1000);
}

// Display orders
function displayOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderNo}</td>
            <td>${order.customer}</td>
            <td>${formatDate(order.date)}</td>
            <td>₺${order.amount.toLocaleString('tr-TR')}</td>
            <td><span class="badge bg-${getStatusColor(order.status)}">${order.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewOrder('${order.orderNo}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="updateOrderStatus('${order.orderNo}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteOrder('${order.orderNo}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Initialize filters
function initializeFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterOrders);
    }
    
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', filterOrders);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterOrders);
    }
}

// Filter orders
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateRangeFilter = document.getElementById('dateRangeFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const status = row.children[4].textContent;
        const date = new Date(row.children[2].textContent);
        const customer = row.children[1].textContent.toLowerCase();
        const orderNo = row.children[0].textContent.toLowerCase();
        
        const statusMatch = statusFilter === '' || status === statusFilter;
        const dateMatch = dateRangeFilter === '' || isDateInRange(date, dateRangeFilter);
        const searchMatch = customer.includes(searchInput) || orderNo.includes(searchInput);
        
        row.style.display = statusMatch && dateMatch && searchMatch ? '' : 'none';
    });
}

// Initialize add order modal
function initializeAddOrderModal() {
    const addOrderBtn = document.getElementById('addOrderBtn');
    const addOrderModal = new bootstrap.Modal(document.getElementById('addOrderModal'));
    
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', function() {
            addOrderModal.show();
        });
    }
}

// View order
function viewOrder(orderNo) {
    // Simulated API call - replace with actual API call
    const order = {
        orderNo: orderNo,
        customer: 'Ahmet Yılmaz',
        date: '2024-03-15',
        amount: 1250,
        status: 'Tamamlandı',
        items: [
            {
                product: 'iPhone 13 Pro',
                quantity: 1,
                price: 32999
            },
            {
                product: 'Nike Spor Ayakkabı',
                quantity: 2,
                price: 2499
            }
        ],
        shippingAddress: 'Atatürk Cad. No:123, Kadıköy/İstanbul',
        paymentMethod: 'Kredi Kartı'
    };
    
    const modal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
    const modalBody = document.querySelector('#viewOrderModal .modal-body');
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Sipariş No:</strong> ${order.orderNo}</p>
                <p><strong>Müşteri:</strong> ${order.customer}</p>
                <p><strong>Tarih:</strong> ${formatDate(order.date)}</p>
                <p><strong>Durum:</strong> ${order.status}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Tutar:</strong> ₺${order.amount.toLocaleString('tr-TR')}</p>
                <p><strong>Ödeme Yöntemi:</strong> ${order.paymentMethod}</p>
                <p><strong>Teslimat Adresi:</strong> ${order.shippingAddress}</p>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Sipariş Detayları</h6>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Ürün</th>
                            <th>Adet</th>
                            <th>Fiyat</th>
                            <th>Toplam</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.product}</td>
                                <td>${item.quantity}</td>
                                <td>₺${item.price.toLocaleString('tr-TR')}</td>
                                <td>₺${(item.quantity * item.price).toLocaleString('tr-TR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    modal.show();
}

// Update order status
function updateOrderStatus(orderNo) {
    // Simulated API call - replace with actual API call
    const order = {
        orderNo: orderNo,
        status: 'İşleniyor'
    };
    
    const modal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
    const form = document.getElementById('updateStatusForm');
    
    form.elements['orderNo'].value = order.orderNo;
    form.elements['status'].value = order.status;
    
    modal.show();
}

// Delete order
function deleteOrder(orderNo) {
    if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
        showLoading();
        
        // Simulated API call - replace with actual API call
        setTimeout(() => {
            hideLoading();
            showToast('Sipariş başarıyla silindi.');
            loadOrders();
        }, 1000);
    }
}

// Helper functions
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

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
}

function isDateInRange(date, range) {
    const today = new Date();
    const startDate = new Date();
    
    switch (range) {
        case 'today':
            return date.toDateString() === today.toDateString();
        case 'week':
            startDate.setDate(today.getDate() - 7);
            return date >= startDate && date <= today;
        case 'month':
            startDate.setMonth(today.getMonth() - 1);
            return date >= startDate && date <= today;
        default:
            return true;
    }
} 