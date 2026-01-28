<?php
// config.php - รองรับทั้ง localhost และ Railway

// อ่านค่าจาก Environment Variables (สำหรับ Railway)
$host = getenv('MYSQL_HOST') ?: getenv('MYSQLHOST') ?: 'localhost';
$dbname = getenv('MYSQL_DATABASE') ?: getenv('MYSQLDATABASE') ?: 'student';
$username = getenv('MYSQL_USER') ?: getenv('MYSQLUSER') ?: 'root';
$password = getenv('MYSQL_PASSWORD') ?: getenv('MYSQLPASSWORD') ?: '';
$port = getenv('MYSQL_PORT') ?: getenv('MYSQLPORT') ?: 3306;

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
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

