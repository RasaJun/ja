document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const alertMessage = document.getElementById('alertMessage');
    
    // 檢查是否已經登入
    checkLoginStatus();
    
    // 登入表單提交
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(loginForm);
        const username = formData.get('username').toLowerCase();
        
        // 只允許 staff 和 admin
        if (username !== 'staff' && username !== 'admin') {
            showAlert('只能使用 staff 或 admin 帳號登入', 'error');
            return;
        }
        
        // 顯示載入狀態
        setLoading(true);
        
        try {
            const response = await fetch('php/login.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('歡迎光臨廉價勞工', 'success');
                
                // 儲存使用者資訊
                sessionStorage.setItem('user', JSON.stringify(result.data));
                
                // 跳轉到收銀頁面
                setTimeout(() => {
                    window.location.href = 'pos.html';
                }, 1500);
            } else {
                showAlert(result.message, 'error');
                setLoading(false);
            }
            
        } catch (error) {
            console.error('登入錯誤:', error);
            showAlert('系統錯誤，請稍後再試', 'error');
            setLoading(false);
        }
    });
    
    // 檢查登入狀態
    async function checkLoginStatus() {
        try {
            const response = await fetch('php/check_session.php');
            const result = await response.json();
            
            if (result.success) {
                // 如果已經登入，直接跳轉到收銀頁面
                window.location.href = 'pos.html';
            }
        } catch (error) {
            console.error('檢查登入狀態失敗:', error);
        }
    }
    
    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.textContent = '登入中...';
            loginBtn.disabled = true;
        } else {
            loginBtn.textContent = '登入系統';
            loginBtn.disabled = false;
        }
    }
    
    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertMessage.className = `alert alert-${type} show`;
    }
});
