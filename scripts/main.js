class FlashcardApp {
    constructor() {
        // --- Step 1: Define screen containers ---
        this.startScreen = document.getElementById("start-screen");
        this.menueScreen = document.getElementById("menue-screen");
        this.flashcardScreen = document.getElementById("flashcard-screen");
        this.libraryScreen = document.getElementById("library-screen");
        this.practiceScreen = document.getElementById("practice-screen");
        this.currentSetId = null;

        // --- Step 2: Set up the initial event listeners ---
        this.safeAddEventListener("starting-button", "click", () => this.showMenu());
        this.setupMenuEventListeners();
    }

    safeAddEventListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            // This message helps in debugging but doesn't crash the app.
            console.warn(`Element with ID '${id}' not found. Listener not attached.`);
        }
    }

    setupMenuEventListeners() {
        this.safeAddEventListener("go-back", "click", () => this.showStart());
        this.safeAddEventListener("library-button", "click", () => this.showLibraryScreen());
        this.safeAddEventListener("new-set", "click", () => this.showFlashcardScreen());
        this.safeAddEventListener("practice", "click", () => this.showPracticeScreen());
    }

    hideAllScreens() {
        this.startScreen.style.display = "none";
        this.menueScreen.style.display = "none";
        this.flashcardScreen.style.display = "none";
        this.libraryScreen.style.display = "none";
        this.practiceScreen.style.display = "none";
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

        this.safeAddEventListener("go-back-flashcard", "click", () => this.showMenu());
        this.safeAddEventListener("add-card", "click", () => this.addFlashcard());
        this.safeAddEventListener("save-set", "click", () => this.saveSet());
        
        this.autoExpandTextAreas();
    }

    showLibraryScreen() {
        this.hideAllScreens();
        this.libraryScreen.style.display = "flex";
        this.loadLibrary();
    }

    showPracticeScreen() {
        this.hideAllScreens();
        this.practiceScreen.style.display = "flex";
        document.getElementById("go-back-practice").addEventListener("click", () => this.showMenu());
    }


    addFlashcard() {
        const flashcardContent = document.getElementById("flashcard-content");
        if (!flashcardContent) return;
        const newCard = document.createElement("div");
        newCard.classList.add("card-container");
        newCard.innerHTML = `
            <input type="text" class="term" placeholder="Term">
            <textarea class="definition" placeholder="Definition"></textarea>
            <button class="delete-card"> 
                <img src="images/Trash.svg" alt="trash-icon" />
            </button>
        `;
        newCard.querySelector(".delete-card").addEventListener("click", () => this.deleteFlashcard(newCard));
        const buttonContainer = flashcardContent.querySelector(".button-container");
        if (buttonContainer) {
            flashcardContent.insertBefore(newCard, buttonContainer);
        }
        this.autoExpandTextAreas();
    }

    deleteFlashcard(cardElement) {
        cardElement.remove();
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
        document.querySelectorAll(".definition").forEach(textarea => {
            const expand = () => {
                textarea.style.height = "auto";
                textarea.style.height = (textarea.scrollHeight) + "px";
            };
            textarea.addEventListener("input", expand);
            expand(); // Initial expansion
        });
    }

    editSet(setId, setData) {
        this.currentSetId = setId;
        document.getElementById("set-title").value = setData.title;

        const flashcardContent = document.getElementById("flashcard-content");
        const buttonContainer = document.querySelector(".button-container");

        // Remove only the old card containers
        const existingCards = flashcardContent.querySelectorAll(".card-container");
        existingCards.forEach(card => card.remove());

        // Re-create the cards from the set data
        setData.cards.forEach(cardData => {
            const newCard = document.createElement("div");
            newCard.classList.add("card-container");

            const termInput = document.createElement("input");
            termInput.type = "text";
            termInput.className = "term";
            termInput.placeholder = "Term";
            termInput.value = cardData.term;

            const definitionTextarea = document.createElement("textarea");
            definitionTextarea.className = "definition";
            definitionTextarea.placeholder = "Definition";
            definitionTextarea.textContent = cardData.definition;

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-card";
            deleteButton.innerHTML = `<img src="images/Trash.svg" alt="trash-icon" />`;
            deleteButton.addEventListener("click", () => this.deleteFlashcard(newCard));

            newCard.appendChild(termInput);
            newCard.appendChild(definitionTextarea); // Corrected this line
            newCard.appendChild(deleteButton);

            flashcardContent.insertBefore(newCard, buttonContainer);
        });

        this.autoExpandTextAreas();
        this.showFlashcardScreen();
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
            if (this.currentSetId) {
                // Data for updating an existing set
                const setData = {
                    title: setTitle,
                    cards: flashcards,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp() // Add update timestamp
                };
                await window.db.collection("flashcardSets").doc(user.uid).collection("sets").doc(this.currentSetId).update(setData);
                alert(`Flashcard set "${setTitle}" updated successfully.`);

            } else {
                // Data for creating a new set
                const setData = {
                    title: setTitle,
                    cards: flashcards,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Use server timestamp
                };
                await window.db.collection("flashcardSets").doc(user.uid).collection("sets").add(setData);
                alert(`Flashcard set "${setTitle}" saved online.`);
            }

            // Reset form
            this.currentSetId = null;
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

            // Step 1: Clear any old content
            libraryScreen.innerHTML = ""; 

            // Step 2: Create and append the banner
            const banner = document.createElement("div");
            banner.id = "library-banner";
            banner.innerHTML = `
                <button id="go-back-library">
                    <img src="images/Left-Arrow.svg" alt="library-back" id="library-left-icon">
                </button>
                <h1>Your Flashcard Sets</h1>
            `;
            libraryScreen.appendChild(banner);

            // Step 3: Create and append the content area
            const contentDiv = document.createElement("div");
            contentDiv.id = "library-content";
            libraryScreen.appendChild(contentDiv);

            // Step 4: Populate the content area with flashcard sets
            snapshot.forEach(doc => {
                const data = doc.data();
                const cardDiv = document.createElement("div");
                cardDiv.classList.add("library-card"); // Use a class for styling
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

                cardDiv.addEventListener("click", () => this.editSet(doc.id, data));

                const deleteBtn = cardDiv.querySelector(".delete-set-btn");
                deleteBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete "${data.title}"?`)) {
                        try {
                            await window.db.collection("flashcardSets").doc(user.uid).collection("sets").doc(doc.id).delete();
                            cardDiv.remove();
                            alert(`"${data.title}" has been deleted.`);
                        } catch (error) {
                            console.error("Failed to delete set:", error);
                            alert("Failed to delete the set.");
                        }
                    }
                });
                contentDiv.appendChild(cardDiv);
            });

            // Step 5: Add the back button's event listener
            document.getElementById("go-back-library").addEventListener("click", () => this.showMenu());

        } catch (err) {
            console.error("Error loading flashcard sets:", err);
            alert("Failed to load your flashcard sets.");
        }
    }
}