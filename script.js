// Função para filtrar os jogos na barra de pesquisa
function filterGames() {
    const input = document.getElementById('gameSearch').value.toLowerCase();
    const cards = document.getElementsByClassName('update-card');

    for (let i = 0; i < cards.length; i++) {
        const title = cards[i].querySelector('.update-name').innerText.toLowerCase();
        
        if (title.includes(input)) {
            cards[i].style.display = "flex";
        } else {
            cards[i].style.display = "none";
        }
    }
}

// Função para copiar o código (Usada nas páginas internas)
function copyCode(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const oldText = button.innerText;
        button.innerText = "COPIADO!";
        button.style.background = "#ffffff";
        
        setTimeout(() => { 
            button.innerText = oldText; 
            button.style.background = "#00ff88";
        }, 2000);
    });
}
