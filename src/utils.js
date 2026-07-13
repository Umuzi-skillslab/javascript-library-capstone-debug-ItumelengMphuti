let messageTimeout;

export function showMessage(message, type = "info", elementId = "message-box") {
  if (typeof message !== "string") {
    return;
  }

  if (typeof type !== "string") {
    type = "info";
  }

  if (typeof elementId !== "string") {
    return;
  }

  const messageBox = document.getElementById(elementId);

  if (!messageBox) return;

  clearTimeout(messageTimeout);

  messageBox.innerHTML = message;
  messageBox.className = type;
  messageBox.classList.remove("hidden");

  messageTimeout = setTimeout(() => {
    messageBox.classList.add("hidden");
  }, 5000);
}

export function countBooksRecursive(bookList, index = 0) {
  if (!Array.isArray(bookList)) {
    return 0;
  }

  if (index >= bookList.length) {
    return 0;
  }

  return 1 + countBooksRecursive(bookList, index + 1);
}

export function calculateTotalCopies(...bookCollection) {
  return bookCollection.reduce((total, book) => total + book.totalCopies, 0);
}
