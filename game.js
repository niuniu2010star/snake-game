// 游戏配置
const config = {
    gridSize: 20,
    fps: 8,
    snakeColors: [
        [255, 0, 0],      // 红
        [255, 165, 0],    // 橙
        [255, 255, 0],    // 黄
        [0, 255, 0],      // 绿
        [0, 255, 255],    // 青
        [0, 0, 255],      // 蓝
        [128, 0, 128],    // 紫
        [255, 0, 255],    // 粉
        [128, 0, 0],      // 深红
        [128, 128, 0],    // 橄榄
        [0, 128, 0],      // 深绿
        [0, 128, 128],    // 深青
        [0, 0, 128],      // 深蓝
        [128, 0, 128],    // 深紫
        [255, 192, 203],  // 浅粉
        [192, 192, 192]   // 银灰
    ],
    foodColors: [
        [255, 0, 0],      // 红
        [255, 165, 0],    // 橙
        [255, 255, 0],    // 黄
        [0, 255, 0],      // 绿
        [0, 255, 255],    // 青
        [0, 0, 255],      // 蓝
        [128, 0, 128],    // 紫
        [255, 0, 255],    // 粉
        [128, 0, 0],      // 深红
        [128, 128, 0],    // 橄榄
        [0, 128, 0],      // 深绿
        [0, 128, 128],    // 深青
        [0, 0, 128],      // 深蓝
        [128, 0, 128],    // 深紫
        [255, 192, 203],  // 浅粉
        [192, 192, 192]   // 银灰
    ]
};

// 游戏状态
const gameState = {
    canvas: null,
    ctx: null,
    snake: [],
    food: null,
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    gameOver: false,
    gameStarted: false,
    paused: false,
    currentColorIndex: 0,
    foodColorIndex: 0,
    explosions: [],
    scoreElement: null,
    width: 0,
    height: 0,
    gridWidth: 0,
    gridHeight: 0,
    touchStart: { x: 0, y: 0 },
    audioContext: null,
    eatSound: null,
    backgroundMusic: null,
    musicFiles: []
};

// 初始化游戏
function initGame() {
    // 获取画布元素
    gameState.canvas = document.getElementById('gameCanvas');
    gameState.ctx = gameState.canvas.getContext('2d');
    gameState.scoreElement = document.getElementById('score');
    
    // 设置画布尺寸
    gameState.width = gameState.canvas.width;
    gameState.height = gameState.canvas.height;
    gameState.gridWidth = Math.floor(gameState.width / config.gridSize);
    gameState.gridHeight = Math.floor(gameState.height / config.gridSize);
    
    // 初始化音频
    initAudio();
    
    // 重置游戏状态
    resetGame();
    
    // 绑定事件
    bindEvents();
    
    // 启动游戏循环
    setInterval(updateGame, 1000 / config.fps);
    
    // 开始渲染循环
    renderGame();
}

// 初始化音频
function initAudio() {
    try {
        // 创建音频上下文
        gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 加载吃食物的声音
        gameState.eatSound = new Audio('audio/bgm1.mp3');
        gameState.eatSound.volume = 0.3;
        
        // 加载背景音乐文件
        gameState.musicFiles = [
            new Audio('audio/bgm1.mp3'),
            new Audio('audio/bgm2.mp3'),
            new Audio('audio/bgm3.mp3'),
            new Audio('audio/bgm4.mp3'),
            new Audio('audio/bgm5.mp3')
        ];
        
        // 设置背景音乐音量
        gameState.musicFiles.forEach(music => {
            music.volume = 0.2;
            music.loop = true;
        });
        
        console.log('音频初始化成功');
    } catch (e) {
        console.log('音频初始化失败:', e);
    }
}

// 解锁音频（处理浏览器自动播放政策）
function unlockAudio() {
    // 尝试恢复音频上下文
    if (gameState.audioContext && gameState.audioContext.state === 'suspended') {
        gameState.audioContext.resume().then(() => {
            console.log('音频上下文已解锁');
        });
    }
    
    // 尝试播放一个静音的音频来解锁
    if (gameState.eatSound) {
        gameState.eatSound.volume = 0;
        gameState.eatSound.play().catch(e => {
            console.log('音频解锁尝试:', e);
        });
        setTimeout(() => {
            if (gameState.eatSound) {
                gameState.eatSound.volume = 0.3;
            }
        }, 100);
    }
}

