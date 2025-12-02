// 工具函数
const utils = {
    // 动态获取API基础URL
    getApiBase() {
        // Vercel环境使用相对路径，开发环境使用绝对路径
        if (window.location.hostname === 'localhost') {
            return 'http://localhost:3000/api';
        }
        return '/api';
    },
    
    // 显示消息
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            background: ${type === 'error' ? '#dc3545' : 
                        type === 'warning' ? '#ffc107' : '#28a745'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    },
    
    // 获取元素
    $(selector) {
        return document.querySelector(selector);
    },
    
    // 获取所有匹配元素
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    // 检查登录状态
    checkLogin() {
        return localStorage.getItem('token') && localStorage.getItem('user');
    },
    
    // 获取用户信息
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    
    // 保存用户信息
    saveUser(user, token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
    },
    
    // 清除用户信息
    clearUser() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    },
    
    // API请求封装
    async apiRequest(endpoint, options = {}) {
        try {
            const response = await fetch(this.getApiBase() + endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }
};