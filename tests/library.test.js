
/**
 * @jest-environment jsdom
 */
import { beforeEach, describe, expect, jest } from '@jest/globals'

import { showMessage } from "../src/utils.js";

import {
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
    findMemberById,
    findBookByISBN,
    LibraryStats,
    formatBookInfo,
    calculateFineAmount
} from "../src/library.js";

import {
    initializeUI,
    renderBookCatalogue,
    handleSearch,
    displayBookDetails,
    handleBorrowSubmit,
    handleFilterChange,
    updateStatisticsDisplay,
    createMemberForm,
    exportLibraryData,
    handleBookClick,
    setupEventListeners,
    renderMemberList,
    loadCatalogue,
    importLibraryData,
    saveToLocalStorage,
    loadFromLocalStorage
} from "../src/ui.js";



describe('Book Class', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-07-06"));
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    test("should create a book instance with the correct properties ", () => {
        const book = new Book(
            "978-0-7432-7356-5",
            "Test Book",
            "John Doe",
            2024,
            5
        );
        expect(book.isbn).toBe("978-0-7432-7356-5");
        expect(book.title).toBe("Test Book");
        expect(book.author).toBe("John Doe");
        expect(book.year).toBe(2024);
        expect(book.availableCopies).toBe(5);
        expect(book.totalCopies).toBe(5);
        expect(book.checkedOut).toEqual([]);

    });

    test("should return true when copies are available", () => {
        const book = new Book("978-0-7432-7356-5", "Test Book", "John Doe", 2009, 4);
        expect(book.isAvailable()).toBe(true)
    });

    test("should return false when copies are not available", () => {
        const book = new Book("978-0-7432-7356-5", "Test Book", "John Doe", 2009, 0);
        expect(book.isAvailable()).toBe(false)
    });

    test("should return book infomation", () => {
        const book = new Book("978-0-7432-7356-5", "Fake Book", "John Doe", 2002, 3);
        expect(book.getInfo()).toBe('"Fake Book" by John Doe (2002) - ISBN: 978-0-7432-7356-5 | Available: 3/3')
    });

    test("should check out a book successfully", () => {
        const book = new Book("978-0-3856-6052-4", "Book", "Author", 2024, 2);

        const result = book.checkOut("001");

        expect(book.checkedOut).toHaveLength(1);
        expect(book.checkedOut[0].memberId).toBe("001");
        expect(book.checkedOut[0].checkoutDate).toEqual(new Date("2026-07-06"));
    });

    test("should allow multpiple members to checkout copies", () => {
        const book = new Book("978-0-3856-6052-4", "Fake Book", "John Doe", 2009, 3);
        book.checkOut("001");
        book.checkOut("002"

        );
        expect(book.checkedOut).toHaveLength(2);

        expect(book.checkedOut[0].memberId).toBe("001");
        expect(book.checkedOut[1].memberId).toBe("002");

        expect(book.checkedOut[0].checkoutDate).toEqual(
            new Date("2026-07-06")
        );
        expect(book.checkedOut[1].checkoutDate).toEqual(
            new Date("2026-07-06")
        );
    });

    test("should not allow checkout when no copies are available", () => {
        const book = new Book("978-0-7432-7357-2", "Fake Book", "John Doe", 2006, 1);
        book.checkOut("001");
        const result = book.checkOut("002");
        expect(book.checkedOut).toHaveLength(1);
        expect(book.checkedOut[0].memberId).toBe("001");
        expect(book.checkedOut[0].checkoutDate).toEqual(new Date("2026-07-06"));
    });

    test("should allow a book to be reserved", () => {
        const book = new Book("978-0-7432-7357-2", "The Fake Book", "John Doe", 2010, 0);
        const result = book.reserveBook("002");

        expect(result).toBe(true);
        expect(book.reservationQueue).toHaveLength(1);
        expect(book.reservationQueue[0]).toBe("002");
    });

    test("standard members cannot reserve books", () => {
        const member = new Member(
            "001",
            "John",
            "john@email.com",
            "standard"
        );

        expect(member.canReserve()).toBe(false);
    });

    test("should not reserve the same book twice", () => {
        const book = new Book(
            "ISBN1",
            "Book",
            "Author",
            2020,
            0
        );

        book.reserveBook("001");

        expect(book.reserveBook("001")).toBe(false);
    });

    test("should allow a member to reserve a book with no available copies", () => {
        const book = new Book("978-0-7432-7357-2", "The Fake Book", "John Doe", 2010, 0);
        const result = book.reserveBook("002");

        expect(result).toBe(true);
        expect(book.reservationQueue).toHaveLength(1);
        expect(book.reservationQueue[0]).toBe("002");
    });

    test("should add multiple members to the reservation queue", () => {
        const book = new Book("978-0-7432-7357-2", "The Fake Book", "John Doe", 2010, 0);

        book.reserveBook("002");
        book.reserveBook("003");
        book.reserveBook("004");

        expect(book.reservationQueue).toHaveLength(3);
        expect(book.reservationQueue).toEqual(["002", "003", "004"]);
    });

    test("should not allow reservation when copies are available", () => {
        const book = new Book("978-0-7432-7357-2", "The Fake Book", "John Doe", 2010, 2);

        const result = book.reserveBook("002");

        expect(result).toBe(false);
        expect(book.reservationQueue).toHaveLength(0);
    });

    test("should assign the book to the first reserved member when returned", () => {
        const book = new Book("978-0-7432-7357-2", "The Fake Book", "John Doe", 2010, 1);

        book.checkOut("001");

        book.reserveBook("002");
        book.reserveBook("003");

        book.returnBook("001");

        expect(book.checkedOut).toHaveLength(1);
        expect(book.checkedOut[0].memberId).toBe("002");
        expect(book.reservationQueue).toEqual(["003"]);
        expect(book.availableCopies).toBe(0);
    });

    test("should return a checked out book", () => {
        const book = new Book("978-0-7432-7357-2", "Fake Book", "John Doe", 2006, 2);

        book.checkOut("001");

        const result = book.returnBook("001");

        expect(result).toBe(true);
        expect(book.availableCopies).toBe(2);
        expect(book.checkedOut).toHaveLength(0);
    });
    test("should return false if member did not borrow the book", () => {
        const book = new Book("978-0-7432-7357-2", "Fake Book", "John Doe", 2006, 2);

        expect(book.returnBook("001")).toBe(false);
    })
});