// 播放背景音乐
function playBackgroundMusic() {
    // 停止所有正在播放的音乐
    if (gameState.musicFiles) {
        gameState.musicFiles.forEach(music => {
            music.pause();
            music.currentTime = 0;
        });
    }
    
    // 随机选择一首音乐播放
    if (gameState.musicFiles && gameState.musicFiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * gameState.musicFiles.length);
        const selectedMusic = gameState.musicFiles[randomIndex];
        
        selectedMusic.play().catch(e => {
            console.log('播放背景音乐失败:', e);
        });
        
        console.log(`正在播放背景音乐: bgm${randomIndex + 1}.mp3`);
    }
}

// 创建蜂鸣音效
function createBeepSound(frequency, duration) {
    return function() {
        try {
            const oscillator = gameState.audioContext.createOscillator();
            const gainNode = gameState.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(gameState.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, gameState.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, gameState.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, gameState.audioContext.currentTime + duration);
            
            oscillator.start(gameState.audioContext.currentTime);
            oscillator.stop(gameState.audioContext.currentTime + duration);
        } catch (e) {
            console.log('播放声音失败:', e);
        }
    };
}

// 创建背景音乐
function createBackgroundMusic() {
    return function() {
        try {
            // 简单的背景音乐生成
            const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
            const durations = [0.2, 0.2, 0.2, 0.2, 0.4, 0.2, 0.2, 0.4];
            
            let time = gameState.audioContext.currentTime;
            
            for (let i = 0; i < notes.length; i++) {
                const oscillator = gameState.audioContext.createOscillator();
                const gainNode = gameState.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(gameState.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(notes[i], time);
                gainNode.gain.setValueAtTime(0.1, time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
                
                oscillator.start(time);
                oscillator.stop(time + durations[i]);
                
                time += durations[i];
            }
        } catch (e) {
            console.log('播放背景音乐失败:', e);
        }
    };
}

// 重置游戏
function resetGame() {
    // 初始化蛇
    const centerX = Math.floor(gameState.gridWidth / 2);
    const centerY = Math.floor(gameState.gridHeight / 2);
    gameState.snake = [{ x: centerX, y: centerY }];
    
    // 初始化方向
    gameState.direction = { x: 1, y: 0 };
    gameState.nextDirection = { x: 1, y: 0 };
    
    // 生成食物
    gameState.food = generateFood();
    
    // 重置分数
    gameState.score = 0;
    gameState.scoreElement.textContent = `分数: ${gameState.score}`;
    
    // 重置游戏状态
    gameState.gameOver = false;
    gameState.gameStarted = false;
    gameState.paused = false;
    
    // 随机颜色
    gameState.currentColorIndex = Math.floor(Math.random() * config.snakeColors.length);
    gameState.foodColorIndex = Math.floor(Math.random() * config.foodColors.length);
    
    // 清空特效
    gameState.explosions = [];
}

// 生成食物
function generateFood() {
    while (true) {
        const food = {
            x: Math.floor(Math.random() * (gameState.gridWidth - 2)) + 1,
            y: Math.floor(Math.random() * (gameState.gridHeight - 2)) + 1
        };
        
        // 检查食物是否与蛇身重叠
        const collision = gameState.snake.some(segment => 
            segment.x === food.x && segment.y === food.y
        );
        
        if (!collision) {
            return food;
        }
    }
}

// 绑定事件
function bindEvents() {
    // 键盘事件
    window.addEventListener('keydown', handleKeyDown);
    
    // 触摸事件
    gameState.canvas.addEventListener('touchstart', handleTouchStart);
    gameState.canvas.addEventListener('touchmove', handleTouchMove);
    
    // 鼠标事件
    gameState.canvas.addEventListener('mousedown', handleMouseDown);
    gameState.canvas.addEventListener('mousemove', handleMouseMove);
}

// 处理键盘事件
function handleKeyDown(e) {
    // 解锁音频（处理浏览器自动播放政策）
    unlockAudio();
    
    if (!gameState.gameStarted) {
        if (e.code === 'Space') {
            gameState.gameStarted = true;
            // 播放背景音乐
            playBackgroundMusic();
        }
        return;
    }
    
    if (gameState.gameOver) {
        if (e.code === 'KeyR') {
            resetGame();
        }
        return;
    }
    
    if (e.code === 'KeyP') {
        gameState.paused = !gameState.paused;
        return;
    }
    
    if (gameState.paused) {
        return;
    }
    
    // 方向控制
    switch (e.code) {
        case 'ArrowUp':
            if (gameState.direction.y !== 1) {
                gameState.nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            if (gameState.direction.y !== -1) {
                gameState.nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            if (gameState.direction.x !== 1) {
                gameState.nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            if (gameState.direction.x !== -1) {
                gameState.nextDirection = { x: 1, y: 0 };
            }
            break;
    }
}

// 处理触摸开始
function handleTouchStart(e) {
    const touch = e.touches[0];
    gameState.touchStart.x = touch.clientX;
    gameState.touchStart.y = touch.clientY;
    
    // 解锁音频（处理浏览器自动播放政策）
    unlockAudio();
    
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        // 播放背景音乐
        playBackgroundMusic();
    } else if (gameState.gameOver) {
        resetGame();
    }
}

// 处理触摸移动
function handleTouchMove(e) {
    if (!gameState.gameStarted || gameState.gameOver || gameState.paused) {
        return;
    }
    
    const touch = e.touches[0];
    const dx = touch.clientX - gameState.touchStart.x;
    const dy = touch.clientY - gameState.touchStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 30) {
        // 计算方向
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平方向
            if (dx > 0 && gameState.direction.x !== -1) {
                gameState.nextDirection = { x: 1, y: 0 };
            } else if (dx < 0 && gameState.direction.x !== 1) {
                gameState.nextDirection = { x: -1, y: 0 };
            }
        } else {
            // 垂直方向
            if (dy > 0 && gameState.direction.y !== -1) {
                gameState.nextDirection = { x: 0, y: 1 };
            } else if (dy < 0 && gameState.direction.y !== 1) {
                gameState.nextDirection = { x: 0, y: -1 };
            }
        }
        
        // 更新触摸起点
        gameState.touchStart.x = touch.clientX;
        gameState.touchStart.y = touch.clientY;
    }
}

// 处理鼠标按下
function handleMouseDown(e) {
    gameState.touchStart.x = e.clientX;
    gameState.touchStart.y = e.clientY;
    
    // 解锁音频（处理浏览器自动播放政策）
    unlockAudio();
    
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        // 播放背景音乐
        playBackgroundMusic();
    } else if (gameState.gameOver) {
        resetGame();
    }
}

// 处理鼠标移动
function handleMouseMove(e) {
    if (!gameState.gameStarted || gameState.gameOver || gameState.paused) {
        return;
    }
    
    const dx = e.clientX - gameState.touchStart.x;
    const dy = e.clientY - gameState.touchStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 30) {
        // 计算方向
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平方向
            if (dx > 0 && gameState.direction.x !== -1) {
                gameState.nextDirection = { x: 1, y: 0 };
            } else if (dx < 0 && gameState.direction.x !== 1) {
                gameState.nextDirection = { x: -1, y: 0 };
            }
        } else {
            // 垂直方向
            if (dy > 0 && gameState.direction.y !== -1) {
                gameState.nextDirection = { x: 0, y: 1 };
            } else if (dy < 0 && gameState.direction.y !== 1) {
                gameState.nextDirection = { x: 0, y: -1 };
            }
        }
        
        // 更新触摸起点
        gameState.touchStart.x = e.clientX;
        gameState.touchStart.y = e.clientY;
    }
}

