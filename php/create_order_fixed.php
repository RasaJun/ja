<?php
// 開啟錯誤報告
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 設定 JSON 標頭
header('Content-Type: application/json');

// 啟動 session
session_start();

try {
    // 直接連線資料庫
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 獲取 POST 數據
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
    
    // 獲取使用者名稱（從 session 或使用預設值）
    $username = isset($_SESSION['username']) ? $_SESSION['username'] : 'staff';
    
    // 產生訂單編號
    $orderNumber = date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    
    // 插入訂單 - 不使用交易
    $sql = "INSERT INTO orders (order_number, total_amount, created_by, status) VALUES (?, ?, ?, 'pending')";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$orderNumber, $total, $username]);
    
    if (!$result) {
        throw new Exception('訂單插入失敗');
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
        
        $itemResult = $stmt->execute([
            $orderId,
            $productId,
            $productName,
            $price,
            $quantity,
            $subtotal
        ]);
        
        if (!$itemResult) {
            throw new Exception('訂單明細插入失敗');
        }
    }
    
    // 驗證訂單是否真的寫入
    $checkStmt = $pdo->prepare("SELECT * FROM orders WHERE order_number = ?");
    $checkStmt->execute([$orderNumber]);
    $checkOrder = $checkStmt->fetch();
    
    if (!$checkOrder) {
        throw new Exception('訂單寫入驗證失敗');
    }
    
    echo json_encode([
        'success' => true,
        'message' => '訂單建立成功',
        'data' => [
            'order_number' => $orderNumber,
            'order_id' => $orderId
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '訂單建立失敗: ' . $e->getMessage()
    ]);
}
?>