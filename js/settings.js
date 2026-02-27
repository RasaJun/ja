let products = [];
let currentUser = null;

// 初始化頁面
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    loadUserInfo();
    await loadProducts();
    
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// 檢查認證（staff 和 admin 都可以進入）
async function checkAuth() {
    try {
        const response = await fetch('php/check_session.php');
        const result = await response.json();
        
        if (!result.success) {
            window.location.href = 'index.html';
        } else {
            currentUser = result.data;
            // staff 和 admin 都可以進入設定頁面
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

// 載入商品
async function loadProducts() {
    try {
        const response = await fetch('php/get_products_with_discounts.php?t=' + Date.now());
        const result = await response.json();
        
        if (result.success) {
            products = result.data;
            renderSettings();
        } else {
            showMessage('載入商品失敗', 'error');
        }
    } catch (error) {
        console.error('載入商品錯誤:', error);
        showMessage('系統錯誤', 'error');
    }
}

// 渲染設定頁面
function renderSettings() {
    const grid = document.getElementById('settingsGrid');
    grid.innerHTML = '';
    
    products.forEach(product => {
        const hasDiscount = product.discount_price && product.discount_price > 0;
        const discountPrice = hasDiscount ? product.discount_price : '';
        
        const card = document.createElement('div');
        card.className = 'setting-card';
        card.innerHTML = `
            <img src="${product.image_url || 'images/' + product.image_filename}" 
                 alt="${product.name}" 
                 class="setting-image"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%231976d2\'/%3E%3Ctext x=\'50\' y=\'65\' font-size=\'40\' text-anchor=\'middle\' fill=\'white\'%3E${product.name.charAt(0)}%3C/text%3E%3C/svg%3E';">
            
            <div class="setting-form">
                <h3>${product.name}</h3>
                
                <div class="price-display">
                    <div class="price-row">
                        <span>原價：</span>
                        <span class="current-price">$${product.price}</span>
                    </div>
                    
                    <div class="price-row">
                        <span>優惠價：</span>
                        <span class="discount-price" id="display-price-${product.id}">
                            ${hasDiscount ? '$' + product.discount_price : '無優惠'}
                        </span>
                        <button class="toggle-discount ${hasDiscount ? '' : 'off'}" 
                                onclick="toggleDiscount(${product.id})">
                            ${hasDiscount ? '🎯 優惠中' : '⚪ 設定優惠'}
                        </button>
                    </div>
                </div>
                
                <div id="discount-input-${product.id}" style="${hasDiscount ? 'display:block;' : 'display:none;'}">
                    <div class="price-input-group">
                        <input type="number" 
                               id="discount-${product.id}" 
                               class="discount-input" 
                               value="${discountPrice}" 
                               placeholder="優惠價格"
                               min="0"
                               step="1">
                        <button class="save-btn" onclick="saveDiscount(${product.id})" style="width: auto; padding: 8px 15px;">
                            儲存優惠
                        </button>
                    </div>
                    <div class="help-text">
                        💡 輸入0或留空可取消優惠
                    </div>
                </div>
                
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #e3f2fd;">
                    <div class="price-row">
                        <span>最後更新：</span>
                        <span>${product.updated_at ? new Date(product.updated_at).toLocaleString('zh-TW') : '從未'}</span>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 切換優惠輸入框顯示
function toggleDiscount(productId) {
    const inputDiv = document.getElementById(`discount-input-${productId}`);
    const toggleBtn = document.querySelector(`#discount-input-${productId}`).previousElementSibling.querySelector('.toggle-discount');
    const displayPrice = document.getElementById(`display-price-${productId}`);
    
    if (inputDiv.style.display === 'none') {
        inputDiv.style.display = 'block';
        toggleBtn.textContent = '❌ 取消優惠';
        toggleBtn.classList.remove('off');
    } else {
        // 如果關閉時沒有輸入值，清除優惠
        const discountInput = document.getElementById(`discount-${productId}`);
        if (!discountInput.value) {
            displayPrice.textContent = '無優惠';
        }
        inputDiv.style.display = 'none';
        toggleBtn.textContent = '⚪ 設定優惠';
        toggleBtn.classList.add('off');
    }
}

// 儲存優惠價格
async function saveDiscount(productId) {
    const discountInput = document.getElementById(`discount-${productId}`);
    let discountPrice = discountInput.value.trim();
    
    // 如果輸入為空或是0，視為取消優惠
    if (discountPrice === '' || parseFloat(discountPrice) === 0) {
        discountPrice = null;
    } else {
        discountPrice = parseFloat(discountPrice);
        if (isNaN(discountPrice) || discountPrice < 0) {
            showMessage('請輸入有效的優惠價格', 'error');
            return;
        }
    }
    
    try {
        const formData = new FormData();
        formData.append('product_id', productId);
        formData.append('discount_price', discountPrice);
        formData.append('updated_by', currentUser.username);
        
        const response = await fetch('php/update_discount.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('優惠設定已更新', 'success');
            
            // 更新顯示
            const displayPrice = document.getElementById(`display-price-${productId}`);
            if (discountPrice) {
                displayPrice.textContent = '$' + discountPrice;
                displayPrice.style.color = '#ff5252';
            } else {
                displayPrice.textContent = '無優惠';
            }
            
            // 重新載入商品列表以更新最後更新時間
            await loadProducts();
        } else {
            showMessage(result.message || '更新失敗', 'error');
        }
    } catch (error) {
        console.error('更新錯誤:', error);
        showMessage('系統錯誤', 'error');
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