// 更新游戏
function updateGame() {
    if (!gameState.gameStarted || gameState.gameOver || gameState.paused) {
        return;
    }
    
    // 更新方向
    gameState.direction = gameState.nextDirection;
    
    // 计算新蛇头位置
    const head = { ...gameState.snake[0] };
    head.x += gameState.direction.x;
    head.y += gameState.direction.y;
    
    // 边界检测
    if (head.x < 0 || head.x >= gameState.gridWidth || head.y < 0 || head.y >= gameState.gridHeight) {
        gameState.gameOver = true;
        return;
    }
    
    // 移动蛇身
    gameState.snake.unshift(head);
    
    // 检测食物碰撞
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 增加分数
        gameState.score += 1;
        gameState.scoreElement.textContent = `分数: ${gameState.score}`;
        
        // 播放吃食物的声音
        if (gameState.eatSound) {
            // 重置音频并播放
            gameState.eatSound.currentTime = 0;
            gameState.eatSound.play().catch(e => {
                console.log('播放吃食物声音失败:', e);
            });
        }
        
        // 随机切换颜色
        gameState.currentColorIndex = Math.floor(Math.random() * config.snakeColors.length);
        gameState.foodColorIndex = Math.floor(Math.random() * config.foodColors.length);
        
        // 生成烟花特效
        createFirework(head.x, head.y);
        
        // 生成新食物
        gameState.food = generateFood();
    } else {
        // 移除蛇尾
        gameState.snake.pop();
    }
    
    // 更新特效
    updateExplosions();
}

