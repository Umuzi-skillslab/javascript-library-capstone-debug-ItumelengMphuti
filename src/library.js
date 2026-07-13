let books = [];
let members = [];
const LATE_FEE_PER_DAY = 0.50;
const MAX_BOOKS_PER_MEMBER = 5;
const MAX_DIGITAL_BOOKS_PER_MEMBER = 5;

// Book class
class Book {
    constructor(isbn, title, author, year, copies, category, type) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.year = year;
        this.availableCopies = copies;
        this.totalCopies = copies;
        this.category = category;
        this.type = type;
        this.checkedOut = [];
        this.reservationQueue = [];
    }

    isAvailable() {
        return this.availableCopies > 0;
    }

    getInfo() {
        return `"${this.title}" by ${this.author} (${this.year}) - ISBN: ${this.isbn} | Available: ${this.availableCopies}/${this.totalCopies}`;
    }

    checkOut(memberId) {
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
        if (this.reservationQueue.includes(memberId)) {
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

        if (this.reservationQueue.length > 0) {
            const nextMember = this.reservationQueue.shift();
            this.checkOut(nextMember);
        }
        return true;
    }


}

// Digital book class with inheritance
class DigitalBook extends Book {
    constructor(isbn, title, author, year, category, fileSize, format, ) {
        // Missing: super() call with correct parameters
        super(isbn, title, author, year, Infinity, category, "digital")
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

// Member class
class Member {
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

    getMemberInfo() {
        const { id, name, email, membershipType } = this;

        return `${name} (${id}) - ${membershipType} member | ${email}`;
    }

    canBorrow() {
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

// Premium member with inheritance
class PremiumMember extends Member {
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

// Recursive function to search for books
function searchBooksByCategory(bookList, category, index = 0) {
    if (!bookList) {
        return [];
    }

    if (index >= bookList.length) {
        return [];
    }

    if (bookList[index].category === category) {
        return [bookList[index]].concat(
            searchBooksByCategory(bookList, category, index + 1)
        );
    }

    return searchBooksByCategory(bookList, category, index + 1);
}

function getBooksByAuthor(authorName) {
    return books.filter(book => book.author === authorName);
}

function calculateTotalLateFees(memberRecord) {
    return memberRecord.overdueBooks.reduce(
        (total, book) => total + (book.daysLate * LATE_FEE_PER_DAY),
        0
    );
}

// Function missing spread operator
function combineBookCollections(fiction, nonFiction, reference) {
    return [...fiction, ...nonFiction, ...reference];
}

// Function adds books
function addMultipleBooks(...newBooks) {
    books.push(...newBooks)
}

// Function updates member information
function updateMemberInfo(member, updates) {
    // Should destructure updates object
    const { name, email, membershipType } = updates;

    member.name = name;
    member.email = email;
    member.membershipType = membershipType;

    return member;
}

// Function with no error handling
function borrowBook(memberId, isbn, bookType) {
    try {
        if (!memberId || !isbn) {
            return {
                success: false,
                message: "Please enter both a Member ID and an ISBN."
            };
        }

        const member = findMemberById(memberId);

        if (!member) {
            return {
                success: false,
                message: `Member '${memberId}' does not exist.`
            };
        }

        const book = findBookByISBN(isbn);

        if (!book) {
            return {
                success: false,
                message: `Book with ISBN '${isbn}' was not found.`
            };
        }

        if (!member.canBorrow()) {
            return {
                success: false,
                message: "This member has reached the borrowing limit."
            };
        }

        if (!book.isAvailable()) {
            if (member.canReserve()) {
                book.reserveBook(memberId);

                return {
                    success: true,
                    message: "Book is unavailable. You have been added to the reservation queue."
                };
            }

            return {
                success: false,
                message: "This book is currently unavailable."
            };
        }

        const borrowed = book.checkOut(memberId);

        if (!borrowed) {
            return {
                success: false,
                message: "Unable to check out the book."
            };
        }

        member.borrowedBooks.push(isbn);

        return {
            success: true,
            message: `"${book.title}" has been borrowed successfully.`
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

function returnBook(memberId, isbn) {

    try {

        if (!memberId || !isbn) {
            return {
                success: false,
                message: "Please enter both a Member ID and an ISBN."
            };
        }

        const member = findMemberById(memberId);

        if (!member) {
            return {
                success: false,
                message: `Member '${memberId}' does not exist.`
            };
        }

        const book = findBookByISBN(isbn);

        if (!book) {
            return {
                success: false,
                message: `Book with ISBN '${isbn}' was not found.`
            };
        }

        const returned = book.returnBook(memberId);

        if (!returned) {
            return {
                success: false,
                message: "This member has not borrowed this book."
            };
        }

        const borrowedIndex = member.borrowedBooks.indexOf(isbn);

        if (borrowedIndex !== -1) {
            member.borrowedBooks.splice(borrowedIndex, 1);
        }

        return {
            success: true,
            message: `"${book.title}" has been returned successfully.`
        };

    } catch (error) {

        return {
            success: false,
            message: error.message
        };

    }
}

function findMemberById(id) {
    return members.find(member => member.id === id) || null;
}

function findBookByISBN(isbn) {
    return books.find(book => book.isbn === isbn) || null;
}

// Statistics object with missing methods
const LibraryStats = {
    totalBooks: 0,
    totalMembers: 0,
    totalBorrowings: 0,

   updateStats() {
    console.log("updateStats() is running");

    this.totalBooks = books.length;
    this.totalMembers = members.length;
    this.totalBorrowings = books.reduce(
        (total, book) => total + book.checkedOut.length,
        0
    );

    console.log(this.totalBooks);
    console.log(this.totalMembers);
    console.log(this.totalBorrowings);
},

    getAverageBorrowings() {
        if (this.totalMembers === 0) {
            return 0;
        }
        return Math.round(this.totalBorrowings / this.totalMembers);
    },

    countAvailableBooks() {
        let available = 0;

        for (const book of books) {
            available += book.availableCopies;
        }
        return available;
    },

    getStatistics() {
        const {
            totalBooks,
            totalMembers,
            totalBorrowings
        } = this;

        return {
            totalBooks,
            totalMembers,
            totalBorrowings
        };
    },

    getMostPopularBook() {
        if (books.length === 0) {
            return null;
        }
        return books.reduce((popular, current) =>
            current.checkedOut.length > popular.checkedOut.length
                ? current
                : popular
        );
    }
};

// Function with string manipulation errors
function formatBookInfo(book) {
    return `Title: ${book.title.trim().toUpperCase()}
Author: ${book.author.trim()}
Year: ${book.year}`;
}

function calculateFineAmount(daysLate) {
    if (daysLate == null) {
        return null;
    }

    if (typeof daysLate !== "number") {
        return null;
    }

    if (Number.isNaN(daysLate)) {
        return null;
    }

    const fine = daysLate * LATE_FEE_PER_DAY;

    return fine.toFixed(2);
}

export {
    books,
    members,
    Book,
    DigitalBook,
    Member,
    PremiumMember,
    findOverdueBooks,
    processReturnQueue,
    searchBooksByCategory,
    getBooksByAuthor,
    calculateTotalLateFees,
    combineBookCollections,
    addMultipleBooks,
    updateMemberInfo,
    borrowBook,
    returnBook,
    findMemberById,
    findBookByISBN,
    LibraryStats,
    formatBookInfo,
    calculateFineAmount
};