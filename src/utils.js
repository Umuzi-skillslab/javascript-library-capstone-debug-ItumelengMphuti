let messageTimeout;

export function showMessage(message, type = "info") {

    const messageBox = document.getElementById("message-box");

    if (!messageBox) return;

    clearTimeout(messageTimeout);

    messageBox.textContent = message;

    messageBox.className = type;

    messageBox.classList.remove("hidden");

    messageTimeout = setTimeout(() => {
        messageBox.classList.add("hidden");
    }, 5000); // 30 seconds
}