describe('DigitalBook Class', () => {
    // Missing: test for inheritance
    test("should inherit from Book class", () => {
        const ebook = new DigitalBook("978-0-7432-7357-2", "Book", "Jane Doe", 2024, "5MB", "PDF");
        expect(ebook instanceof DigitalBook).toBe(true);
        expect(ebook instanceof Book).toBe(true);
    });
    // Missing: test for super() call
    test("should call the Book constructor using super()", () => {
        const ebook = new DigitalBook(
            "978-0-7432-7357-2",
            "Book",
            "Jane Doe",
            2024,
            "reference",
            "5MB",
            "PDF"
        );
        expect(ebook.isbn).toBe("978-0-7432-7357-2");
        expect(ebook.title).toBe("Book");
        expect(ebook.author).toBe("Jane Doe");
        expect(ebook.year).toBe(2024);
        expect(ebook.fileSize).toBe("5MB");
        expect(ebook.format).toBe("PDF");
    });
    test("should initialize DigitalBook properties", () => {
        const ebook = new DigitalBook(
            "978-0-7432-7357-2",
            "Book",
            "Jane Doe",
            2024,
            "reference",
            "5MB",
            "PDF"
        );
        expect(ebook.fileSize).toBe("5MB");
        expect(ebook.format).toBe("PDF");
        expect(ebook.downloads).toBe(0);
        expect(ebook.downloadHistory).toEqual([]);
    });
    // Missing: test for download method
    test("should download a digital book", () => {
        const ebook = new DigitalBook("978-0-7432-7357-2", "Book", "Jane Doe", 2024, "5MB", "PDF");

        const result = ebook.download("002")
        expect(result).toBe(true);
        expect(ebook.downloads).toBe(1);
        expect(ebook.downloadHistory).toEqual(["002"]);
    });
});

describe('Member Class', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-07-06"));
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    test("should create a member with correct details", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard", "2026-07-01");

        expect(member.id).toBe(1);
        expect(member.name).toBe("John Doe");
        expect(member.email).toBe("johndoe@email.com");
        expect(member.membershipType).toBe("standard");
        expect(member.borrowedBooks).toEqual([]);
        expect(member.joinDate).toBe("2026-07-01");
    });
    test("should return the correct membership duration in days", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard", "2026-07-01");
        expect(member.getMembershipDuration()).toBe("Member has been active for 5 days.");

    });
    test("should return the correct membership duration in months and days", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard", "2026-02-01");
        expect(member.getMembershipDuration()).toBe("Member has been active for 5 months and 4 days.");

    });
    test("should return the correct membership duration in years", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard", "2024-06-01");
        expect(member.getMembershipDuration()).toBe("Member has been active for 2 years, 1 month and 4 days.");

    });
    test("should return an error message for a future join date", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard", "2026-07-07");

        expect(() => member.getMembershipDuration())
            .toThrow("Member has not joined yet.");
    });

    test("should get correct member information", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard");
        expect(member.getMemberInfo()).toBe("John Doe (1) - standard member | johndoe@email.com");
    });

    test("should return true if a member can borrow a book", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard");
        const result = member.canBorrow();
        expect(result).toBe(true);
    });
    test("should return false when member has borrowed 5 books", () => {
        const member = new Member(
            1,
            "John Doe",
            "johndoe@email.com",
            "standard"
        );

        member.borrowedBooks = [
            "ISBN1",
            "ISBN2",
            "ISBN3",
            "ISBN4",
            "ISBN5"
        ];

        expect(member.canBorrow()).toBe(false);
    });
    test("should return false when member has more than 5 borrowed books", () => {
        const member = new Member(
            1,
            "John Doe",
            "johndoe@email.com",
            "standard"
        );

        member.borrowedBooks = [
            "ISBN1",
            "ISBN2",
            "ISBN3",
            "ISBN4",
            "ISBN5",
            "ISBN6"
        ];

        expect(member.canBorrow()).toBe(false);
    });

    test("should return true if a member can download an ebook", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard");

        const result = member.canBorrowEbook();
        expect(result).toBe(true);
    });

    test("should return false when a member downloaded 5 books", () => {
        const member = new Member(1, "John Doe", "johndoe@email.com", "standard", "2026-07-01");
        member.downloadedBooks = [
            "ISBN1",
            "ISBN2",
            "ISBN3",
            "ISBN4",
            "ISBN5"
        ];
        expect(member.canBorrowEbook()).toBe(false);
    });
});

