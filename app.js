const API_URL = 'http://localhost/student/api.php';

let state = {
    view: 'login',
    currentUser: null,
    loading: false,
    loginData: { username: '', password: '' },
    registerData: { username: '', password: '', confirmPassword: '' },
    profileData: {
        student_id: '',
        full_name: '',
        email: '',
        phone: '',
        birth_date: '',
        address: '',
        major: '',
        year_level: 1,
        gpa: 0
    },
    students: [],
    searchTerm: '',
    editingStudent: null,
    error: '',
    success: ''
};

// API Call
async function apiCall(action, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const url = method === 'GET' && data 
            ? `${API_URL}?action=${action}&${new URLSearchParams(data).toString()}`
            : `${API_URL}?action=${action}`;
        
        const response = await fetch(url, options);
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
}

// Login
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
            state.success = 'เข้าสู่ระบบสำเร็จ';
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

// Register
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

// Load Profile
async function loadProfile(userId) {
    try {
        const profile = await apiCall('get_profile', 'GET', { user_id: userId });
        if (profile && profile.id) {
            state.profileData = profile;
        }
    } catch (err) {
        console.log('No profile yet');
    }
}

// Save Profile
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
            state.success = 'บันทึกข้อมูลสำเร็จ';
            setTimeout(() => {
                state.success = '';
                render();
            }, 3000);
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

// Load All Students
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

// Delete Student
async function handleDeleteStudent(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) return;
    
    state.loading = true;
    render();
    
    try {
        const result = await apiCall('delete_student', 'DELETE', { id });
        if (result.success) {
            state.success = 'ลบข้อมูลสำเร็จ';
            await loadAllStudents();
            setTimeout(() => {
                state.success = '';
                render();
            }, 2000);
        }
    } catch (err) {
        state.error = err.message;
        state.loading = false;
        render();
    }
}

// Update Student
async function handleUpdateStudent() {
    state.loading = true;
    render();
    
    try {
        const result = await apiCall('update_student', 'PUT', state.editingStudent);
        if (result.success) {
            state.success = 'แก้ไขข้อมูลสำเร็จ';
            state.editingStudent = null;
            await loadAllStudents();
            setTimeout(() => {
                state.success = '';
                render();
            }, 2000);
        }
    } catch (err) {
        state.error = err.message;
        state.loading = false;
        render();
    }
}

// Logout
async function handleLogout() {
    try {
        await apiCall('logout', 'POST');
        state.currentUser = null;
        state.profileData = {
            student_id: '',
            full_name: '',
            email: '',
            phone: '',
            birth_date: '',
            address: '',
            major: '',
            year_level: 1,
            gpa: 0
        };
        state.view = 'login';
        state.success = 'ออกจากระบบสำเร็จ';
        setTimeout(() => {
            state.success = '';
            render();
        }, 2000);
        render();
    } catch (err) {
        state.error = err.message;
        render();
    }
}

