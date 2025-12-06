import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// 本地运行端口配置
const PORT = 3000;
const HOST = '0.0.0.0';

// Socket.io配置
const io = new Server(server, {
  cors: {
    origin: "*", // 允许所有来源
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// JWT密钥 - 本地开发使用固定密钥
const JWT_SECRET = 'script-house-local-secret-key-2024';

// 游戏数据存储（使用内存，生产环境建议用数据库）
const games = {
    'love-virus': {
        id: 'love-virus',
        name: '11、爱情病毒',
        description: '一场关于爱情与病毒的生存游戏',
        players: [],
        status: 'waiting',
        maxPlayers: 8,
        minPlayers: 2,
        gameStarted: false,
        startTime: null,
        createdAt: new Date()
    }
};

// 用户存储
const users = new Map();

// 静态文件服务
app.use(express.static('public'));

// 路由配置
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/game-love-virus.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game-love-virus.html'));
});

// 健康检查端点（简化版）
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        games: Object.keys(games).length
    });
});

// API路由
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    // 1. 验证密码（统一为123456）
    if (password !== '123456') {
        return res.status(401).json({ 
            success: false, 
            message: '密码错误，请输入123456' 
        });
    }
    
    // 2. 用户名随便填，如果没有填就用默认名
    const userNickname = username?.trim() || '玩家' + Math.floor(Math.random() * 1000);
    const userId = Date.now() + Math.random().toString(36).substring(2, 9);
    
    // 3. 生成JWT token
    const token = jwt.sign(
        { 
            userId: userId,
            username: userNickname,
            loginTime: Date.now()
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
    
    // 4. 保存用户信息
    users.set(userId, {
        id: userId,
        username: userNickname,
        nickname: userNickname,
        loginTime: new Date(),
        token: token
    });
    
    res.json({
        success: true,
        token: token,
        user: {
            id: userId,
            username: userNickname,
            nickname: userNickname,
            loginTime: new Date().toLocaleString('zh-CN')
        }
    });
});

// 获取游戏列表
app.get('/api/games', (req, res) => {
    const gameList = Object.values(games).map(game => ({
        id: game.id,
        name: game.name,
        description: game.description,
        status: game.status,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.players.length,
        gameStarted: game.gameStarted
    }));
    
    res.json({ success: true, games: gameList });
});

// Socket.io连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);
    
    // 加入游戏
    socket.on('join-game', (data) => {
        const { gameId, token } = data;
        const game = games[gameId];
        
        if (!game) {
            socket.emit('error', { message: '游戏不存在' });
            return;
        }
        
        if (game.gameStarted) {
            socket.emit('error', { message: '游戏已开始，无法加入' });
            return;
        }
        
        try {
            // 验证token
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // 检查是否已经在房间中
            const existingPlayer = game.players.find(p => p.userId === decoded.userId);
            if (existingPlayer) {
                // 更新socket连接
                existingPlayer.socketId = socket.id;
                socket.join(gameId);
                io.to(gameId).emit('game-update', game);
                return;
            }
            
            // 检查房间人数限制
            if (game.players.length >= game.maxPlayers) {
                socket.emit('error', { message: `房间已满，最多${game.maxPlayers}人` });
                return;
            }
            
            // 创建玩家信息
            const player = {
                socketId: socket.id,
                userId: decoded.userId,
                username: decoded.username,
                nickname: decoded.username,
                ready: false,
                isHost: game.players.length === 0,
                joinTime: new Date()
            };
            
            game.players.push(player);
            socket.join(gameId);
            
            // 通知房间内所有玩家
            io.to(gameId).emit('game-update', game);
            console.log(`玩家 ${player.nickname} 加入游戏 ${game.name}`);
            
        } catch (error) {
            socket.emit('error', { message: '认证失败' });
        }
    });
    
    // 玩家准备
    socket.on('player-ready', (data) => {
        const { gameId } = data;
        const game = games[gameId];
        
        if (game && !game.gameStarted) {
            const player = game.players.find(p => p.socketId === socket.id);
            if (player) {
                player.ready = !player.ready; // 切换准备状态
                io.to(gameId).emit('game-update', game);
                console.log(`玩家 ${player.nickname} ${player.ready ? '准备' : '取消准备'}`);
                
                // 检查是否可以开始游戏
                const readyPlayers = game.players.filter(p => p.ready);
                if (readyPlayers.length >= game.minPlayers) {
                    const host = game.players.find(p => p.isHost);
                    if (host) {
                        io.to(host.socketId).emit('can-start-game', {
                            readyPlayers: readyPlayers.length,
                            totalPlayers: game.players.length
                        });
                    }
                }
            }
        }
    });
    
    // 开始游戏
    socket.on('start-game', (data) => {
        const { gameId } = data;
        const game = games[gameId];
        
        if (!game) {
            socket.emit('error', { message: '游戏不存在' });
            return;
        }
        
        if (game.gameStarted) {
            socket.emit('error', { message: '游戏已开始' });
            return;
        }
        
        // 检查是否是房主
        const player = game.players.find(p => p.socketId === socket.id);
        if (!player || !player.isHost) {
            socket.emit('error', { message: '只有房主可以开始游戏' });
            return;
        }
        
        // 检查准备人数
        const readyPlayers = game.players.filter(p => p.ready);
        if (readyPlayers.length < game.minPlayers) {
            socket.emit('error', { message: `至少需要${game.minPlayers}名玩家准备` });
            return;
        }
        
        // 开始游戏
        game.status = 'playing';
        game.gameStarted = true;
        game.startTime = new Date();
        
        io.to(gameId).emit('game-started', {
            game: game,
            message: `游戏开始！当前回合：1`
        });
        
        console.log(`游戏 ${game.name} 开始，玩家数: ${readyPlayers.length}`);
    });
    
    // 断开连接处理
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
        
        // 从所有游戏中移除玩家
        Object.values(games).forEach(game => {
            const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
            if (playerIndex > -1) {
                const player = game.players[playerIndex];
                game.players.splice(playerIndex, 1);
                console.log(`玩家 ${player.nickname} 离开游戏 ${game.name}`);
                
                // 如果房间为空，重置游戏状态
                if (game.players.length === 0) {
                    game.status = 'waiting';
                    game.gameStarted = false;
                    game.startTime = null;
                } else if (player.isHost) {
                    // 房主离开，指定新房主
                    game.players[0].isHost = true;
                }
                
                io.to(game.id).emit('game-update', game);
            }
        });
    });
});

// 启动服务器
server.listen(PORT, HOST, () => {
    console.log(`
🎮 煎蛋的剧本小屋服务器启动成功！
📍 本地访问: http://${HOST}:${PORT}
🌐 环境: 本地开发
🎯 当前游戏: 爱情病毒 (2-8人)
🔒 统一密码: 123456
📡 Socket.io: 已启用
💡 运行模式: 纯本地运行
    `);
});

export default app;