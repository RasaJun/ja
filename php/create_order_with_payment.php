<?php
// 關閉錯誤輸出
ini_set('display_errors', 0);
error_reporting(0);

// 設定 JSON 標頭
header('Content-Type: application/json');

// 啟動 session
session_start();

try {
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 檢查 orders 表是否有 payment_method 欄位
    $checkColumn = $pdo->query("SHOW COLUMNS FROM orders LIKE 'payment_method'");
    if ($checkColumn->rowCount() == 0) {
        // 新增 payment_method 欄位
        $pdo->exec("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT '現金' AFTER status");
    }
    
    // 獲取 POST 數據
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('無效的訂單數據');
    }
    
    $items = $data['items'] ?? [];
    $total = $data['total'] ?? 0;
    $paymentMethod = $data['payment_method'] ?? '現金';
    
    if (empty($items)) {
        throw new Exception('訂單不能為空');
    }
    
    // 獲取使用者名稱
    $username = isset($_SESSION['username']) ? $_SESSION['username'] : 'staff';
    
    // 產生訂單編號
    $orderNumber = 'ORD' . date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    
    // 插入訂單（包含付款方式）
    $sql = "INSERT INTO orders (order_number, total_amount, created_by, status, payment_method) VALUES (?, ?, ?, 'pending', ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$orderNumber, $total, $username, $paymentMethod]);
    
    $orderId = $pdo->lastInsertId();
    
    // 插入訂單明細
    $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
    
    foreach ($items as $item) {
        $productId = $item['product_id'] ?? $item['id'] ?? 0;
        $productName = $item['name'] ?? '未知商品';
        $price = $item['price'] ?? 0;
        $quantity = $item['quantity'] ?? 1;
        $subtotal = $item['subtotal'] ?? ($price * $quantity);
        
        $stmt->execute([
            $orderId,
            $productId,
            $productName,
            $price,
            $quantity,
            $subtotal
        ]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => '訂單建立成功',
        'data' => [
            'order_number' => $orderNumber,
            'payment_method' => $paymentMethod
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '訂單建立失敗: ' . $e->getMessage()
    ]);
}
?>