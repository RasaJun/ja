<?php
require_once 'config.php';

// 開啟錯誤報告
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 設定錯誤日誌
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// 檢查是否登入
$user = checkLogin();

// 只接受 POST 請求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, '無效的請求方法');
}

// 獲取 POST 數據
$input = file_get_contents('php://input');
error_log("收到訂單數據: " . $input);

$data = json_decode($input, true);
$items = $data['items'] ?? [];
$total = $data['total'] ?? 0;

error_log("解析後的商品數量: " . count($items));
error_log("解析後的總金額: " . $total);

if (empty($items)) {
    error_log("錯誤: 訂單商品為空");
    sendResponse(false, '訂單不能為空');
}

try {
    $pdo = getDB();
    error_log("資料庫連線成功");
    
    // 開始交易
    $pdo->beginTransaction();
    error_log("開始交易");
    
    // 產生訂單編號
    $orderNumber = 'ORD' . date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    error_log("訂單編號: " . $orderNumber);
    
    // 插入訂單
    $sql = "INSERT INTO orders (order_number, total_amount, created_by, status) VALUES (?, ?, ?, 'pending')";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$orderNumber, $total, $user['username']]);
    
    if (!$result) {
        error_log("訂單插入失敗");
        throw new Exception('訂單插入失敗');
    }
    
    $orderId = $pdo->lastInsertId();
    error_log("訂單ID: " . $orderId);
    
    // 插入訂單明細
    $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
    
    foreach ($items as $index => $item) {
        $productId = $item['product_id'] ?? $item['id'] ?? 0;
        $productName = $item['name'] ?? '未知商品';
        $price = $item['price'] ?? 0;
        $quantity = $item['quantity'] ?? 1;
        $subtotal = $item['subtotal'] ?? ($price * $quantity);
        
        error_log("插入明細 $index: product_id=$productId, name=$productName, price=$price, quantity=$quantity");
        
        $result = $stmt->execute([
            $orderId,
            $productId,
            $productName,
            $price,
            $quantity,
            $subtotal
        ]);
        
        if (!$result) {
            error_log("明細插入失敗");
            throw new Exception('訂單明細插入失敗');
        }
    }
    
    // 提交交易
    $pdo->commit();
    error_log("交易提交成功");
    
    // 驗證資料是否真的寫入
    $checkStmt = $pdo->prepare("SELECT * FROM orders WHERE order_number = ?");
    $checkStmt->execute([$orderNumber]);
    $checkOrder = $checkStmt->fetch();
    
    if ($checkOrder) {
        error_log("資料庫驗證成功，訂單已寫入");
    } else {
        error_log("資料庫驗證失敗，訂單未找到");
    }
    
    sendResponse(true, '訂單建立成功', ['order_number' => $orderNumber]);
    
} catch (Exception $e) {
    if (isset($pdo)) {
        $pdo->rollBack();
        error_log("交易回滾");
    }
    error_log("錯誤: " . $e->getMessage());
    error_log("錯誤追蹤: " . $e->getTraceAsString());
    sendResponse(false, '訂單建立失敗: ' . $e->getMessage());
}
?>