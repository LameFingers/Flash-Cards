const startBtn = document.getElementById("starting-button");
const startScreen = document.getElementById("start-screen");
const menueScreen = document.getElementById("menue-screen");
const backBtn = document.getElementById("Right-Arrow-Icon");

startBtn.addEventListener('click', () => { 
    startScreen.style.display = 'none';
    menueScreen.style.display = 'block';
});

backBtn.addEventListener('click', () => {
    menueScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