// 创建烟花特效
function createFirework(x, y) {
    const firework = {
        x: x * config.gridSize + config.gridSize / 2,
        y: y * config.gridSize + config.gridSize / 2,
        particles: [],
        smokeParticles: []
    };
    
    // 生成烟花粒子
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        
        firework.particles.push({
            x: firework.x,
            y: firework.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: config.snakeColors[Math.floor(Math.random() * config.snakeColors.length)],
            size: 2 + Math.random() * 2,
            alpha: 1.0,
            gravity: 0.1
        });
    }
    
    // 生成烟雾粒子
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1;
        
        firework.smokeParticles.push({
            x: firework.x,
            y: firework.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: [128, 128, 128], // 灰色烟雾
            size: 3 + Math.random() * 3,
            alpha: 0.8,
            gravity: -0.05 // 烟雾上升
        });
    }
    
    gameState.explosions.push(firework);
}

// 更新特效
function updateExplosions() {
    gameState.explosions.forEach(firework => {
        // 更新烟花粒子
        firework.particles.forEach(particle => {
            particle.vy += particle.gravity;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha = Math.max(0, particle.alpha - 0.02);
            particle.size = Math.max(0, particle.size - 0.05);
        });
        
        // 更新烟雾粒子
        firework.smokeParticles.forEach(particle => {
            particle.vy += particle.gravity;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha = Math.max(0, particle.alpha - 0.01);
            particle.size = Math.min(10, particle.size + 0.05); // 烟雾逐渐变大
        });
        
        // 移除死亡粒子
        firework.particles = firework.particles.filter(p => p.alpha > 0);
        firework.smokeParticles = firework.smokeParticles.filter(p => p.alpha > 0);
    });
    
    // 移除完成的烟花
    gameState.explosions = gameState.explosions.filter(f => 
        f.particles.length > 0 || f.smokeParticles.length > 0
    );
}

// 渲染游戏
function renderGame() {
    // 清空画布
    gameState.ctx.clearRect(0, 0, gameState.width, gameState.height);
    
    // 绘制背景
    gameState.ctx.fillStyle = '#e0f7fa';
    gameState.ctx.fillRect(0, 0, gameState.width, gameState.height);
    
    // 绘制边框
    drawBorder();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
    
    // 绘制特效
    drawExplosions();
    
    // 绘制开始界面
    if (!gameState.gameStarted) {
        drawStartScreen();
    }
    
    // 绘制游戏结束界面
    if (gameState.gameOver) {
        drawGameOverScreen();
    }
    
    // 绘制暂停界面
    if (gameState.paused) {
        drawPauseScreen();
    }
    
    // 继续渲染循环
    requestAnimationFrame(renderGame);
}

// 绘制边框
function drawBorder() {
    gameState.ctx.strokeStyle = '#0277bd';
    gameState.ctx.lineWidth = 2;
    gameState.ctx.strokeRect(0, 0, gameState.width, gameState.height);
}

// 绘制蛇
function drawSnake() {
    gameState.snake.forEach((segment, index) => {
        const x = segment.x * config.gridSize;
        const y = segment.y * config.gridSize;
        
        if (index === 0) {
            // 绘制蛇头（卡通风格）
            drawSnakeHead(x, y);
        } else {
            // 绘制蛇身（粗线条风格）
            drawSnakeBody(x, y);
        }
    });
}

