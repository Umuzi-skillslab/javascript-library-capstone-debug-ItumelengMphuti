// Library UI - DOM Manipulation with Complex Errors
import {
    Book,
    DigitalBook,
    Member,
    PremiumMember,
    books,
    members,
    borrowBook,
    findBookByISBN,
    searchBooksByCategory,
    LibraryStats
} from "./library.js";

import { showMessage } from "./utils.js";

// Missing: proper initialization with DOMContentLoaded
if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initializeUI);
}

let catalogueContainer;
let searchInput;
let filterDropdown;

function initializeUI() {
    // Wrong selector syntax
    catalogueContainer = document.querySelector("#catalogue-list");
    searchInput = document.getElementById("search");
    filterDropdown = document.querySelector("#filter-category");  // Missing #

    // Missing: null checks
    if (!catalogueContainer || !searchInput || !filterDropdown) {
        console.error("UI elements not found.");
        return;
    }

    setupEventListeners();
    loadCatalogue();
    createMemberForm();
    renderMemberList();
    updateStatisticsDisplay();
}

function setupEventListeners() {
    searchInput.addEventListener("input", handleSearch);
    filterDropdown.addEventListener("change", handleFilterChange);

    const borrowForm = document.getElementById("borrow-form");

    if (borrowForm) {
        borrowForm.addEventListener("submit", handleBorrowSubmit);
    }

    catalogueContainer.addEventListener("click", handleBookClick);

    // Navigation tabs
    document
        .getElementById("catalogue-tab")
        .addEventListener("click", () => showSection("catalogue"));

    document
        .getElementById("members-tab")
        .addEventListener("click", () => showSection("members"));

    document
        .getElementById("statistics-tab")
        .addEventListener("click", () => showSection("statistics"));
}

function showSection(section) {
    const catalogue = document.getElementById("catalogue-section");
    const borrowSection = document.getElementById("borrow-section");
    const members = document.getElementById("member-section");
    const statistics = document.getElementById("statistics-section");

    // Hide everything first
    catalogue.classList.add("hidden");
    borrowSection.classList.add("hidden");
    members.classList.add("hidden");
    statistics.classList.add("hidden");

    // Reset the tabs
    document.getElementById("catalogue-tab").setAttribute("aria-selected", "false");
    document.getElementById("members-tab").setAttribute("aria-selected", "false");
    document.getElementById("statistics-tab").setAttribute("aria-selected", "false");

    switch (section) {
        case "catalogue":
            catalogue.classList.remove("hidden");
            borrowSection.classList.remove("hidden");
            document.getElementById("catalogue-tab").setAttribute("aria-selected", "true");
            break;

        case "members":
            members.classList.remove("hidden");
            document.getElementById("members-tab").setAttribute("aria-selected", "true");
            break;

        case "statistics":
            statistics.classList.remove("hidden");
            document.getElementById("statistics-tab").setAttribute("aria-selected", "true");
            updateStatisticsDisplay();
            break;
    }
}