describe('PremiumMember Class', () => {
    // Missing: test for inheritance
    test("should inherit from Member class", () => {
        const premiumMember = new PremiumMember(1, "John Doe", "johndoe@email.com", "2026-07-01");
        expect(premiumMember instanceof PremiumMember).toBe(true);
        expect(premiumMember instanceof Member).toBe(true);
    });
    test("show override the canBorrowBook method", () => {
        const premiumMember = new PremiumMember(1, "John Doe", "johndoe@email.com", "premium", "2026-07-01");

        const result = premiumMember.canBorrow();
        expect(result).toBe(true);
    });
    test("should allow premium member to borrow more than 5 books", () => {
        const premiumMember = new PremiumMember(1, "John Doe", "johndoe@email.com", "premium", "2026-07-01");

        premiumMember.borrowedBooks = [
            "ISBN1",
            "ISBN2",
            "ISBN3",
            "ISBN4",
            "ISBN5",
            "ISBN6",
            "ISBN6"
        ];
        expect(premiumMember.canBorrow()).toBe(true);
    });
    test("should return false when premium member borrows 10 books", () => {
        const premiumMember = new PremiumMember(1, "John Doe", "johndoe@email.com", "premium", "2026-07-01");

        premiumMember.borrowedBooks = [
            "ISBN1",
            "ISBN2",
            "ISBN3",
            "ISBN4",
            "ISBN5",
            "ISBN6",
            "ISBN7",
            "ISBN8",
            "ISBN9",
            "ISBN10"
        ];
        expect(premiumMember.canBorrow()).toBe(false);
    });

    test("premium members can reserve books", () => {
        const member = new PremiumMember(
            "001",
            "Jane",
            "jane@email.com"
        );

        expect(member.canReserve()).toBe(true);
    });

    test("should override the canBorrowEbook method", () => {
        const premiumMember = new PremiumMember(1, "John Doe", "johndoe@email.com", "premium", "2026-07-01");

        const result = premiumMember.canBorrowEbook();
        expect(result).toBe(true);
    });
    test("should allow a premium member to download more than the standard limit", () => {
        const premiumMember = new PremiumMember(
            1,
            "John Doe",
            "johndoe@email.com",
            "2026-07-01"
        );

        premiumMember.downloadedBooks = [
            "ISBN1",
            "ISBN2",
            "ISBN3",
            "ISBN4",
            "ISBN5",
            "ISBN6",
            "ISBN7",
            "ISBN8",
            "ISBN9",
            "ISBN10"
        ];

        expect(premiumMember.canBorrowEbook()).toBe(true);
    });
    test("should not allow a premium member to download more than 15 ebooks", () => {
        const premiumMember = new PremiumMember(
            1,
            "John Doe",
            "johndoe@email.com",
            "2026-07-01"
        );

        premiumMember.downloadedBooks = [
            "ISBN1",
            "ISBN2",
            "ISBN3",
            "ISBN4",
            "ISBN5",
            "ISBN6",
            "ISBN7",
            "ISBN8",
            "ISBN9",
            "ISBN10",
            "ISBN11",
            "ISBN12",
            "ISBN13",
            "ISBN14",
            "ISBN15"
        ];

        expect(premiumMember.canBorrowEbook()).toBe(false);
    });

    test("should waiver late fees for premium members", () => {
        const premiumMember = new PremiumMember(1, "John Doe", "johndoe@email.com", "2026-07-01");

        expect(premiumMember.calculateTotalLateFees(0)).toBe(0);
        expect(premiumMember.calculateTotalLateFees(5)).toBe(0);
        expect(premiumMember.calculateTotalLateFees(100)).toBe(0);
    });
});

describe('Library Functions', () => {
    // Missing: beforeEach to initialize test data
    beforeEach(() => {
        books.length = 0;
        members.length = 0;

        books.push(
            new Book("978-0-123", "Things Fall Apart", "Chinua Achebe", 1958, 3),
            new Book("978-0-456", "Americanah", "Chimamanda Ngozi Adichie", 2013, 2),
            new Book("978-0-789", "No Longer at Ease", "Chinua Achebe", 1960, 4)
        );
        members.push(
            new Member("001", "John", "john@email.com", "standard"),
            new PremiumMember("002", "Jane", "jane@email.com")
        );
    });

    test("findBookByISBN returns book", () => {
        const book = findBookByISBN("978-0-123");

        expect(book).not.toBeNull();
        expect(book.title).toBe("Things Fall Apart");
    });

    test("should return null when ISBN is not found", () => {
        expect(findBookByISBN("ISBN999")).toBeNull();
    });

    test("should return all books by an author", () => {
        const result = getBooksByAuthor("Chinua Achebe");

        expect(result).toHaveLength(2);
    });

    test("should return an empty array when author has no books", () => {
        expect(getBooksByAuthor("J.K. Rowling")).toEqual([]);
    });
});

describe("Array Operations", () => {

    test("should calculate total late fees using reduce", () => {

        const memberRecord = {
            overdueBooks: [
                { daysLate: 2 },
                { daysLate: 3 }
            ]
        };

        expect(calculateTotalLateFees(memberRecord)).toBe(2.5);
    });

    test("should combine book collections using spread", () => {

        const fiction = ["Book 1"];
        const nonFiction = ["Book 2"];
        const reference = ["Book 3"];

        expect(
            combineBookCollections(fiction, nonFiction, reference)
        ).toEqual(["Book 1", "Book 2", "Book 3"]);

    });

    test("should add multiple books using rest parameters", () => {

        books.length = 0;

        const book1 = new Book("ISBN1", "Book 1", "Author", 2020, 2);
        const book2 = new Book("ISBN2", "Book 2", "Author", 2021, 2);

        addMultipleBooks(book1, book2);

        expect(books).toHaveLength(2);

    });

});

describe("Recursive Functions", () => {

    const library = [
        {
            title: "Book 1",
            category: "fiction"
        },
        {
            title: "Book 2",
            category: "reference"
        },
        {
            title: "Book 3",
            category: "fiction"
        }
    ];

    test("should return books in the selected category", () => {

        const result = searchBooksByCategory(library, "fiction");

        expect(result).toHaveLength(2);

    });

    test("should return an empty array for an empty book list", () => {

        expect(
            searchBooksByCategory([], "fiction")
        ).toEqual([]);

    });

    test("should return an empty array for null input", () => {

        expect(
            searchBooksByCategory(null, "fiction")
        ).toEqual([]);

    });

});

describe("Error Handling", () => {

    test("should return false for null memberId", () => {
        expect(borrowBook(null, "ISBN1")).toEqual({
            message: "Please enter both a Member ID and an ISBN.",
            success: false
        });
    });

    test("should return false for null ISBN", () => {
        expect(borrowBook("001", null)).toEqual({
            message: "Please enter both a Member ID and an ISBN.",
            success: false
        });
    });

    test("should return null for invalid fine input", () => {
        expect(calculateFineAmount("five")).toBeNull();
    });

    test("should return null for NaN", () => {
        expect(calculateFineAmount(NaN)).toBeNull();
    });

});

