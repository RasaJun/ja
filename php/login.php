<?php
require_once 'config.php';

// 只接受 POST 請求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, '無效的請求方法');
}

// 獲取 POST 數據
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

// 驗證輸入
if (empty($username) || empty($password)) {
    sendResponse(false, '請輸入使用者名稱和密碼');
}

// 只允許 staff 和 admin
if (!in_array($username, ['staff', 'admin'])) {
    sendResponse(false, '無效的使用者名稱');
}

try {
    $pdo = getDB();
    
    // 查詢使用者
    $stmt = $pdo->prepare("SELECT id, username, password, role, full_name FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    // 驗證密碼（預設密碼：staff123, admin123）
    if ($user && password_verify($password, $user['password'])) {
        // 登入成功
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['logged_in'] = true;
        
        sendResponse(true, '登入成功', [
            'username' => $user['username'],
            'role' => $user['role'],
            'full_name' => $user['full_name']
        ]);
    } else {
        sendResponse(false, '使用者名稱或密碼錯誤');
    }
    
} catch (PDOException $e) {
    sendResponse(false, '系統錯誤');
}
?>