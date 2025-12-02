// 认证管理
class AuthManager {
    constructor() {
        this.apiBase = utils.getApiBase();
    }
    
    async login(username, password) {
        try {
            const result = await utils.apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            if (result.success) {
                utils.saveUser(result.user, result.token);
                return result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('登录失败:', error);
            throw new Error('网络错误，请检查连接');
        }
    }
    
    logout() {
        utils.clearUser();
        window.location.href = '/';
    }
    
    isAuthenticated() {
        return utils.checkLogin();
    }
}

// 创建全局实例
window.authManager = new AuthManager();