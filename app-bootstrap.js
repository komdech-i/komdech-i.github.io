const API_URL = 'http://localhost/student/api.php';

let state = {
    view: 'login',
    currentUser: null,
    loading: false,
    loginData: { username: '', password: '' },
    registerData: { username: '', password: '', confirmPassword: '' },
    profileData: {
        student_id: '', full_name: '', email: '', phone: '',
        birth_date: '', address: '', major: '', year_level: 1, gpa: 0
    },
    students: [],
    searchTerm: '',
    error: '',
    success: ''
};

async function apiCall(action, method = 'GET', data = null) {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (data && method !== 'GET') options.body = JSON.stringify(data);
        const url = method === 'GET' && data 
            ? `${API_URL}?action=${action}&${new URLSearchParams(data).toString()}`
            : `${API_URL}?action=${action}`;
        const response = await fetch(url, options);
        return await response.json();
    } catch (err) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
}

async function handleLogin() {
    state.error = '';
    state.loading = true;
    render();
    try {
        const result = await apiCall('login', 'POST', state.loginData);
        if (result.success) {
            state.currentUser = { id: result.userId, username: result.username };
            await loadProfile(result.userId);
            state.view = 'profile';
            state.success = 'เข้าสู่ระบบสำเร็จ!';
            state.loginData = { username: '', password: '' };
        } else {
            state.error = result.error;
        }
    } catch (err) {
        state.error = err.message;
    } finally {
        state.loading = false;
        render();
    }
}

async function handleRegister() {
    state.error = '';
    if (state.registerData.password !== state.registerData.confirmPassword) {
        state.error = 'รหัสผ่านไม่ตรงกัน';
        render();
        return;
    }
    if (state.registerData.password.length < 6) {
        state.error = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
        render();
        return;
    }
    state.loading = true;
    render();
    try {
        const result = await apiCall('register', 'POST', state.registerData);
        if (result.success) {
            state.success = 'ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ';
            state.registerData = { username: '', password: '', confirmPassword: '' };
            setTimeout(() => {
                state.view = 'login';
                state.success = '';
                render();
            }, 1500);
        } else {
            state.error = result.error;
        }
    } catch (err) {
        state.error = err.message;
    } finally {
        state.loading = false;
        render();
    }
}

async function loadProfile(userId) {
    try {
        const profile = await apiCall('get_profile', 'GET', { user_id: userId });
        if (profile && profile.id) state.profileData = profile;
    } catch (err) {
        console.log('No profile yet');
    }
}

async function handleSaveProfile() {
    state.error = '';
    state.loading = true;
    render();
    try {
        const result = await apiCall('save_profile', 'POST', {
            ...state.profileData,
            user_id: state.currentUser.id
        });
        if (result.success) {
            state.success = 'บันทึกข้อมูลสำเร็จ!';
            setTimeout(() => { state.success = ''; render(); }, 3000);
        } else {
            state.error = result.error;
        }
    } catch (err) {
        state.error = err.message;
    } finally {
        state.loading = false;
        render();
    }
}

async function loadAllStudents() {
    state.loading = true;
    render();
    try {
        const data = await apiCall('get_all_students', 'GET', state.searchTerm ? { search: state.searchTerm } : {});
        state.students = data;
    } catch (err) {
        state.error = err.message;
    } finally {
        state.loading = false;
        render();
    }
}

async function handleDeleteStudent(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) return;
    state.loading = true;
    render();
    try {
        const result = await apiCall('delete_student', 'DELETE', { id });
        if (result.success) {
            state.success = 'ลบข้อมูลสำเร็จ!';
            await loadAllStudents();
            setTimeout(() => { state.success = ''; render(); }, 2000);
        }
    } catch (err) {
        state.error = err.message;
        state.loading = false;
        render();
    }
}

async function handleLogout() {
    try {
        await apiCall('logout', 'POST');
        state.currentUser = null;
        state.profileData = {
            student_id: '', full_name: '', email: '', phone: '',
            birth_date: '', address: '', major: '', year_level: 1, gpa: 0
        };
        state.view = 'login';
        state.success = 'ออกจากระบบสำเร็จ!';
        setTimeout(() => { state.success = ''; render(); }, 2000);
        render();
    } catch (err) {
        state.error = err.message;
        render();
    }
}

function render() {
    const app = document.getElementById('app');
    let html = `
        <div class="container">
            <div class="text-center mb-4">
                <h1 class="header-title display-4 fw-bold">
                    <i class="bi bi-mortarboard-fill"></i> ระบบจัดการข้อมูลนักศึกษา
                </h1>
                <p class="text-white fs-5">Student Management System</p>
            </div>
            ${state.success ? `<div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> ${state.success}</div>` : ''}
            ${state.error ? `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${state.error}</div>` : ''}
            ${renderView()}
        </div>
    `;
    app.innerHTML = html;
    attachEventListeners();
}

