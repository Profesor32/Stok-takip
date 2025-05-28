// Genel Yardımcı Fonksiyonlar ve Olay Dinleyiciler

// Token kontrolü ve yetkilendirme
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Admin sayfalarında veya oturum gerektiren diğer sayfalarda token yoksa login sayfasına yönlendir
        if (window.location.pathname.includes('/admin/') ||
            window.location.pathname === '/frontend/profile.html' ||
            window.location.pathname === '/frontend/orders.html' ||
             window.location.pathname === '/frontend/cart.html') { // Sepet sayfası için de auth gerekli olabilir
            window.location.href = '/frontend/login.html';
            return false;
        }
        return false;
    }

    // Token varsa, geçerliliğini kontrol etmek için bir API çağrısı yapılabilir (isteğe bağlı)
    // Şimdilik sadece varlığını kontrol ediyoruz.

    return true;
}

// Kullanıcı menüsünü güncelle
function updateUserMenu() {
    const token = localStorage.getItem('token');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userDropdown) {
        if (token) {
            const user = JSON.parse(localStorage.getItem('user'));
            userDropdown.innerHTML = `
                <li><a class="dropdown-item" href="/frontend/profile.html"><i class="fas fa-user me-2"></i> Profilim</a></li>
                <li><a class="dropdown-item" href="/frontend/orders.html"><i class="fas fa-box me-2"></i> Siparişlerim</a></li>
                ${user.isAdmin ? '<li><a class="dropdown-item" href="/frontend/admin/dashboard.html"><i class="fas fa-cog me-2"></i> Admin Panel</a></li>' : ''}
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i> Çıkış Yap</a></li>
            `;
        } else {
            userDropdown.innerHTML = `
                <li><a class="dropdown-item" href="/frontend/login.html"><i class="fas fa-sign-in-alt me-2"></i> Giriş Yap</a></li>
                <li><a class="dropdown-item" href="/frontend/register.html"><i class="fas fa-user-plus me-2"></i> Kayıt Ol</a></li>
            `;
        }
    }
}

// Sepet sayısını güncelle
async function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;

    if (!checkAuth()) {
        cartCount.textContent = '0';
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cart/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            cartCount.textContent = data.data.count;
        } else {
             cartCount.textContent = '0'; // Hata durumunda sepet sayısını sıfırla
        }
    } catch (error) {
        console.error('Sepet sayısı güncelleme hatası:', error);
        const cartCount = document.getElementById('cartCount');
        if (cartCount) cartCount.textContent = '0'; // Hata durumunda sepet sayısını sıfırla
    }
}

// Toast bildirimi göster
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Çıkış yap
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateUserMenu();
    showToast('Başarıyla çıkış yapıldı', 'success');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

// --- Ürün Listeleme Sayfası İçin Fonksiyonlar (frontend/products.html) ---

let allProducts = []; // Tüm ürünleri saklamak için değişken

// Ürünleri API'den getir ve görüntüle
async function fetchAndDisplayProducts() {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return; // Sadece products.html sayfasında çalışır

    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
            allProducts = data.data; // Tüm ürünleri sakla
            displayProducts(allProducts); // Hepsini görüntüle
        } else {
            showToast(data.message || 'Ürünler yüklenemedi', 'danger');
             productsContainer.innerHTML = '<div class="col-12 text-center"><p>Ürünler yüklenirken bir hata oluştu.</p></div>';
        }
    } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        showToast('Ürünler yüklenirken bir hata oluştu', 'danger');
         productsContainer.innerHTML = '<div class="col-12 text-center"><p>Ürünler yüklenirken bir hata oluştu.</p></div>';
    }
}

