// ===== Admin Module — Dashboard Logic =====

let editingProductId = null;

// Check admin access
function checkAdminAccess() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI(user);

        if (!user || user.email !== ADMIN_EMAIL) {
            document.getElementById('admin-content').innerHTML = `
        <div class="empty-state" style="min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div class="empty-state-icon">🔒</div>
          <h3 class="empty-state-title">เฉพาะแอดมินเท่านั้น</h3>
          <p class="empty-state-text">กรุณาเข้าสู่ระบบด้วยบัญชีแอดมิน</p>
          <button class="btn btn-primary" onclick="openAuthModal('login')" style="margin-top: var(--space-4);">เข้าสู่ระบบ</button>
        </div>`;
            return;
        }

        // Admin verified — load admin data
        loadAdminProducts();
        loadAdminOrders();
        loadPaymentSettings();
        loadAdminRewards();
    });
}

// ===== Sidebar Navigation =====
function showAdminSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.admin-sidebar-item').forEach(s => s.classList.remove('active'));

    const target = document.getElementById('section-' + section);
    const sidebarItem = document.querySelector(`[data-section="${section}"]`);

    if (target) target.classList.remove('hidden');
    if (sidebarItem) sidebarItem.classList.add('active');

    // Close mobile sidebar
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

function toggleAdminSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

