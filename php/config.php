<?php
// 開啟錯誤顯示
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Session 設定（在 session_start() 之前）
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0);  // 如果是 HTTPS 改為 1
ini_set('session.cookie_samesite', 'Lax');

// 啟動 Session
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// 資料庫設定
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'pos_system');

// 建立連線
function getDB() {
    try {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        error_log("資料庫連線錯誤：" . $e->getMessage());
        die(json_encode([
            'success' => false, 
            'message' => '資料庫連線失敗'
        ]));
    }
}

// 回傳 JSON 格式
function sendResponse($success, $message, $data = null) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

// 檢查是否登入
function checkLogin() {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        sendResponse(false, '請先登入');
    }
    return $_SESSION;
}

// 檢查是否為管理員
function checkAdmin() {
    $session = checkLogin();
    if ($session['role'] !== 'admin') {
        sendResponse(false, '權限不足');
    }
    return $session;
}
?>