let currentUser = null;
let currentPage = 1;
let totalPages = 1;
let orders = [];
let deleteOrderId = null;

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    loadUserInfo();
    await loadOrders();
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('searchOrder').addEventListener('input', debounce(loadOrders, 500));
    document.getElementById('dateFilter').addEventListener('change', loadOrders);
});

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
        userDisplay.textContent = `${currentUser.full_name || currentUser.username} (${currentUser.role === 'admin' ? '管理員' : '員工'})`;
    }
}

// 載入訂單列表
async function loadOrders() {
    const tbody = document.getElementById('ordersList');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">載入中...</td></tr>';
    
    try {
        // 加入時間戳防止快取
        const response = await fetch('php/get_orders_final.php?t=' + Date.now(), {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        const result = await response.json();
        console.log('訂單資料:', result);
        
        if (result.success) {
            orders = result.data || [];
            
            // 分頁
            const start = (currentPage - 1) * 10;
            const end = start + 10;
            const pageOrders = orders.slice(start, end);
            
            totalPages = Math.ceil(orders.length / 10);
            
            renderOrders(pageOrders);
            updatePagination();
        } else {
            throw new Error(result.message || '載入失敗');
        }
    } catch (error) {
        console.error('載入訂單錯誤:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px;">
                    <div style="color: #f44336; font-size: 1.2rem; margin-bottom: 10px;">
                        ❌ 載入失敗
                    </div>
                    <p style="color: #666;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 8px 30px; background: #1976d2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        重新整理
                    </button>
                </td>
            </tr>
        `;
    }
}


// 輔助函數：格式化日期
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW');
    } catch (e) {
        return dateString;
    }
}

// 輔助函數：取得狀態文字
function getStatusText(status) {
    const statusMap = {
        'pending': '處理中',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
}

// 渲染訂單列表
function renderOrders(ordersToRender) {
    const tbody = document.getElementById('ordersList');
    
    if (!ordersToRender || ordersToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    📭 尚無訂單資料
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    ordersToRender.forEach(order => {
        // 付款方式圖示
        const paymentIcon = {
            '現金': '💵',
            'AlipayHK': '📱',
            '其他': '💳'
        }[order.payment_method] || '💳';
        
        // 格式化購買內容
        const itemsText = order.items_text || '無商品';
        
        html += `
            <tr>
                <td><strong>${order.order_number}</strong></td>
                <td>
                    <span style="display: flex; align-items: center; gap: 5px;">
                        ${paymentIcon} ${order.payment_method || '現金'}
                    </span>
                </td>
                <td>${formatDate(order.created_at)}</td>
                <td style="max-width: 300px;">${itemsText}</td>
                <td><strong style="color: #1976d2;">$${order.total_amount}</strong></td>
                <td>
                    <button class="delete-btn" onclick="showDeleteConfirm(${order.id}, '${order.order_number}')">
                        🗑️ 刪除
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// 顯示刪除確認彈窗
function showDeleteConfirm(orderId, orderNumber) {
    deleteOrderId = orderId;
    const modal = document.getElementById('confirmModal');
    const orderInfo = document.getElementById('deleteOrderInfo');
    
    // 找到該訂單的詳細資訊
    const order = orders.find(o => o.id === orderId);
    let itemsList = '';
    
    if (order && order.items) {
        itemsList = order.items.map(item => `${item.product_name} x${item.quantity}`).join('、');
    }
    
    orderInfo.innerHTML = `
        <strong>訂單編號：${orderNumber}</strong><br>
        <span style="color: #666;">購買內容：${itemsList || '無明細'}</span><br>
        <span style="color: #1976d2; font-size: 1.2rem;">金額：$${order ? order.total_amount : 0}</span>
    `;
    
    modal.classList.add('show');
    
    // 綁定確認刪除按鈕
    document.getElementById('confirmDeleteBtn').onclick = () => deleteOrder(orderId);
}

// 關閉確認彈窗
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    deleteOrderId = null;
}

// 刪除訂單
async function deleteOrder(orderId) {
    try {
        const response = await fetch('php/delete_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: orderId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('訂單已成功刪除', 'success');
            closeConfirmModal();
            await loadOrders();
        } else {
            showMessage(result.message || '刪除失敗', 'error');
        }
    } catch (error) {
        console.error('刪除訂單錯誤:', error);
        showMessage('系統錯誤: ' + error.message, 'error');
    }
}

// 重新整理訂單
function refreshOrders() {
    currentPage = 1;
    loadOrders();
}

// 顯示錯誤
function showError(message) {
    const tbody = document.getElementById('ordersList');
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
                <div style="color: #f44336; font-size: 1.2rem; margin-bottom: 10px;">
                    ❌ 載入失敗
                </div>
                <p style="color: #666;">${message}</p>
                <button onclick="refreshOrders()" style="margin-top: 20px; padding: 8px 30px; background: #1976d2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    重新整理
                </button>
            </td>
        </tr>
    `;
}

// 更新分頁
function updatePagination() {
    document.getElementById('pageInfo').textContent = `第 ${currentPage} 頁 / 共 ${totalPages} 頁`;
}

// 切換頁碼
function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
        loadOrders();
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
        loadOrders();
    }
}



// 查看訂單詳情
async function viewOrder(orderId) {
    try {
        const response = await fetch(`php/get_order_details.php?id=${orderId}`);
        const result = await response.json();
        
        if (result.success) {
            showOrderModal(result.data);
        } else {
            showMessage('載入訂單詳情失敗', 'error');
        }
    } catch (error) {
        console.error('載入訂單詳情錯誤:', error);
        showMessage('系統錯誤', 'error');
    }
}

// 顯示訂單詳情彈窗
function showOrderModal(order) {
    const modal = document.getElementById('orderModal');
    const orderNumber = document.getElementById('modalOrderNumber');
    const details = document.getElementById('orderDetails');
    
    orderNumber.textContent = order.order_number;
    
    details.innerHTML = `
        <div class="order-info">
            <div class="order-info-row">
                <span class="order-info-label">訂單編號：</span>
                <span class="order-info-value">${order.order_number}</span>
            </div>
            <div class="order-info-row">
                <span class="order-info-label">建立時間：</span>
                <span class="order-info-value">${formatDate(order.created_at)}</span>
            </div>
            <div class="order-info-row">
                <span class="order-info-label">員工：</span>
                <span class="order-info-value">${order.created_by}</span>
            </div>
            <div class="order-info-row">
                <span class="order-info-label">狀態：</span>
                <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
            </div>
        </div>
        
        <h3>訂單明細</h3>
        <table class="order-items-table">
            <thead>
                <tr>
                    <th>商品名稱</th>
                    <th>單價</th>
                    <th>數量</th>
                    <th>小計</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(item => `
                    <tr>
                        <td>${item.product_name}</td>
                        <td>$${item.price}</td>
                        <td>${item.quantity}</td>
                        <td><strong>$${item.subtotal}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align: right; font-weight: 700;">總計：</td>
                    <td><strong>$${order.total_amount}</strong></td>
                </tr>
            </tfoot>
        </table>
        
        ${currentUser.role === 'admin' ? `
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                <select id="orderStatus" class="status-select">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>處理中</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>已完成</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>已取消</option>
                </select>
                <button class="filter-btn" onclick="updateOrderStatus(${order.id})">
                    更新狀態
                </button>
            </div>
        ` : ''}
    `;
    
    modal.classList.add('show');
}

// 更新訂單狀態
async function updateOrderStatus(orderId) {
    const status = document.getElementById('orderStatus').value;
    
    try {
        const response = await fetch('php/update_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: orderId,
                status: status
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('訂單狀態已更新');
            closeModal();
            loadOrders();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('更新訂單錯誤:', error);
        showMessage('系統錯誤', 'error');
    }
}

// 編輯訂單
function editOrder(orderId) {
    // 實作編輯訂單功能
    viewOrder(orderId);
}

// 刪除訂單 - 最簡單版本
async function deleteOrder(orderId) {
    if (!confirm('確定要刪除此訂單嗎？')) return;
    
    try {
        const response = await fetch('php/delete_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: orderId })
        });
        
        const result = await response.json();
        console.log('刪除結果:', result);
        
        if (result.success) {
            alert('訂單已刪除！');
            // 最簡單的方式：重新載入整個頁面
            window.location.reload();
        } else {
            alert('刪除失敗：' + result.message);
        }
    } catch (error) {
        console.error('刪除錯誤:', error);
        alert('系統錯誤：' + error.message);
    }
}

// 關閉彈窗
function closeModal() {
    document.getElementById('orderModal').classList.remove('show');
}

// 切換頁碼
function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
        loadOrders();
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
        loadOrders();
    }
}

// 更新分頁資訊
function updatePagination() {
    document.getElementById('pageInfo').textContent = `第 ${currentPage} 頁 / 共 ${totalPages} 頁`;
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 取得狀態文字
function getStatusText(status) {
    const statusMap = {
        'pending': '處理中',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    return statusMap[status] || status;
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

// 防抖函數
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}