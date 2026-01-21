function copyCode(text, button) {
    // Copia o texto para a área de transferência
    navigator.clipboard.writeText(text).then(() => {
        // Salva o texto original do botão (COPIAR)
        const originalText = button.innerText;
        
        // Muda o estilo e o texto do botão
        button.innerText = "COPIADO!";
        button.classList.add("copied");
        
        // Volta ao normal após 2 segundos
        setTimeout(() => {
            button.innerText = originalText;
            button.classList.remove("copied");
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
}
