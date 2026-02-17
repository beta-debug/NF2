// ===== Main.js — Component Loader + UI Interactions =====

// Load component HTML into page
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error('Component load error:', error);
    }
}

// Initialize components and app
document.addEventListener('DOMContentLoaded', async () => {
    // Load header and footer
    await loadComponent('header-placeholder', '/components/header.html');
    await loadComponent('footer-placeholder', '/components/footer.html');

    // Highlight active nav link
    highlightActiveNav();

    // Initialize scroll effects
    initScrollEffects();

    // Initialize fade-in animations
    initFadeAnimations();

    // Check auth state
    if (typeof initAuth === 'function') {
        initAuth();
    }

    // Load products if on appropriate page
    if (typeof loadProducts === 'function') {
        loadProducts();
    }

    // Load featured products on home page
    // Load featured products on home page
    if (typeof loadFeaturedProducts === 'function') {
        loadFeaturedProducts();
    }

    // Load contact channels
    loadContactChannels();
});

// ===== Navigation =====
function highlightActiveNav() {
    const currentPath = window.location.pathname;
    setTimeout(() => {
        const navLinks = document.querySelectorAll('.header-nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath === href ||
                (currentPath.endsWith('/') && href === '/index.html') ||
                (currentPath.endsWith('index.html') && href === '/index.html')) {
                link.classList.add('active');
            }
        });
    }, 100);
}

// Mobile nav toggle
function toggleMobileNav() {
    const nav = document.getElementById('main-nav');
    const toggle = document.getElementById('nav-toggle');
    nav.classList.toggle('active');
    toggle.classList.toggle('active');
}

// ===== Scroll Effects =====
function initScrollEffects() {
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
    });
}

// ===== Fade-in Animations =====
function initFadeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Re-observe after dynamic content loads
    setTimeout(() => {
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
    }, 1000);
}

// ===== Auth Modal =====
function openAuthModal(tab = 'login') {
    const backdrop = document.getElementById('auth-backdrop');
    const modal = document.getElementById('auth-modal');
    backdrop.classList.add('active');
    modal.classList.add('active');
    switchAuthTab(tab);
}

function closeAuthModal() {
    const backdrop = document.getElementById('auth-backdrop');
    const modal = document.getElementById('auth-modal');
    backdrop.classList.remove('active');
    modal.classList.remove('active');
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const title = document.getElementById('auth-modal-title');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        title.textContent = 'เข้าสู่ระบบ';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        title.textContent = 'สมัครสมาชิก';
    }
}

// ===== User Dropdown =====
function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('user-dropdown');
    const userMenu = document.getElementById('user-menu');
    if (dropdown && userMenu && !userMenu.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ===== Utility Functions =====
function formatPrice(price) {
    return Number(price).toLocaleString('th-TH');
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== Floating Contact Button =====
async function loadContactChannels() {
    if (window.location.pathname.includes('admin')) return;

    try {
        if (typeof db === 'undefined') return;

        const snapshot = await db.collection('contact_channels').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) return;

        const container = document.createElement('div');
        container.className = 'floating-contact-container';

        let contactsHtml = '';
        snapshot.forEach(doc => {
            const c = doc.data();
            let icon = '🔗';
            let bgColor = c.color || '#333';

            if (c.type === 'line') { icon = '💬'; bgColor = c.color || '#06C755'; }
            if (c.type === 'facebook') { icon = '📘'; bgColor = c.color || '#1877F2'; }
            if (c.type === 'instagram') { icon = '📸'; bgColor = c.color || '#E1306C'; }
            if (c.type === 'tiktok') { icon = '🎵'; bgColor = c.color || '#000000'; }
            if (c.type === 'phone') { icon = '📞'; bgColor = c.color || '#2ECC71'; }

            contactsHtml += `
                <a href="${c.value}" target="_blank" class="contact-item">
                    <div class="contact-icon" style="background:${bgColor}">${icon}</div>
                    <div class="contact-info">
                        <span class="contact-name">${c.name}</span>
                        <span class="contact-desc">${c.type.toUpperCase()}</span>
                    </div>
                </a>
            `;
        });

        container.innerHTML = `
            <div class="contact-list-popup" id="contact-popup">
                <div class="contact-list-header">ติดต่อเรา</div>
                ${contactsHtml}
            </div>
            <div class="floating-contact-btn" onclick="toggleContactPopup()">
                💬
            </div>
        `;

        document.body.appendChild(container);

        document.addEventListener('click', (e) => {
            const popup = document.getElementById('contact-popup');
            const btn = document.querySelector('.floating-contact-btn');
            if (popup && popup.classList.contains('active') && !popup.contains(e.target) && !btn.contains(e.target)) {
                popup.classList.remove('active');
            }
        });

    } catch (error) {
        console.error('Error loading contact channels:', error);
    }
}

function toggleContactPopup() {
    const popup = document.getElementById('contact-popup');
    if (popup) popup.classList.toggle('active');
}
