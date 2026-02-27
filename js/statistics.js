let currentUser = null;
let allOrders = [];
let productStats = [];

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    loadUserInfo();
    
    // 設定預設日期範圍（最近30天）
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('startDate').value = formatDateInput(thirtyDaysAgo);
    document.getElementById('endDate').value = formatDateInput(today);
    
    await loadStatistics();
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// 檢查認證
async function checkAuth() {
    try {
        const response = await fetch('php/check_session.php');
        const result = await response.json();
        
        if (!result.success) {
            window.location.href = 'index.html';
        } else {
            currentUser = result.data;
        }
    } catch (error) {
        console.error('檢查認證失敗:', error);
        window.location.href = 'index.html';
    }
}

// 載入使用者資訊
function loadUserInfo() {
    const userDisplay = document.getElementById('userDisplay');
    if (currentUser) {
        userDisplay.textContent = `${currentUser.full_name || currentUser.username}`;
    }
}

// 格式化日期為 YYYY-MM-DD
function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


// 更新摘要卡片
function updateSummary(summary) {
    document.getElementById('totalQuantity').textContent = summary.totalQuantity || 0;
    document.getElementById('totalOrders').textContent = `${summary.totalOrders || 0} 筆訂單`;
    document.getElementById('totalRevenue').textContent = `$${summary.totalRevenue || 0}`;
    
    const avgOrder = summary.totalOrders > 0 
        ? Math.round(summary.totalRevenue / summary.totalOrders) 
        : 0;
    
    if (summary.topProduct) {
        document.getElementById('topProduct').textContent = summary.topProduct.name;
        document.getElementById('topProductSales').textContent = `${summary.topProduct.quantity} 件`;
    } else {
        document.getElementById('topProduct').textContent = '-';
        document.getElementById('topProductSales').textContent = '0 件';
    }
}

// 在 updateSummary 函數中加入付款方式統計
function updatePaymentStats(orders) {
    const paymentStats = {
        '現金': { count: 0, total: 0 },
        'AlipayHK': { count: 0, total: 0 },
        '其他': { count: 0, total: 0 }
    };
    
    orders.forEach(order => {
        const method = order.payment_method || '現金';
        if (paymentStats[method]) {
            paymentStats[method].count++;
            paymentStats[method].total += parseFloat(order.total_amount);
        }
    });
    
    const container = document.getElementById('paymentStats');
    let html = '<div style="display: grid; gap: 15px;">';
    
    const colors = {
        '現金': '#4caf50',
        'AlipayHK': '#1976d2',
        '其他': '#ff9800'
    };
    
    const icons = {
        '現金': '💵',
        'AlipayHK': '📱',
        '其他': '💳'
    };
    
    for (const [method, data] of Object.entries(paymentStats)) {
        if (data.count > 0) {
            html += `
                <div style="background: white; padding: 15px; border-radius: 10px; border-left: 5px solid ${colors[method]};">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="font-size: 1.5rem;">${icons[method]}</span>
                        <span style="font-weight: 600; color: ${colors[method]};">${method}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                        <span>訂單數：</span>
                        <span style="font-weight: 600;">${data.count} 筆</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                        <span>營業額：</span>
                        <span style="font-weight: 600; color: ${colors[method]};">$${data.total}</span>
                    </div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// 在 loadStatistics 函數中呼叫
async function loadStatistics() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    try {
        const response = await fetch(`php/get_statistics.php?start=${startDate}&end=${endDate}&t=${Date.now()}`);
        const result = await response.json();
        
        if (result.success) {
            allOrders = result.orders || [];
            productStats = result.productStats || [];
            updateSummary(result.summary);
            updatePaymentStats(allOrders);  // 新增這行
            renderProductStats(productStats);
            renderSalesChart(productStats);
            renderDetailedStats(allOrders);
        } else {
            showMessage('載入統計失敗', 'error');
        }
    } catch (error) {
        console.error('載入統計錯誤:', error);
        showMessage('系統錯誤', 'error');
    }
}

// 渲染商品統計表格
function renderProductStats(stats) {
    const tbody = document.querySelector('#productStats tbody');
    
    if (!stats || stats.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    暫無銷售資料
                </td>
            </tr>
        `;
        return;
    }
    
    // 計算總銷售額用於佔比
    const totalSales = stats.reduce((sum, item) => sum + item.total, 0);
    
    let html = '';
    stats.forEach((item, index) => {
        const percentage = totalSales > 0 ? ((item.total / totalSales) * 100).toFixed(1) : 0;
        const rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : ''));
        
        html += `
            <tr>
                <td>
                    <span class="${rankClass}">
                        ${index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `#${index + 1}`))}
                    </span>
                </td>
                <td>${item.name}</td>
                <td><strong>${item.quantity}</strong> 件</td>
                <td><strong>$${item.total}</strong></td>
                <td>
                    ${percentage}%
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 渲染銷售圖表
function renderSalesChart(stats) {
    const chartDiv = document.getElementById('salesChart');
    
    if (!stats || stats.length === 0) {
        chartDiv.innerHTML = '<p style="text-align: center; color: #999; width: 100%;">暫無銷售資料</p>';
        return;
    }
    
    // 找出最大銷售量用於圖表比例
    const maxQuantity = Math.max(...stats.map(item => item.quantity));
    
    let html = '';
    stats.forEach(item => {
        const height = maxQuantity > 0 ? (item.quantity / maxQuantity) * 200 : 0;
        
        html += `
            <div class="bar-item">
                <div class="bar" style="height: ${height}px;"></div>
                <div class="bar-value">${item.quantity}</div>
                <div class="bar-label" title="${item.name}">${item.name}</div>
            </div>
        `;
    });
    
    chartDiv.innerHTML = html;
}

// 渲染詳細統計表格
function renderDetailedStats(orders) {
    const tbody = document.querySelector('#detailedStats tbody');
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    暫無銷售記錄
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    orders.forEach(order => {
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                html += `
                    <tr>
                        <td>${formatDate(order.created_at)}</td>
                        <td>${order.order_number}</td>
                        <td>${item.product_name}</td>
                        <td>$${item.price}</td>
                        <td>${item.quantity}</td>
                        <td><strong>$${item.subtotal}</strong></td>
                    </tr>
                `;
            });
        }
    });
    
    tbody.innerHTML = html;
}

