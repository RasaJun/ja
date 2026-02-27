<?php
// 關閉所有錯誤輸出
ini_set('display_errors', 0);
error_reporting(0);

// 設定 JSON 標頭
header('Content-Type: application/json');

// 防止快取
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

try {
    // 直接連線資料庫
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 取得所有訂單，強制不使用快取
    $sql = "SELECT o.* FROM orders o ORDER BY o.created_at DESC";
    $stmt = $pdo->query($sql);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 為每個訂單取得商品明細
    foreach ($orders as &$order) {
        $itemStmt = $pdo->prepare("SELECT product_name, quantity, price, subtotal FROM order_items WHERE order_id = ?");
        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($items) > 0) {
            // 有明細
            $itemsText = [];
            foreach ($items as $item) {
                $itemsText[] = $item['product_name'] . ' x' . $item['quantity'];
            }
            $order['items_text'] = implode('、', $itemsText);
            $order['items'] = $items;
        } else {
            // 沒有明細
            $order['items_text'] = '無明細';
            $order['items'] = [];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $orders,
        'timestamp' => time() // 加入時間戳防止快取
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '資料庫錯誤'
    ]);
}
?>