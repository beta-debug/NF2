// ===== Products Module — Firestore CRUD =====

let allProducts = [];
let allCategories = [];
const productsGrid = document.getElementById('products-grid');
const categorySelect = document.getElementById('category-select');
const productSearch = document.getElementById('product-search');

// DOM Elements & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
});

// Load all products from Firestore
async function loadProducts() {
    if (!productsGrid) return;

    productsGrid.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    try {
        const snapshot = await db.collection('products').orderBy('updatedAt', 'desc').get();
        allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">โหลดสินค้าไม่สำเร็จ</h3>
        <p class="empty-state-text">กรุณาตรวจสอบการเชื่อมต่อ Firebase</p>
      </div>`;
    }
}

// Load categories for filter
async function loadCategories() {
    if (!categorySelect) return;
    try {
        const snapshot = await db.collection('categories').orderBy('name').get();
        allCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        allCategories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            categorySelect.appendChild(opt);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Filter products based on search and category
function filterProducts() {
    if (!productSearch || !allProducts.length) return;

    const searchTerm = productSearch.value.toLowerCase().trim();
    const selectedCategory = categorySelect ? categorySelect.value : 'all';

    const filtered = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    renderProducts(filtered);
}

// Render products to grid
function renderProducts(products) {
    if (!productsGrid) return;

    if (products.length === 0) {
        productsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🛒</div>
          <h3 class="empty-state-title">ไม่พบสินค้า</h3>
          <p class="empty-state-text">ลองค้นหาด้วยคำอื่นหรือเปลี่ยนหมวดหมู่</p>
        </div>`;
        return;
    }

    productsGrid.innerHTML = '';
    products.forEach(product => {
        productsGrid.appendChild(createProductCard(product));
    });

    // Re-init fade animations for new cards
    if (typeof initFadeAnimations === 'function') {
        initFadeAnimations();
    }
}

