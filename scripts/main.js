

class FlashcardApp {
    constructor () {
        this.startBtn = document.getElementById("starting-button");
        this.startScreen = document.getElementById("start-screen");
        this.flashcardScreen = document.getElementById("flashcard-screen");
        this.libraryScreen = document.getElementById("library-screen");
        this.menueScreen = document.getElementById("menue-screen");
        this.backBtn = document.getElementById("Right-Arrow-Icon");
        this.newSet = document.getElementById("new-set-icon");
        this.backBtnFlash = document.getElementById("go-back-flashcard");
        this.addCardBtn = document.getElementById("add-card");
        this.trashBtn = document.getElementById("trash-button");
        this.flashcardContent = document.getElementById("flashcard-content");
        this.libraryButton = document.getElementById("library-button");
        this.backBtnLib = document.getElementById("go-back-library");
        this.saveBtn = document.getElementById("save-set");
        

        this.flashcards = [];

        // Register the initial card in HTML (if present)
        this.autoExpandTextAreas();
        const initialCard = this.flashcardContent.querySelector(".card-container");
        if (initialCard) {
            this.flashcards.push({ term: "", definition: "" });
            initialCard.setAttribute("data-index", 0);
        }
        
        this.setupEventListener();
    }

    setupEventListener() {
        this.startBtn.addEventListener("click", () => this.showMenu());
        this.backBtn.addEventListener("click", () => this.showStart());
        this.newSet.addEventListener("click", () => this.showFlashcardScreen());
        this.backBtnFlash.addEventListener("click", () => this.showMenu());
        this.addCardBtn.addEventListener("click", () => this.addFlashcard());
        this.trashBtn.addEventListener("click", () => this.deleteLastFlashcard());
        this.libraryButton.addEventListener("click", () => this.showLibraryScreen());
        this.backBtnLib.addEventListener("click", () => this.showMenu());
        this.saveBtn.addEventListener("click", () => this.saveSet());
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

    showLibraryScreen() {
        this.hideAllScreens();
        this.libraryScreen.style.display = "flex";
    }

    hideAllScreens() {
        this.startScreen.style.display = "none";
        this.menueScreen.style.display = "none";
        this.flashcardScreen.style.display = "none";
        this.libraryScreen.style.display = "none";
    }

    addFlashcard() {
        const newCardData = { term: "", definition: "" };
        this.flashcards.push(newCardData);

        const cardIndex = this.flashcards.length - 1;

        const newCard = document.createElement("div");
        newCard.classList.add("card-container");
        newCard.setAttribute("data-index", cardIndex);

        newCard.innerHTML = `

            <input type="text" class="term" placeholder="Term">
            <textarea class="definition" placeholder="Definition"></textarea>
            <button class="delete-card"> 
                <img src="images/Trash.svg" alt="trash-icon" />
            </button>
        `;


        newCard.querySelector(".delete-card").addEventListener("click", () => {
            this.deleteFlashcard(newCard);
        });

        const buttonContainer = document.querySelector(".button-container");
        this.flashcardContent.insertBefore(newCard, buttonContainer);
        this.updateCardIndices();
        this.autoExpandTextAreas();

        this.flashcardContent.scrollTop = this.flashcardContent.scrollHeight;
    }

    deleteFlashcard(cardElement) {
        const index = parseInt(cardElement.getAttribute("data-index"), 10);
        this.flashcards.splice(index, 1);
        cardElement.remove();
        this.updateCardIndices();
    }

    deleteLastFlashcard() {
        const cardElements = this.flashcardContent.querySelectorAll(".card-container");
        if (cardElements.length === 0) return;

        const lastCard = cardElements[cardElements.length - 1];
        const index = parseInt(lastCard.getAttribute("data-index"), 10);
        this.flashcards.splice(index, 1);
        lastCard.remove();
        this.updateCardIndices();
    }

    updateCardIndices() {
        const cardElements = document.querySelectorAll(".card-container");
        cardElements.forEach((card, i) => {
            card.setAttribute("data-index", i);
        });
    }

    autoExpandTextAreas() {
        const textareas = document.querySelectorAll(".definition");
        
        textareas.forEach(textarea => {
            textarea.addEventListener("input", function () {
                this.style.height = "auto";
                this.style.height = this.scrollHeight + "px";
            });

            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        });
    }

  async saveSet() {
    const setTitle = document.getElementById("set-title").value.trim();
    if (!setTitle) {
      alert("Please enter a title for your flashcard set.");
      return;
    }

    const cardElements = document.querySelectorAll(".card-container");
    const flashcards = [];

    cardElements.forEach(card => {
      const term = card.querySelector(".term").value.trim();
      const definition = card.querySelector(".definition").value.trim();
      if (term && definition) {
        flashcards.push({ term, definition });
      }
    });

    if (flashcards.length === 0) {
      alert("Please add at least one flashcard with both a term and a definition.");
      return;
    }

    try {
      await window.db.collection("flashcardSets").add({
        title: setTitle,
        cards: flashcards,
        createdAt: new Date()
      });

      alert(`Flashcard set "${setTitle}" saved online! ✅`);
    } catch (error) {
      console.error("Error saving to Firestore:", error.message, error);
      alert("Something went wrong while saving.");
    }
  }
}

