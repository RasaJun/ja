// 產品資料庫
const products = [
    {
        id: 1,
        name: '經典牛肉漢堡',
        price: 180,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
        description: '多汁牛肉漢堡'
    },
    {
        id: 2,
        name: '瑪格麗特披薩',
        price: 280,
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&h=200&fit=crop',
        description: '經典義式披薩'
    },
    {
        id: 3,
        name: '日式拉麵',
        price: 220,
        image: 'https://images.unsplash.com/photo-1557872943-16e5a264d9b2?w=300&h=200&fit=crop',
        description: '濃郁豚骨湯頭'
    },
    {
        id: 4,
        name: '凱薩沙拉',
        price: 150,
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop',
        description: '新鮮蔬菜佐凱薩醬'
    },
    {
        id: 5,
        name: '提拉米蘇',
        price: 120,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop',
        description: '義式經典甜點'
    },
    {
        id: 6,
        name: '冰美式咖啡',
        price: 80,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop',
        description: '香醇冰咖啡'
    },
    {
        id: 7,
        name: '珍珠奶茶',
        price: 70,
        image: 'https://images.unsplash.com/photo-1558857563-c0c3e7f58a10?w=300&h=200&fit=crop',
        description: '台灣經典飲品'
    },
    {
        id: 8,
        name: '炸雞翅',
        price: 150,
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6de455209?w=300&h=200&fit=crop',
        description: '香辣酥脆雞翅'
    },
    {
        id: 9,
        name: '海鮮燉飯',
        price: 320,
        image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&h=200&fit=crop',
        description: '豐富海鮮配料'
    },
    {
        id: 10,
        name: '巧克力蛋糕',
        price: 110,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop',
        description: '濃郁巧克力'
    },
    {
        id: 11,
        name: '綠茶',
        price: 50,
        image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=300&h=200&fit=crop',
        description: '清香回甘'
    },
    {
        id: 12,
        name: '牛肉麵',
        price: 200,
        image: 'https://images.unsplash.com/photo-1582878826629-39b7ad3e7f5a?w=300&h=200&fit=crop',
        description: '紅燒牛肉麵'
    }
];

// 購物車資料
let cart = [];

// 初始化頁面
document.addEventListener('DOMContentLoaded', () => {
    displayProducts(products);
    setupSearchListener();
});

// 顯示產品
function displayProducts(productsToShow) {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';

    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    $${product.price}
                    <button class="add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> 加入
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// 設置搜尋監聽
function setupSearchListener() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
        displayProducts(filteredProducts);
    });
}

// 加入購物車
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartDisplay();
    animateAddToCart();
}

// 更新購物車顯示
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-basket"></i>
                <p>購物車是空的</p>
                <span>點擊餐點加入購物車</span>
            </div>
        `;
    } else {
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <i class="fas fa-trash remove-item" onclick="removeFromCart(${item.id})"></i>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }

    updateSummary();
}

// 更新數量
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartDisplay();
        }
    }
}

// 從購物車移除
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
}

// 清空購物車
function clearCart() {
    if (cart.length > 0 && confirm('確定要清空購物車嗎？')) {
        cart = [];
        updateCartDisplay();
    }
}

// 更新總結
function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 500 ? 0 : 60;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `$${subtotal}`;
    document.getElementById('shipping').textContent = shipping === 0 ? '免費' : `$${shipping}`;
    document.getElementById('total').textContent = `$${total}`;
}

// 結帳
function checkout() {
    if (cart.length === 0) {
        alert('購物車是空的，請先加入商品！');
        return;
    }

    // 顯示結帳成功視窗
    document.getElementById('checkoutModal').classList.add('show');
    
    // 可以在此處發送訂單到後端
    console.log('訂單資料:', {
        items: cart,
        total: document.getElementById('total').textContent,
        timestamp: new Date().toISOString()
    });
}

// 關閉模態框
function closeModal() {
    document.getElementById('checkoutModal').classList.remove('show');
    // 清空購物車
    cart = [];
    updateCartDisplay();
}

// 加入購物車動畫
function animateAddToCart() {
    const cartIcon = document.querySelector('.cart-header i');
    cartIcon.style.transform = 'scale(1.3)';
    cartIcon.style.color = '#ffd700';
    
    setTimeout(() => {
        cartIcon.style.transform = 'scale(1)';
        cartIcon.style.color = 'white';
    }, 300);
}