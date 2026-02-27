<?php
// 關閉錯誤輸出
ini_set('display_errors', 0);
error_reporting(0);

// 設定 JSON 標頭
header('Content-Type: application/json');

// 防止快取
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 取得商品列表，包含優惠價格
    $sql = "SELECT * FROM products ORDER BY sort_order";
    $stmt = $pdo->query($sql);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 加入完整的圖片路徑
    foreach ($products as &$product) {
        $product['image_url'] = 'images/' . $product['image_filename'];
        
        // 確保 discount_price 是數字或 null
        if ($product['discount_price'] !== null) {
            $product['discount_price'] = floatval($product['discount_price']);
        }
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