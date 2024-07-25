const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');

// Установка размеров канваса
canvas.width = 400;
canvas.height = 400;

// Загрузка изображений
const duckImage = new Image();
duckImage.src = 'assets/images/2dduck.png';
const backgroundImage = new Image();
backgroundImage.src = 'assets/images/oldtown.png';
const bottleImage = new Image();
bottleImage.src = 'assets/images/jager.png';

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
duckFrames[0].src = 'assets/images/2dduck_frame1.png';
duckFrames[1].src = 'assets/images/2dduck_frame2.png';
let currentFrame = 0;
let frameCounter = 0;

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
    ctx.save();
    if (drunkLevel > 0) {
        ctx.fillStyle = `rgba(0, 255, 0, ${drunkLevel / 10})`;
        ctx.fillRect(duckX - cameraX, duckY, 80, 80);
    }
    drawImageWithOutline(duckFrames[currentFrame], duckX - cameraX, duckY, 80, 80);
    ctx.restore();

    // Отрисовка бутылок
    bottles.forEach(bottle => {
        if (bottle.x - cameraX >= -60 && bottle.x - cameraX < canvas.width) {
            drawImageWithOutline(bottleImage, bottle.x - cameraX, duckY - 20, 120, 60);
        }
    });

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
        }
        // Анимация рвоты
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(duckX - cameraX + 40, duckY + 90, 10, 0, Math.PI * 2);
        ctx.fill();
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

    requestAnimationFrame(update);
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
        
        steps++;
        if (steps >= nextBottleIn) {
            bottles.push({ x: duckX + canvas.width });
            nextBottleIn = Math.floor(Math.random() * 5) + 3; // 3-7 шагов
            steps = 0;
        }
    }
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
            isVomiting = true;
            vomitTimer = 120; // 2 секунды при 60 FPS
            gameDesignPoints++;
            vomitThreshold += 2; // Увеличиваем порог для следующей рвоты
            drunkLevel = 0;
        }
    } else {
        vomitThreshold = Math.max(5, vomitThreshold - 1); // Уменьшаем порог, но не ниже 5
    }
    
    lastDrinkTime = now;
}

// Обновляем функцию update для использования handleBottleCollision
function update() {
    // ... (остальной код функции update)

    bottles = bottles.filter(bottle => {
        if (Math.abs((duckX + 40) - (bottle.x + 60)) < 80) {
            handleBottleCollision();
            return false;
        }
        return true;
    });

    // ... (остальной код функции update)
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

// Запуск игры
update();