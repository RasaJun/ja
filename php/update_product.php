<?php
require_once 'config.php';

// 檢查是否為管理員
checkAdmin();

// 只接受 POST 請求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, '無效的請求方法');
}

// 獲取 POST 數據
$id = $_POST['id'] ?? '';
$name = $_POST['name'] ?? '';
$price = $_POST['price'] ?? '';
$image_filename = $_POST['image_filename'] ?? '';

// 驗證輸入
if (empty($id) || empty($name) || empty($price) || empty($image_filename)) {
    sendResponse(false, '所有欄位都必須填寫');
}

if (!is_numeric($price) || $price <= 0) {
    sendResponse(false, '價格必須為正數');
}

try {
    $pdo = getDB();
    
    // 更新商品
    $stmt = $pdo->prepare("UPDATE products SET name = ?, price = ?, image_filename = ? WHERE id = ?");
    $stmt->execute([$name, $price, $image_filename, $id]);
    
    sendResponse(true, '商品更新成功');
    
} catch (PDOException $e) {
    sendResponse(false, '更新失敗');
}
?>