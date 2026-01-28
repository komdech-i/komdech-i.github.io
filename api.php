<?php
// api.php - API Endpoints สำหรับระบบนักศึกษา

session_start();
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ==================== REGISTER ====================
if ($action === 'register' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = sanitize($data['username']);
    $password = $data['password'];
    
    if (empty($username) || empty($password)) {
        jsonResponse(['error' => 'กรุณากรอกข้อมูลให้ครบถ้วน'], 400);
    }
    
    // เช็คว่า username ซ้ำไหม
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'ชื่อผู้ใช้นี้มีอยู่แล้ว'], 400);
    }
    
    // สร้าง user ใหม่
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->execute([$username, $hashedPassword]);
    
    jsonResponse([
        'success' => true,
        'message' => 'ลงทะเบียนสำเร็จ',
        'userId' => $pdo->lastInsertId()
    ]);
}

// ==================== LOGIN ====================
if ($action === 'login' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = sanitize($data['username']);
    $password = $data['password'];
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(['error' => 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'], 401);
    }
    
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    
    jsonResponse([
        'success' => true,
        'message' => 'เข้าสู่ระบบสำเร็จ',
        'userId' => $user['id'],
        'username' => $user['username']
    ]);
}

// ==================== LOGOUT ====================
if ($action === 'logout' && $method === 'POST') {
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'ออกจากระบบสำเร็จ']);
}

// ==================== SAVE STUDENT PROFILE ====================
if ($action === 'save_profile' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userId = $data['user_id'];
    $studentId = sanitize($data['student_id'] ?? '');
    $fullName = sanitize($data['full_name'] ?? '');
    $email = sanitize($data['email'] ?? '');
    $phone = sanitize($data['phone'] ?? '');
    $birthDate = $data['birth_date'] ?? null;
    $address = sanitize($data['address'] ?? '');
    $major = sanitize($data['major'] ?? '');
    $yearLevel = intval($data['year_level'] ?? 1);
    $gpa = floatval($data['gpa'] ?? 0);
    
    // เช็คว่ามี profile อยู่แล้วไหม
    $stmt = $pdo->prepare("SELECT id FROM student_profiles WHERE user_id = ?");
    $stmt->execute([$userId]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // UPDATE
        $stmt = $pdo->prepare("
            UPDATE student_profiles SET 
                student_id = ?, full_name = ?, email = ?, phone = ?,
                birth_date = ?, address = ?, major = ?, year_level = ?, gpa = ?
            WHERE user_id = ?
        ");
        $stmt->execute([
            $studentId, $fullName, $email, $phone,
            $birthDate, $address, $major, $yearLevel, $gpa, $userId
        ]);
    } else {
        // INSERT
        $stmt = $pdo->prepare("
            INSERT INTO student_profiles 
            (user_id, student_id, full_name, email, phone, birth_date, address, major, year_level, gpa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId, $studentId, $fullName, $email, $phone,
            $birthDate, $address, $major, $yearLevel, $gpa
        ]);
    }
    
    jsonResponse(['success' => true, 'message' => 'บันทึกข้อมูลสำเร็จ']);
}

// ==================== GET PROFILE ====================
if ($action === 'get_profile' && $method === 'GET') {
    $userId = $_GET['user_id'] ?? 0;
    
    $stmt = $pdo->prepare("SELECT * FROM student_profiles WHERE user_id = ?");
    $stmt->execute([$userId]);
    $profile = $stmt->fetch();
    
    jsonResponse($profile ?: []);
}

// ==================== GET ALL STUDENTS ====================
if ($action === 'get_all_students' && $method === 'GET') {
    $search = $_GET['search'] ?? '';
    
    if ($search) {
        $stmt = $pdo->prepare("
            SELECT sp.*, u.username 
            FROM student_profiles sp
            JOIN users u ON sp.user_id = u.id
            WHERE sp.student_id LIKE ? OR sp.full_name LIKE ? OR sp.major LIKE ?
            ORDER BY sp.id DESC
        ");
        $searchTerm = "%$search%";
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
    } else {
        $stmt = $pdo->query("
            SELECT sp.*, u.username 
            FROM student_profiles sp
            JOIN users u ON sp.user_id = u.id
            ORDER BY sp.id DESC
        ");
    }
    
    $students = $stmt->fetchAll();
    jsonResponse($students);
}

// ==================== DELETE STUDENT ====================
if ($action === 'delete_student' && $method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    $stmt = $pdo->prepare("DELETE FROM student_profiles WHERE id = ?");
    $stmt->execute([$id]);
    
    jsonResponse(['success' => true, 'message' => 'ลบข้อมูลสำเร็จ']);
}

// ==================== UPDATE STUDENT ====================
if ($action === 'update_student' && $method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'];
    $studentId = sanitize($data['student_id']);
    $fullName = sanitize($data['full_name']);
    $email = sanitize($data['email']);
    $phone = sanitize($data['phone']);
    $birthDate = $data['birth_date'];
    $address = sanitize($data['address']);
    $major = sanitize($data['major']);
    $yearLevel = intval($data['year_level']);
    $gpa = floatval($data['gpa']);
    
    $stmt = $pdo->prepare("
        UPDATE student_profiles SET 
            student_id = ?, full_name = ?, email = ?, phone = ?,
            birth_date = ?, address = ?, major = ?, year_level = ?, gpa = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $studentId, $fullName, $email, $phone,
        $birthDate, $address, $major, $yearLevel, $gpa, $id
    ]);
    
    jsonResponse(['success' => true, 'message' => 'แก้ไขข้อมูลสำเร็จ']);
}

jsonResponse(['error' => 'Invalid action'], 400);
?>