describe("String Operations", () => {

    test("should format book information correctly", () => {

        const book = new Book(
            "ISBN1",
            "  Things Fall Apart  ",
            " Chinua Achebe ",
            1958,
            3
        );

        const result = formatBookInfo(book);

        expect(result).toContain("THINGS FALL APART");
        expect(result).toContain("Chinua Achebe");
        expect(result).toContain("1958");

    });

});

describe("Math Operations", () => {

    test("should calculate the correct fine amount", () => {
        expect(calculateFineAmount(5)).toBe("2.50");
    });

    test("should return a string formatted to two decimal places", () => {
        expect(typeof calculateFineAmount(5)).toBe("string");
    });

    test("should return null for NaN", () => {
        expect(calculateFineAmount(NaN)).toBeNull();
    });

    test("should return null for null", () => {
        expect(calculateFineAmount(null)).toBeNull();
    });

    test("should return null for undefined", () => {
        expect(calculateFineAmount(undefined)).toBeNull();
    });

    test("should return null for invalid type", () => {
        expect(calculateFineAmount("5")).toBeNull();
    });

    test("should calculate a negative fine", () => {
        expect(calculateFineAmount(-2)).toBe("-1.00");
    });
});

describe("LibraryStats", () => {
    beforeEach(() => {
        books.length = 0;
        members.length = 0;

        const book1 = new Book("ISBN1", "Book One", "Author A", 2020, 3);
        const book2 = new Book("ISBN2", "Book Two", "Author B", 2021, 2);

        // Use the actual method
        book1.checkOut("001");
        book2.checkOut("001");
        book2.checkOut("002");

        books.push(book1, book2);

        members.push(
            new Member("001", "John", "john@email.com", "standard"),
            new Member("002", "Jane", "jane@email.com", "premium")
        );

        LibraryStats.updateStats();
    });

    test("should update library statistics", () => {
        expect(LibraryStats.totalBooks).toBe(2);
        expect(LibraryStats.totalMembers).toBe(2);
        expect(LibraryStats.totalBorrowings).toBe(3);
    });

    test("should calculate average borrowings per member", () => {
        expect(LibraryStats.getAverageBorrowings()).toBe(2);
    });

    test("should return 0 when there are no members", () => {
        members.length = 0;

        LibraryStats.updateStats();

        expect(LibraryStats.getAverageBorrowings()).toBe(0);
    });

    test("should count available books", () => {
        expect(LibraryStats.countAvailableBooks()).toBe(2);
    }); // Failing

    test("should return a statistics object", () => {
        expect(LibraryStats.getStatistics()).toEqual({
            totalBooks: 2,
            totalMembers: 2,
            totalBorrowings: 3
        });
    });

    test("should return the most popular book", () => {
        const result = LibraryStats.getMostPopularBook();

        expect(result.title).toBe("Book Two");
    });

    test("should return null when there are no books", () => {
        books.length = 0;

        expect(LibraryStats.getMostPopularBook()).toBeNull();
    });
});

describe("initializeUI", () => {

    test("should log an error when required elements are missing", () => {

        document.body.innerHTML = "";

        const errorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        initializeUI();

        expect(errorSpy).toHaveBeenCalledWith(
            "UI elements not found."
        );

        errorSpy.mockRestore();

    });

    

});

