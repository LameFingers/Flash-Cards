const startBtn = document.getElementById("starting-button");
const startScreen = document.getElementById("start-screen");
const flashcardScreen = document.getElementById("flashcard-screen")
const menueScreen = document.getElementById("menue-screen");
const backBtn = document.getElementById("Right-Arrow-Icon");
const newSet = document.getElementById("new-set-icon");
const backBtnFlash = document.getElementById("go-back-flashcard");

startBtn.addEventListener('click', () => { 
    startScreen.style.display = 'none';
    menueScreen.style.display = 'block';
});

backBtn.addEventListener('click', () => {
    menueScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

newSet.addEventListener("click", () => {
    menueScreen.style.display = "none";
    flashcardScreen.style.display = "flex";
})

backBtnFlash.addEventListener("click", () => {
    flashcardScreen.style.display = "none";
    menueScreen.style.display = "block";
})



































