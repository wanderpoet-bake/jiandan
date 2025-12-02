// 游戏管理器
class GameManager {
    constructor() {
        this.games = new Map();
    }
    
    registerGame(gameId, GameClass) {
        this.games.set(gameId, GameClass);
    }
    
    getGame(gameId) {
        return this.games.get(gameId);
    }
    
    getGameList() {
        return Array.from(this.games.keys()).map(gameId => ({
            id: gameId,
            name: this.games.get(gameId).name,
            status: 'waiting'
        }));
    }
}

module.exports = GameManager;