async function loadCatalogue() {
    try {
        const response = await fetch("../data/books.json");
        const data = await response.json();

        books.length = 0;

        data.books.forEach(book => {
            if (book.type === "digital") {
                books.push(
                    new DigitalBook(
                        book.isbn,
                        book.title,
                        book.author,
                        book.year,
                        book.category,
                        book.fileSize,
                        book.format
                    )
                );
            } else {
                books.push(
                    new Book(
                        book.isbn,
                        book.title,
                        book.author,
                        book.year,
                        book.copies,
                        book.category,
                        book.type
                    )
                );
            }
        });

        renderBookCatalogue(books);

    } catch (error) {
        console.error(error);
    }
}
// Complex DOM rendering with errors
function renderBookCatalogue(bookList) {
    const container =
        catalogueContainer || document.getElementById("catalogue-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const fragment = document.createDocumentFragment();

    for (const book of bookList) {
        const bookCard = document.createElement("div");
        bookCard.className = "book-card";
        bookCard.dataset.isbn = book.isbn;

        bookCard.innerHTML = `
        <h3>${book.title}</h3>
        <p><strong>Author:</strong> ${book.author}</p>
        <p><strong>Type:</strong> ${book.type.charAt(0).toUpperCase() + book.type.slice(1)}</p>
        <p><strong>Category:</strong> ${book.category.charAt(0).toUpperCase() + book.category.slice(1)}</p>
        <p><strong>Available:</strong> ${book.type === "digital" ? "Unlimited" : book.availableCopies
            }</p>
        `;

        fragment.appendChild(bookCard);
    }

    container.appendChild(fragment);
}

// Function with event handling errors
function handleBorrowSubmit(event) {
    event.preventDefault();

    const memberId = document.getElementById("member-id").value.trim();
    const isbn = document.getElementById("isbn").value.trim();

    if (!memberId || !isbn) {
        showMessage("Please enter both Member ID and ISBN.",
            "error"
        );
        return;
    }

    try {
        const result = borrowBook(memberId, isbn);

showMessage(
    result.message,
    result.success ? "success" : "error"
);

if (result.success) {
    event.target.reset();
    renderBookCatalogue(books);
    updateStatisticsDisplay();
}

    } catch (error) {
        console.error(error);
        showMessage(
            "An unexpected error occurred.",
            "error");
    }
}

// Function missing event delegation
function handleBookClick(event) {
    const bookCard = event.target.closest(".book-card");

    if (!bookCard) {
        return;
    }

    const isbn = bookCard.dataset.isbn;
    displayBookDetails(isbn);
}

// Search function with errors
function handleSearch(event) {
    const searchTerm = event.target.value.trim().toLowerCase();

    const results = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
    );

    renderBookCatalogue(results);
}

// Function with filter errors
function handleFilterChange(event) {
    const selectedCategory = event.target.value;

    if (selectedCategory === "all") {
        renderBookCatalogue(books);
        return;
    }

    const filtered = books.filter(
        book => book.category === selectedCategory
    );

    renderBookCatalogue(filtered);
}

// Function missing JSON operations
function exportLibraryData() {
    try {
        const data = {
            books,
            members
        };

        return JSON.stringify(data);

    } catch (error) {
        console.error("Export failed:", error);
        return null;
    }
}
// Function missing JSON parsing
function importLibraryData(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        if (!data.books || !data.members) {
            throw new Error("Invalid library data.");
        }

        books.length = 0;
        members.length = 0;

        books.push(...data.books);
        members.push(...data.members);

        renderBookCatalogue(books);
        updateStatisticsDisplay();

    } catch (error) {
        console.error("Import failed:", error);
    }
}

// LocalStorage functions with errors
function saveToLocalStorage() {
    try {
        localStorage.setItem(
            "libraryBooks",
            JSON.stringify(books)
        );

        localStorage.setItem(
            "libraryMembers",
            JSON.stringify(members)
        );

    } catch (error) {
        console.error("Failed to save:", error);
    }
}

function loadFromLocalStorage() {
    try {
        const booksData = localStorage.getItem("libraryBooks");
        const membersData = localStorage.getItem("libraryMembers");

        if (!booksData || !membersData) {
            return;
        }

        books.length = 0;
        members.length = 0;

        books.push(...JSON.parse(booksData));
        members.push(...JSON.parse(membersData));

        renderBookCatalogue(books);
        updateStatisticsDisplay();

    } catch (error) {
        console.error("Failed to load:", error);
    }
}