function renderView() {
    if (state.view === 'login') return renderLogin();
    if (state.view === 'register') return renderRegister();
    if (state.view === 'profile') return renderProfile();
    if (state.view === 'students') return renderStudents();
    return '';
}

function renderLogin() {
    return `
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="card">
                    <div class="card-body p-5">
                        <div class="icon-badge"><i class="bi bi-person-circle"></i></div>
                        <h3 class="text-center mb-4 fw-bold" style="color: var(--text-dark)">เข้าสู่ระบบ</h3>
                        <div class="mb-3">
                            <label class="form-label"><i class="bi bi-person"></i> ชื่อผู้ใช้</label>
                            <input id="login-username" type="text" class="form-control" placeholder="กรอกชื่อผู้ใช้">
                        </div>
                        <div class="mb-4">
                            <label class="form-label"><i class="bi bi-lock"></i> รหัสผ่าน</label>
                            <input id="login-password" type="password" class="form-control" placeholder="กรอกรหัสผ่าน">
                        </div>
                        <button id="btn-login" class="btn btn-primary w-100 mb-3" ${state.loading ? 'disabled' : ''}>
                            ${state.loading ? 'กำลังเข้าสู่ระบบ...' : '<i class="bi bi-box-arrow-in-right"></i> เข้าสู่ระบบ'}
                        </button>
                        <div class="text-center">
                            <button id="btn-to-register" class="btn btn-link">ยังไม่มีบัญชี? <strong>ลงทะเบียนที่นี่</strong></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderRegister() {
    return `
        <div class="row justify-content-center">
            <div class="col-md-5">
                <div class="card">
                    <div class="card-body p-5">
                        <div class="icon-badge"><i class="bi bi-person-plus"></i></div>
                        <h3 class="text-center mb-4 fw-bold" style="color: var(--text-dark)">ลงทะเบียน</h3>
                        <div class="mb-3">
                            <label class="form-label"><i class="bi bi-person"></i> ชื่อผู้ใช้</label>
                            <input id="register-username" type="text" class="form-control" placeholder="เลือกชื่อผู้ใช้">
                        </div>
                        <div class="mb-3">
                            <label class="form-label"><i class="bi bi-lock"></i> รหัสผ่าน</label>
                            <input id="register-password" type="password" class="form-control" placeholder="สร้างรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)">
                        </div>
                        <div class="mb-4">
                            <label class="form-label"><i class="bi bi-lock-fill"></i> ยืนยันรหัสผ่าน</label>
                            <input id="register-confirm" type="password" class="form-control" placeholder="ยืนยันรหัสผ่านอีกครั้ง">
                        </div>
                        <button id="btn-register" class="btn btn-primary w-100 mb-3" ${state.loading ? 'disabled' : ''}>
                            ${state.loading ? 'กำลังลงทะเบียน...' : '<i class="bi bi-check-circle"></i> ลงทะเบียน'}
                        </button>
                        <div class="text-center">
                            <button id="btn-to-login" class="btn btn-link">มีบัญชีอยู่แล้ว? <strong>เข้าสู่ระบบ</strong></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderProfile() {
    return `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                    <h4 class="mb-0"><i class="bi bi-person-badge"></i> ข้อมูลนักศึกษา</h4>
                    <small>ผู้ใช้: ${state.currentUser.username}</small>
                </div>
                <div>
                    <button id="btn-view-students" class="btn btn-success me-2">
                        <i class="bi bi-people"></i> ดูรายชื่อทั้งหมด
                    </button>
                    <button id="btn-logout" class="btn btn-danger">
                        <i class="bi bi-box-arrow-right"></i> ออกจากระบบ
                    </button>
                </div>
            </div>
            <div class="card-body p-4">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label fw-bold"><i class="bi bi-hash"></i> รหัสนักศึกษา</label>
                        <input id="student-id" type="text" class="form-control" placeholder="เช่น 65010001" value="${state.profileData.student_id || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold"><i class="bi bi-person"></i> ชื่อ-นามสกุล</label>
                        <input id="full-name" type="text" class="form-control" value="${state.profileData.full_name || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold"><i class="bi bi-envelope"></i> อีเมล</label>
                        <input id="email" type="email" class="form-control" value="${state.profileData.email || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold"><i class="bi bi-telephone"></i> เบอร์โทร</label>
                        <input id="phone" type="tel" class="form-control" value="${state.profileData.phone || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold"><i class="bi bi-calendar"></i> วันเกิด</label>
                        <input id="birth-date" type="date" class="form-control" value="${state.profileData.birth_date || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold"><i class="bi bi-book"></i> สาขาวิชา</label>
                        <input id="major" type="text" class="form-control" value="${state.profileData.major || ''}">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold"><i class="bi bi-layers"></i> ชั้นปี</label>
                        <select id="year-level" class="form-select">
                            <option value="1" ${state.profileData.year_level == 1 ? 'selected' : ''}>ปี 1</option>
                            <option value="2" ${state.profileData.year_level == 2 ? 'selected' : ''}>ปี 2</option>
                            <option value="3" ${state.profileData.year_level == 3 ? 'selected' : ''}>ปี 3</option>
                            <option value="4" ${state.profileData.year_level == 4 ? 'selected' : ''}>ปี 4</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-bold"><i class="bi bi-star"></i> เกรดเฉลี่ย (GPA)</label>
                        <input id="gpa" type="number" step="0.01" class="form-control" value="${state.profileData.gpa || 0}">
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-bold"><i class="bi bi-geo-alt"></i> ที่อยู่</label>
                        <textarea id="address" class="form-control" rows="3">${state.profileData.address || ''}</textarea>
                    </div>
                </div>
                <div class="text-end mt-4">
                    <button id="btn-save-profile" class="btn btn-primary btn-lg" ${state.loading ? 'disabled' : ''}>
                        <i class="bi bi-save"></i> บันทึกข้อมูล
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderStudents() {
    return `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h4 class="mb-0"><i class="bi bi-people-fill"></i> รายชื่อนักศึกษาทั้งหมด</h4>
                <button id="btn-back-profile" class="btn btn-secondary">
                    <i class="bi bi-arrow-left"></i> กลับ
                </button>
            </div>
            <div class="card-body p-4">
                <div class="mb-4">
                    <input id="search-input" type="text" class="form-control" placeholder="ค้นหาด้วย รหัส, ชื่อ, หรือสาขา..." value="${state.searchTerm}">
                </div>
                ${state.loading ? '<div class="text-center py-5"><div class="spinner-border"></div></div>' : 
                    state.students.length === 0 ? '<div class="text-center py-5">ไม่พบข้อมูล</div>' :
                    `<div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>รหัส</th><th>ชื่อ-นามสกุล</th><th>สาขา</th>
                                    <th>ชั้นปี</th><th>GPA</th><th class="text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.students.map(s => `
                                    <tr>
                                        <td>${s.student_id}</td>
                                        <td>${s.full_name}</td>
                                        <td>${s.major}</td>
                                        <td>ปี ${s.year_level}</td>
                                        <td>${s.gpa}</td>
                                        <td class="text-center">
                                            <button class="btn btn-sm btn-danger btn-delete" data-id="${s.id}">
                                                <i class="bi bi-trash"></i> ลบ
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`
                }
            </div>
        </div>
    `;
}

function attachEventListeners() {
    const el = (id) => document.getElementById(id);
    
    if (el('btn-login')) {
        el('btn-login').onclick = () => {
            state.loginData.username = el('login-username').value;
            state.loginData.password = el('login-password').value;
            handleLogin();
        };
    }
    
    if (el('btn-to-register')) el('btn-to-register').onclick = () => { state.view = 'register'; render(); };
    
    if (el('btn-register')) {
        el('btn-register').onclick = () => {
            state.registerData.username = el('register-username').value;
            state.registerData.password = el('register-password').value;
            state.registerData.confirmPassword = el('register-confirm').value;
            handleRegister();
        };
    }
    
    if (el('btn-to-login')) el('btn-to-login').onclick = () => { state.view = 'login'; render(); };
    
    if (el('btn-save-profile')) {
        el('btn-save-profile').onclick = () => {
            state.profileData.student_id = el('student-id').value;
            state.profileData.full_name = el('full-name').value;
            state.profileData.email = el('email').value;
            state.profileData.phone = el('phone').value;
            state.profileData.birth_date = el('birth-date').value;
            state.profileData.major = el('major').value;
            state.profileData.year_level = parseInt(el('year-level').value);
            state.profileData.gpa = parseFloat(el('gpa').value);
            state.profileData.address = el('address').value;
            handleSaveProfile();
        };
    }
    
    if (el('btn-view-students')) el('btn-view-students').onclick = () => { state.view = 'students'; loadAllStudents(); };
    if (el('btn-logout')) el('btn-logout').onclick = handleLogout;
    if (el('btn-back-profile')) el('btn-back-profile').onclick = () => { state.view = 'profile'; render(); };
    
    if (el('search-input')) {
        el('search-input').oninput = (e) => {
            state.searchTerm = e.target.value;
            loadAllStudents();
        };
    }
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = () => handleDeleteStudent(btn.dataset.id);
    });
}

render();