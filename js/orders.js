// ===== Orders Module — Order Management =====

// Load customer orders (for history page)
async function loadCustomerOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;

    if (!currentUser) {
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <h3 class="empty-state-title">กรุณาเข้าสู่ระบบ</h3>
        <p class="empty-state-text">เข้าสู่ระบบเพื่อดูประวัติคำสั่งซื้อของคุณ</p>
        <button class="btn btn-primary" onclick="openAuthModal('login')" style="margin-top: var(--space-4);">เข้าสู่ระบบ</button>
      </div>`;
        return;
    }

    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    try {
        const snapshot = await db.collection('orders')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3 class="empty-state-title">ยังไม่มีคำสั่งซื้อ</h3>
          <p class="empty-state-text">เมื่อคุณสั่งซื้อสินค้า ออเดอร์จะแสดงที่นี่</p>
          <a href="/pages/products.html" class="btn btn-primary" style="margin-top: var(--space-4);">ดูสินค้า</a>
        </div>`;
            return;
        }

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            container.appendChild(createOrderCard(order));
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3 class="empty-state-title">โหลดไม่สำเร็จ</h3>
        <p class="empty-state-text">กรุณาลองใหม่อีกครั้ง</p>
      </div>`;
    }
}

// Create order card for customer
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';

    const statusBadge = getStatusBadge(order.status);

    card.innerHTML = `
    <div class="order-card-info">
      <div class="order-card-title">${order.productName}</div>
      <div class="order-card-detail">
        ${statusBadge}
        <span style="margin-left: var(--space-2);">${formatDate(order.createdAt)}</span>
      </div>
    </div>
    <div class="order-card-price">฿${formatPrice(order.price)}</div>
    <button class="order-card-menu" onclick="showOrderMenu('${order.id}')" title="ดูรายละเอียด">☰</button>
  `;
    return card;
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': '<span class="badge badge-warning">รอชำระ</span>',
        'paid': '<span class="badge badge-info">ชำระแล้ว</span>',
        'processing': '<span class="badge badge-primary">กำลังดำเนินการ</span>',
        'completed': '<span class="badge badge-success">สำเร็จ</span>',
        'cancelled': '<span class="badge badge-danger">ยกเลิก</span>'
    };
    return statusMap[status] || statusMap['pending'];
}

// Show order detail popup (3-line menu click)
async function showOrderMenu(orderId) {
    try {
        const doc = await db.collection('orders').doc(orderId).get();
        if (!doc.exists) {
            showToast('ไม่พบออเดอร์', 'error');
            return;
        }

        const order = doc.data();

        // Remove existing popup
        const existingBackdrop = document.getElementById('order-detail-backdrop');
        if (existingBackdrop) existingBackdrop.remove();
        const existingModal = document.getElementById('order-detail-modal');
        if (existingModal) existingModal.remove();

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.id = 'order-detail-backdrop';
        backdrop.onclick = () => closeOrderDetail();

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'order-detail-modal';
        modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">รายละเอียดออเดอร์</h3>
        <button class="modal-close" onclick="closeOrderDetail()">&times;</button>
      </div>
      <div style="margin-bottom: var(--space-5);">
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-muted);">สินค้า</span>
          <span style="font-weight: 600;">${order.productName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-muted);">ราคา</span>
          <span style="font-weight: 700; color: var(--color-secondary);">฿${formatPrice(order.price)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-muted);">สถานะ</span>
          <span>${getStatusBadge(order.status)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border);">
          <span style="color: var(--color-text-muted);">การชำระเงิน</span>
          <span>${order.paymentMethod === 'promptpay' ? '📱 พร้อมเพย์' : '🏦 โอนเงิน'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3);">
          <span style="color: var(--color-text-muted);">วันที่</span>
          <span>${formatDate(order.createdAt)}</span>
        </div>
      </div>
      ${order.credentials ? `
        <div style="background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.3); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4);">
          <h4 style="color: var(--color-success); margin-bottom: var(--space-3); font-size: var(--text-base);">🔑 ข้อมูลเข้าสู่ระบบ (จากแอดมิน)</h4>
          <div style="margin-bottom: var(--space-2);">
            <span style="color: var(--color-text-muted); font-size: var(--text-sm);">อีเมล:</span>
            <span style="font-weight: 600; font-family: var(--font-mono);">${order.credentials.email || '-'}</span>
          </div>
          <div>
            <span style="color: var(--color-text-muted); font-size: var(--text-sm);">รหัสผ่าน:</span>
            <span style="font-weight: 600; font-family: var(--font-mono);">${order.credentials.password || '-'}</span>
          </div>
        </div>
      ` : `
        <div style="background: rgba(243,156,18,0.1); border: 1px solid rgba(243,156,18,0.3); border-radius: var(--radius-md); padding: var(--space-4); text-align: center;">
          <p style="color: var(--color-warning); font-size: var(--text-sm); margin: 0;">⏳ รอแอดมินส่งข้อมูลเข้าสู่ระบบ</p>
        </div>
      `}
    `;

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error loading order detail:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    }
}

function closeOrderDetail() {
    const backdrop = document.getElementById('order-detail-backdrop');
    const modal = document.getElementById('order-detail-modal');
    if (backdrop) backdrop.remove();
    if (modal) modal.remove();
}

// Wait for auth before loading orders
function initHistoryPage() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI(user);
        loadCustomerOrders();
    });
}
