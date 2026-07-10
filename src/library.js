// Library Management System - Starter Code with Complex Errors

// Global state management (scoping issues)
let books = [];  // Missing declaration
let members = [];
const LATE_FEE_PER_DAY = 0.50;
const MAX_BOOKS_PER_MEMBER = 5;
const MAX_DIGITAL_BOOKS_PER_MEMBER = 5;

// Book class with multiple issues
export class Book {
    constructor(isbn, title, author, year, copies) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.year = year;
        this.availableCopies = copies;
        this.totalCopies = copies;
        this.checkedOut = [];
        this.reservationQueue = [];
    }
    // Missing: method to check availability
    isAvailable() {
        return this.availableCopies > 0;
    }

    // Missing: method to get book info using template literals
    getInfo() {
        return `"${this.title}" by ${this.author} (${this.year}) - ISBN: ${this.isbn} | Available: ${this.availableCopies}/${this.totalCopies}`;
    }

    checkOut(memberId) {
        // No validation for available copies
        if (!this.isAvailable()) {
            return false;
        }
        this.availableCopies--;
        this.checkedOut.push({ memberId, checkoutDate: new Date() });

        return true;
    }

    reserveBook(memberId) {
        if (this.availableCopies > 0) {
            return false;
        }
        if(this.reservationQueue.includes(memberId)) {
            return false;
        }
        this.reservationQueue.push(memberId);
        return true;
    }

    returnBook(memberId) {
        const index = this.checkedOut.findIndex(
            record => record.memberId === memberId
        );

        if (index === -1) {
            return false;
        }

        this.checkedOut.splice(index, 1);
        this.availableCopies++;

        if(this.reservationQueue.length > 0) {
            const nextMember = this.reservationQueue.shift();
            this.checkOut(nextMember);
        }
        return true;
    }


}

// Digital book class with inheritance problems
export class DigitalBook extends Book {
    constructor(isbn, title, author, year, fileSize, format) {
        // Missing: super() call with correct parameters
        super(isbn, title, author, year, Infinity)
        this.fileSize = fileSize;
        this.format = format;
        this.downloads = 0;
        this.downloadHistory = [];
    }

    download(memberId) {
        this.downloads++;
        this.downloadHistory.push(memberId);
        return true;
    }
}

// Member class with errors
export class Member {
    constructor(id, name, email, membershipType, joinDate) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.membershipType = membershipType;
        this.borrowedBooks = [];
        this.downloadedBooks = [];
        // Missing: joinDate property
        this.joinDate = joinDate
    }
    // Missing: method to calculate membership duration
    getMembershipDuration() {
        const joined = new Date(this.joinDate);
        const today = new Date();

        if (joined > today) {
            throw new Error("Member has not joined yet.");
        };

        // Milliseconds difference
        const diffMs = today - joined;
        const diffDate = new Date(diffMs);

        const year = diffDate.getUTCFullYear() - 1970;
        const month = diffDate.getUTCMonth();
        const days = diffDate.getDate() - 1;

        const yearLabel = year === 1 ? "year" : "years";
        const monthLabel = month === 1 ? "month" : "months";
        const dayLabel = days === 1 ? "day" : "days";

        if (year > 0) {
            return `Member has been active for ${year} ${yearLabel}, ${month} ${monthLabel} and ${days} ${dayLabel}.`;
        } else if
            (month > 0) {
            return `Member has been active for ${month} ${monthLabel} and ${days} ${dayLabel}.`;
        } else {
            return `Member has been active for ${days} ${dayLabel}.`;
        }
    }
    // Missing: method using destructuring
    getMemberInfo() {
        const { id, name, email, membershipType } = this;

        return `${name} (${id}) - ${membershipType} member | ${email}`;
    }

    canBorrow() {
        // Wrong comparison operator
        if (this.borrowedBooks.length >= MAX_BOOKS_PER_MEMBER) {
            return false;
        }
        return true;
    }
    canBorrowEbook() {
        if (this.downloadedBooks.length >= MAX_DIGITAL_BOOKS_PER_MEMBER) {
            return false;
        }
        return true;
    }
    canReserve() {
        return false;
    }
}

// Premium member with inheritance issues
export class PremiumMember extends Member {
    constructor(id, name, email, joinDate) {
        super(id, name, email, "premium", joinDate);
    }

    // Should override canBorrow to allow more books
    canBorrow() {
        return this.borrowedBooks.length < 10;
    }
    //No late fee for premium
    calculateTotalLateFees(daysLate) {
        return 0;
    }

    canBorrowEbook() {
        return this.downloadedBooks.length < 15;
    }

    canReserve() {
        return true;
    }
}

