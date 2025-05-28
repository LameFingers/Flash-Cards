document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("starting-button");
    const startScreen = document.getElementById("start-screen");
    const flashcardScreen = document.getElementById("flashcard-screen")
    const menueScreen = document.getElementById("menue-screen");
    const backBtn = document.getElementById("Right-Arrow-Icon");
    const newSet = document.getElementById("new-set-icon");
    const backBtnFlash = document.getElementById("go-back-flashcard");
    const addCardBtn = document.getElementById("add-card");
    const flashcardContent = document.getElementById("flashcard-content");

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

    addCardBtn.addEventListener("click", () => {
        const cardContainers = document.querySelectorAll(".card-container");
        const lastCard = cardContainers[cardContainers.length - 1];
        const termInput = lastCard.querySelector(".term");
        const definitionInput = lastCard.querySelector(".definition");
        const term = termInput.value.trim();
        const definition = definitionInput.value.trim();

        if (term === " " || definition === "") {
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
        flashcardContent.insertBefore(newCard, buttonContainer);
    });

});
































