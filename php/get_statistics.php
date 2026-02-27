<?php
header('Content-Type: application/json');

try {
    $pdo = new PDO('mysql:host=localhost;dbname=ja;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 取得日期範圍
    $startDate = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');
    
    // 取得指定日期範圍內的訂單（包含付款方式）
    $sql = "SELECT o.* FROM orders o 
            WHERE DATE(o.created_at) BETWEEN ? AND ?
            ORDER BY o.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$startDate, $endDate]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 初始化統計資料
    $productStats = [];
    $totalQuantity = 0;
    $totalRevenue = 0;
    $paymentStats = [
        '現金' => ['count' => 0, 'total' => 0],
        'AlipayHK' => ['count' => 0, 'total' => 0],
        '其他' => ['count' => 0, 'total' => 0]
    ];
    
    // 為每個訂單取得商品明細
    foreach ($orders as &$order) {
        $itemStmt = $pdo->prepare("SELECT product_name, quantity, price, subtotal FROM order_items WHERE order_id = ?");
        $itemStmt->execute([$order['id']]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        $order['items'] = $items;
        
        // 計算統計
        foreach ($items as $item) {
            $totalQuantity += $item['quantity'];
            $totalRevenue += $item['subtotal'];
            
            $productName = $item['product_name'];
            if (!isset($productStats[$productName])) {
                $productStats[$productName] = [
                    'name' => $productName,
                    'quantity' => 0,
                    'total' => 0
                ];
            }
            $productStats[$productName]['quantity'] += $item['quantity'];
            $productStats[$productName]['total'] += $item['subtotal'];
        }
        
        // 付款方式統計
        $method = $order['payment_method'] ?? '現金';
        if (isset($paymentStats[$method])) {
            $paymentStats[$method]['count']++;
            $paymentStats[$method]['total'] += $order['total_amount'];
        }
    }
    
    // 排序商品統計
    $productStats = array_values($productStats);
    usort($productStats, function($a, $b) {
        return $b['total'] <=> $a['total'];
    });
    
    // 找出熱銷商品
    $topProduct = !empty($productStats) ? $productStats[0] : null;
    
    // 摘要資料
    $summary = [
        'totalOrders' => count($orders),
        'totalQuantity' => $totalQuantity,
        'totalRevenue' => $totalRevenue,
        'topProduct' => $topProduct,
        'paymentStats' => $paymentStats
    ];
    
    echo json_encode([
        'success' => true,
        'orders' => $orders,
        'productStats' => $productStats,
        'summary' => $summary
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '資料庫錯誤'
    ]);
}
?>