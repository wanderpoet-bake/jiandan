// 基础游戏类
class BaseGame {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.maxPlayers = config.maxPlayers;
        this.minPlayers = config.minPlayers;
        this.players = [];
        this.status = 'waiting';
    }
    
    addPlayer(player) {
        if (this.players.length < this.maxPlayers) {
            this.players.push(player);
            return true;
        }
        return false;
    }
    
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
    }
    
    canStart() {
        return this.players.length >= this.minPlayers;
    }
}

module.exports = BaseGame;