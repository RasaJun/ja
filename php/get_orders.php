<?php
require_once 'config.php';

// 開啟錯誤報告
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 檢查是否登入
checkLogin();

try {
    $pdo = getDB();
    
    // 檢查 orders 表是否存在
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'orders'");
    if ($tableCheck->rowCount() == 0) {
        sendResponse(false, 'orders 資料表不存在');
        return;
    }
    
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $status = isset($_GET['status']) && $_GET['status'] !== 'all' ? $_GET['status'] : '';
    $date = isset($_GET['date']) ? $_GET['date'] : '';
    
    $limit = 10;
    $offset = ($page - 1) * $limit;
    
    // 建立查詢條件
    $where = [];
    $params = [];
    
    if (!empty($search)) {
        $where[] = "order_number LIKE :search";
        $params[':search'] = "%$search%";
    }
    
    if (!empty($status)) {
        $where[] = "status = :status";
        $params[':status'] = $status;
    }
    
    if (!empty($date)) {
        $where[] = "DATE(created_at) = :date";
        $params[':date'] = $date;
    }
    
    $whereClause = empty($where) ? "" : "WHERE " . implode(" AND ", $where);
    
    // 取得總筆數
    $countSql = "SELECT COUNT(*) FROM orders $whereClause";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalOrders = $countStmt->fetchColumn();
    $totalPages = ceil($totalOrders / $limit);
    
    // 取得訂單列表 - 使用命名參數
    $sql = "
        SELECT o.*, 
               (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count 
        FROM orders o 
        $whereClause 
        ORDER BY o.created_at DESC 
        LIMIT :limit OFFSET :offset
    ";
    
    $stmt = $pdo->prepare($sql);
    
    // 綁定所有參數
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    // 綁定 limit 和 offset 為整數
    $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $orders = $stmt->fetchAll();
    
    // 如果沒有訂單，回傳空陣列
    if (!$orders) {
        $orders = [];
    }
    
    sendResponse(true, '取得成功', [
        'orders' => $orders,
        'totalPages' => $totalPages,
        'currentPage' => $page,
        'totalOrders' => $totalOrders
    ]);
    
} catch (Exception $e) {
    error_log("get_orders.php 錯誤: " . $e->getMessage());
    error_log("錯誤追蹤: " . $e->getTraceAsString());
    sendResponse(false, '取得訂單失敗: ' . $e->getMessage());
}
?>