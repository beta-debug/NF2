// ===== Products Module — Firestore CRUD =====

// Load all products from Firestore
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🛒</div>
          <h3 class="empty-state-title">ยังไม่มีสินค้า</h3>
          <p class="empty-state-text">สินค้าจะแสดงเมื่อแอดมินเพิ่มสินค้าแล้ว</p>
        </div>`;
            return;
        }

        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            grid.appendChild(createProductCard(product));
        });

        // Re-init fade animations for new cards
        if (typeof initFadeAnimations === 'function') {
            initFadeAnimations();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">โหลดสินค้าไม่สำเร็จ</h3>
        <p class="empty-state-text">กรุณาตรวจสอบการเชื่อมต่อ Firebase</p>
      </div>`;
    }
}

// Load featured products for homepage
async function loadFeaturedProducts() {
    const grid = document.getElementById('featured-products');
    if (!grid) return;

    grid.innerHTML = '<div class="loader" style="grid-column: 1 / -1;"><div class="spinner"></div></div>';

    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').limit(3).get();

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
    card.innerHTML = `
    <div class="product-card-image">
      <img src="${product.imageUrl || '/images/package-1.webp'}" alt="${product.name}" 
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect fill=%22%231a1a2e%22 width=%22400%22 height=%22300%22/><text fill=%22%23666%22 x=%22200%22 y=%22150%22 text-anchor=%22middle%22 font-size=%2216%22>No Image</text></svg>'">
      ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}
    </div>
    <div class="product-card-body">
      <h3 class="product-card-title">${product.name}</h3>
      <p class="product-card-description">${product.description || ''}</p>
      <div class="product-card-footer">
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
    if (!currentUser) {
        showToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ', 'warning');
        openAuthModal('login');
        return;
    }

    // Show payment choice
    showPaymentModal(productId, productName, price);
}

// Payment modal
function showPaymentModal(productId, productName, price) {
    // Remove existing modal if any
    const existing = document.getElementById('payment-modal-backdrop');
    if (existing) existing.remove();
    const existingModal = document.getElementById('payment-modal');
    if (existingModal) existingModal.remove();

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
    if (!currentUser) return;

    try {
        const orderData = {
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email.split('@')[0],
            userEmail: currentUser.email,
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

        // Redirect to payment page
        setTimeout(() => {
            window.location.href = `/pages/payment.html?orderId=${docRef.id}&method=${paymentMethod}`;
        }, 1000);
    } catch (error) {
        console.error('Error creating order:', error);
        showToast('เกิดข้อผิดพลาดในการสั่งซื้อ', 'error');
    }
}
