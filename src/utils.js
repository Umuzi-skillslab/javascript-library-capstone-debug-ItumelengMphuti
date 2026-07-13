let messageTimeout;

export function showMessage(
    message,
    type = "info",
    elementId = "message-box"
) {
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