describe('DOM Manipulation', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <input id="search">
            <select id="filter-category"></select>
            <div id="catalogue-list"></div>
            <div id="book-details"></div>
        `;
    });

    test("should render all books", () => {

        const testBooks = [
            {
                isbn: "1",
                title: "Book One",
                author: "Author One",
                category: "fiction",
                type: "physical",
                availableCopies: 3
            },
            {
                isbn: "2",
                title: "Book Two",
                author: "Author Two",
                category: "reference",
                type: "ebook",
                availableCopies: Infinity
            }
        ];

        renderBookCatalogue(testBooks);

        const cards = document.querySelectorAll(".book-card");

        expect(cards.length).toBe(2);
    });

    test("should display the correct title", () => {

        const testBooks = [{
            isbn: "1",
            title: "Things Fall Apart",
            author: "Achebe",
            category: "fiction",
            type: "physical",
            availableCopies: 2
        }];

        renderBookCatalogue(testBooks);

        expect(document.body.textContent)
            .toContain("Things Fall Apart");

    });

    test("should display the author", () => {

        const testBooks = [{
            isbn: "1",
            title: "Atomic Habits",
            author: "James Clear",
            category: "non-fiction",
            type: "physical",
            availableCopies: 4
        }];

        renderBookCatalogue(testBooks);

        expect(document.body.textContent)
            .toContain("James Clear");

    });

    test("should capitalize the category", () => {

        const testBooks = [{
            isbn: "1",
            title: "Book",
            author: "Author",
            category: "fiction",
            type: "physical",
            availableCopies: 3
        }];

        renderBookCatalogue(testBooks);

        expect(document.body.textContent)
            .toContain("Fiction");

    });

    test("should capitalize the book type", () => {

        const testBooks = [{
            isbn: "1",
            title: "Book",
            author: "Author",
            category: "fiction",
            type: "ebook",
            availableCopies: Infinity
        }];

        renderBookCatalogue(testBooks);

        expect(document.body.textContent)
            .toContain("Ebook");

    });

});

describe("JSON Operations", () => {

    beforeEach(() => {
        books.length = 0;
        members.length = 0;

        books.push(
            new Book(
                "978-0-123",
                "Test Book",
                "Test Author",
                2024,
                3,
                "fiction",
                "physical"
            )
        );

        members.push(
            new Member(
                "001",
                "John Doe",
                "john@test.com",
                "standard"
            )
        );
    });

    test("should export library data as a JSON string", () => {
        const json = exportLibraryData();

        expect(typeof json).toBe("string");
    });

    test("should export books and members", () => {
        const json = exportLibraryData();
        const data = JSON.parse(json);

        expect(data.books.length).toBe(1);
        expect(data.members.length).toBe(1);

        expect(data.books[0].title).toBe("Test Book");
        expect(data.members[0].name).toBe("John Doe");
    });

    test("should import library data", () => {

        const json = JSON.stringify({
            books: [
                {
                    isbn: "111",
                    title: "Imported Book",
                    author: "Author",
                    year: 2025,
                    availableCopies: 2,
                    totalCopies: 2,
                    category: "fiction",
                    type: "physical",
                    checkedOut: [],
                    reservationQueue: []
                }
            ],
            members: [
                {
                    id: "002",
                    name: "Jane Doe",
                    email: "jane@test.com",
                    membershipType: "standard",
                    borrowedBooks: [],
                    downloadedBooks: []
                }
            ]
        });

        importLibraryData(json);

        expect(books.length).toBe(1);
        expect(members.length).toBe(1);

        expect(books[0].title).toBe("Imported Book");
        expect(members[0].name).toBe("Jane Doe");
    });

    test("should log an error for invalid JSON", () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        importLibraryData("{invalid json}");

        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

});

describe("LocalStorage", () => {

    beforeEach(() => {
        localStorage.clear();

        books.length = 0;
        members.length = 0;

        books.push(
            new Book(
                "978-0-123",
                "Test Book",
                "Test Author",
                2024,
                3,
                "fiction",
                "physical"
            )
        );

        members.push(
            new Member(
                "001",
                "John Doe",
                "john@test.com",
                "standard"
            )
        );
    });

    test("should save books to localStorage", () => {
        saveToLocalStorage();

        const savedBooks = JSON.parse(
            localStorage.getItem("libraryBooks")
        );

        expect(savedBooks).toHaveLength(1);
        expect(savedBooks[0].title).toBe("Test Book");
    });

    test("should save members to localStorage", () => {
        saveToLocalStorage();

        const savedMembers = JSON.parse(
            localStorage.getItem("libraryMembers")
        );

        expect(savedMembers).toHaveLength(1);
        expect(savedMembers[0].name).toBe("John Doe");
    });

    test("should load books and members from localStorage", () => {

        saveToLocalStorage();

        books.length = 0;
        members.length = 0;

        loadFromLocalStorage();

        expect(books).toHaveLength(1);
        expect(members).toHaveLength(1);

        expect(books[0].title).toBe("Test Book");
        expect(members[0].name).toBe("John Doe");
    });

    test("should handle empty localStorage", () => {

        localStorage.clear();

        expect(() => loadFromLocalStorage()).not.toThrow();
    });

});

describe("displayBookDetails", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="book-details"></div>
        `;

        books.length = 0;

        books.push(
            new Book(
                "123",
                "Atomic Habits",
                "James Clear",
                2018,
                5,
                "non-fiction",
                "physical"
            )
        );
    });

    test("should display the selected book title", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("Atomic Habits");
    });

    test("should display the author", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("James Clear");
    });

    test("should display the ISBN", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("123");
    });

    test("should display the year", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("2018");
    });

    test("should not throw when book is not found", () => {
        expect(() => displayBookDetails("999")).not.toThrow();
    });
});

describe("displayBookDetails", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="book-details"></div>
        `;

        books.length = 0;

        books.push(
            new Book(
                "123",
                "Atomic Habits",
                "James Clear",
                2018,
                5,
                "non-fiction",
                "physical"
            )
        );
    });

    test("should display the book title", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("Atomic Habits");
    });

    test("should display the author", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("James Clear");
    });

    test("should display the ISBN", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("123");
    });

    test("should display the publication year", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("2018");
    });

    test("should display the capitalized type", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("Physical");
    });

    test("should display the capitalized category", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("Non-fiction");
    });

    test("should display available copies", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("5");
    });

    test("should display total copies", () => {
        displayBookDetails("123");

        expect(document.getElementById("book-details").textContent)
            .toContain("5");
    });

    test("should do nothing if the book does not exist", () => {
        displayBookDetails("999");

        expect(document.getElementById("book-details").innerHTML)
            .toBe("");
    });

});

describe("updateStatisticsDisplay", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <p id="total-books"></p>
            <p id="total-members"></p>
            <p id="books-borrowed"></p>
        `;

        books.length = 0;
        members.length = 0;

        books.push(
            new Book(
                "111",
                "Book One",
                "Author One",
                2024,
                3,
                "fiction",
                "physical"
            )
        );

        books.push(
            new Book(
                "222",
                "Book Two",
                "Author Two",
                2023,
                2,
                "reference",
                "physical"
            )
        );

        members.push(
            new Member(
                "001",
                "John Doe",
                "john@test.com",
                "standard"
            )
        );
    });

    test("should display the total number of books", () => {
        updateStatisticsDisplay();

        expect(document.getElementById("total-books").textContent)
            .toBe("2");
    });

    test("should display the total number of members", () => {
        updateStatisticsDisplay();

        expect(document.getElementById("total-members").textContent)
            .toBe("1");
    });

    test("should display zero borrowed books initially", () => {
        updateStatisticsDisplay();

        expect(document.getElementById("books-borrowed").textContent)
            .toBe("0");
    });

    test("should update borrowed books after a checkout", () => {
        books[0].checkOut("001");

        updateStatisticsDisplay();

        expect(document.getElementById("books-borrowed").textContent)
            .toBe("1");
    });

    test("should do nothing if statistic elements are missing", () => {
        document.body.innerHTML = "";

        expect(() => updateStatisticsDisplay()).not.toThrow();
    });

});

