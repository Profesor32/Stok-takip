// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize login form
    initializeLoginForm();
    
    // Initialize register form
    initializeRegisterForm();
    
    // Check authentication status
    checkAuth();
});

// Initialize login form
function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = loginForm.elements['email'].value;
            const password = loginForm.elements['password'].value;
            const rememberMe = loginForm.elements['rememberMe'].checked;
            
            if (!validateEmail(email)) {
                showToast('Lütfen geçerli bir e-posta adresi girin.', 'danger');
                return;
            }
            
            if (!validatePassword(password)) {
                showToast('Lütfen geçerli bir şifre girin.', 'danger');
                return;
            }
            
            showLoading();
            
            // API call
            fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.error) {
                    showToast(data.error, 'danger');
                    return;
                }
                
                // Store user data
                if (rememberMe) {
                    localStorage.setItem('userData', JSON.stringify(data));
                } else {
                    sessionStorage.setItem('userData', JSON.stringify(data));
                }
                
                showToast('Giriş başarılı. Yönlendiriliyorsunuz...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            })
            .catch(error => {
                hideLoading();
                showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'danger');
                console.error('Login error:', error);
            });
        });
    }
}

// Initialize register form
function initializeRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = registerForm.elements['name'].value;
            const email = registerForm.elements['email'].value;
            const password = registerForm.elements['password'].value;
            const confirmPassword = registerForm.elements['confirmPassword'].value;
            const termsAccepted = registerForm.elements['terms'].checked;
            
            if (!name) {
                showToast('Lütfen adınızı girin.', 'danger');
                return;
            }
            
            if (!validateEmail(email)) {
                showToast('Lütfen geçerli bir e-posta adresi girin.', 'danger');
                return;
            }
            
            if (!validatePassword(password)) {
                showToast('Şifre en az 8 karakter uzunluğunda olmalı ve en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir.', 'danger');
                return;
            }
            
            if (password !== confirmPassword) {
                showToast('Şifreler eşleşmiyor.', 'danger');
                return;
            }
            
            if (!termsAccepted) {
                showToast('Lütfen kullanım koşullarını kabul edin.', 'danger');
                return;
            }
            
            showLoading();
            
            // API call
            fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                
                if (data.error) {
                    showToast(data.error, 'danger');
                    return;
                }
                
                showToast('Kayıt başarılı. Giriş sayfasına yönlendiriliyorsunuz...');
                
                // Redirect to login page
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            })
            .catch(error => {
                hideLoading();
                showToast('Bir hata oluştu. Lütfen tekrar deneyin.', 'danger');
                console.error('Register error:', error);
            });
        });
    }
}

// Check authentication status
function checkAuth() {
    const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
    const currentPage = window.location.pathname.split('/').pop();
    
    if (userData) {
        // User is logged in
        if (currentPage === 'login.html' || currentPage === 'register.html') {
            // Redirect to dashboard if trying to access login/register pages
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is not logged in
        if (currentPage !== 'login.html' && currentPage !== 'register.html' && currentPage !== 'index.html') {
            // Redirect to login page if trying to access protected pages
            window.location.href = 'login.html';
        }
    }
}

// Logout
function logout() {
    // Clear storage
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userData');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// Helper functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    // En az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}

function showToast(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Kapat"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast container after animation
    toast.addEventListener('hidden.bs.toast', function() {
        toastContainer.remove();
    });
}

function showLoading() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Yükleniyor...</span>
        </div>
    `;
    document.body.appendChild(spinner);
}

function hideLoading() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
} 