/**
 * Lógica da Barra de Pesquisa na Home
 */
function filterGames() {
    const input = document.getElementById('gameSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.update-card');

    cards.forEach(card => {
        // Pega o nome do jogo dentro de cada card
        const titleElement = card.querySelector('.update-name');
        if (titleElement) {
            const title = titleElement.innerText.toLowerCase();
            
            // Lógica de exibir ou esconder
            if (title.includes(input)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        }
    });
}

/**
 * Função de Copiar Código (Páginas Internas)
 */
function copyCode(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const oldText = button.innerText;
        
        button.innerText = "COPIADO!";
        button.style.background = "#ffffff";
        button.style.color = "#000";

        setTimeout(() => { 
            button.innerText = oldText; 
            button.style.background = "#00ff88";
            button.style.color = "#000";
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
}
