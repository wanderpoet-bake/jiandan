// 首页逻辑
document.addEventListener('DOMContentLoaded', function() {
    initHomePage();
});

function initHomePage() {
    checkLoginStatus();
    setupEventListeners();
}

function checkLoginStatus() {
    const userInfo = document.getElementById('userInfo');
    const userGreeting = document.getElementById('userGreeting');
    const user = utils.getUser();
    
    if (user) {
        userGreeting.textContent = `欢迎，${user.nickname}`;
        userInfo.style.display = 'block';
    } else {
        userInfo.style.display = 'none';
    }
}

function setupEventListeners() {
    // 回车键快速开始
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            enterGame('love-virus');
        }
    });
}

// 全局函数
window.enterGame = function(gameId) {
    if (utils.checkLogin()) {
        window.location.href = `/game-${gameId}.html`;
    } else {
        window.location.href = `/login?game=${gameId}`;
    }
};

window.logout = function() {
    if (confirm('确定要退出登录吗？')) {
        authManager.logout();
    }
};