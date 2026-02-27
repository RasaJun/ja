// 購車資料
let cart = [];
let products = [];
let currentUser = null;

// 在檔案開頭加入
let currentPaymentMethod = '現金';

// 在初始化時加入付款方式監聽
document.addEventListener('DOMContentLoaded', async function() {
    console.log('頁面初始化...');
    
    await checkAuth();
    loadUserInfo();
    await loadProducts();
    
    // 綁定事件
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('confirmCheckoutBtn').addEventListener('click', confirmCheckout);
    
    // 付款方式切換監聽
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', function(e) {
            currentPaymentMethod = e.target.value;
            toggleCashInput(e.target.value === '現金');
        });
    });

    
    // 搜尋功能
    document.getElementById('searchProduct')?.addEventListener('input', function(e) {
        filterProducts(e.target.value);
    });
});

// 切換現金輸入顯示
function toggleCashInput(show) {
    const cashDiv = document.getElementById('cashChange');
    if (show) {
        cashDiv.classList.add('show');
    } else {
        cashDiv.classList.remove('show');
    }
}


// 確認結帳（取代原來的 checkout）
async function confirmCheckout() {
    if (cart.length === 0) {
        showMessage('購物車是空的', 'error');
        return;
    }
    
    // 獲取付款方式
    const paymentMethod = currentPaymentMethod;
    
    
    // 計算總金額
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    
    // 格式化訂單資料
    const orderItems = cart.map(item => ({
        product_id: item.id || item.product_id || 0,
        name: item.name || '未知商品',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        subtotal: Number(item.subtotal) || 0
    }));
    
    const orderData = {
        items: orderItems,
        total: Number(total),
        payment_method: paymentMethod
    };
    
    console.log('準備送出訂單:', orderData);
    
    // 禁用按鈕
    const checkoutBtn = document.getElementById('confirmCheckoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span>⏳</span> 處理中...';
    
    try {
        const response = await fetch('php/create_order_with_payment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData),
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        console.log('伺服器回應:', result);
        
        if (result.success) {
            // 顯示成功訊息
            showMessage(`訂單 #${result.data.order_number} 建立成功！`, 'success');
            
            // 顯示成功彈窗（包含付款方式）
            showCheckoutSuccess(result.data.order_number, paymentMethod);
            
            // 清空購物車
            cart = [];
            renderCart();
            
            document.getElementById('changeAmount').textContent = '$0';
            
            // 更新購物車數量顯示
            updateCartCount();
        } else {
            showMessage(result.message || '訂單建立失敗', 'error');
        }
    } catch (error) {
        console.error('結帳錯誤:', error);
        showMessage('系統錯誤: ' + error.message, 'error');
    } finally {
        // 恢復按鈕
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<span>✅</span> 確認結帳';
    }
}

// 修改結帳成功彈窗
function showCheckoutSuccess(orderNumber, paymentMethod) {
    // 檢查元素是否存在
    const modal = document.getElementById('checkoutSuccess');
    const orderNumberEl = document.getElementById('successOrderNumber');
    const paymentMethodEl = document.getElementById('successPaymentMethod');
    
    if (!modal) {
        console.error('找不到 checkoutSuccess 元素');
        return;
    }
    
    const paymentDisplay = {
        '現金': '💵 現金支付',
        'AlipayHK': '📱 AlipayHK 支付',
        '其他': '💳 其他方式'
    };
    
    // 安全地設定文字內容
    if (orderNumberEl) {
        orderNumberEl.textContent = `訂單編號：${orderNumber}`;
    }
    
    if (paymentMethodEl) {
        paymentMethodEl.textContent = paymentDisplay[paymentMethod] || paymentMethod;
    }
    
    modal.classList.add('show');
}

// 修改 renderCart 函數，加入總金額更新時重新計算找零
function renderCart() {
    const cartDiv = document.getElementById('cartItems');
    const totalSpan = document.getElementById('totalAmount');
    const cartCount = document.getElementById('cartCount');
    
    if (cart.length === 0) {
        cartDiv.innerHTML = '<div class="empty-cart">🛒 購物車是空的<br><small>點擊商品加入訂單</small></div>';
        totalSpan.textContent = '$0';
        if (cartCount) cartCount.textContent = '0';
        return;
    }
    
    let total = 0;
    let totalItems = 0;
    cartDiv.innerHTML = '';
    
    cart.forEach(item => {
        total += item.subtotal;
        totalItems += item.quantity;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        
        const priceStyle = item.has_discount ? 'color: #ff5252; font-weight: bold;' : '';
        const originalPriceHtml = item.has_discount ? 
            `<span style="color: #999; text-decoration: line-through; font-size: 0.8rem; margin-left: 5px;">$${item.original_price}</span>` : '';
        
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price" style="${priceStyle}">
                    $${item.price} ${originalPriceHtml}
                </div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-subtotal" style="${priceStyle}">$${item.subtotal}</div>
        `;
        cartDiv.appendChild(itemDiv);
    });
    
    totalSpan.textContent = `$${total}`;
    if (cartCount) cartCount.textContent = totalItems;
    
    // 重新計算找零
    calculateChange();
}

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    // 檢查登入狀態
    await checkAuth();
    
    // 載入使用者資訊
    loadUserInfo();
    
    // 載入商品
    await loadProducts();
    
    // 綁定事件
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
});

// 檢查認證
// 檢查認證
async function checkAuth() {
    try {
        const response = await fetch('php/check_session.php', {
            method: 'GET',
            credentials: 'same-origin',  // 重要：包含 cookie
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        const result = await response.json();
        console.log('checkAuth response:', result);  // 除錯用
        
        if (!result.success) {
            console.log('未登入，跳轉到首頁');
            window.location.href = 'index.html';
        } else {
            currentUser = result.data;
            console.log('當前使用者:', currentUser);
        }
    } catch (error) {
        console.error('檢查認證失敗:', error);
        window.location.href = 'index.html';
    }
}

// 載入使用者資訊
function loadUserInfo() {
    const userDisplay = document.getElementById('userDisplay');
    const userStr = sessionStorage.getItem('user');
    
    if (userStr) {
        const user = JSON.parse(userStr);
        userDisplay.textContent = `${user.full_name || user.username} (${user.role === 'admin' ? '管理員' : '員工'})`;
    } else if (currentUser) {
        userDisplay.textContent = `${currentUser.full_name || currentUser.username} (${currentUser.role === 'admin' ? '管理員' : '員工'})`;
    }
}

// 載入商品
async function loadProducts() {
    console.log('開始載入商品...');
    
    try {
        const response = await fetch('php/get_products.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        console.log('API 回應狀態:', response.status);
        
        const result = await response.json();
        console.log('API 回應內容:', result);
        
        if (result.success) {
            products = result.data;
            console.log('取得商品數量:', products.length);
            
            if (products.length === 0) {
                // 如果沒有商品，顯示提示並插入預設商品
                console.log('沒有商品資料，嘗試插入預設商品');
                await insertDefaultProducts();
            } else {
                renderProducts();
            }
        } else {
            console.error('載入商品失敗:', result.message);
            showMessage('載入商品失敗: ' + result.message, 'error');
            
            // 如果 API 失敗，使用預設商品
            useDefaultProducts();
        }
    } catch (error) {
        console.error('載入商品錯誤:', error);
        showMessage('系統錯誤: ' + error.message, 'error');
        
        // 使用預設商品
        useDefaultProducts();
    }
}

// 使用預設商品（當 API 失敗時）
function useDefaultProducts() {
    console.log('使用預設商品資料');
    
    products = [
        { id: 1, name: '盲盒鎖匙扣', price: 35, image_filename: 'keychain.png', sort_order: 1 },
        { id: 2, name: '月曆', price: 50, image_filename: 'calendar.png', sort_order: 2 },
        { id: 3, name: '[COMBO] 盲盒鎖匙扣 * 5', price: 150, image_filename: 'keychain_combo.png', sort_order: 3 },
    ];
    
    // 加入圖片路徑
    products.forEach(product => {
        product.image_url = 'images/' + product.image_filename;
    });
    
    renderProducts();
}

// 插入預設商品到資料庫
async function insertDefaultProducts() {
    // 這裡可以實作一個 API 來插入預設商品
    // 暫時先使用預設商品
    useDefaultProducts();
}

// 渲染商品列表
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    
    if (!grid) {
        console.error('找不到 productsGrid 元素');
        return;
    }
    
    grid.innerHTML = '';
    
    if (!products || products.length === 0) {
        grid.innerHTML = '<div class="empty-cart" style="grid-column: 1/-1; padding: 50px;">📦 目前沒有商品</div>';
        return;
    }
    
    console.log('渲染商品，第一筆資料:', products[0]);
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // 確保點擊時傳入完整的商品物件
        card.onclick = () => {
            console.log('點擊商品:', product); // 除錯用
            addToCart(product);
        };
        
        // 安全地取得商品名稱
        const productName = product.name || product.product_name || '未知商品';
        
        // 安全地取得商品價格
        const productPrice = product.price || product.product_price || 0;
        
        // 安全地取得商品圖片
        let productImage = 'images/default.jpg';
        if (product.image_url) {
            productImage = product.image_url;
        } else if (product.image_filename) {
            productImage = 'images/' + product.image_filename;
        }
        
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${productImage}" 
                     alt="${productName}" 
                     class="product-image"
                     onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\' viewBox=\'0 0 150 150\'%3E%3Crect width=\'150\' height=\'150\' fill=\'%231976d2\'/%3E%3Ctext x=\'75\' y=\'90\' font-size=\'50\' text-anchor=\'middle\' fill=\'white\' font-family=\'Arial\'%3E${productName.charAt(0)}%3C/text%3E%3C/svg%3E';">
            </div>
            <div class="product-info">
                <div class="product-name">${productName}</div>
                <div class="product-price">$${productPrice}</div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// 加入購物車
function addToCart(product) {
    console.log('加入購物車的商品:', product); // 除錯用
    
    // 確保 product 有正確的 id
    const productId = product.id || product.product_id || 0;
    
    // 檢查是否已經在購物車中
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        // 如果已經存在，數量 +1
        existingItem.quantity += 1;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        // 如果不存在，新增到購物車
        const newItem = {
            id: productId,
            product_id: productId,
            name: product.name || product.product_name || '未知商品',
            price: Number(product.price) || 0,
            quantity: 1,
            subtotal: Number(product.price) || 0
        };
        cart.push(newItem);
    }
    
    console.log('目前購物車:', cart); // 除錯用
    
    // 重新渲染購物車
    renderCart();
    
    // 顯示加入成功的訊息
    showMessage(`已加入 ${product.name || '商品'}`, 'success');
}


// 更新數量
function updateQuantity(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        const item = cart[itemIndex];
        item.quantity += change;
        
        if (item.quantity <= 0) {
            cart.splice(itemIndex, 1);
        } else {
            item.subtotal = item.quantity * item.price;
        }
        
        renderCart();
    }
}

// 渲染購物車
function renderCart() {
    const cartDiv = document.getElementById('cartItems');
    const totalSpan = document.getElementById('totalAmount');
    
    if (cart.length === 0) {
        cartDiv.innerHTML = '<div class="empty-cart">購物車是空的</div>';
        totalSpan.textContent = '$0';
        return;
    }
    
    let total = 0;
    cartDiv.innerHTML = '';
    
    cart.forEach(item => {
        total += item.subtotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-subtotal">$${item.subtotal}</div>
        `;
        cartDiv.appendChild(itemDiv);
    });
    
    totalSpan.textContent = `$${total}`;
}

// 結帳
async function checkout() {
    if (cart.length === 0) {
        showMessage('購物車是空的', 'error');
        return;
    }
    
    // 計算總金額
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    
    // 格式化訂單資料
    const orderItems = cart.map(item => ({
        product_id: item.id || item.product_id || 0,
        name: item.name || '未知商品',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        subtotal: Number(item.subtotal) || 0
    }));
    
    const orderData = {
        items: orderItems,
        total: Number(total)
    };
    
    console.log('準備送出訂單:', orderData);
    
    // 禁用按鈕
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span>⏳</span> 處理中...';
    
    try {
        // 使用修正版的 API
        const response = await fetch('php/create_order_fixed.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData),
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        console.log('伺服器回應:', result);
        
        if (result.success) {
            // 顯示成功訊息
            showMessage(`訂單 #${result.data.order_number} 建立成功！`, 'success');
            
            // 顯示成功彈窗
            showCheckoutSuccess(result.data.order_number);
            
            // 清空購物車
            cart = [];
            renderCart();
            
            // 更新購物車數量顯示
            updateCartCount();
        } else {
            showMessage(result.message || '訂單建立失敗', 'error');
        }
    } catch (error) {
        console.error('結帳錯誤:', error);
        showMessage('系統錯誤: ' + error.message, 'error');
    } finally {
        // 恢復按鈕
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<span>✅</span> 結帳';
    }
}

// 更新購物車數量顯示
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// 渲染購物車
function renderCart() {
    const cartDiv = document.getElementById('cartItems');
    const totalSpan = document.getElementById('totalAmount');
    const cartCount = document.getElementById('cartCount');
    
    if (!cartDiv) return;
    
    if (cart.length === 0) {
        cartDiv.innerHTML = '<div class="empty-cart">🛒 購物車是空的<br><small>點擊商品加入訂單</small></div>';
        totalSpan.textContent = '$0';
        if (cartCount) cartCount.textContent = '0';
        return;
    }
    
    let total = 0;
    let totalItems = 0;
    cartDiv.innerHTML = '';
    
    cart.forEach(item => {
        total += item.subtotal;
        totalItems += item.quantity;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-subtotal">$${item.subtotal}</div>
        `;
        cartDiv.appendChild(itemDiv);
    });
    
    totalSpan.textContent = `$${total}`;
    if (cartCount) cartCount.textContent = totalItems;
}

// 更新數量
function updateQuantity(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
        const item = cart[itemIndex];
        item.quantity += change;
        
        if (item.quantity <= 0) {
            cart.splice(itemIndex, 1);
        } else {
            item.subtotal = item.quantity * item.price;
        }
        
        renderCart();
    }
}

// 更新購物車數量顯示
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// 顯示結帳成功彈窗
function showCheckoutSuccess(orderNumber) {
    // 檢查是否有成功彈窗元素
    let modal = document.getElementById('checkoutSuccess');
    
    // 如果沒有，建立一個
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'checkoutSuccess';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header" style="background: #4caf50;">
                    <h2>✅ 結帳成功</h2>
                    <button class="close-btn" onclick="closeCheckoutModal()">&times;</button>
                </div>
                <div class="modal-body" style="text-align: center; padding: 30px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
                    <h3 id="successOrderNumber" style="color: #4caf50; margin-bottom: 15px;"></h3>
                    <p>訂單已建立成功</p>
                    <button class="checkout-btn" onclick="closeCheckoutModal()" style="margin-top: 20px;">
                        確定
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('successOrderNumber').textContent = `訂單編號：${orderNumber}`;
    modal.classList.add('show');
}

// 關閉結帳成功彈窗
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutSuccess');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 顯示結帳成功彈窗
function showCheckoutSuccess(orderNumber) {
    const modal = document.getElementById('checkoutSuccess');
    if (modal) {
        document.getElementById('successOrderNumber').textContent = `訂單編號：${orderNumber}`;
        modal.classList.add('show');
    } else {
        // 如果沒有彈窗，用 toast 顯示
        showMessage(`訂單 #${orderNumber} 建立成功！`, 'success');
    }
}

// 關閉結帳成功彈窗
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutSuccess');
    if (modal) {
        modal.classList.remove('show');
    }
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