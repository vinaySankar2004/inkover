// Wrapper app page. Links hand off to the native side; nothing else happens here.

function send(message) {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.controller) {
        window.webkit.messageHandlers.controller.postMessage(message);
    }
}

for (const link of document.querySelectorAll("a[data-url]")) {
    link.addEventListener("click", function (event) {
        event.preventDefault();
        send({ action: "openURL", url: link.dataset.url });
    });
}
