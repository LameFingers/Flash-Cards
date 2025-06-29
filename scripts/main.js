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

        this.autoExpandTextAreas();
        this.setupEventListener();
        this.showMenu();
    }

    setupEventListener() {
        this.startBtn.addEventListener("click", () => this.showMenu());
        this.backBtn.addEventListener("click", () => this.showStart());
        this.newSet.addEventListener("click", () => this.showFlashcardScreen());
        this.backBtnFlash.addEventListener("click", () => this.showMenu());
        this.addCardBtn.addEventListener("click", () => this.addFlashcard());
        this.trashBtn.addEventListener("click", () => this.deleteLastFlashcard());
        this.libraryButton.addEventListener("click", () => {
            this.showLibraryScreen();
            this.loadLibrary();
        });
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
        const cardIndex = document.querySelectorAll(".card-container").length;

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
        cardElement.remove();
        this.updateCardIndices();
    }

    deleteLastFlashcard() {
        const cardElements = this.flashcardContent.querySelectorAll(".card-container");
        if (cardElements.length > 0) {
            cardElements[cardElements.length - 1].remove();
            this.updateCardIndices();
        }
    }

    updateCardIndices() {
        document.querySelectorAll(".card-container").forEach((card, i) => {
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

        const user = window.auth.currentUser;
        if (!user) {
            alert("Please login first");
            return;
        }

        try {
            await window.db.collection("flashcardSets").doc(user.uid).collection("sets").add({
                title: setTitle,
                cards: flashcards,
                createdAt: new Date()
            });

            alert(`Flashcard set "${setTitle}" saved online.`);

            // Reset form
            document.getElementById("set-title").value = "";
            document.querySelectorAll(".card-container").forEach(card => card.remove());
            this.addFlashcard();

        } catch (error) {
            console.error("Error saving to Firestore:", error.message, error);
            alert("Something went wrong while saving.");
        }
    }

    async loadLibrary() {
        const user = window.auth.currentUser;
        if (!user) {
            alert("You must be logged in to view your flashcards.");
            return;
        }

        try {
            const snapshot = await window.db
                .collection("flashcardSets")
                .doc(user.uid)
                .collection("sets")
                .orderBy("createdAt", "desc")
                .get();

            const libraryScreen = document.getElementById("library-screen");
        libraryScreen.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100vh;">
                <div id="library-banner" style="position: relative; padding: 20px 0; text-align: center;">
                    <button id="go-back-library" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer;">
                        <img src="images/Left-Arrow.svg" alt="library-back" id="library-left-icon">
                    </button>
                    <h1 style="margin: 0; display: inline-block;">Your Flashcard Sets</h1>
                </div>
                <div id="library-content"></div>
            </div>
            `;
            const contentDiv = document.getElementById("library-content");

            snapshot.forEach(doc => {
            const data = doc.data();
            const cardDiv = document.createElement("div");
            cardDiv.style.border = "1px solid #000";
            cardDiv.style.padding = "10px";
            cardDiv.style.marginBottom = "15px";
            cardDiv.classList.add("library-card");
            cardDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="overflow-wrap: anywhere;">
                            <strong>${data.title}</strong>
                            <p>${data.cards ? data.cards.length : 0} card(s)</p>
                        </div>
                    <button class="delete-set-btn" style="background: none; border: none; cursor: pointer;" title="Delete set">
                    <img src="images/Trash.svg"/>
                    </button>
                </div>
                `;



            cardDiv.addEventListener("click", () => {
                alert(`Clicked set: ${data.title}`);
            });

            const deleteBtn = cardDiv.querySelector(".delete-set-btn");
            deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const confirmed = confirm(`Are you sure you want to delete "${data.title}"?`);
                if (!confirmed) return;

                try {
                await window.db
                    .collection("flashcardSets")
                    .doc(user.uid)
                    .collection("sets")
                    .doc(doc.id)
                    .delete();

                cardDiv.remove();
                alert(`"${data.title}" has been deleted.`);
                } catch (error) {
                console.error("Failed to delete set:", error);
                alert("Failed to delete the set.");
                }
            });

            contentDiv.appendChild(cardDiv);
            });

            document.getElementById("go-back-library")
                .addEventListener("click", () => this.showMenu());

        } catch (err) {
            console.error("Error loading flashcard sets:", err);
            alert("Failed to load your flashcard sets.");
        }
    }
}