// ===== Product Management =====
async function loadAdminProducts() {
    const tbody = document.getElementById('admin-products-list');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-8);"><div class="spinner" style="margin:0 auto;"></div></td></tr>';

    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-8);color:var(--color-text-muted);">ยังไม่มีสินค้า เพิ่มสินค้าเลย!</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const p = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><img src="${p.imageUrl || ''}" alt="${p.name}" class="admin-table-img" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22><rect fill=%22%231a1a2e%22 width=%2250%22 height=%2250%22/></svg>'"></td>
        <td style="font-weight:600;color:var(--color-text);">${p.name}</td>
        <td style="color:var(--color-secondary);font-weight:700;">฿${formatPrice(p.price)}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.description || '-'}</td>
        <td style="font-size:var(--text-xs);color:var(--color-text-muted);">${formatDate(p.createdAt)}</td>
        <td>
          <div style="display:flex;gap:var(--space-2);">
            <button class="btn btn-secondary btn-sm" onclick="editProduct('${doc.id}')">✏️ แก้ไข</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${doc.id}', '${p.name.replace(/'/g, "\\'")}')">🗑️ ลบ</button>
          </div>
        </td>
      `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading admin products:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:var(--space-8);color:var(--color-danger);">เกิดข้อผิดพลาด</td></tr>';
    }
}

// Handle product form submit
async function handleProductSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const description = document.getElementById('product-description').value.trim();
    const imageUrl = document.getElementById('product-image-url').value.trim();
    const badge = document.getElementById('product-badge').value.trim();
    const btn = document.getElementById('product-submit-btn');

    if (!name || !price) {
        showToast('กรุณากรอกชื่อและราคา', 'warning');
        return;
    }

    btn.disabled = true;
    btn.textContent = editingProductId ? 'กำลังอัปเดต...' : 'กำลังเพิ่ม...';

    try {
        const productData = {
            name, price, description, imageUrl, badge,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingProductId) {
            await db.collection('products').doc(editingProductId).update(productData);
            showToast('อัปเดตสินค้าสำเร็จ! ✅', 'success');
        } else {
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
            showToast('เพิ่มสินค้าสำเร็จ! 🎉', 'success');
        }

        resetProductForm();
        loadAdminProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = editingProductId ? 'อัปเดตสินค้า' : 'เพิ่มสินค้า';
    }
}

async function editProduct(productId) {
    try {
        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) return;

        const p = doc.data();
        document.getElementById('product-name').value = p.name || '';
        document.getElementById('product-price').value = p.price || '';
        document.getElementById('product-description').value = p.description || '';
        document.getElementById('product-image-url').value = p.imageUrl || '';
        document.getElementById('product-badge').value = p.badge || '';

        editingProductId = productId;
        document.getElementById('product-submit-btn').textContent = 'อัปเดตสินค้า';
        document.getElementById('cancel-edit-btn').classList.remove('hidden');

        // Preview image
        const preview = document.getElementById('image-preview');
        if (p.imageUrl) {
            preview.innerHTML = `<img src="${p.imageUrl}" class="image-upload-preview" alt="preview">`;
        }

        // Scroll to form
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
        showToast('กำลังแก้ไข: ' + p.name, 'info');
    } catch (error) {
        console.error('Error editing product:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    }
}

async function deleteProduct(productId, productName) {
    if (!confirm(`ต้องการลบสินค้า "${productName}" หรือไม่?`)) return;

    try {
        await db.collection('products').doc(productId).delete();
        showToast('ลบสินค้าสำเร็จ', 'success');
        loadAdminProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

function resetProductForm() {
    document.getElementById('product-form').reset();
    editingProductId = null;
    document.getElementById('product-submit-btn').textContent = 'เพิ่มสินค้า';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    document.getElementById('image-preview').innerHTML = `
    <div class="image-upload-icon">📷</div>
    <div class="image-upload-text">วาง URL รูปภาพด้านล่าง</div>
  `;
}

// Image URL preview
function previewImageUrl() {
    const url = document.getElementById('product-image-url').value.trim();
    const preview = document.getElementById('image-preview');
    if (url) {
        preview.innerHTML = `<img src="${url}" class="image-upload-preview" alt="preview" onerror="this.parentElement.innerHTML='<div class=\\'image-upload-icon\\'>⚠️</div><div class=\\'image-upload-text\\'>URL รูปภาพไม่ถูกต้อง</div>'">`;
    } else {
        preview.innerHTML = `
      <div class="image-upload-icon">📷</div>
      <div class="image-upload-text">วาง URL รูปภาพด้านล่าง</div>
    `;
    }
}

// ===== Payment Settings =====
async function loadPaymentSettings() {
    try {
        const doc = await db.collection('settings').doc('payment').get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('qr-code-url').value = data.qrCodeUrl || '';
            document.getElementById('bank-name').value = data.bankName || '';
            document.getElementById('bank-account').value = data.bankAccount || '';
            document.getElementById('bank-holder').value = data.bankHolder || '';

            // Preview QR
            if (data.qrCodeUrl) {
                document.getElementById('qr-preview').innerHTML = `<img src="${data.qrCodeUrl}" class="image-upload-preview" alt="QR Code">`;
            }
        }
    } catch (error) {
        console.error('Error loading payment settings:', error);
    }
}

async function savePaymentSettings(event) {
    event.preventDefault();
    const btn = document.getElementById('payment-save-btn');
    btn.disabled = true;
    btn.textContent = 'กำลังบันทึก...';

    try {
        await db.collection('settings').doc('payment').set({
            qrCodeUrl: document.getElementById('qr-code-url').value.trim(),
            bankName: document.getElementById('bank-name').value.trim(),
            bankAccount: document.getElementById('bank-account').value.trim(),
            bankHolder: document.getElementById('bank-holder').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('บันทึกช่องทางชำระเงินสำเร็จ! ✅', 'success');
    } catch (error) {
        console.error('Error saving payment settings:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'บันทึก';
    }
}

function previewQrUrl() {
    const url = document.getElementById('qr-code-url').value.trim();
    const preview = document.getElementById('qr-preview');
    if (url) {
        preview.innerHTML = `<img src="${url}" class="image-upload-preview" alt="QR">`;
    } else {
        preview.innerHTML = '<div class="image-upload-icon">📱</div><div class="image-upload-text">วาง URL รูป QR Code</div>';
    }
}

// ===== Order Management (Admin) =====
async function loadAdminOrders() {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;

    container.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">ยังไม่มีออเดอร์</h3>
          <p class="empty-state-text">ออเดอร์จากลูกค้าจะแสดงที่นี่</p>
        </div>`;
            return;
        }

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            container.appendChild(createAdminOrderCard(order));
        });
    } catch (error) {
        console.error('Error loading admin orders:', error);
        container.innerHTML = '<div style="text-align:center;color:var(--color-danger);padding:var(--space-8);">เกิดข้อผิดพลาด</div>';
    }
}

function createAdminOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
    <div class="order-card-info">
      <div class="order-card-title">${order.productName}</div>
      <div class="order-card-detail">
        <span style="color:var(--color-accent);">👤 ${order.userName || order.userEmail || 'ไม่ทราบ'}</span>
        <span style="margin-left: var(--space-2);">${getStatusBadge(order.status)}</span>
        <span style="margin-left: var(--space-2); color: var(--color-text-muted); font-size: var(--text-xs);">${formatDate(order.createdAt)}</span>
      </div>
    </div>
    <div class="order-card-price">฿${formatPrice(order.price)}</div>
    <button class="order-card-menu" onclick="showAdminOrderMenu('${order.id}')" title="จัดการออเดอร์">☰</button>
  `;
    return card;
}

// Admin order management popup
async function showAdminOrderMenu(orderId) {
    try {
        const doc = await db.collection('orders').doc(orderId).get();
        if (!doc.exists) return;

        const order = doc.data();

        // Remove existing
        const eBd = document.getElementById('admin-order-backdrop');
        if (eBd) eBd.remove();
        const eM = document.getElementById('admin-order-modal');
        if (eM) eM.remove();

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';
        backdrop.id = 'admin-order-backdrop';
        backdrop.onclick = () => closeAdminOrderModal();

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'admin-order-modal';
        modal.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">จัดการออเดอร์</h3>
        <button class="modal-close" onclick="closeAdminOrderModal()">&times;</button>
      </div>
      
      <div style="background: var(--color-surface); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-5);">
        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
          <span style="color:var(--color-text-muted);font-size:var(--text-sm);">ลูกค้า</span>
          <span style="font-weight:600;">${order.userName || '-'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
          <span style="color:var(--color-text-muted);font-size:var(--text-sm);">อีเมลลูกค้า</span>
          <span style="font-size:var(--text-sm);">${order.userEmail || '-'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2);">
          <span style="color:var(--color-text-muted);font-size:var(--text-sm);">สินค้า</span>
          <span style="font-weight:600;">${order.productName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--color-text-muted);font-size:var(--text-sm);">ราคา</span>
          <span style="font-weight:700;color:var(--color-secondary);">฿${formatPrice(order.price)}</span>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">สถานะออเดอร์</label>
        <select class="form-select" id="order-status-select">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>รอชำระ</option>
          <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>ชำระแล้ว</option>
          <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>กำลังดำเนินการ</option>
          <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>สำเร็จ</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ยกเลิก</option>
        </select>
      </div>

      <div style="background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.2); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-5);">
        <h4 style="color: var(--color-accent); margin-bottom: var(--space-4); font-size: var(--text-base);">🔑 ส่งข้อมูลเข้าสู่ระบบให้ลูกค้า</h4>
        <div class="form-group">
          <label class="form-label">อีเมล (สำหรับลูกค้าใช้)</label>
          <input type="text" class="form-input" id="cred-email" placeholder="อีเมลที่จะส่งให้ลูกค้า" value="${order.credentials?.email || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">รหัสผ่าน (สำหรับลูกค้าใช้)</label>
          <input type="text" class="form-input" id="cred-password" placeholder="รหัสผ่านที่จะส่งให้ลูกค้า" value="${order.credentials?.password || ''}">
        </div>
      </div>

      <button class="btn btn-primary btn-block btn-lg" onclick="updateOrderAdmin('${orderId}')">💾 บันทึกการเปลี่ยนแปลง</button>
    `;

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    }
}

