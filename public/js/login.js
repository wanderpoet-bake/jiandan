document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = this.querySelector('button[type="submit"]');
    
    // 验证输入
    if (!username) {
        utils.showMessage('请输入用户名', 'error');
        return;
    }
    
    if (!password) {
        utils.showMessage('请输入密码', 'error');
        return;
    }
    
    // 显示加载状态
    loginBtn.disabled = true;
    loginBtn.textContent = '登录中...';
    
    try {
        const result = await authManager.login(username, password);
        
        utils.showMessage('登录成功！', 'success');
        
        // 延迟跳转
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const gameId = urlParams.get('game');
            
            if (gameId) {
                window.location.href = `/game-${gameId}.html`;
            } else {
                window.location.href = '/';
            }
        }, 1000);
        
    } catch (error) {
        utils.showMessage(error.message || '登录失败', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '登录';
    }
});

// 页面加载时自动填充用户名
document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    if (!usernameInput.value) {
        usernameInput.value = '玩家' + Math.floor(Math.random() * 1000);
    }
});