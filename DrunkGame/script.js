const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

// Установка размеров канваса
canvas.width = 400;
canvas.height = 400;

// Загрузка изображений
const duckImage = new Image();
duckImage.src = './assets/images/2dduck.png';
const backgroundImage = new Image();
backgroundImage.src = './assets/images/oldtown.png';
const bottleImage = new Image();
bottleImage.src = './assets/images/jager.png';

// Игровые переменные
let duckX = 100;
let duckY = canvas.height - 150;
let cameraX = 0;
let currency = 0;
let displayedCurrency = 0;
let walkSpeed = 5;
let currencyPerBottle = 1;
let autoWalkSpeed = 0;
let steps = 0;
let nextBottleIn = Math.floor(Math.random() * 5) + 3; // 3-7 шагов
let bottles = [];
let showHint = true;
let splashes = [];

// Добавленные переменные для опьянения и рвоты
let drunkLevel = 0;
let lastDrinkTime = 0;
let isVomiting = false;
let vomitTimer = 0;
let gameDesignPoints = 0;
let vomitThreshold = 5; // Начальный порог для рвоты

const duckFrames = [new Image(), new Image()];
duckFrames[0].src = './assets/images/2dduck_frame1.png';
duckFrames[1].src = './assets/images/2dduck_frame2.png';
let currentFrame = 0;
let frameCounter = 0;

const GROUND_LEVEL = 300; // Было 250, теперь 300

// Определение констант и глобальных переменных
const BOTTLE_SIZE = 90; // Размер бутылки
const MIN_BOTTLE_DISTANCE = 200;
const MAX_BOTTLE_DISTANCE = 400;

let lastBottleX = 0;
let glowIntensity = 0;
let glowIncreasing = true;

// Функция обновления игры
function update() {
    // Очистка канваса
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Зацикливание уровня
    let bgX = cameraX % backgroundImage.width;
    ctx.drawImage(backgroundImage, -bgX, 0, backgroundImage.width, canvas.height);
    if (bgX > 0) {
        ctx.drawImage(backgroundImage, -bgX + backgroundImage.width, 0, backgroundImage.width, canvas.height);
    }

    // Анимация уточки
    frameCounter++;
    if (frameCounter >= 10) { // Меняем кадр каждые 10 обновлений
        currentFrame = 1 - currentFrame;
        frameCounter = 0;
    }

    // Отрисовка уточки с обводкой и анимацией
    drawDuck();

    // Отрисовка бутылок
    drawBottles();

    // Анимация брызг
    splashes = splashes.filter(splash => {
        ctx.fillStyle = `rgba(255, 255, 255, ${splash.opacity})`;
        ctx.beginPath();
        ctx.arc(splash.x - cameraX, splash.y, splash.size, 0, Math.PI * 2);
        ctx.fill();
        splash.x += splash.vx;
        splash.y += splash.vy;
        splash.opacity -= 0.02;
        splash.size -= 0.1;
        return splash.opacity > 0 && splash.size > 0;
    });

    // Обработка состояния опьянения и рвоты
    if (isVomiting) {
        vomitTimer--;
        if (vomitTimer <= 0) {
            isVomiting = false;
            gameDesignPoints++;
            showGameDesignPointsAnimation();
        }
        drawVomit();
    } else if (autoWalkSpeed > 0) {
        moveForward(autoWalkSpeed);
    }

    // Уменьшение уровня опьянения со временем
    drunkLevel = Math.max(0, drunkLevel - 0.01);

    // Проверка столкновения с бутылками
    bottles = bottles.filter(bottle => {
        if (Math.abs((duckX + 40) - (bottle.x + 60)) < 80) {
            handleBottleCollision();
            return false;
        }
        return true;
    });

    // Анимация изменения очков
    displayedCurrency += (currency - displayedCurrency) * 0.1;

    // Отображение количества очков и очков геймдизайна
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 24px Arial';
    ctx.strokeText(`Бутылки: ${Math.round(displayedCurrency)}`, 10, 30);
    ctx.fillText(`Бутылки: ${Math.round(displayedCurrency)}`, 10, 30);
    ctx.strokeText(`Геймдизайн: ${gameDesignPoints}`, 10, 60);
    ctx.fillText(`Геймдизайн: ${gameDesignPoints}`, 10, 60);

    // Отображение подсказки
    if (showHint) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = '18px Arial';
        ctx.strokeText('Нажмите пробел для движения', 10, canvas.height - 20);
        ctx.fillText('Нажмите пробел для движения', 10, canvas.height - 20);
    }

    // Удаление бутылок, которые ушли далеко влево
    bottles = bottles.filter(bottle => bottle.x > cameraX - 100);

    requestAnimationFrame(update);
}

