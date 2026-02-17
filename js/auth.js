// ===== Auth Module — Firebase Authentication =====

let currentUser = null;

function initAuth() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthUI(user);
    });
}

function updateAuthUI(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const adminLink = document.getElementById('admin-link');

    if (!authButtons || !userMenu) return;

    if (user) {
        authButtons.classList.add('hidden');
        userMenu.classList.remove('hidden');

        // Set user info
        const avatar = document.getElementById('user-avatar');
        const displayName = document.getElementById('user-display-name');

        if (avatar) {
            const name = user.displayName || user.email || 'U';
            avatar.textContent = name.charAt(0).toUpperCase();
        }
        if (displayName) {
            displayName.textContent = user.displayName || user.email.split('@')[0];
        }

        // Show admin link if admin
        if (adminLink && user.email === ADMIN_EMAIL) {
            adminLink.classList.remove('hidden');
            adminLink.style.display = 'flex';
        }
    } else {
        authButtons.classList.remove('hidden');
        userMenu.classList.add('hidden');
        if (adminLink) {
            adminLink.classList.add('hidden');
        }
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    btn.disabled = true;
    btn.textContent = 'กำลังเข้าสู่ระบบ...';

    try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast('เข้าสู่ระบบสำเร็จ! 🎉', 'success');
        closeAuthModal();
        document.getElementById('login-form').reset();
    } catch (error) {
        let msg = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        if (error.code === 'auth/user-not-found') msg = 'ไม่พบอีเมลนี้ในระบบ';
        if (error.code === 'auth/wrong-password') msg = 'รหัสผ่านไม่ถูกต้อง';
        if (error.code === 'auth/invalid-email') msg = 'อีเมลไม่ถูกต้อง';
        showToast(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'เข้าสู่ระบบ';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const btn = document.getElementById('register-btn');

    if (password !== confirm) {
        showToast('รหัสผ่านไม่ตรงกัน', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'กำลังสมัครสมาชิก...';

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });

        // Save user data to Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: email === ADMIN_EMAIL ? 'admin' : 'customer'
        });

        showToast('สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ 🎉', 'success');
        closeAuthModal();
        document.getElementById('register-form').reset();
    } catch (error) {
        let msg = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        if (error.code === 'auth/email-already-in-use') msg = 'อีเมลนี้ถูกใช้งานแล้ว';
        if (error.code === 'auth/weak-password') msg = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        if (error.code === 'auth/invalid-email') msg = 'อีเมลไม่ถูกต้อง';
        showToast(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'สมัครสมาชิก';
    }
}

async function logoutUser() {
    try {
        await auth.signOut();
        showToast('ออกจากระบบแล้ว', 'info');
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) dropdown.classList.add('hidden');

        // Redirect to home if on protected page
        const protectedPages = ['/pages/admin.html', '/pages/history.html'];
        if (protectedPages.includes(window.location.pathname)) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        showToast('เกิดข้อผิดพลาด', 'error');
    }
}
