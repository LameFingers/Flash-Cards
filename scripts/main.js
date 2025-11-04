class FlashcardApp {
    constructor() {
        // Screen containers
        this.startScreen = document.getElementById("start-screen");
        this.menueScreen = document.getElementById("menue-screen");
        this.flashcardScreen = document.getElementById("flashcard-screen");
        this.libraryScreen = document.getElementById("library-screen");
        this.practiceScreen = document.getElementById("practice-screen");
        
        this.currentSetId = null;
        this.eventListeners = []; // Track listeners for cleanup
        
        this.initializeApp();
    }

    initializeApp() {
        this.addEventListenerWithTracking("starting-button", "click", () => this.showMenu());
        this.setupMenuEventListeners();
    }

    /**
     * Adds event listener with tracking for potential cleanup
     * Prevents duplicate listeners and helps avoid memory leaks
     */
    addEventListenerWithTracking(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.push({ element, event, handler });
        } else {
            console.warn(`Element with ID '${id}' not found. Listener not attached.`);
        }
    }

    /**
     * Safe event listener addition without tracking
     * Use for dynamically created elements that will be garbage collected
     */
    safeAddEventListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element with ID '${id}' not found. Listener not attached.`);
        }
    }

    setupMenuEventListeners() {
        this.safeAddEventListener("go-back", "click", () => this.showStart());
        this.safeAddEventListener("library-button", "click", () => this.showLibraryScreen());
        this.safeAddEventListener("new-set", "click", () => this.showFlashcardScreen());
        this.safeAddEventListener("practice", "click", () => this.showPracticeScreen());
    }

    // Screen visibility management
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
        this.currentSetId = null;

        this.resetFlashcardForm();
        this.addFlashcard();

        this.safeAddEventListener("go-back-flashcard", "click", () => this.showMenu());
        this.safeAddEventListener("add-card", "click", () => this.addFlashcard());
        this.safeAddEventListener("save-set", "click", () => this.saveSet());
    }

    async showLibraryScreen() {
        this.hideAllScreens();
        this.libraryScreen.style.display = "flex";

        const user = window.auth.currentUser;
        if (!user) {
            alert("You must be logged in to view your flashcards.");
            return;
        }

        this.buildLibraryStructure();
        this.safeAddEventListener("go-back-library", "click", () => this.showMenu());
        
        await this.loadLibraryContent(user.uid);
    }

    /**
     * Builds the static HTML structure for the library screen
     */
    buildLibraryStructure() {
        this.libraryScreen.innerHTML = `
            <div id="library-banner">
                <button id="go-back-library">
                    <img src="images/Left-Arrow.svg" alt="library-back">
                </button>
                <h1>Your Flashcard Sets</h1>
            </div>
            <div id="library-content"></div>
        `;
    }

    /**
     * Loads and displays user's flashcard sets from Firestore
     */
    async loadLibraryContent(userId) {
        const contentDiv = document.getElementById("library-content");
        
        try {
            const snapshot = await window.db
                .collection("flashcardSets")
                .doc(userId)
                .collection("sets")
                .orderBy("createdAt", "desc")
                .get();
            
            if (snapshot.empty) {
                contentDiv.innerHTML = "<p>You don't have any flashcard sets yet.</p>";
                return;
            }

            snapshot.forEach(doc => {
                const setCard = this.createLibraryCard(doc.id, doc.data());
                contentDiv.appendChild(setCard);
            });
        } catch (err) {
            console.error("Error loading library:", err);
            alert("Failed to load your library.");
        }
    }

    /**
     * Creates a single library card element with edit and delete functionality
     */
    createLibraryCard(docId, data) {
        const cardDiv = document.createElement("div");
        cardDiv.className = "library-card";
        
        cardDiv.innerHTML = `
            <div class="library-card-content">
                <strong>${this.escapeHtml(data.title)}</strong>
                <p>${data.cards ? data.cards.length : 0} card(s)</p>
            </div>
            <button class="delete-set-btn" title="Delete Set">
                <img src="images/Trash.svg" alt="Delete">
            </button>
        `;

        const cardContent = cardDiv.querySelector(".library-card-content");
        cardContent.addEventListener("click", () => this.editSet(docId, data));

        const deleteBtn = cardDiv.querySelector(".delete-set-btn");
        deleteBtn.addEventListener("click", (e) => this.handleDeleteSet(e, docId, data.title, cardDiv));
        
        return cardDiv;
    }

    /**
     * Handles deletion of a flashcard set
     */
    async handleDeleteSet(event, docId, title, cardElement) {
        event.stopPropagation();
        
        if (!confirm(`Are you sure you want to delete the set "${title}"?`)) {
            return;
        }

        const user = window.auth.currentUser;
        if (!user) return;

        try {
            await window.db
                .collection("flashcardSets")
                .doc(user.uid)
                .collection("sets")
                .doc(docId)
                .delete();
            
            cardElement.remove();
            alert(`"${title}" has been deleted.`);
        } catch (error) {
            console.error("Error deleting set:", error);
            alert("Failed to delete the set.");
        }
    }

    async showPracticeScreen() {
        this.hideAllScreens();
        this.practiceScreen.style.display = "flex";

        document.getElementById("practice-set-selection").style.display = "flex";
        document.getElementById("practice-card-view").style.display = "none";
        
        this.safeAddEventListener("go-back-practice", "click", () => this.showMenu());

        const user = window.auth.currentUser;
        if (!user) return;

        await this.loadPracticeSets(user.uid);
    }

    /**
     * Loads available flashcard sets for practice mode
     */
    async loadPracticeSets(userId) {
        const setListDiv = document.getElementById("practice-set-list");
        setListDiv.innerHTML = "";

        try {
            const snapshot = await window.db
                .collection("flashcardSets")
                .doc(userId)
                .collection("sets")
                .orderBy("createdAt", "desc")
                .get();
            
            if (snapshot.empty) {
                setListDiv.innerHTML = "<p>You have no sets to practice.</p>";
                return;
            }

            snapshot.forEach(doc => {
                const setItem = this.createPracticeSetItem(doc.data());
                setListDiv.appendChild(setItem);
            });
        } catch (err) {
            console.error("Error loading sets for practice:", err);
            alert("Failed to load your sets.");
        }
    }

    /**
     * Creates a clickable practice set item
     */
    createPracticeSetItem(data) {
        const setItem = document.createElement("div");
        setItem.className = "practice-set-item";
        setItem.innerHTML = `
            <div>
                <strong>${this.escapeHtml(data.title)}</strong>
                <p>${data.cards ? data.cards.length : 0} card(s)</p>
            </div>
            <span>▶</span>
        `;
        
        setItem.addEventListener("click", () => {
            if (data.cards && data.cards.length > 0) {
                this.startPracticeSession(data.cards, data.title);
            } else {
                alert("This set has no cards to practice.");
            }
        });
        
        return setItem;
    }

    /**
     * Adds a new blank flashcard to the creation/edit form
     */
    addFlashcard() {
        const flashcardContent = document.getElementById("flashcard-content");
        const newCard = document.createElement("div");
        newCard.className = "card-container";
        newCard.innerHTML = `
            <input type="text" class="term" placeholder="Term">
            <textarea class="definition" placeholder="Definition"></textarea>
            <button class="delete-card"> 
                <img src="images/Trash.svg" alt="trash-icon" />
            </button>
        `;
        
        newCard.querySelector(".delete-card").addEventListener("click", () => newCard.remove());
        
        const buttonContainer = flashcardContent.querySelector(".button-container");
        flashcardContent.insertBefore(newCard, buttonContainer);
        
        this.autoExpandTextAreas();
    }
    
    /**
     * Loads an existing flashcard set for editing
     */
    editSet(setId, setData) {
        this.hideAllScreens();
        this.flashcardScreen.style.display = "flex";
        this.currentSetId = setId;

        this.resetFlashcardForm();
        document.getElementById("set-title").value = setData.title;
        
        setData.cards.forEach(cardData => {
            this.addEditableFlashcard(cardData.term, cardData.definition);
        });

        this.safeAddEventListener("go-back-flashcard", "click", () => this.showMenu());
        this.safeAddEventListener("add-card", "click", () => this.addFlashcard());
        this.safeAddEventListener("save-set", "click", () => this.saveSet());
        this.autoExpandTextAreas();
    }

    /**
     * Adds a pre-filled flashcard (for editing)
     */
    addEditableFlashcard(term, definition) {
        const flashcardContent = document.getElementById("flashcard-content");
        const newCard = document.createElement("div");
        newCard.className = "card-container";
        newCard.innerHTML = `
            <input type="text" class="term" value="${this.escapeHtml(term)}">
            <textarea class="definition">${this.escapeHtml(definition)}</textarea>
            <button class="delete-card"><img src="images/Trash.svg" alt="Delete"></button>
        `;
        
        newCard.querySelector(".delete-card").addEventListener("click", () => newCard.remove());
        
        const buttonContainer = flashcardContent.querySelector(".button-container");
        flashcardContent.insertBefore(newCard, buttonContainer);
    }
    
    /**
     * Auto-expands textareas to fit content
     */
    autoExpandTextAreas() {
        document.querySelectorAll(".definition").forEach(textarea => {
            const expand = () => {
                textarea.style.height = "auto";
                textarea.style.height = `${textarea.scrollHeight}px`;
            };
            textarea.addEventListener("input", expand);
            expand();
        });
    }

    /**
     * Initializes practice session with flashcard navigation
     */
    startPracticeSession(cards, setTitle) {
        document.getElementById("practice-set-selection").style.display = "none";
        document.getElementById("practice-card-view").style.display = "flex";

        let currentIndex = 0;
        const cardElement = document.getElementById("practice-card");
        const frontFace = cardElement.querySelector(".card-front");
        const backFace = cardElement.querySelector(".card-back");
        const progressIndicator = document.getElementById("practice-progress");
        const practiceSetTitle = document.getElementById("practice-set-title");

        practiceSetTitle.textContent = setTitle;

        const updateCard = () => {
            cardElement.classList.remove("is-flipped");
            frontFace.textContent = cards[currentIndex].term;
            backFace.textContent = cards[currentIndex].definition;
            progressIndicator.textContent = `Card ${currentIndex + 1} of ${cards.length}`;
        };

        // Using { once: false } explicitly for clarity, though it's the default [web:6]
        const flipCard = () => cardElement.classList.toggle("is-flipped");
        document.getElementById("practice-flip-card").onclick = flipCard;
        cardElement.onclick = flipCard;

        document.getElementById("practice-next-card").onclick = () => {
            if (currentIndex < cards.length - 1) {
                currentIndex++;
                updateCard();
            }
        };
        
        document.getElementById("practice-prev-card").onclick = () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCard();
            }
        };
        
        document.getElementById("practice-exit-session").onclick = () => {
            this.showPracticeScreen();
        };

        updateCard();
    }

    /**
     * Saves or updates a flashcard set in Firestore
     */
    async saveSet() {
        const setTitle = document.getElementById("set-title").value.trim();
        if (!setTitle) {
            alert("Please enter a title for your flashcard set.");
            return;
        }

        const flashcards = this.collectFlashcards();
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
            const setRef = window.db
                .collection("flashcardSets")
                .doc(user.uid)
                .collection("sets");

            if (this.currentSetId) {
                await setRef.doc(this.currentSetId).update({
                    title: setTitle,
                    cards: flashcards,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`Flashcard set "${setTitle}" updated successfully.`);
            } else {
                await setRef.add({
                    title: setTitle,
                    cards: flashcards,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`Flashcard set "${setTitle}" saved online.`);
            }

            this.resetFlashcardForm();
            this.addFlashcard();
        } catch (error) {
            console.error("Error saving to Firestore:", error.message, error);
            alert("Something went wrong while saving.");
        }
    }

    /**
     * Collects all flashcards from the form
     */
    collectFlashcards() {
        const cardElements = document.querySelectorAll(".card-container");
        const flashcards = [];

        cardElements.forEach(card => {
            const term = card.querySelector(".term").value.trim();
            const definition = card.querySelector(".definition").value.trim();
            if (term && definition) {
                flashcards.push({ term, definition });
            }
        });

        return flashcards;
    }

    /**
     * Resets the flashcard creation form
     */
    resetFlashcardForm() {
        this.currentSetId = null;
        document.getElementById("set-title").value = "";
        document.querySelectorAll(".card-container").forEach(card => card.remove());
    }

    /**
     * Escapes HTML to prevent XSS attacks
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, char => map[char]);
    }

    /**
     * Cleanup method to remove event listeners (call when destroying the app)
     */
    cleanup() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }
}
