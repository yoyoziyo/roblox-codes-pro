function filterGames() {
    const input = document.getElementById('gameSearch');
    const filter = input.value.toLowerCase();
    const grid = document.getElementById('gameGrid');
    const cards = grid.getElementsByClassName('card');
    
    Array.from(cards).forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
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
        const card = button.parentElement; // Pega o card pai
        
        button.innerText = "COPIADO!";
        button.style.background = "#ffffff";
        card.style.borderColor = "#00ff88"; // Brilha a borda do card

        setTimeout(() => { 
            button.innerText = oldText; 
            button.style.background = "#00ff88";
            card.style.borderColor = "#222"; // Volta ao normal
        }, 2000);
    });
}

// Foca no campo de busca ao carregar a home
window.onload = function() {
    const searchInput = document.getElementById('gameSearch');
    if (searchInput) searchInput.focus();
};