describe("renderMemberList", () => {

    beforeEach(() => {

        document.body.innerHTML = `
            <div id="member-list"></div>
        `;

        members.length = 0;

    });

    test("should render no member cards when the list is empty", () => {

        renderMemberList();

        const container = document.getElementById("member-list");

        expect(container.children.length).toBe(0);

    });

    test("should render one standard member", () => {

        members.push(
            new Member(
                "001",
                "John Doe",
                "john@test.com",
                "standard"
            )
        );

        renderMemberList();

        const container = document.getElementById("member-list");

        expect(container.children.length).toBe(1);

        expect(container.innerHTML)
            .toContain("John Doe");

        expect(container.innerHTML)
            .toContain("john@test.com");

        expect(container.innerHTML)
            .toContain("standard");

    });

    test("should render one premium member", () => {

        members.push(
            new PremiumMember(
                "002",
                "Jane Doe",
                "jane@test.com",
                "premium"
            )
        );

        renderMemberList();

        const container = document.getElementById("member-list");

        expect(container.children.length).toBe(1);

        expect(container.innerHTML)
            .toContain("Jane Doe");

        expect(container.innerHTML)
            .toContain("premium");

    });

    test("should render multiple members", () => {

        members.push(
            new Member(
                "001",
                "John",
                "john@test.com",
                "standard"
            )
        );

        members.push(
            new PremiumMember(
                "002",
                "Jane",
                "jane@test.com",
                "premium"
            )
        );

        renderMemberList();

        const container = document.getElementById("member-list");

        expect(container.children.length).toBe(2);

        expect(container.innerHTML)
            .toContain("John");

        expect(container.innerHTML)
            .toContain("Jane");

    });

    // test("should display borrowed books count", () => {

    //     const member = new Member(
    //         "001",
    //         "John",
    //         "john@test.com",
    //         "standard"
    //     );

    //     member.borrowedBooks.push("123");
    //     member.borrowedBooks.push("456");

    //     members.push(member);

    //     renderMemberList();

    //     const container = document.getElementById("member-list");

    //     expect(container.innerHTML)
    //         .toContain("2");

    // });

    test("should not throw when member-list container does not exist", () => {

        document.body.innerHTML = "";

        expect(() => renderMemberList())
            .not.toThrow();

    });

});

describe("handleBookClick", () => {

    beforeEach(() => {

        document.body.innerHTML = `
            <div id="book-details"></div>

            <div class="book-card" data-isbn="123">
                <h3 id="title">Test Book</h3>
            </div>

            <div id="outside"></div>
        `;

        books.length = 0;

        books.push(
            new Book(
                "123",
                "Test Book",
                "Author",
                2024,
                2,
                "fiction",
                "physical"
            )
        );

    });

    test("should display book details when clicking the book card", () => {

        handleBookClick({
            target: document.querySelector(".book-card")
        });

        expect(
            document.getElementById("book-details").innerHTML
        ).toContain("Test Book");

    });

    test("should display book details when clicking a child element", () => {

        handleBookClick({
            target: document.getElementById("title")
        });

        expect(
            document.getElementById("book-details").innerHTML
        ).toContain("Test Book");

    });

    test("should do nothing when clicking outside a book card", () => {

        handleBookClick({
            target: document.getElementById("outside")
        });

        expect(
            document.getElementById("book-details").innerHTML
        ).toBe("");

    });

    test("should do nothing if the ISBN does not exist", () => {

        document.querySelector(".book-card").dataset.isbn = "999";

        handleBookClick({
            target: document.querySelector(".book-card")
        });

        expect(
            document.getElementById("book-details").innerHTML
        ).toBe("");

    });

});

describe("handleFilterChange", () => {

    beforeEach(() => {

        document.body.innerHTML = `
            <div id="catalogue-list"></div>
        `;

        books.length = 0;

        books.push(
            new Book(
                "111",
                "Things Fall Apart",
                "Chinua Achebe",
                1958,
                2,
                "fiction",
                "physical"
            )
        );

        books.push(
            new Book(
                "222",
                "Sapiens",
                "Yuval Noah Harari",
                2011,
                2,
                "non-fiction",
                "physical"
            )
        );

        books.push(
            new Book(
                "333",
                "Clean Code",
                "Robert C. Martin",
                2008,
                2,
                "reference",
                "physical"
            )
        );

    });

    test("should display all books", () => {

        handleFilterChange({
            target: {
                value: "all"
            }
        });

        expect(document.querySelectorAll(".book-card").length)
            .toBe(3);

    });

    test("should filter fiction books", () => {

        handleFilterChange({
            target: {
                value: "fiction"
            }
        });

        const catalogue = document.getElementById("catalogue-list");

        expect(catalogue.innerHTML)
            .toContain("Things Fall Apart");

        expect(document.querySelectorAll(".book-card").length)
            .toBe(1);

    });

    test("should filter non-fiction books", () => {

        handleFilterChange({
            target: {
                value: "non-fiction"
            }
        });

        const catalogue = document.getElementById("catalogue-list");

        expect(catalogue.innerHTML)
            .toContain("Sapiens");

        expect(document.querySelectorAll(".book-card").length)
            .toBe(1);

    });

    test("should filter reference books", () => {

        handleFilterChange({
            target: {
                value: "reference"
            }
        });

        const catalogue = document.getElementById("catalogue-list");

        expect(catalogue.innerHTML)
            .toContain("Clean Code");

        expect(document.querySelectorAll(".book-card").length)
            .toBe(1);

    });

    test("should render no books for an invalid category", () => {

        handleFilterChange({
            target: {
                value: "history"
            }
        });

        expect(document.querySelectorAll(".book-card").length)
            .toBe(0);

    });

});

