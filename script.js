function copyCode(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerText;
        button.innerText = "COPIADO!";
        setTimeout(() => {
            button.innerText = originalText;
        }, 2000);
    });
}
