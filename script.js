function copyCode(text, button) {
    // Copia para a área de transferência
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        
        // Feedback visual
        button.innerHTML = "Copiado! ✓";
        button.classList.add('copied');
        
        // Reseta o botão após 2.5 segundos
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2500);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
}
