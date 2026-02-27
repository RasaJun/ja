<?php
require_once 'config.php';

if (isset($_SESSION['user_id']) && $_SESSION['logged_in'] === true) {
    sendResponse(true, '已登入', [
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'],
        'full_name' => $_SESSION['full_name']
    ]);
} else {
    sendResponse(false, '未登入');
}
?>