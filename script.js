function filterGames() {
    const input = document.getElementById('gameSearch');
    const filter = input.value.toLowerCase();
    const grid = document.getElementById('gameGrid');
    const cards = grid.getElementsByClassName('card');
    
    // Converter para Array para usar forEach (mais moderno)
    Array.from(cards).forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        
        // Se o input estiver vazio, esconde. Se contiver o termo, mostra.
        if (filter !== "" && title.includes(filter)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

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
    });
}