// 绘制蛇头
function drawSnakeHead(x, y) {
    const radius = config.gridSize * 0.6;
    const centerX = x + config.gridSize / 2;
    const centerY = y + config.gridSize / 2;
    const color = config.snakeColors[gameState.currentColorIndex];
    
    // 蛇头主体
    gameState.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    gameState.ctx.beginPath();
    gameState.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    gameState.ctx.fill();
    
    // 蛇头边框
    gameState.ctx.strokeStyle = '#000';
    gameState.ctx.lineWidth = 3;
    gameState.ctx.beginPath();
    gameState.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    gameState.ctx.stroke();
    
    // 绘制眼睛
    const eyeOffset = radius / 2;
    gameState.ctx.fillStyle = '#fff';
    
    if (gameState.direction.x === 1) { // 向右
        // 右眼
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX + eyeOffset, centerY - eyeOffset / 2, 4, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 右眼球
        gameState.ctx.fillStyle = '#000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX + eyeOffset, centerY - eyeOffset / 2, 2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 左眼
        gameState.ctx.fillStyle = '#fff';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX + eyeOffset, centerY + eyeOffset / 2, 4, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 左眼球
        gameState.ctx.fillStyle = '#000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX + eyeOffset, centerY + eyeOffset / 2, 2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 嘴巴
        gameState.ctx.strokeStyle = '#f00';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(centerX + radius - 10, centerY - 5);
        gameState.ctx.lineTo(centerX + radius, centerY);
        gameState.ctx.lineTo(centerX + radius - 10, centerY + 5);
        gameState.ctx.stroke();
    } else if (gameState.direction.x === -1) { // 向左
        // 右眼
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX - eyeOffset, centerY - eyeOffset / 2, 4, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 右眼球
        gameState.ctx.fillStyle = '#000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX - eyeOffset, centerY - eyeOffset / 2, 2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 左眼
        gameState.ctx.fillStyle = '#fff';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX - eyeOffset, centerY + eyeOffset / 2, 4, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 左眼球
        gameState.ctx.fillStyle = '#000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX - eyeOffset, centerY + eyeOffset / 2, 2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 嘴巴
        gameState.ctx.strokeStyle = '#f00';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(centerX - radius + 10, centerY - 5);
        gameState.ctx.lineTo(centerX - radius, centerY);
        gameState.ctx.lineTo(centerX - radius + 10, centerY + 5);
        gameState.ctx.stroke();
    } else if (gameState.direction.y === -1) { // 向上
        // 右眼
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX + eyeOffset / 2, centerY - eyeOffset, 4, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 右眼球
        gameState.ctx.fillStyle = '#000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX + eyeOffset / 2, centerY - eyeOffset, 2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 左眼
        gameState.ctx.fillStyle = '#fff';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX - eyeOffset / 2, centerY - eyeOffset, 4, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 左眼球
        gameState.ctx.fillStyle = '#000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX - eyeOffset / 2, centerY - eyeOffset, 2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 嘴巴
        gameState.ctx.strokeStyle = '#f00';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(centerX - 5, centerY - radius + 10);
        gameState.ctx.lineTo(centerX, centerY - radius);
        gameState.ctx.lineTo(centerX + 5, centerY - radius + 10);
        gameState.ctx.stroke();
    } else if (gameState.direction.y === 1) { // 向下
        // 右眼
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX + eyeOffset / 2, centerY + eyeOffset, 4, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 右眼球
        gameState.ctx.fillStyle = '#000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX + eyeOffset / 2, centerY + eyeOffset, 2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 左眼
        gameState.ctx.fillStyle = '#fff';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX - eyeOffset / 2, centerY + eyeOffset, 4, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 左眼球
        gameState.ctx.fillStyle = '#000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(centerX - eyeOffset / 2, centerY + eyeOffset, 2, 0, Math.PI * 2);
        gameState.ctx.fill();
        
        // 嘴巴
        gameState.ctx.strokeStyle = '#f00';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.beginPath();
        gameState.ctx.moveTo(centerX - 5, centerY + radius - 10);
        gameState.ctx.lineTo(centerX, centerY + radius);
        gameState.ctx.lineTo(centerX + 5, centerY + radius - 10);
        gameState.ctx.stroke();
    }
}

