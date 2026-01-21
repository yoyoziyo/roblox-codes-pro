// Função para filtrar os jogos na página inicial
function filterGames() {
    const input = document.getElementById('gameSearch');
    const filter = input.value.toLowerCase();
    const grid = document.querySelector('.grid-jogos');
    
    // Verifica se a grid existe (só existe na Home)
    if (grid) {
        const cards = grid.getElementsByClassName('card');
        for (let i = 0; i < cards.length; i++) {
            let name = cards[i].querySelector('h3').innerText;
            if (name.toLowerCase().indexOf(filter) > -1) {
                cards[i].style.display = "";
            } else {
                cards[i].style.display = "none";
            }
        }
    }
}

// Função para copiar os códigos
function copyCode(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerText;
        button.innerText = "COPIADO!";
        button.classList.add("copied");
        
        setTimeout(() => {
            button.innerText = originalText;
            button.classList.remove("copied");
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
}