// 匯出統計報表
function exportStats() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // 建立 CSV 內容
    let csv = '📊 銷售統計報表\n';
    csv += '日期範圍,' + startDate + ' 至 ' + endDate + '\n';
    csv += '產出時間,' + new Date().toLocaleString('zh-TW') + '\n\n';
    
    // 付款方式統計
    csv += '=== 付款方式統計 ===\n';
    csv += '付款方式,訂單數量,營業總額\n';
    
    // 計算付款方式統計
    const paymentStats = {};
    allOrders.forEach(order => {
        const method = order.payment_method || '現金';
        if (!paymentStats[method]) {
            paymentStats[method] = { count: 0, total: 0 };
        }
        paymentStats[method].count++;
        paymentStats[method].total += parseFloat(order.total_amount);
    });
    
    for (const [method, data] of Object.entries(paymentStats)) {
        csv += `${method},${data.count},${data.total}\n`;
    }
    
    csv += '\n=== 營業額總計 ===\n';
    csv += `總營業額,$${allOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0)}\n`;
    csv += `總訂單數,${allOrders.length}\n\n`;
    
    // 商品銷售統計
    csv += '=== 商品銷售統計 ===\n';
    csv += '商品名稱,銷售數量,銷售總額\n';
    
    productStats.forEach(item => {
        csv += `${item.name},${item.quantity},${item.total}\n`;
    });
    
    csv += '\n=== 詳細銷售記錄 ===\n';
    csv += '訂單編號,付款方式,付款時間,商品名稱,單價,數量,小計\n';
    
    allOrders.forEach(order => {
        // 格式化付款時間
        const paymentTime = order.created_at ? new Date(order.created_at).toLocaleString('zh-TW') : 'N/A';
        
        if (order.items && order.items.length > 0) {
            // 第一筆商品顯示完整訂單資訊
            order.items.forEach((item, index) => {
                csv += `${index === 0 ? order.order_number : ''},`;
                csv += `${index === 0 ? (order.payment_method || '現金') : ''},`;
                csv += `${index === 0 ? paymentTime : ''},`;
                csv += `${item.product_name},`;
                csv += `${item.price},`;
                csv += `${item.quantity},`;
                csv += `${item.subtotal}\n`;
            });
        } else {
            // 如果沒有明細，只顯示訂單資訊
            csv += `${order.order_number},${order.payment_method || '現金'},${paymentTime},無商品資料,0,0,0\n`;
        }
    });
    
    // 下載 CSV 檔案
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `銷售統計_${startDate}_至_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage('報表已匯出', 'success');
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW');
    } catch (e) {
        return dateString;
    }
}

// 顯示訊息
function showMessage(text, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = text;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 登出
async function logout() {
    try {
        await fetch('php/logout.php');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('登出錯誤:', error);
    }
}