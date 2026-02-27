<?php
require_once 'config.php';

// 清除 Session
$_SESSION = array();

// 刪除 Session Cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// 銷毀 Session
session_destroy();

sendResponse(true, '已成功登出');
?>