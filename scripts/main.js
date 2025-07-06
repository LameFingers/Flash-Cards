class FlashcardApp {
    constructor() {
        // --- Define all screen containers ---
        this.startScreen = document.getElementById("start-screen");
        this.menueScreen = document.getElementById("menue-screen");
        this.flashcardScreen = document.getElementById("flashcard-screen");
        this.libraryScreen = document.getElementById("library-screen");
        this.practiceScreen = document.getElementById("practice-screen");
        this.currentSetId = null;

        // --- Set up the initial event listeners ---
        this.safeAddEventListener("starting-button", "click", () => this.showMenu());
        this.setupMenuEventListeners();
    }

    /**
     * A helper function to safely add event listeners without crashing the app.
     */
    safeAddEventListener(id, event, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element with ID '${id}' not found. Listener not attached.`);
        }
    }

    // Sets up listeners for the main menu buttons
    setupMenuEventListeners() {
        this.safeAddEventListener("go-back", "click", () => this.showStart());
        this.safeAddEventListener("library-button", "click", () => this.showLibraryScreen());
        this.safeAddEventListener("new-set", "click", () => this.showFlashcardScreen());
        this.safeAddEventListener("practice", "click", () => this.showPracticeScreen());
    }

    // --- Screen Visibility Management ---

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

        document.getElementById("set-title").value = "";
        document.querySelectorAll(".card-container").forEach(card => card.remove());

        // Add the first blank card for the new set
        this.addFlashcard();

        // Safely set up listeners for the screen's buttons
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

        // Build the screen's static structure
        this.libraryScreen.innerHTML = `
            <div id="library-banner">
                <button id="go-back-library">
                    <img src="images/Left-Arrow.svg" alt="library-back">
                </button>
                <h1>Your Flashcard Sets</h1>
            </div>
            <div id="library-content"></div>
        `;
        
        // Re-attach the back button listener
        this.safeAddEventListener("go-back-library", "click", () => this.showMenu());
        
        const contentDiv = document.getElementById("library-content");
        try {
            const snapshot = await window.db.collection("flashcardSets").doc(user.uid).collection("sets").orderBy("createdAt", "desc").get();
            
            if (snapshot.empty) {
                contentDiv.innerHTML = "<p>You don't have any flashcard sets yet.</p>";
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const cardDiv = document.createElement("div");
                cardDiv.className = "library-card";
                
                cardDiv.innerHTML = `
                    <div class="library-card-content">
                        <strong>${data.title}</strong>
                        <p>${data.cards ? data.cards.length : 0} card(s)</p>
                    </div>
                    <button class="delete-set-btn" title="Delete Set">
                        <img src="images/Trash.svg" alt="Delete">
                    </button>
                `;

                // Make the main card area clickable for editing
                const cardContent = cardDiv.querySelector(".library-card-content");
                cardContent.addEventListener("click", () => this.editSet(doc.id, data));

                // Add the delete functionality to the button
                const deleteBtn = cardDiv.querySelector(".delete-set-btn");
                deleteBtn.addEventListener("click", async (e) => {
                    e.stopPropagation(); // Prevents the edit function from running
                    
                    if (confirm(`Are you sure you want to delete the set "${data.title}"?`)) {
                        try {
                            await window.db.collection("flashcardSets").doc(user.uid).collection("sets").doc(doc.id).delete();
                            cardDiv.remove(); // Remove the set from the screen
                            alert(`"${data.title}" has been deleted.`);
                        } catch (error) {
                            console.error("Error deleting set:", error);
                            alert("Failed to delete the set.");
                        }
                    }
                });
                
                contentDiv.appendChild(cardDiv);
            });
        } catch (err) {
            console.error("Error loading library:", err);
            alert("Failed to load your library.");
        }
    }

    async showPracticeScreen() {
        this.hideAllScreens();
        this.practiceScreen.style.display = "flex";

        // Show the set selection list and hide the card viewer
        document.getElementById("practice-set-selection").style.display = "flex";
        document.getElementById("practice-card-view").style.display = "none";
        
        // Re-attach the main back button listener
        this.safeAddEventListener("go-back-practice", "click", () => this.showMenu());

        const user = window.auth.currentUser;
        if (!user) return;

        const setListDiv = document.getElementById("practice-set-list");
        setListDiv.innerHTML = ""; // Clear old list

        try {
            const snapshot = await window.db.collection("flashcardSets").doc(user.uid).collection("sets").orderBy("createdAt", "desc").get();
            if (snapshot.empty) {
                setListDiv.innerHTML = "<p>You have no sets to practice.</p>";
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const setItem = document.createElement("div");
                setItem.className = "practice-set-item";
                setItem.innerHTML = `
                    <div>
                        <strong>${data.title}</strong>
                        <p>${data.cards ? data.cards.length : 0} card(s)</p>
                    </div>
                    <span>▶</span>
                `;
                // Add click listener to start the practice session for this set
                setItem.addEventListener("click", () => {
                    if (data.cards && data.cards.length > 0) {
                        this.startPracticeSession(data.cards);
                    } else {
                        alert("This set has no cards to practice.");
                    }
                });
                setListDiv.appendChild(setItem);
            });
        } catch (err) {
            console.error("Error loading sets for practice:", err);
            alert("Failed to load your sets.");
        }
    }

    // --- Utility Methods ---

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
    
    editSet(setId, setData) {
        this.hideAllScreens();
        this.flashcardScreen.style.display = "flex";
        this.currentSetId = setId;

        document.getElementById("set-title").value = setData.title;
        document.querySelectorAll(".card-container").forEach(card => card.remove());
        
        setData.cards.forEach(cardData => {
            const flashcardContent = document.getElementById("flashcard-content");
            const newCard = document.createElement("div");
            newCard.className = "card-container";
            newCard.innerHTML = `
                <input type="text" class="term" value="${cardData.term}">
                <textarea class="definition">${cardData.definition}</textarea>
                <button class="delete-card"><img src="images/Trash.svg" alt="Delete"></button>
            `;
            newCard.querySelector(".delete-card").addEventListener("click", () => newCard.remove());
            const buttonContainer = flashcardContent.querySelector(".button-container");
            flashcardContent.insertBefore(newCard, buttonContainer);
        });

        // Safely set up listeners for the screen's buttons
        this.safeAddEventListener("go-back-flashcard", "click", () => this.showMenu());
        this.safeAddEventListener("add-card", "click", () => this.addFlashcard());
        this.safeAddEventListener("save-set", "click", () => this.saveSet());
        this.autoExpandTextAreas();
    }
    
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

    startPracticeSession(cards) {
        // Hide the set selection and show the card viewer
        document.getElementById("practice-set-selection").style.display = "none";
        document.getElementById("practice-card-view").style.display = "flex";

        let currentIndex = 0;
        const cardElement = document.getElementById("practice-card");
        const frontFace = cardElement.querySelector(".card-front");
        const backFace = cardElement.querySelector(".card-back");
        const progressIndicator = document.getElementById("practice-progress");

        const updateCard = () => {
            cardElement.classList.remove("is-flipped"); // Always show front first
            frontFace.textContent = cards[currentIndex].term;
            backFace.textContent = cards[currentIndex].definition;
            progressIndicator.textContent = `Card ${currentIndex + 1} of ${cards.length}`;
        };

        // Button listeners for the practice session
        document.getElementById("practice-flip-card").onclick = () => cardElement.classList.toggle("is-flipped");
        cardElement.onclick = () => cardElement.classList.toggle("is-flipped");

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
        
        // Listener to exit the session
        document.getElementById("practice-exit-session").onclick = () => {
            this.showPracticeScreen(); // Go back to the set selection list
        };

        updateCard(); // Load the first card
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