// DOM Elements
const profileForm = document.getElementById('profileForm');
const securityForm = document.getElementById('securityForm');
const notificationsForm = document.getElementById('notificationsForm');
const photoForm = document.getElementById('photoForm');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const activityTableBody = document.getElementById('activityTableBody');

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    loadUserProfile();
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Profil bilgileri alınamadı');
        }

        const user = await response.json();
        
        // Update UI
        userName.textContent = `${user.firstName} ${user.lastName}`;
        profileName.textContent = `${user.firstName} ${user.lastName}`;
        profileEmail.textContent = user.email;

        // Fill form fields
        profileForm.firstName.value = user.firstName;
        profileForm.lastName.value = user.lastName;
        profileForm.email.value = user.email;
        profileForm.phone.value = user.phone || '';
        profileForm.address.value = user.address || '';

        // Load activity history
        loadActivityHistory();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Load activity history
async function loadActivityHistory() {
    try {
        const response = await fetch('/api/auth/activity', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Aktivite geçmişi alınamadı');
        }

        const activities = await response.json();
        
        // Clear existing rows
        activityTableBody.innerHTML = '';

        // Add activity rows
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(activity.date).toLocaleString()}</td>
                <td>${activity.action}</td>
                <td>${activity.details}</td>
                <td>${activity.ipAddress}</td>
            `;
            activityTableBody.appendChild(row);
        });
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Update profile
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!profileForm.checkValidity()) {
        e.stopPropagation();
        profileForm.classList.add('was-validated');
        return;
    }

    try {
        const formData = new FormData(profileForm);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Profil güncellenemedi');
        }

        showToast('Profil başarıyla güncellendi', 'success');
        loadUserProfile();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Update password
securityForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!securityForm.checkValidity()) {
        e.stopPropagation();
        securityForm.classList.add('was-validated');
        return;
    }

    const newPassword = securityForm.newPassword.value;
    const confirmPassword = securityForm.confirmPassword.value;

    if (newPassword !== confirmPassword) {
        securityForm.confirmPassword.setCustomValidity('Şifreler eşleşmiyor');
        e.stopPropagation();
        securityForm.classList.add('was-validated');
        return;
    }

    try {
        const formData = new FormData(securityForm);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch('/api/auth/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Şifre güncellenemedi');
        }

        showToast('Şifre başarıyla güncellendi', 'success');
        securityForm.reset();
        securityForm.classList.remove('was-validated');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Update notifications
notificationsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const data = {
            emailNotifications: notificationsForm.emailNotifications.checked,
            smsNotifications: notificationsForm.smsNotifications.checked,
            lowStockNotifications: notificationsForm.lowStockNotifications.checked,
            orderNotifications: notificationsForm.orderNotifications.checked
        };

        const response = await fetch('/api/auth/notifications', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Bildirim ayarları güncellenemedi');
        }

        showToast('Bildirim ayarları başarıyla güncellendi', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Update profile photo
photoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const formData = new FormData(photoForm);
        const response = await fetch('/api/auth/photo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Profil fotoğrafı güncellenemedi');
        }

        showToast('Profil fotoğrafı başarıyla güncellendi', 'success');
        loadUserProfile();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePhotoModal'));
        modal.hide();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Logout
logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.querySelector('.toast');
    const toastBody = toast.querySelector('.toast-body');
    
    // Update toast style based on type
    toast.className = 'toast';
    toast.classList.add(`bg-${type === 'error' ? 'danger' : type}`);
    
    // Update icon based on type
    const icon = toast.querySelector('.fas');
    icon.className = 'fas';
    switch (type) {
        case 'success':
            icon.classList.add('fa-check-circle');
            break;
        case 'error':
            icon.classList.add('fa-exclamation-circle');
            break;
        default:
            icon.classList.add('fa-info-circle');
    }
    
    toastBody.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize
checkAuth();

// Profile functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load user profile
    loadUserProfile();
    
    // Initialize profile form
    initializeProfileForm();
    
    // Initialize password form
    initializePasswordForm();
});

// Initialize profile form
function initializeProfileForm() {
    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = profileForm.elements['name'].value;
            const email = profileForm.elements['email'].value;
            
            if (!name) {
                showToast('Lütfen adınızı girin.', 'danger');
                return;
            }
            
            if (!validateEmail(email)) {
                showToast('Lütfen geçerli bir e-posta adresi girin.', 'danger');
                return;
            }
            
            showLoading();
            
            // Simulated API call - replace with actual API call
            setTimeout(() => {
                hideLoading();
                
                // Update user data in storage
                const userData = JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData'));
                userData.name = name;
                userData.email = email;
                
                if (localStorage.getItem('userData')) {
                    localStorage.setItem('userData', JSON.stringify(userData));
                } else {
                    sessionStorage.setItem('userData', JSON.stringify(userData));
                }
                
                // Update profile info
                const profileName = document.getElementById('profileName');
                if (profileName) {
                    profileName.textContent = name;
                }
                
                const profileEmail = document.getElementById('profileEmail');
                if (profileEmail) {
                    profileEmail.textContent = email;
                }
                
                showToast('Profil bilgileri başarıyla güncellendi.');
            }, 1000);
        });
    }
}

// Initialize password form
function initializePasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = passwordForm.elements['currentPassword'].value;
            const newPassword = passwordForm.elements['newPassword'].value;
            const confirmPassword = passwordForm.elements['confirmPassword'].value;
            
            if (!currentPassword) {
                showToast('Lütfen mevcut şifrenizi girin.', 'danger');
                return;
            }
            
            if (!validatePassword(newPassword)) {
                showToast('Yeni şifre en az 8 karakter uzunluğunda olmalı ve en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir.', 'danger');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showToast('Yeni şifreler eşleşmiyor.', 'danger');
                return;
            }
            
            showLoading();
            
            // Simulated API call - replace with actual API call
            setTimeout(() => {
                hideLoading();
                showToast('Şifre başarıyla güncellendi.');
                passwordForm.reset();
            }, 1000);
        });
    }
}

// Update profile photo
function updateProfilePhoto() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                showToast('Dosya boyutu 5MB\'dan küçük olmalıdır.', 'danger');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const profilePhoto = document.getElementById('profilePhoto');
                if (profilePhoto) {
                    profilePhoto.src = e.target.result;
                }
                
                showToast('Profil fotoğrafı başarıyla güncellendi.');
            };
            reader.readAsDataURL(file);
        }
    });
    
    fileInput.click();
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