// Ürünleri DOM'a görüntüle (filtrelenmiş/aranmış listeyi alır)
function displayProducts(products) {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return; // Sadece products.html sayfasında çalışır

    if (products.length === 0) {
        productsContainer.innerHTML = '<div class="col-12 text-center"><p>Ürün bulunamadı.</p></div>';
        return;
    }

    productsContainer.innerHTML = products.map(product => `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <a href="/frontend/product-detail.html?id=${product.id}">
                    <img src="${product.image_url || '../images/placeholder.jpg'}" class="card-img-top" alt="${product.name}">
                </a>
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text">${product.description ? product.description.substring(0, 100) + '...' : ''}</p>
                    <p class="card-text">
                        <small class="text-muted">Stok: ${product.stock}</small>
                    </p>
                    <p class="card-text">
                        <strong>${parseFloat(product.price).toFixed(2)} TL</strong>
                    </p>
                    <button class="btn btn-primary" onclick="addToCart(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
                        ${product.stock <= 0 ? 'Stokta Yok' : 'Sepete Ekle'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Ürün arama fonksiyonu
function searchProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
     const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        (product.description && product.description.toLowerCase().includes(searchTerm))
    );
    displayProducts(filteredProducts);
}

// --- Sepet Sayfası İçin Fonksiyonlar (frontend/cart.html) ---

// Sepet ürünlerini getir ve görüntüle
async function fetchCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return; // Sadece cart.html sayfasında çalışır

    // checkAuth() fetchCartItems çağrılmadan önce yapılıyor, burada tekrar kontrol etmeye gerek yok.

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            displayCartItems(data.data.items);
            updateOrderSummary(data.data);
        } else {
            showToast(data.message || 'Sepet yüklenemedi', 'danger');
             cartItemsContainer.innerHTML = '<div class="text-center py-4"><p>Sepetiniz yüklenirken bir hata oluştu.</p></div>';
        }
    } catch (error) {
        console.error('Sepet yükleme hatası:', error);
        showToast('Sepet yüklenirken bir hata oluştu', 'danger');
         cartItemsContainer.innerHTML = '<div class="text-center py-4"><p>Sepetiniz yüklenirken bir hata oluştu.</p></div>';
    }
}

// Sepet ürünlerini DOM'a görüntüle
function displayCartItems(items) {
    const cartItemsContainer = document.getElementById('cartItems');
     if (!cartItemsContainer) return; // Sadece cart.html sayfasında çalışır
    
    if (items.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-shopping-cart fa-3x mb-3 text-muted"></i>
                <p class="mb-0">Sepetiniz boş</p>
                <a href="/frontend/products.html" class="btn btn-primary mt-3">Alışverişe Başla</a>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = items.map(item => `
        <div class="cart-item mb-3 pb-3 border-bottom">
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${item.product.image_url || '../images/placeholder.jpg'}" class="img-fluid rounded" alt="${item.product.name}">
                </div>
                <div class="col-md-4">
                    <h5 class="mb-1">${item.product.name}</h5>
                    <p class="text-muted mb-0">${item.product.description ? item.product.description.substring(0, 50) + '...' : ''}</p>
                </div>
                <div class="col-md-2">
                    <div class="input-group">
                        <button class="btn btn-outline-secondary btn-sm" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <input type="number" class="form-control form-control-sm text-center" value="${item.quantity}" min="1" max="${item.product.stock}" onchange="updateQuantity(${item.id}, this.value)">
                        <button class="btn btn-outline-secondary btn-sm" onclick="updateQuantity(${item.id}, ${item.quantity + 1})" ${item.quantity >= item.product.stock ? 'disabled' : ''}>+</button>
                    </div>
                </div>
                <div class="col-md-2 text-end">
                    <p class="mb-0">${parseFloat(item.product.price * item.quantity).toFixed(2)} TL</p>
                </div>
                <div class="col-md-2 text-end">
                    <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Sipariş özetini güncelle
function updateOrderSummary(data) {
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');

    if (subtotalElement) subtotalElement.textContent = `${parseFloat(data.subtotal || 0).toFixed(2)} TL`;
    if (taxElement) taxElement.textContent = `${parseFloat(data.tax || 0).toFixed(2)} TL`;
    if (totalElement) totalElement.textContent = `${parseFloat(data.total || 0).toFixed(2)} TL`;
}

// Ürün miktarını güncelle
async function updateQuantity(itemId, quantity) {
    quantity = parseInt(quantity);
    if (quantity < 1 || isNaN(quantity)) {
         showToast('Lütfen geçerli bir miktar girin.', 'warning');
         fetchCartItems(); // Geçersiz miktar girilirse sepeti tekrar yükle
        return;
    }

    // checkAuth() updateQuantity çağrılmadan önce yapılıyor.

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cart/update/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
        });

        const data = await response.json();

        if (data.success) {
            // Sepet verilerini yeniden çek ve görüntüle
            fetchCartItems();
            // Sepet sayısını güncelle
            updateCartCount();
        } else {
            showToast(data.message || 'Miktar güncellenemedi', 'danger');
             fetchCartItems(); // Hata durumunda sepeti tekrar yükle
        }
    } catch (error) {
        console.error('Miktar güncelleme hatası:', error);
        showToast('Miktar güncellenirken bir hata oluştu', 'danger');
         fetchCartItems(); // Hata durumunda sepeti tekrar yükle
    }
}

