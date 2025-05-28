// DOM Elements
const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');

// Event Listeners
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
}

// Functions
async function handleLogin(e) {
    e.preventDefault();

    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const rememberMe = document.querySelector('#rememberMe').checked;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Giriş başarısız');
        }

        // Store token
        localStorage.setItem('token', data.token);
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        }

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        showToast(error.message, 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#confirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Şifreler eşleşmiyor', 'danger');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Kayıt başarısız');
        }

        showToast('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        showToast(error.message, 'danger');
    }
} 