// Load featured products for homepage
async function loadFeaturedProducts() {
    const grid = document.getElementById('featured-products');
    if (!grid) return;

    grid.innerHTML = '<div class="loader" style="grid-column: 1 / -1;"><div class="spinner"></div></div>';

    try {
        const snapshot = await db.collection('products').orderBy('updatedAt', 'desc').limit(3).get();

        if (snapshot.empty) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🛒</div>
          <h3 class="empty-state-title">เร็วๆ นี้</h3>
          <p class="empty-state-text">สินค้าใหม่กำลังจะมา</p>
        </div>`;
            return;
        }

        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            grid.appendChild(createProductCard(product));
        });
    } catch (error) {
        console.error('Error loading featured:', error);
        grid.innerHTML = '';
    }
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';

    // Process description into lines if it exists
    let descriptionHTML = '';
    if (product.description) {
        const lines = product.description.split('\n').filter(line => line.trim() !== '');
        descriptionHTML = `<ul class="product-card-description-list">
            ${lines.map(line => `<li><span class="check-icon">✓</span> ${line.trim()}</li>`).join('')}
        </ul>`;
    }

    card.innerHTML = `
    <div class="product-card-image">
      <img src="${product.imageUrl || '/images/package-1.webp'}" alt="${product.name}" 
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect fill=%22%231a1a2e%22 width=%22400%22 height=%22300%22/><text fill=%22%23666%22 x=%22200%22 y=%22150%22 text-anchor=%22middle%22 font-size=%2216%22>No Image</text></svg>'">
      ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
    </div>
    <div class="product-card-body" style="flex-grow:1; display:flex; flex-direction:column;">
      <h3 class="product-card-title">${product.name}</h3>
      <div class="product-card-description" style="flex-grow:1;">${descriptionHTML}</div>
      <div class="product-card-footer" style="margin-top:auto;">
        <div class="product-card-price">
          <span class="currency">฿</span>${formatPrice(product.price)}
        </div>
        <button class="btn btn-primary btn-sm" onclick="orderProduct('${product.id}', '${product.name.replace(/'/g, "\\'")}', ${product.price})">
          สั่งซื้อ
        </button>
      </div>
    </div>
  `;
    return card;
}

// Order product
async function orderProduct(productId, productName, price) {
    // Check if auth is available
    if (typeof currentUser === 'undefined') {
        // Fallback to simpler check if currentUser isn't globally available yet
        const userRole = localStorage.getItem('userRole');
        if (!userRole) {
            showToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ', 'warning');
            setTimeout(() => { window.location.href = '/pages/admin.html'; }, 1500);
            return;
        }
    } else if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ', 'warning');
        if (typeof openAuthModal === 'function') openAuthModal('login');
        else setTimeout(() => { window.location.href = '/pages/admin.html'; }, 1500);
        return;
    }

    // Show payment choice
    showPaymentModal(productId, productName, price);
}

// Payment modal
function showPaymentModal(productId, productName, price) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop active';
    backdrop.id = 'payment-modal-backdrop';
    backdrop.onclick = () => closePaymentModal();

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'payment-modal';
    modal.style.maxWidth = '500px';
    modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">ยืนยันการสั่งซื้อ</h3>
      <button class="modal-close" onclick="closePaymentModal()">&times;</button>
    </div>
    <div style="background: var(--color-surface); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-5);">
      <p style="font-weight: 600; margin-bottom: var(--space-2); color: var(--color-text);">${productName}</p>
      <p style="font-size: var(--text-2xl); font-weight: 800; color: var(--color-secondary);">฿${formatPrice(price)}</p>
    </div>
    <h4 style="margin-bottom: var(--space-4); font-size: var(--text-base);">เลือกช่องทางชำระเงิน</h4>
    <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-6);">
      <button class="btn btn-secondary btn-block" onclick="confirmOrder('${productId}', '${productName.replace(/'/g, "\\'")}', ${price}, 'promptpay')" style="justify-content: flex-start; padding: var(--space-4);">
        📱 พร้อมเพย์ / QR Code
      </button>
      <button class="btn btn-secondary btn-block" onclick="confirmOrder('${productId}', '${productName.replace(/'/g, "\\'")}', ${price}, 'transfer')" style="justify-content: flex-start; padding: var(--space-4);">
        🏦 โอนเงิน เลขบัญชี
      </button>
    </div>
  `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
}

function closePaymentModal() {
    const backdrop = document.getElementById('payment-modal-backdrop');
    const modal = document.getElementById('payment-modal');
    if (backdrop) backdrop.remove();
    if (modal) modal.remove();
}

// Confirm order and redirect to payment page
async function confirmOrder(productId, productName, price, paymentMethod) {
    try {
        const userId = typeof currentUser !== 'undefined' && currentUser ? currentUser.uid : 'anonymous';
        const userEmail = typeof currentUser !== 'undefined' && currentUser ? currentUser.email : 'guest';
        const userName = typeof currentUser !== 'undefined' && currentUser ? (currentUser.displayName || userEmail.split('@')[0]) : 'guest';

        const orderData = {
            userId: userId,
            userName: userName,
            userEmail: userEmail,
            productId: productId,
            productName: productName,
            price: price,
            paymentMethod: paymentMethod,
            status: 'pending',
            credentials: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('orders').add(orderData);
        closePaymentModal();
        showToast('สร้างออเดอร์สำเร็จ! กำลังไปหน้าชำระเงิน...', 'success');

        setTimeout(() => {
            window.location.href = `/pages/payment.html?orderId=${docRef.id}&method=${paymentMethod}`;
        }, 1000);
    } catch (error) {
        console.error('Error creating order:', error);
        showToast('เกิดข้อผิดพลาดในการสั่งซื้อ', 'error');
    }
}

// Formatting price with commas
function formatPrice(price) {
    return Number(price).toLocaleString('en-US');
}

// Ensure functions are global
window.filterProducts = filterProducts;
window.orderProduct = orderProduct;
window.formatPrice = formatPrice;
window.confirmOrder = confirmOrder;
window.closePaymentModal = closePaymentModal;
window.loadProducts = loadProducts;
window.loadFeaturedProducts = loadFeaturedProducts;