// Render UI
function render() {
    const app = document.getElementById('app');
    
    let html = `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800 mb-2">🎓 ระบบจัดการข้อมูลนักศึกษา</h1>
                    <p class="text-gray-600">Student Management System</p>
                </div>
                
                ${state.success ? `<div class="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">${state.success}</div>` : ''}
                ${state.error ? `<div class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">${state.error}</div>` : ''}
                
                ${renderView()}
            </div>
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
        <div class="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">เข้าสู่ระบบ</h2>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้</label>
                    <input id="login-username" type="text" value="${state.loginData.username}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                        placeholder="กรอกชื่อผู้ใช้">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                    <input id="login-password" type="password" value="${state.loginData.password}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                        placeholder="กรอกรหัสผ่าน">
                </div>
                <button id="btn-login" ${state.loading ? 'disabled' : ''} 
                    class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                    ${state.loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
            </div>
            <div class="mt-6 text-center">
                <button id="btn-to-register" class="text-indigo-600 hover:text-indigo-800 font-medium">
                    ยังไม่มีบัญชี? ลงทะเบียนที่นี่
                </button>
            </div>
        </div>
    `;
}

function renderRegister() {
    return `
        <div class="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">ลงทะเบียน</h2>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้</label>
                    <input id="register-username" type="text" value="${state.registerData.username}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                        placeholder="เลือกชื่อผู้ใช้">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
                    <input id="register-password" type="password" value="${state.registerData.password}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                        placeholder="สร้างรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
                    <input id="register-confirm" type="password" value="${state.registerData.confirmPassword}" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                        placeholder="ยืนยันรหัสผ่านอีกครั้ง">
                </div>
                <button id="btn-register" ${state.loading ? 'disabled' : ''} 
                    class="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                    ${state.loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
                </button>
            </div>
            <div class="mt-6 text-center">
                <button id="btn-to-login" class="text-indigo-600 hover:text-indigo-800 font-medium">
                    มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                </button>
            </div>
        </div>
    `;
}

function renderProfile() {
    return `
        <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">ข้อมูลนักศึกษา</h2>
                    <p class="text-gray-600">ผู้ใช้: ${state.currentUser.username}</p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-view-students" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        ดูรายชื่อทั้งหมด
                    </button>
                    <button id="btn-logout" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        ออกจากระบบ
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label class="block text-sm font-medium mb-2">รหัสนักศึกษา</label>
                    <input id="student-id" type="text" value="${state.profileData.student_id || ''}" class="w-full px-4 py-2 border rounded-lg" placeholder="เช่น 65010001"></div>
                <div><label class="block text-sm font-medium mb-2">ชื่อ-นามสกุล</label>
                    <input id="full-name" type="text" value="${state.profileData.full_name || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium mb-2">อีเมล</label>
                    <input id="email" type="email" value="${state.profileData.email || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium mb-2">เบอร์โทร</label>
                    <input id="phone" type="tel" value="${state.profileData.phone || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium mb-2">วันเกิด</label>
                    <input id="birth-date" type="date" value="${state.profileData.birth_date || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium mb-2">สาขาวิชา</label>
                    <input id="major" type="text" value="${state.profileData.major || ''}" class="w-full px-4 py-2 border rounded-lg"></div>
                <div><label class="block text-sm font-medium mb-2">ชั้นปี</label>
                    <select id="year-level" class="w-full px-4 py-2 border rounded-lg">
                        <option value="1" ${state.profileData.year_level == 1 ? 'selected' : ''}>ปี 1</option>
                        <option value="2" ${state.profileData.year_level == 2 ? 'selected' : ''}>ปี 2</option>
                        <option value="3" ${state.profileData.year_level == 3 ? 'selected' : ''}>ปี 3</option>
                        <option value="4" ${state.profileData.year_level == 4 ? 'selected' : ''}>ปี 4</option>
                    </select></div>
                <div><label class="block text-sm font-medium mb-2">เกรดเฉลี่ย (GPA)</label>
                    <input id="gpa" type="number" step="0.01" value="${state.profileData.gpa || 0}" class="w-full px-4 py-2 border rounded-lg"></div>
                <div class="md:col-span-2"><label class="block text-sm font-medium mb-2">ที่อยู่</label>
                    <textarea id="address" rows="3" class="w-full px-4 py-2 border rounded-lg">${state.profileData.address || ''}</textarea></div>
            </div>
            <div class="mt-6 flex justify-end">
                <button id="btn-save-profile" ${state.loading ? 'disabled' : ''} class="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    ${state.loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
            </div>
        </div>
    `;
}

function renderStudents() {
    return `
        <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">รายชื่อนักศึกษาทั้งหมด</h2>
                <button id="btn-back-profile" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">กลับ</button>
            </div>
            <div class="mb-6">
                <input id="search-input" type="text" value="${state.searchTerm}" 
                    class="w-full px-4 py-2 border rounded-lg" placeholder="ค้นหาด้วย รหัส, ชื่อ, หรือสาขา...">
            </div>
            ${state.loading ? '<div class="text-center py-8">กำลังโหลด...</div>' : 
                state.students.length === 0 ? '<div class="text-center py-8">ไม่พบข้อมูล</div>' :
                `<table class="w-full"><thead class="bg-gray-50"><tr>
                    <th class="px-4 py-3 text-left">รหัส</th>
                    <th class="px-4 py-3 text-left">ชื่อ-นามสกุล</th>
                    <th class="px-4 py-3 text-left">สาขา</th>
                    <th class="px-4 py-3 text-left">ชั้นปี</th>
                    <th class="px-4 py-3 text-left">GPA</th>
                    <th class="px-4 py-3 text-center">จัดการ</th>
                </tr></thead><tbody>
                    ${state.students.map(s => `
                        <tr class="border-t hover:bg-gray-50">
                            <td class="px-4 py-3">${s.student_id}</td>
                            <td class="px-4 py-3">${s.full_name}</td>
                            <td class="px-4 py-3">${s.major}</td>
                            <td class="px-4 py-3">ปี ${s.year_level}</td>
                            <td class="px-4 py-3">${s.gpa}</td>
                            <td class="px-4 py-3 text-center">
                                <button class="btn-edit text-blue-600 hover:bg-blue-50 px-3 py-1 rounded" data-id="${s.id}">แก้ไข</button>
                                <button class="btn-delete text-red-600 hover:bg-red-50 px-3 py-1 rounded" data-id="${s.id}">ลบ</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody></table>`
            }
        </div>
    `;
}

function attachEventListeners() {
    // Login
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.onclick = () => {
            state.loginData.username = document.getElementById('login-username').value;
            state.loginData.password = document.getElementById('login-password').value;
            handleLogin();
        };
    }
    
    const btnToRegister = document.getElementById('btn-to-register');
    if (btnToRegister) btnToRegister.onclick = () => { state.view = 'register'; state.error = ''; render(); };
    
    // Register
    const btnRegister = document.getElementById('btn-register');
    if (btnRegister) {
        btnRegister.onclick = () => {
            state.registerData.username = document.getElementById('register-username').value;
            state.registerData.password = document.getElementById('register-password').value;
            state.registerData.confirmPassword = document.getElementById('register-confirm').value;
            handleRegister();
        };
    }
    
    const btnToLogin = document.getElementById('btn-to-login');
    if (btnToLogin) btnToLogin.onclick = () => { state.view = 'login'; state.error = ''; render(); };
    
    // Profile
    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.onclick = () => {
            state.profileData.student_id = document.getElementById('student-id').value;
            state.profileData.full_name = document.getElementById('full-name').value;
            state.profileData.email = document.getElementById('email').value;
            state.profileData.phone = document.getElementById('phone').value;
            state.profileData.birth_date = document.getElementById('birth-date').value;
            state.profileData.major = document.getElementById('major').value;
            state.profileData.year_level = parseInt(document.getElementById('year-level').value);
            state.profileData.gpa = parseFloat(document.getElementById('gpa').value);
            state.profileData.address = document.getElementById('address').value;
            handleSaveProfile();
        };
    }
    
    const btnViewStudents = document.getElementById('btn-view-students');
    if (btnViewStudents) btnViewStudents.onclick = () => { state.view = 'students'; loadAllStudents(); };
    
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.onclick = handleLogout;
    
    // Students
    const btnBackProfile = document.getElementById('btn-back-profile');
    if (btnBackProfile) btnBackProfile.onclick = () => { state.view = 'profile'; render(); };
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            state.searchTerm = e.target.value;
            loadAllStudents();
        };
    }
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = () => handleDeleteStudent(btn.dataset.id);
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.onclick = () => {
            const student = state.students.find(s => s.id == btn.dataset.id);
            if (student) {
                state.editingStudent = {...student};
                // Show edit modal - simplified version
                alert('ฟีเจอร์แก้ไขกำลังพัฒนา - ใช้ phpMyAdmin แก้ไขชั่วคราว');
            }
        };
    });
}

// Initialize
render();