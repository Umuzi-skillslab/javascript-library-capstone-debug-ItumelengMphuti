import { jest } from '@jest/globals'

import { Book, DigitalBook, Member } from '../src/library.js';

describe('Book Class', () => {
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

        expect(result).toBe(true);
        expect(book.availableCopies).toBe(1);
        expect(book.checkedOut).toContain("001");
    });
    test("should allow multpiple members to checkout copies", () => {
        const book = new Book("978-0-3856-6052-4", "Fake Book", "John Doe", 2009, 3);
        book.checkOut("001");
        book.checkOut("002");

        expect(book.availableCopies).toBe(1);
        expect(book.checkedOut).toEqual(["001", "002"]);
    });

    test("should not allow checkout when no copies are available", () => {
        const book = new Book("978-0-7432-7357-2", "Fake Book", "John Doe", 2006, 1);
        book.checkOut("001");
        const result = book.checkOut("002");

        expect(result).toBe(false);
        expect(book.availableCopies).toBe(0);
        expect(book.checkedOut).toEqual(["001"]);
    });
    test("should return a checked out book", () => {
        const book = new Book("978-0-7432-7357-2", "Fake Book", "John Doe", 2006, 2);

        book.checkOut("001");

        const result = book.returnBook("001");

        expect(result).toBe(true);
        expect(book.availableCopies).toBe(2);
        expect(book.checkedOut).toEqual([]);
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
        const ebook = new DigitalBook("978-0-7432-7357-2", "Book", "Jane Doe", 2024, "5MB", "PDF");
        expect(ebook.isbn).toBe("978-0-7432-7357-2");
        expect(ebook.title).toBe("Book");
        expect(ebook.author).toBe("Jane Doe");
        expect(ebook.year).toBe(2024);
        expect(ebook.fileSize).toBe("5MB");
        expect(ebook.format).toBe("PDF");
    });
    test("should initialize DigitalBook properties", () => {
        const ebook = new DigitalBook("978-0-7432-7357-2", "Book", "Jane Doe", 2024, "5MB", "PDF");
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
});

describe('PremiumMember Class', () => {
    // Missing: all tests for premium member
    // Missing: test for inheritance
    // Missing: test for overridden methods
});

describe('Library Functions', () => {
    // Missing: beforeEach to initialize test data

    test('findBookByISBN returns book', () => {
        // Test data not set up properly
        var book = findBookByISBN('978-0-123');

        // Will fail - no books in array
        expect(book).toBeDefined();
    });

    // Missing: test for getBooksByAuthor
    // Missing: test with empty arrays
    // Missing: test with null/undefined inputs
});

describe('Array Operations', () => {
    // Missing: tests for filter operations
    // Missing: tests for map operations
    // Missing: tests for reduce operations
    // Missing: tests for spread operator
    // Missing: tests for rest parameters
});

describe('Recursive Functions', () => {
    // Missing: test for searchBooksByCategory
    // Missing: test for base case
    // Missing: test for stack overflow prevention
});

describe('Error Handling', () => {
    // Missing: tests for try-catch blocks
    // Missing: tests for undefined/null handling
    // Missing: tests for type checking
});

describe('String Operations', () => {
    // Missing: tests for formatBookInfo
    // Missing: tests for template literals
    // Missing: tests for string methods
});

describe('Math Operations', () => {
    test('calculateFineAmount returns number', () => {
        var fine = calculateFineAmount(5);

        expect(typeof fine).toBe('number');
        // Missing: test for correct calculation
        // Missing: test for toFixed/rounding
    });

    // Missing: test for NaN handling
    // Missing: test for negative numbers
});

describe('DOM Manipulation', () => {
    // Missing: DOM setup with jsdom
    // Missing: tests for event handlers
    // Missing: tests for renderBookCatalogue
    // Missing: tests for search functionality
});

describe('JSON Operations', () => {
    // Missing: tests for JSON.stringify
    // Missing: tests for JSON.parse
    // Missing: tests for error handling in JSON operations
});

describe('LocalStorage', () => {
    // Missing: localStorage mock
    // Missing: tests for save functionality
    // Missing: tests for load functionality
    // Missing: tests for error handling
});

// Missing: describe blocks for:
// - Nested loops
// - For-of loops
// - Destructuring
// - Scope testing (var, let, const)
// - Module exports/imports