// 绘制蛇身
function drawSnakeBody(x, y) {
    const radius = config.gridSize / 2;
    const centerX = x + config.gridSize / 2;
    const centerY = y + config.gridSize / 2;
    const color = config.snakeColors[gameState.currentColorIndex];
    
    // 蛇身主体
    gameState.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    gameState.ctx.beginPath();
    gameState.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    gameState.ctx.fill();
    
    // 蛇身边框（粗线条）
    gameState.ctx.strokeStyle = '#000';
    gameState.ctx.lineWidth = 3;
    gameState.ctx.beginPath();
    gameState.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    gameState.ctx.stroke();
}

// 绘制食物
function drawFood() {
    const x = gameState.food.x * config.gridSize;
    const y = gameState.food.y * config.gridSize;
    const radius = config.gridSize / 2 - 3;
    const centerX = x + config.gridSize / 2;
    const centerY = y + config.gridSize / 2;
    const color = config.foodColors[gameState.foodColorIndex];
    
    // 添加闪烁效果
    const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.005);
    
    // 食物主体
    gameState.ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    gameState.ctx.beginPath();
    gameState.ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
    gameState.ctx.fill();
    
    // 高光效果
    gameState.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    gameState.ctx.beginPath();
    gameState.ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 3, 0, Math.PI * 2);
    gameState.ctx.fill();
    
    // 黑色边框
    gameState.ctx.strokeStyle = '#000';
    gameState.ctx.lineWidth = 2;
    gameState.ctx.beginPath();
    gameState.ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
    gameState.ctx.stroke();
}

// 绘制特效
function drawExplosions() {
    gameState.explosions.forEach(firework => {
        // 绘制烟花粒子
        firework.particles.forEach(particle => {
            gameState.ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.alpha})`;
            gameState.ctx.beginPath();
            gameState.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            gameState.ctx.fill();
        });
        
        // 绘制烟雾粒子
        firework.smokeParticles.forEach(particle => {
            gameState.ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.alpha})`;
            gameState.ctx.beginPath();
            gameState.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            gameState.ctx.fill();
        });
    });
}

// 绘制开始界面
function drawStartScreen() {
    // 半透明背景
    gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    gameState.ctx.fillRect(0, 0, gameState.width, gameState.height);
    
    // 游戏标题
    gameState.ctx.fillStyle = '#fff';
    gameState.ctx.font = '48px Arial';
    gameState.ctx.textAlign = 'center';
    gameState.ctx.fillText('卡通贪吃蛇', gameState.width / 2, gameState.height / 2 - 50);
    
    // 开始提示
    gameState.ctx.font = '24px Arial';
    gameState.ctx.fillText('点击屏幕开始游戏', gameState.width / 2, gameState.height / 2 + 20);
    
    // 操作提示
    gameState.ctx.font = '16px Arial';
    gameState.ctx.fillText('滑动屏幕控制方向', gameState.width / 2, gameState.height / 2 + 60);
}

// 绘制游戏结束界面
function drawGameOverScreen() {
    // 半透明背景
    gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameState.ctx.fillRect(0, 0, gameState.width, gameState.height);
    
    // 游戏结束标题
    gameState.ctx.fillStyle = '#fff';
    gameState.ctx.font = '48px Arial';
    gameState.ctx.textAlign = 'center';
    gameState.ctx.fillText('游戏结束', gameState.width / 2, gameState.height / 2 - 50);
    
    // 最终分数
    gameState.ctx.font = '24px Arial';
    gameState.ctx.fillText(`最终分数: ${gameState.score}`, gameState.width / 2, gameState.height / 2 + 20);
    
    // 重新开始提示
    gameState.ctx.font = '16px Arial';
    gameState.ctx.fillText('点击屏幕重新开始', gameState.width / 2, gameState.height / 2 + 60);
}

// 绘制暂停界面
function drawPauseScreen() {
    // 半透明背景
    gameState.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    gameState.ctx.fillRect(0, 0, gameState.width, gameState.height);
    
    // 暂停标题
    gameState.ctx.fillStyle = '#fff';
    gameState.ctx.font = '48px Arial';
    gameState.ctx.textAlign = 'center';
    gameState.ctx.fillText('游戏暂停', gameState.width / 2, gameState.height / 2);
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', initGame);