// Sepetten ürün kaldır
async function removeFromCart(itemId) {
     if (!confirm('Bu ürünü sepetten kaldırmak istediğinize emin misiniz?')) return;

    // checkAuth() removeFromCart çağrılmadan önce yapılıyor.

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cart/remove/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Ürün sepetten kaldırıldı', 'success');
            // Sepet verilerini yeniden çek ve görüntüle
            fetchCartItems();
            // Sepet sayısını güncelle
            updateCartCount();
        } else {
            showToast(data.message || 'Ürün kaldırılamadı', 'danger');
        }
    } catch (error) {
        console.error('Ürün kaldırma hatası:', error);
        showToast('Ürün kaldırılırken bir hata oluştu', 'danger');
    }
}

// Siparişi tamamla (Checkout)
async function checkout() {
    // checkAuth() checkout çağrılmadan önce yapılıyor.

    // Sepetin boş olup olmadığını kontrol et
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement && parseFloat(subtotalElement.textContent) <= 0) {
         showToast('Sepetinizde ürün bulunmamaktadır.', 'info');
         return;
    }

    if (!confirm('Siparişi tamamlamak istediğinize emin misiniz?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Siparişiniz başarıyla oluşturuldu', 'success');
            // Sepeti boşaltma işlemi backend'de yapılmalı ve sepet sayısı güncellenmeli.
            updateCartCount(); // Sepet sayısını güncelle
            setTimeout(() => {
                window.location.href = '/frontend/orders.html'; // Siparişler sayfasına yönlendir
            }, 1000);
        } else {
            showToast(data.message || 'Sipariş oluşturulamadı', 'danger');
        }
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        showToast('Sipariş oluşturulurken bir hata oluştu', 'danger');
    }
}

// --- Ürün Detay Sayfası İçin Fonksiyonlar (frontend/product-detail.html) ---

async function fetchAndDisplayProductDetail() {
    const productDetailContainer = document.getElementById('productDetailContainer');
     if (!productDetailContainer) return; // Sadece product-detail.html sayfasında çalışır

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        productDetailContainer.innerHTML = '<div class="col-12 text-center"><p>Ürün ID belirtilmedi.</p></div>';
        showToast('Ürün ID belirtilmedi', 'danger');
        return;
    }

    try {
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();

        if (data.success && data.data) {
            displayProductDetail(data.data);
        } else {
            productDetailContainer.innerHTML = '<div class="col-12 text-center"><p>Ürün bulunamadı.</p></div>';
            showToast(data.message || 'Ürün bulunamadı', 'danger');
        }

    } catch (error) {
        console.error('Ürün detay yükleme hatası:', error);
        productDetailContainer.innerHTML = '<div class="col-12 text-center"><p>Ürün detayları yüklenirken bir hata oluştu.</p></div>';
        showToast('Ürün detayları yüklenirken bir hata oluştu', 'danger');
    }
}