// Complex function with nested loops and errors
function findOverdueBooks(daysOverdue) {
    let overdue = [];

    for (let i = 0; i < books.length; i++) {
        for (let j = 0; j < books[i].checkedOut.length; j++) {
            // Missing: actual date checking logic
            const checkoutRecord = books[i].checkedOut[j];
            const dateCheckedOut = new Date(checkoutRecord.checkoutDate);
            const today = new Date();

            const diffMs = today - dateCheckedOut;
            const daysBorrowed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (daysBorrowed >= daysOverdue) {
                const overdueBook = {
                    isbn: books[i].isbn,
                    title: books[i].title,
                    memberId: checkoutRecord.memberId,
                    checkoutDate: checkoutRecord.checkoutDate
                };
                overdue.push(overdueBook)
            }
        }
    }

    return overdue;
}

// Processes Books being returned
function processReturnQueue(queue) {
    const results = [];

    while (queue.length > 0) {
        const { book, memberId } = queue.shift();

        const success = book.returnBook(memberId);

        if (success) {
            results.push(
                `Processed return: "${book.title}" from member ${memberId}`
            );
        } else {
            results.push(
                `Return failed: member ${memberId} had no record for "${book.title}"`
            );
        }
    }

    return results;
}

// Recursive function with multiple errors
function searchBooksByCategory(bookList, category, index) {
    // Missing: base case
    // Missing: undefined/null checks
    // Wrong comparison

    if (bookList[index].category = category) {
        return [bookList[index]].concat(searchBooksByCategory(bookList, category, index + 1));
    }

    return searchBooksByCategory(bookList, category, index + 1);
}

// Function missing array methods
function getBooksByAuthor(authorName) {
    var result = [];

    // Should use filter method
    for (var i = 0; i < books.length; i++) {
        if (books[i].author == authorName) {  // Should use ===
            result.push(books[i]);
        }
    }

    return result;
}

// Function that should use reduce
function calculateTotalLateFees(memberRecord) {
    var total = 0;

    // Should use reduce on array
    for (var i = 0; i < memberRecord.overdueBooks.length; i++) {
        total = total + memberRecord.overdueBooks[i].daysLate * LATE_FEE_PER_DAY;
    }

    return total;
}

// Function missing spread operator
function combineBookCollections(fiction, nonFiction, reference) {
    // Should use spread operator
    var combined = [];

    for (var i = 0; i < fiction.length; i++) combined.push(fiction[i]);
    for (var i = 0; i < nonFiction.length; i++) combined.push(nonFiction[i]);
    for (var i = 0; i < reference.length; i++) combined.push(reference[i]);

    return combined;
}

// Function missing rest parameters
function addMultipleBooks(book1, book2, book3) {
    // Should use rest parameters to accept unlimited books
    books.push(book1);
    books.push(book2);
    books.push(book3);
}

// Function missing destructuring
function updateMemberInfo(member, updates) {
    // Should destructure updates object
    member.name = updates.name;
    member.email = updates.email;
    member.membershipType = updates.membershipType;

    return member;
}

// Function with no error handling
function borrowBook(memberId, isbn) {
    // Missing: try-catch block
    // Missing: validation for undefined/null
    // Missing: typeof checks

    var member = findMemberById(memberId);
    var book = findBookByISBN(isbn);

    // No check if member or book exists
    if (member.canBorrow()) {
        book.checkOut(memberId);
        member.borrowedBooks.push(isbn);
        return true;
    }

    return false;
}

// Helper functions with errors
function findMemberById(id) {
    // Should use find method
    for (var i = 0; i < members.length; i++) {
        if (members[i].id = id) {  // Wrong operator
            return members[i];
        }
    }
    // Returns undefined implicitly - should handle explicitly
}

function findBookByISBN(isbn) {
    var i = 0;

    // Wrong loop choice
    while (i < books.length) {
        if (books[i].isbn === isbn) {
            return books[i];
        }
        i = i + 1;
    }

    return null;
}

// Statistics object with missing methods
var LibraryStats = {
    totalBooks: 0,
    totalMembers: 0,
    totalBorrowings: 0,

    // Missing: method using Math object for calculations
    // Missing: method using for-of loop
    // Missing: method returning object with destructuring

    updateStats: function () {
        this.totalBooks = books.length;
        this.totalMembers = members.length;
    },

    getMostPopularBook: function () {
        // Inefficient implementation - should use reduce
        var maxCheckouts = 0;
        var popularBook = null;

        for (var i = 0; i < books.length; i++) {
            if (books[i].checkedOut.length > maxCheckouts) {
                maxCheckouts = books[i].checkedOut.length;
                popularBook = books[i];
            }
        }

        return popularBook;
    }
};

// Function with string manipulation errors
function formatBookInfo(book) {
    // Should use template literals
    var info = "Title: " + book.title + "\n";
    info = info + "Author: " + book.author + "\n";
    info = info + "Year: " + book.year;

    // Missing: proper string methods (trim, toUpperCase, etc.)

    return info;
}

// Function with number/type issues
function calculateFineAmount(daysLate) {
    // Missing: typeof check
    // Missing: NaN handling
    // Missing: null/undefined check

    var fine = daysLate * LATE_FEE_PER_DAY;

    // Should use toFixed for currency
    return fine;
}

// Missing: module exports
// Missing: proper data structure for ISBN lookups (Map/Set)
