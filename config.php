<?php
// config.php - การตั้งค่าเชื่อมต่อ MySQL

$host = 'localhost';
$dbname = 'student';
$username = 'root';
$password = ''; // เปลี่ยนตามของคุณ

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// ฟังก์ชันช่วยเหลือ
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>