// Ürün detaylarını DOM'a görüntüle
function displayProductDetail(product) {
     const productDetailContainer = document.getElementById('productDetailContainer');
     if (!productDetailContainer) return; // Sadece product-detail.html sayfasında çalışır

    productDetailContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <img src="${product.image_url || '../images/placeholder.jpg'}" class="img-fluid rounded" alt="${product.name}">
                 <!-- Birden fazla fotoğraf için galeri eklenebilir -->
            </div>
            <div class="col-md-6">
                <h2>${product.name}</h2>
                <p class="text-muted">Stok Kodu: ${product.sku || 'N/A'}</p>
                <h4>${parseFloat(product.price).toFixed(2)} TL</h4>
                <p>${product.description || 'Ürün açıklaması bulunmamaktadır.'}</p>
                <p><strong>Stok Durumu:</strong> ${product.stock > 0 ? product.stock + ' adet stokta' : 'Stokta Yok'}</p>
                 
                <div class="d-flex align-items-center mb-3">
                     <label for="quantity" class="form-label me-2">Miktar:</label>
                     <input type="number" id="quantity" class="form-control w-auto" value="1" min="1" max="${product.stock}" ${product.stock <= 0 ? 'disabled' : ''}>
                </div>

                <button class="btn btn-primary btn-lg" onclick="addToCartFromDetail(${product.id}, document.getElementById('quantity').value)" ${product.stock <= 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart me-2"></i> Sepete Ekle
                </button>
            </div>
        </div>
    `;
}

// Ürün detay sayfasından sepete ekle (quantity parametresi alır)
async function addToCartFromDetail(productId, quantity) {
     quantity = parseInt(quantity);
     if (quantity < 1 || isNaN(quantity)) {
         showToast('Lütfen geçerli bir miktar girin.', 'warning');
         return;
     }

    if (!checkAuth()) {
        window.location.href = '/frontend/login.html';
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Ürün sepete eklendi', 'success');
            updateCartCount();
        } else {
            showToast(data.message || 'Ürün sepete eklenemedi', 'danger');
        }
    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        showToast('Ürün sepete eklenirken bir hata oluştu', 'danger');
    }
}

// --- Profil Sayfası İçin Fonksiyonlar (frontend/profile.html) ---

async function fetchAndDisplayProfile() {
    const profileDetailContainer = document.getElementById('profileDetailContainer');
    if (!profileDetailContainer) return; // Sadece profile.html sayfasında çalışır

    // checkAuth() fetchAndDisplayProfile çağrılmadan önce yapılıyor.

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.id) {
        profileDetailContainer.innerHTML = '<p>Profil bilgileri bulunamadı. Lütfen giriş yapın.</p>';
        return;
    }

    try {
        // API'den kullanıcı bilgilerini çekme (backend'de /api/profile endpointi olduğunu varsayıyoruz)
        const token = localStorage.getItem('token');
        const response = await fetch('/api/profile', {
             headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
             displayProfile(data.data); // Profil bilgilerini görüntüle
        } else {
             profileDetailContainer.innerHTML = '<p>Profil bilgileri yüklenemedi.</p>';
             showToast(data.message || 'Profil bilgileri yüklenemedi', 'danger');
        }

    } catch (error) {
        console.error('Profil yükleme hatası:', error);
        profileDetailContainer.innerHTML = '<p>Profil bilgileri yüklenirken bir hata oluştu.</p>';
        showToast('Profil yüklenirken bir hata oluştu', 'danger');
    }
}

// Profil bilgilerini DOM'a görüntüle
function displayProfile(user) {
    const profileDetailContainer = document.getElementById('profileDetailContainer');
    if (!profileDetailContainer) return; // Sadece profile.html sayfasında çalışır

    profileDetailContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Kullanıcı Adı:</strong> ${user.username}</p>
                <p><strong>E-posta:</strong> ${user.email}</p>
                <p><strong>Rol:</strong> ${user.isAdmin ? 'Yönetici' : 'Kullanıcı'}</p>
                <!-- Diğer profil bilgileri buraya eklenebilir -->
            </div>
             <!-- Profil düzenleme formu veya şifre değiştirme alanı buraya eklenebilir -->
        </div>
    `;
}

// --- Siparişler Sayfası İçin Fonksiyonlar (frontend/orders.html) ---

async function fetchAndDisplayOrders() {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return; // Sadece orders.html sayfasında çalışır

    // checkAuth() fetchAndDisplayOrders çağrılmadan önce yapılıyor.

    try {
        // API'den siparişleri çekme (backend'de /api/orders endpointi olduğunu varsayıyoruz)
        const token = localStorage.getItem('token');
        const response = await fetch('/api/orders', {
             headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
             displayOrders(data.data); // Siparişleri görüntüle
        } else {
             ordersContainer.innerHTML = '<p>Siparişler yüklenemedi.</p>';
             showToast(data.message || 'Siparişler yüklenemedi', 'danger');
        }

    } catch (error) {
        console.error('Sipariş yükleme hatası:', error);
        ordersContainer.innerHTML = '<p>Siparişler yüklenirken bir hata oluştu.</p>';
        showToast('Sipariş yüklenirken bir hata oluştu', 'danger');
    }
}

// Siparişleri DOM'a görüntüle
function displayOrders(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
     if (!ordersContainer) return; // Sadece orders.html sayfasında çalışır

     if (orders.length === 0) {
         ordersContainer.innerHTML = '<p>Henüz siparişiniz bulunmamaktadır.</p>';
         return;
     }

    let ordersHtml = '<div class="list-group">';

    orders.forEach(order => {
        ordersHtml += `
            <div class="list-group-item list-group-item-action mb-3">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">Sipariş #${order.order_number || order.id}</h5>
                    <small>${new Date(order.order_date).toLocaleDateString()}</small>
                </div>
                <p class="mb-1">Toplam Tutar: <strong>${parseFloat(order.total_amount).toFixed(2)} TL</strong></p>
                <small class="text-muted">Durum: ${order.status}</small>
                 <!-- Sipariş detaylarına gitmek için link veya buton eklenebilir -->
            </div>
        `;
    });

    ordersHtml += '</div>';
    ordersContainer.innerHTML = ordersHtml;
}

// --- Sayfa Yüklendiğinde Çalışacak Olay Dinleyiciler ---

document.addEventListener('DOMContentLoaded', () => {
    // Her sayfada çalışacaklar
    updateUserMenu(); // Kullanıcı menüsünü güncelle
    updateCartCount(); // Sepet sayısını güncelle

    // Sayfaya özel fonksiyonları çalıştır
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        // Ana Sayfa
        // Ürünleri ana sayfadaki products bölümüne getirir (index.html)
        // fetchProducts(); // index.html'de ürün gösterimi için bu fonksiyon kullanılabilir, ancak index.html'in yapısına göre ayarlanmalı

    } else if (window.location.pathname === '/frontend/products.html') {
        // Ürünler Sayfası
        fetchAndDisplayProducts(); // Tüm ürünleri getir ve görüntüle (products.html)
        // Ürün arama inputuna olay dinleyici ekle
        const productSearchInput = document.getElementById('productSearch');
        if(productSearchInput) {
             productSearchInput.addEventListener('input', searchProducts);
        }

    } else if (window.location.pathname === '/frontend/cart.html') {
        // Sepet Sayfası
         // checkAuth() çağrısı DOMContentLoaded içinde yapılıyor
        fetchCartItems(); // Sepet öğelerini getir

    } else if (window.location.pathname === '/frontend/product-detail.html') {
         // Ürün Detay Sayfası
         fetchAndDisplayProductDetail(); // Ürün detayını getir

    } else if (window.location.pathname === '/frontend/profile.html') {
         // Profil Sayfası
         // checkAuth() çağrısı DOMContentLoaded içinde yapılıyor
         fetchAndDisplayProfile(); // Profil bilgilerini getir ve görüntüle

    } else if (window.location.pathname === '/frontend/orders.html') {
         // Siparişler Sayfası
         // checkAuth() çağrısı DOMContentLoaded içinde yapılıyor
         fetchAndDisplayOrders(); // Siparişleri getir ve görüntüle

    } else if (window.location.pathname.includes('/admin/')) {
        // Admin Sayfaları - Yetkilendirme kontrolü
         checkAuth(); // checkAuth admin olmayanları login sayfasına yönlendirir
         // Admin sayfalarına özel scriptler ve fonksiyonlar buraya veya ayrı bir dosyaya eklenebilir.
    }

     // Genel sayfalarda (index, products, cart, detail, about, login, register)
     // userDropdown elementinin olduğu varsayılarak updateUserMenu çağrılır.
     // checkAuth() çağrısı sadece oturum gerektiren sayfalarda başında yapılmalıdır.

}); 

// Ana sayfada ürünleri getirme fonksiyonu (eğer index.html'de productsContainer varsa çalışır)
// Bu fonksiyon şu anda sadece products.html'de kullanılıyor. İhtiyaca göre index.html'e eklenebilir.
// async function fetchProductsForIndexPage() {
//     const productsContainer = document.getElementById('products'); // index.html'deki id
//     if (!productsContainer) return; 

//     try {
//         const response = await fetch('/api/products');
//         const data = await response.json();
//         
//         if (data.success) {
//             // index.html'deki ürün görüntüleme formatına uygun hale getirilmeli
//             productsContainer.innerHTML = data.data.map(product => `...`).join('');
//         } else {
//             showToast(data.message || 'Ürünler yüklenemedi', 'danger');
//         }
//     } catch (error) {
//         console.error('Ürün yükleme hatası:', error);
//         showToast('Ürünler yüklenirken bir hata oluştu', 'danger');
//     }
// } 

// Sepet işlemleri
function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Ürün sepete eklendi', 'success');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateUserMenu();
}); 

document.querySelectorAll('.toggle-details-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const detailsDiv = button.previousElementSibling; // Butondan önceki .project-details divi
        if (detailsDiv.style.display === 'none') {
            detailsDiv.style.display = 'block';
            button.textContent = 'Detayları Gizle';
        } else {
            detailsDiv.style.display = 'none';
            button.textContent = 'Detayları Gör';
        }
    });
}); 