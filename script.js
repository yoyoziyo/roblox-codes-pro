const mainHeart = document.getElementById('mainHeart');
const timerDisplay = document.getElementById('timer');
const loveMessage = document.getElementById('loveMessage');
const lastUpdateDisplay = document.getElementById('lastUpdate');

let isHeartClicked = false;
const startDate = new Date('2025-02-25T00:00:00');

// 1. Mostrar Data da Última Modificação Real
const lastMod = new Date(document.lastModified);
lastUpdateDisplay.innerText = `Atualizado em: ${lastMod.toLocaleDateString('pt-BR')}`;

mainHeart.addEventListener('click', () => {
    if (!isHeartClicked) {
        isHeartClicked = true;
        mainHeart.classList.add('active');
        
        setTimeout(() => {
            document.getElementById('heartContent').style.opacity = '1';
            loveMessage.classList.add('show');
            startTimer();
        }, 500);

        createSmallHearts();
    }
});

function updateTimer() {
    const now = new Date();
    const diff = now - startDate;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    timerDisplay.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function startTimer() {
    updateTimer();
    setInterval(updateTimer, 1000);
}

function createSmallHearts() {
    const container = document.getElementById('smallHeartsContainer');
    for (let i = 0; i < 30; i++) {
        const heart = document.createElement('div');
        heart.style.width = '15px';
        heart.style.height = '15px';
        heart.classList.add('small-heart');
        
        // Posiciona no centro da tela
        heart.style.left = '50%';
        heart.style.top = '50%';
        
        // Define direções aleatórias para a animação
        heart.style.setProperty('--x', `${(Math.random() - 0.5) * 400}px`);
        heart.style.setProperty('--y', `${(Math.random() - 0.5) * 400}px`);
        
        container.appendChild(heart);
        setTimeout(() => heart.remove(), 2000);
    }
}
