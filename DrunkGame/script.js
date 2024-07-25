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

    // Отрисовка уточки с обводкой
    drawImageWithOutline(duckImage, duckX - cameraX, duckY, 80, 80);

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

    // Автоматическая ходьба
    if (autoWalkSpeed > 0) {
        moveForward(autoWalkSpeed);
    }

    // Проверка столкновения с бутылками
    bottles = bottles.filter(bottle => {
        if (Math.abs((duckX + 40) - (bottle.x + 60)) < 80) {
            currency += currencyPerBottle;
            createSplashes(bottle.x, duckY - 20);
            return false;
        }
        return true;
    });

    // Анимация изменения очков
    displayedCurrency += (currency - displayedCurrency) * 0.1;

    // Отображение количества очков
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 24px Arial';
    ctx.strokeText(`Бутылки: ${Math.round(displayedCurrency)}`, 10, 30);
    ctx.fillText(`Бутылки: ${Math.round(displayedCurrency)}`, 10, 30);

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
    duckX += distance;
    cameraX += distance;
    
    steps++;
    if (steps >= nextBottleIn) {
        bottles.push({ x: duckX + canvas.width });
        nextBottleIn = Math.floor(Math.random() * 5) + 3; // 3-7 шагов
        steps = 0;
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