function drawDuck() {
    ctx.save();
    if (drunkLevel > 0) {
        const duckCanvas = document.createElement('canvas');
        const duckCtx = duckCanvas.getContext('2d');
        duckCanvas.width = 80;
        duckCanvas.height = 80;

        duckCtx.drawImage(duckFrames[currentFrame], 0, 0, 80, 80);

        duckCtx.globalCompositeOperation = 'source-atop';
        duckCtx.fillStyle = `rgba(0, 255, 0, ${drunkLevel / 10})`;
        duckCtx.fillRect(0, 0, 80, 80);

        duckCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(duckCanvas, duckX - cameraX, duckY + 50); // Добавлено +50
    } else {
        ctx.drawImage(duckFrames[currentFrame], duckX - cameraX, duckY + 50, 80, 80); // Добавлено +50
    }
    ctx.restore();
}

function drawBottles() {
    ctx.save(); // Сохраняем текущий контекст

    // Обновляем интенсивность свечения
    if (glowIncreasing) {
        glowIntensity += 0.05;
        if (glowIntensity >= 1) glowIncreasing = false;
    } else {
        glowIntensity -= 0.05;
        if (glowIntensity <= 0) glowIncreasing = true;
    }

    bottles.forEach(bottle => {
        const bottleScreenX = bottle.x - cameraX;

        if (bottleScreenX >= -BOTTLE_SIZE && bottleScreenX <= canvas.width) {
            // Рисуем свечение
            const gradient = ctx.createRadialGradient(
                bottleScreenX + BOTTLE_SIZE / 2, canvas.height - BOTTLE_SIZE / 2, 0,
                bottleScreenX + BOTTLE_SIZE / 2, canvas.height - BOTTLE_SIZE / 2, BOTTLE_SIZE
            );
            gradient.addColorStop(0, `rgba(255, 255, 0, ${0.3 * glowIntensity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(bottleScreenX - BOTTLE_SIZE / 2, canvas.height - BOTTLE_SIZE * 1.5, BOTTLE_SIZE * 2, BOTTLE_SIZE * 2);

            // Рисуем бутылку
            ctx.drawImage(bottleImage, bottleScreenX, canvas.height - BOTTLE_SIZE - 20, BOTTLE_SIZE, BOTTLE_SIZE);
        }
    });

    ctx.restore(); // Восстанавливаем исходный контекст
}

function drawImageWithOutline(image, x, y, width, height) {
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 10;
    ctx.drawImage(image, x, y, width, height);
    ctx.shadowBlur = 0;
}

function moveForward(distance) {
    if (!isVomiting) {
        duckX += distance;
        cameraX += distance;
        
        // Проверяем, нужно ли создать новую бутылку
        if (duckX - lastBottleX >= MIN_BOTTLE_DISTANCE) {
            createNewBottles();
        }
    }
}

function createNewBottles() {
    const groupDistance = MIN_BOTTLE_DISTANCE + Math.random() * (MAX_BOTTLE_DISTANCE - MIN_BOTTLE_DISTANCE);
    const bottleCount = Math.floor(Math.random() * 4) + 2; // От 2 до 5 бутылок
    const groupStartX = lastBottleX + groupDistance;

    for (let i = 0; i < bottleCount; i++) {
        const bottleX = groupStartX + i * (BOTTLE_SIZE + 20); // 20 - расстояние между бутылками в группе
        bottles.push({ x: bottleX });
    }

    lastBottleX = groupStartX + (bottleCount - 1) * (BOTTLE_SIZE + 20);
}

function createSplashes(x, y) {
    const splashCount = Math.floor(Math.random() * 5) + 5;
    for (let i = 0; i < splashCount; i++) {
        splashes.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: -Math.random() * 5,
            size: Math.random() * 5 + 2,
            opacity: 1
        });
    }
}

function spendCurrency(amount) {
    if (currency >= amount) {
        currency -= amount;
        createSplashes(duckX, duckY);
        return true;
    }
    return false;
}

// Обновленная функция обработки столкновения с бутылкой
function handleBottleCollision() {
    const now = Date.now();
    currency += currencyPerBottle;
    createSplashes(duckX, duckY - 20);
    drunkLevel = Math.min(10, drunkLevel + 1);
    
    if (now - lastDrinkTime < 30000) { // 30 секунд
        if (drunkLevel >= vomitThreshold) {
            vomit();
        }
    }
    lastDrinkTime = now;
}

// Обработчик нажатия клавиш
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        moveForward(walkSpeed);
        showHint = false;
    }
});

// Обработчики кнопок улучшений
document.getElementById('upgradeSpeed').addEventListener('click', () => {
    if (spendCurrency(10)) {
        walkSpeed += 1;
    }
});

document.getElementById('upgradeCurrency').addEventListener('click', () => {
    if (spendCurrency(20)) {
        currencyPerBottle += 1;
    }
});

document.getElementById('upgradeAuto').addEventListener('click', () => {
    if (currency >= 30) {
        currency -= 30;
        autoWalkSpeed += 0.5;
    }
});

// Функция инициализации бутылок
function initializeBottles() {
    lastBottleX = duckX + canvas.width; // Начальная позиция для первой группы бутылок
    createNewBottles();
}

// Функция инициализации игры
function initGame() {
    initializeBottles();
    
    // Запуск игрового цикла
    requestAnimationFrame(gameLoop);
}

// Игровой цикл
function gameLoop(timestamp) {
    update();
    requestAnimationFrame(gameLoop);
}

// Запуск игры после загрузки всех ресурсов
window.onload = function() {
    bottleImage.onload = function() {
        initGame();
    };
};

function vomit() {
    isVomiting = true;
    drunkLevel = 0; // Сбрасываем уровень опьянения
    vomitTimer = VOMIT_DURATION;
    vomitSpots = [];
    for (let i = 0; i < 10; i++) {
        vomitSpots.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 20 + Math.random() * 30
        });
    }
}

let vomitSpots = [];
let VOMIT_DURATION = 2000; // 2 секунды

function drawVomit() {
    ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
    vomitSpots.forEach(spot => {
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.size, 0, Math.PI * 2);
        ctx.fill();
    });

    const fontSize = 50 + Math.sin(Date.now() / 100) * 10;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'red';
    ctx.textAlign = 'center';
    ctx.fillText('ГЕЙМДИЗАЙН!!!', canvas.width / 2, canvas.height / 2);
}

function showGameDesignPointsAnimation() {
    let animationTimer = 1000;
    const animatePoints = () => {
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = `rgba(255, 255, 0, ${animationTimer / 1000})`;
        ctx.textAlign = 'center';
        ctx.fillText(`+1 ГЕЙМДИЗАЙН!`, canvas.width / 2, canvas.height / 2 - 100);
        animationTimer -= 16;
        if (animationTimer > 0) {
            requestAnimationFrame(animatePoints);
        }
    };
    animatePoints();
}