describe("loadCatalogue", () => {

    beforeEach(() => {

        document.body.innerHTML = `
            <div id="catalogue-list"></div>
        `;

        books.length = 0;

        global.fetch = jest.fn();

    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should load physical books", async () => {

        fetch.mockResolvedValue({
            json: async () => ({
                books: [
                    {
                        isbn: "111",
                        title: "Things Fall Apart",
                        author: "Achebe",
                        year: 1958,
                        copies: 3,
                        category: "fiction",
                        type: "physical"
                    }
                ]
            })
        });

        await loadCatalogue();

        expect(fetch)
            .toHaveBeenCalledWith("../data/books.json");

        expect(books.length)
            .toBe(1);

        expect(books[0])
            .toBeInstanceOf(Book);

        expect(books[0].title)
            .toBe("Things Fall Apart");

    });

    test("should load digital books", async () => {

        fetch.mockResolvedValue({
            json: async () => ({
                books: [
                    {
                        isbn: "222",
                        title: "Clean Code",
                        author: "Robert Martin",
                        year: 2008,
                        category: "reference",
                        type: "digital",
                        fileSize: "5MB",
                        format: "PDF"
                    }
                ]
            })
        });

        await loadCatalogue();

        expect(books.length)
            .toBe(1);

        expect(books[0])
            .toBeInstanceOf(DigitalBook);

        expect(books[0].fileSize)
            .toBe("5MB");

        expect(books[0].format)
            .toBe("PDF");

    });

    test("should load both physical and digital books", async () => {

        fetch.mockResolvedValue({
            json: async () => ({
                books: [
                    {
                        isbn: "111",
                        title: "Book One",
                        author: "Author",
                        year: 2024,
                        copies: 2,
                        category: "fiction",
                        type: "physical"
                    },
                    {
                        isbn: "222",
                        title: "Book Two",
                        author: "Author",
                        year: 2024,
                        category: "reference",
                        type: "digital",
                        fileSize: "8MB",
                        format: "EPUB"
                    }
                ]
            })
        });

        await loadCatalogue();

        expect(books.length)
            .toBe(2);

        expect(books[0])
            .toBeInstanceOf(Book);

        expect(books[1])
            .toBeInstanceOf(DigitalBook);

    });

    test("should render the catalogue after loading", async () => {

        fetch.mockResolvedValue({
            json: async () => ({
                books: [
                    {
                        isbn: "111",
                        title: "Rendered Book",
                        author: "Author",
                        year: 2024,
                        copies: 2,
                        category: "fiction",
                        type: "physical"
                    }
                ]
            })
        });

        await loadCatalogue();

        expect(document.getElementById("catalogue-list").innerHTML)
            .toContain("Rendered Book");

    });

    test("should handle fetch errors", async () => {

        const errorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});

        fetch.mockRejectedValue(new Error("Network Error"));

        await loadCatalogue();

        expect(errorSpy)
            .toHaveBeenCalled();

    });

});

describe("setupEventListeners", () => {

    beforeEach(() => {

        document.body.innerHTML = `
            <input id="search">

            <select id="filter-category">
                <option value="all">All</option>
            </select>

            <div id="catalogue-list"></div>

            <form id="borrow-form"></form>

            <button id="catalogue-tab"></button>
            <button id="members-tab"></button>
            <button id="statistics-tab"></button>

            <div id="member-form"></div>
            <div id="member-list"></div>

            <section id="catalogue-section"></section>
            <section id="members-section"></section>
            <section id="statistics-section"></section>

            <div id="book-details"></div>

            <p id="total-books"></p>
            <p id="total-members"></p>
            <p id="books-borrowed"></p>
        `;

        jest.spyOn(global, "fetch").mockResolvedValue({
            json: async () => ({ books: [] })
        });

    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should initialize without throwing", async () => {

        await initializeUI();

        expect(document.getElementById("search")).not.toBeNull();

    });

    test("should attach the search listener", async () => {

        const spy = jest.spyOn(
            HTMLInputElement.prototype,
            "addEventListener"
        );

        await initializeUI();

        expect(spy).toHaveBeenCalledWith(
            "input",
            handleSearch
        );

    });

    test("should attach the category filter listener", async () => {

        const spy = jest.spyOn(
            HTMLSelectElement.prototype,
            "addEventListener"
        );

        await initializeUI();

        expect(spy).toHaveBeenCalledWith(
            "change",
            handleFilterChange
        );

    });

    test("should attach the borrow form listener", async () => {

        const spy = jest.spyOn(
            HTMLFormElement.prototype,
            "addEventListener"
        );

        await initializeUI();

        expect(spy).toHaveBeenCalledWith(
            "submit",
            handleBorrowSubmit
        );

    });

    test("should attach the catalogue click listener", async () => {

        const spy = jest.spyOn(
            HTMLDivElement.prototype,
            "addEventListener"
        );

        await initializeUI();

        expect(spy).toHaveBeenCalledWith(
            "click",
            handleBookClick
        );

    });

    test("should attach navigation listeners", async () => {

        const spy = jest.spyOn(
            HTMLButtonElement.prototype,
            "addEventListener"
        );

        await initializeUI();

        expect(spy).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );

    });

});