// Display function with template issues
function displayBookDetails(isbn) {
    const book = findBookByISBN(isbn);

    if (!book) {
        return;
    }

    const detailsContainer = document.getElementById("book-details");

    if (!detailsContainer) {
        return;
    }

    detailsContainer.innerHTML = `
        <div class="book-details">
            <h2>${book.title}</h2>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>ISBN:</strong> ${book.isbn}</p>
            <p><strong>Year:</strong> ${book.year}</p>
            <p><strong>Type:</strong> ${book.type.charAt(0).toUpperCase() + book.type.slice(1)}</p>
            <p><strong>Category:</strong> ${book.category.charAt(0).toUpperCase() + book.category.slice(1)}</p>
            <p><strong>Available Copies:</strong> ${book.availableCopies}</p>
            <p><strong>Total Copies:</strong> ${book.totalCopies}</p>
        </div>
    `;
}

// Statistics display with errors
function updateStatisticsDisplay() {
    const totalBooksEl = document.getElementById("total-books");
    const totalMembersEl = document.getElementById("total-members");
    const booksBorrowedEl = document.getElementById("books-borrowed");

    if (!totalBooksEl || !totalMembersEl || !booksBorrowedEl) {
        return;
    }

    LibraryStats.updateStats();

    totalBooksEl.textContent = LibraryStats.totalBooks;
    totalMembersEl.textContent = LibraryStats.totalMembers;
    booksBorrowedEl.textContent = LibraryStats.totalBorrowings;
}

function renderMemberList() {
    const memberList = document.getElementById("member-list");

    if (!memberList) {
        return;
    }

    memberList.innerHTML = "";

    const fragment = document.createDocumentFragment();

    for (const member of members) {
        const card = document.createElement("div");
        card.className = "member-card";

        card.innerHTML = `
            <h3>${member.name}</h3>
            <p><strong>ID:</strong> ${member.id}</p>
            <p><strong>Email:</strong> ${member.email}</p>
            <p><strong>Membership:</strong> ${member.membershipType}</p>
            <p><strong>Joined:</strong> ${member.joinDate}</p>
        `;

        fragment.appendChild(card);
    }

    memberList.appendChild(fragment);
}

// Dynamic form generation with errors
function createMemberForm() {
    const formContainer = document.getElementById("member-form");

    if (!formContainer) {
        return;
    }

    formContainer.innerHTML = "";

    const form = document.createElement("form");
    form.id = "new-member-form";

    form.innerHTML = `
        <label for="name">Name</label>
        <input
            type="text"
            id="name"
            placeholder="Enter member name"
            required
        >

        <label for="email">Email</label>
        <input
            type="email"
            id="email"
            placeholder="Enter email"
            required
        >

        <label for="membership-type">Membership Type</label>
        <select id="membership-type">
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
        </select>

        <button type="submit">Add Member</button>
    `;

    formContainer.appendChild(form);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const membershipType = document.getElementById("membership-type").value;

        if (!name || !email) {
            showMessage("Please complete all fields.",
                "error"
            );
            return;
        }

        // Generate a unique member ID
        const id = String(members.length + 1).padStart(3, "0");

        // Today's date
        const joinDate = new Date().toISOString().split("T")[0];

        let member;

        if (membershipType === "premium") {
            member = new PremiumMember(
                id,
                name,
                email,
                membershipType,
                joinDate
            );
        } else {
            member = new Member(
                id,
                name,
                email,
                membershipType,
                joinDate
            );
        }

        // Add the new member
        members.push(member);

        //Render member list
        renderMemberList();

        // Update statistics
        updateStatisticsDisplay();

        // Show confirmation
        showMessage(
            `Member added successfully!<br>
            Member ID: ${member.id}<br>
            Name: ${member.name}<br>
            Email: ${member.email}<br>
            Membership: ${member.membershipType}`,
            "success"
        );

        // Reset the form
        form.reset();
    });
}

export {
    initializeUI,
    renderBookCatalogue,
    renderMemberList,
    handleBookClick,
    handleSearch,
    displayBookDetails,
    loadCatalogue,
    handleBorrowSubmit,
    handleFilterChange,
    updateStatisticsDisplay,
    createMemberForm,
    exportLibraryData,
    setupEventListeners,
    importLibraryData,
    saveToLocalStorage,
    loadFromLocalStorage
};