class FlashcardApp {

    constructor () {
        this.startBtn = document.getElementById("starting-button");
        this.startScreen = document.getElementById("start-screen");
        this.flashcardScreen = document.getElementById("flashcard-screen");
        this.menueScreen = document.getElementById("menue-screen");
        this.backBtn = document.getElementById("Right-Arrow-Icon");
        this.newSet = document.getElementById("new-set-icon");
        this.backBtnFlash = document.getElementById("go-back-flashcard");
        this.addCardBtn = document.getElementById("add-card");
        this.flashcardContent = document.getElementById("flashcard-content");

        this.setupEventListener();
    }

    setupEventListener() {
        this.startBtn.addEventListener('click', () => this.showMenu());
        this.backBtn.addEventListener('click', () => this.showStart());
        this.newSet.addEventListener('click', () => this.showFlashcardScreen());
        this.backBtnFlash.addEventListener('click', () => this.showMenu());
        this.addCardBtn.addEventListener('click', () => this.addFlashcard());

    }

    showStart() {
        this.hideAllScreens();
        this.startScreen.style.display = "flex";

    }

    showMenu() {
        this.hideAllScreens();
        this.menueScreen.style.display = "block";

    }

    showFlashcardScreen() {
        this.hideAllScreens();
        this.flashcardScreen.style.display = "flex";

    }

    hideAllScreens() {
        this.startScreen.style.display = "none";
        this.menueScreen.style.display = "none";
        this.flashcardScreen.style.display = "none";
    }

    addFlashcard() {
        const cardContainers = document.querySelectorAll(".card-container");
        const lastCard = cardContainers[cardContainers.length - 1];
        const termInput = lastCard.querySelector(".term");
        const definitionInput = lastCard.querySelector(".definition");

        const term = termInput.value.trim();
        const definition = definitionInput.value.trim();

        if (term === "" || definition === "") {
            alert("Please fill in both the term and definition.");
            return;
        }

        const newCard = document.createElement("div");
        newCard.classList.add("card-container");

        newCard.innerHTML = `
            <input type="text" class="term" placeholder="Term">
            <input type="text" class="definition" placeholder="Definition">
        `;

        const buttonContainer = document.querySelector(".button-container");
        this.flashcardContent.insertBefore(newCard, buttonContainer);
    }











    
}
    
document.addEventListener("DOMContentLoaded", () => {
    new FlashcardApp();
});
































