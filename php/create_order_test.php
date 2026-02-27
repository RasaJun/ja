<?php
// 開啟錯誤報告
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 設定 JSON 標頭
header('Content-Type: application/json');

// 啟動 session
session_start();

// 模擬登入用戶（暫時寫死）
$_SESSION['username'] = 'staff';
$_SESSION['user_id'] = 1;

try {
    // 直接連線資料庫
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 接收 POST 數據
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('無效的訂單數據');
    }
    
    $items = $data['items'] ?? [];
    $total = $data['total'] ?? 0;
    
    if (empty($items)) {
        throw new Exception('訂單不能為空');
    }
    
    // 開始交易
    $pdo->beginTransaction();
    
    // 產生訂單編號
    $orderNumber = 'ORD' . date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    
    // 檢查 orders 表結構
    $columns = $pdo->query("DESCRIBE orders")->fetchAll(PDO::FETCH_COLUMN);
    error_log("orders 表欄位: " . implode(', ', $columns));
    
    // 插入訂單
    if (in_array('status', $columns)) {
        $sql = "INSERT INTO orders (order_number, total_amount, created_by, status) VALUES (?, ?, ?, 'pending')";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$orderNumber, $total, 'staff']);
    } else {
        $sql = "INSERT INTO orders (order_number, total_amount, created_by) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$orderNumber, $total, 'staff']);
    }
    
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
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => '訂單建立成功',
        'data' => [
            'order_number' => $orderNumber,
            'order_id' => $orderId
        ]
    ]);
    
} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
    }
    
    echo json_encode([
        'success' => false,
        'message' => '錯誤: ' . $e->getMessage()
    ]);
}
?>