<?php
// 關閉錯誤輸出
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 檢查 discount_price 欄位是否存在
    $checkColumn = $pdo->query("SHOW COLUMNS FROM products LIKE 'discount_price'");
    if ($checkColumn->rowCount() == 0) {
        // 新增 discount_price 欄位
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_price DECIMAL(10,2) NULL AFTER price");
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_updated_at TIMESTAMP NULL AFTER discount_price");
        $pdo->exec("ALTER TABLE products ADD COLUMN discount_updated_by VARCHAR(50) NULL AFTER discount_updated_at");
    }
    
    // 取得商品列表
    $stmt = $pdo->query("SELECT * FROM products ORDER BY sort_order");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 加入完整的圖片路徑
    foreach ($products as &$product) {
        $product['image_url'] = 'images/' . $product['image_filename'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $products
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '資料庫錯誤'
    ]);
}
?>