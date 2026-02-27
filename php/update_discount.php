<?php
require_once 'config.php';

// 關閉錯誤輸出
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');

// 檢查是否登入
checkLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '無效的請求方法']);
    exit;
}

$productId = $_POST['product_id'] ?? 0;
$discountPrice = isset($_POST['discount_price']) && $_POST['discount_price'] !== '' ? $_POST['discount_price'] : null;
$updatedBy = $_POST['updated_by'] ?? 'staff';

if ($productId <= 0) {
    echo json_encode(['success' => false, 'message' => '無效的商品編號']);
    exit;
}

try {
    $pdo = getDB();
    
    // 檢查 discount_price 欄位是否存在
    $checkColumn = $pdo->query("SHOW COLUMNS FROM products LIKE 'discount_price'");
    if ($checkColumn->rowCount() == 0) {
        // 新增 discount_price 欄位
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_price DECIMAL(10,2) NULL AFTER price");
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_updated_at TIMESTAMP NULL AFTER discount_price");
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_updated_by VARCHAR(50) NULL AFTER discount_updated_at");
    }
    
    if ($discountPrice === null) {
        // 取消優惠
        $sql = "UPDATE products SET discount_price = NULL, discount_updated_at = NOW(), discount_updated_by = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$updatedBy, $productId]);
        $message = '優惠已取消';
    } else {
        // 設定優惠
        $sql = "UPDATE products SET discount_price = ?, discount_updated_at = NOW(), discount_updated_by = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$discountPrice, $updatedBy, $productId]);
        $message = '優惠已更新';
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '更新失敗'
    ]);
}
?>