describe("handleBorrowSubmit", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="message-box" class="hidden"></div>

            <form id="borrow-form">
                <input id="member-id">
                <input id="isbn">

                <div id="catalogue-list"></div>

                <p id="total-books"></p>
                <p id="total-members"></p>
                <p id="books-borrowed"></p>
            </form>
        `;

        books.length = 0;
        members.length = 0;

        books.push(
            new Book(
                "123",
                "Test Book",
                "Author",
                2024,
                2,
                "fiction",
                "physical"
            )
        );

        members.push(
            new Member(
                "001",
                "John",
                "john@test.com",
                "standard"
            )
        );
    });

    test("should call preventDefault", () => {

        const event = {
            preventDefault: jest.fn(),
            target: document.getElementById("borrow-form")
        };

        handleBorrowSubmit(event);

        expect(event.preventDefault).toHaveBeenCalled();

    });

    test("should show an error when inputs are empty", () => {

        const event = {
            preventDefault: jest.fn(),
            target: document.getElementById("borrow-form")
        };

        handleBorrowSubmit(event);

        const messageBox = document.getElementById("message-box");

        expect(messageBox.textContent)
            .toBe("Please enter both Member ID and ISBN.");

        expect(messageBox.className)
            .toContain("error");

    });

    test("should show member not found", () => {

        document.getElementById("member-id").value = "999";
        document.getElementById("isbn").value = "123";

        const event = {
            preventDefault: jest.fn(),
            target: document.getElementById("borrow-form")
        };

        handleBorrowSubmit(event);

        const messageBox = document.getElementById("message-box");

        expect(messageBox.textContent)
            .toBe("Member '999' does not exist.");

        expect(messageBox.className)
            .toContain("error");

    });

    test("should show book not found", () => {

        document.getElementById("member-id").value = "001";
        document.getElementById("isbn").value = "999";

        const event = {
            preventDefault: jest.fn(),
            target: document.getElementById("borrow-form")
        };

        handleBorrowSubmit(event);

        const messageBox = document.getElementById("message-box");

        expect(messageBox.textContent)
            .toBe("Book with ISBN '999' was not found.");

        expect(messageBox.className)
            .toContain("error");

    });

    test("should show a success message when borrowing succeeds", () => {

        document.getElementById("member-id").value = "001";
        document.getElementById("isbn").value = "123";

        const event = {
            preventDefault: jest.fn(),
            target: document.getElementById("borrow-form")
        };

        handleBorrowSubmit(event);

        const messageBox = document.getElementById("message-box");

        expect(messageBox.textContent)
            .toBe("\"Test Book\" has been borrowed successfully.");

        expect(messageBox.className)
            .toContain("success");

    });

});

describe("showMessage", () => {

    beforeEach(() => {
        jest.useFakeTimers();

        document.body.innerHTML = `
            <div id="message-box" class="hidden"></div>
        `;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("should display a success message", () => {

        showMessage("Book borrowed successfully!", "success");

        const messageBox = document.getElementById("message-box");

        expect(messageBox.textContent)
            .toBe("Book borrowed successfully!");

        expect(messageBox.className)
            .toContain("success");

        expect(messageBox.classList.contains("hidden"))
            .toBe(false);

    });

    test("should display an error message", () => {

        showMessage("Member not found.", "error");

        const messageBox = document.getElementById("message-box");

        expect(messageBox.textContent)
            .toBe("Member not found.");

        expect(messageBox.className)
            .toContain("error");

    });

    test("should use info as the default type", () => {

        showMessage("Welcome!");

        const messageBox = document.getElementById("message-box");

        expect(messageBox.textContent)
            .toBe("Welcome!");

        expect(messageBox.className)
            .toContain("info");

    });

    test("should hide the message after 5 seconds", () => {

        showMessage("Temporary message", "success");

        const messageBox = document.getElementById("message-box");

        expect(messageBox.classList.contains("hidden"))
            .toBe(false);

        jest.advanceTimersByTime(5000);

        expect(messageBox.classList.contains("hidden"))
            .toBe(true);

    });

    test("should do nothing if the message box does not exist", () => {

        document.body.innerHTML = "";

        expect(() => {
            showMessage("Hello");
        }).not.toThrow();

    });

});

describe("createMemberForm", () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="message-box" class="hidden"></div>
            <div id="member-form"></div>

            <p id="total-books"></p>
            <p id="total-members"></p>
            <p id="books-borrowed"></p>
        `;

        members.length = 0;
        books.length = 0;
    });

    test("should render the member form", () => {

        createMemberForm();

        expect(document.getElementById("new-member-form"))
            .not.toBeNull();

    });

    test("should create all form fields", () => {

        createMemberForm();

        expect(document.getElementById("name")).not.toBeNull();
        expect(document.getElementById("email")).not.toBeNull();
        expect(document.getElementById("membership-type")).not.toBeNull();

    });

    test("should create a submit button", () => {

        createMemberForm();

        const button = document.querySelector("button[type='submit']");

        expect(button).not.toBeNull();
        expect(button.textContent).toBe("Add Member");

    });

    test("should require all fields", () => {

        createMemberForm();

        document.getElementById("name").value = "";
        document.getElementById("email").value = "";

        document
            .getElementById("new-member-form")
            .dispatchEvent(
                new Event("submit", {
                    bubbles: true,
                    cancelable: true
                })
            );

        const messageBox = document.getElementById("message-box");

        expect(messageBox.textContent)
            .toBe("Please complete all fields.");

        expect(messageBox.className)
            .toContain("error");

    });

    test("should create a standard member", () => {

        createMemberForm();

        document.getElementById("name").value = "John";
        document.getElementById("email").value = "john@test.com";
        document.getElementById("membership-type").value = "standard";

        document
            .getElementById("new-member-form")
            .dispatchEvent(
                new Event("submit", {
                    bubbles: true,
                    cancelable: true
                })
            );

        expect(members.length).toBe(1);
        expect(members[0]).toBeInstanceOf(Member);

        const messageBox = document.getElementById("message-box");

        expect(messageBox.innerHTML)
            .toContain("Member added successfully!");

        expect(messageBox.innerHTML)
            .toContain("Member ID: 001");

        expect(messageBox.innerHTML)
            .toContain("Name: John");

        expect(messageBox.innerHTML)
            .toContain("Membership: standard");

        expect(messageBox.className)
            .toContain("success");

    });

    test("should create a premium member", () => {

        createMemberForm();

        document.getElementById("name").value = "Jane";
        document.getElementById("email").value = "jane@test.com";
        document.getElementById("membership-type").value = "premium";

        document
            .getElementById("new-member-form")
            .dispatchEvent(
                new Event("submit", {
                    bubbles: true,
                    cancelable: true
                })
            );

        expect(members.length).toBe(1);
        expect(members[0]).toBeInstanceOf(PremiumMember);

        const messageBox = document.getElementById("message-box");

        expect(messageBox.innerHTML)
            .toContain("Member added successfully!");

        expect(messageBox.innerHTML)
            .toContain("Member ID: 001");

        expect(messageBox.innerHTML)
            .toContain("Name: Jane");

        expect(messageBox.innerHTML)
            .toContain("Membership: premium");

        expect(messageBox.className)
            .toContain("success");

    });

});