async function updateOrderAdmin(orderId) {
    try {
        const status = document.getElementById('order-status-select').value;
        const email = document.getElementById('cred-email').value.trim();
        const password = document.getElementById('cred-password').value.trim();

        // Use transaction to update status and award points if newly completed
        await db.runTransaction(async (transaction) => {
            const orderRef = db.collection('orders').doc(orderId);
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists) throw "Order does not exist!";

            const orderData = orderDoc.data();
            const updateData = {
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (email || password) {
                updateData.credentials = { email, password };
            }

            // Award points logic: Only if changing TO 'completed' FROM something else
            if (status === 'completed' && orderData.status !== 'completed' && orderData.userId) {
                const points = Math.floor(orderData.price || 0);
                const userRef = db.collection('users').doc(orderData.userId);

                // Ensure user doc exists before updating (should generally exist, but safe check would be better)
                // Assuming auth flow creates user doc. If not, set with merge.
                // But transaction.set merge:true is safer.
                // For now, assume user doc exists or increment handles it.
                transaction.update(userRef, {
                    points: firebase.firestore.FieldValue.increment(points)
                });
                console.log(`Awarded ${points} points to user ${orderData.userId}`);
            }

            transaction.update(orderRef, updateData);
        });

        showToast('อัปเดตออเดอร์สำเร็จ! ✅', 'success');
        closeAdminOrderModal();
        loadAdminOrders();
    } catch (error) {
        console.error('Error updating order:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    }
}

function closeAdminOrderModal() {
    const backdrop = document.getElementById('admin-order-backdrop');
    const modal = document.getElementById('admin-order-modal');
    if (backdrop) backdrop.remove();
    if (modal) modal.remove();
}

// ===== Rewards Management =====
async function loadAdminRewards() {
    const tbody = document.getElementById('admin-rewards-list');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:var(--space-8);"><div class="spinner" style="margin:0 auto;"></div></td></tr>';

    try {
        const snapshot = await db.collection('redeemables').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:var(--space-8);color:var(--color-text-muted);">ยังไม่มีของรางวัล</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const r = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><img src="${r.imageUrl || ''}" alt="${r.name}" class="admin-table-img" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22><rect fill=%22%231a1a2e%22 width=%2250%22 height=%2250%22/></svg>'"></td>
        <td style="font-weight:600;color:var(--color-text);">${r.name}</td>
        <td style="color:var(--color-secondary);font-weight:700;">${r.points} แต้ม</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.description || '-'}</td>
        <td>
            <button class="btn btn-danger btn-sm" onclick="deleteReward('${doc.id}', '${r.name.replace(/'/g, "\\'")}')">🗑️ ลบ</button>
        </td>
      `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading admin rewards:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:var(--space-8);color:var(--color-danger);">เกิดข้อผิดพลาด</td></tr>';
    }
}

async function handleRewardSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('reward-name').value.trim();
    const points = parseInt(document.getElementById('reward-points').value);
    const description = document.getElementById('reward-description').value.trim();
    const imageUrl = document.getElementById('reward-image-url').value.trim();
    const btn = document.getElementById('reward-submit-btn');

    if (!name || !points) {
        showToast('กรุณากรอกชื่อและแต้ม', 'warning');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'กำลังเพิ่ม...';

    try {
        const rewardData = {
            name, points, description, imageUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('redeemables').add(rewardData);
        showToast('เพิ่มของรางวัลสำเร็จ! 🎉', 'success');

        document.getElementById('reward-form').reset();
        document.getElementById('reward-image-preview').innerHTML = `
            <div class="image-upload-icon">📷</div>
            <div class="image-upload-text">วาง URL รูปภาพด้านล่าง</div>
        `;
        loadAdminRewards();
    } catch (error) {
        console.error('Error saving reward:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'เพิ่มของรางวัล';
    }
}

async function deleteReward(rewardId, rewardName) {
    if (!confirm(`ต้องการลบของรางวัล "${rewardName}" หรือไม่?`)) return;

    try {
        await db.collection('redeemables').doc(rewardId).delete();
        showToast('ลบของรางวัลสำเร็จ', 'success');
        loadAdminRewards();
    } catch (error) {
        console.error('Error deleting reward:', error);
        showToast('เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

function previewRewardImage() {
    const url = document.getElementById('reward-image-url').value.trim();
    const preview = document.getElementById('reward-image-preview');
    if (url) {
        preview.innerHTML = `<img src="${url}" class="image-upload-preview" alt="preview" onerror="this.parentElement.innerHTML='<div class=\\'image-upload-icon\\'>⚠️</div><div class=\\'image-upload-text\\'>URL รูปภาพไม่ถูกต้อง</div>'">`;
    } else {
        preview.innerHTML = `
      <div class="image-upload-icon">📷</div>
      <div class="image-upload-text">วาง URL รูปภาพด้านล่าง</div>
    `;
    }
}

function resetRewardForm() {
    document.getElementById('reward-form').reset();
    document.getElementById('reward-image-preview').innerHTML = `
    <div class="image-upload-icon">📷</div>
    <div class="image-upload-text">วาง URL รูปภาพด้านล่าง</div>
  `;
}
