function filterGames() {
    const input = document.getElementById('gameSearch').value.toLowerCase();
    const searchSection = document.getElementById('searchSection');
    const updatesSection = document.getElementById('updatesSection');
    const searchQueryText = document.getElementById('searchQueryText');
    const searchResultsGrid = document.getElementById('searchResultsGrid');
    const noResults = document.getElementById('noResults');
    
    // Todos os cards originais que estão no Last Updates
    const allCards = document.querySelectorAll('#allGamesList .update-card');

    if (input.length > 0) {
        // 1. Esconde o Last Updates e mostra a Pesquisa
        updatesSection.style.display = "none";
        searchSection.style.display = "block";
        searchQueryText.innerText = `Resultados para: "${input}"`;
        
        // 2. Limpa resultados anteriores
        searchResultsGrid.innerHTML = "";
        let found = false;

        // 3. Filtra e clona os cards para o frame de busca
        allCards.forEach(card => {
            const name = card.querySelector('.update-name').innerText.toLowerCase();
            if (name.includes(input)) {
                const clone = card.cloneNode(true); // Clona o card para não tirar do lugar original
                searchResultsGrid.appendChild(clone);
                found = true;
            }
        });

        noResults.style.display = found ? "none" : "block";

    } else {
        // Se a busca estiver vazia, volta ao normal
        updatesSection.style.display = "block";
        searchSection.style.display = "none";
    }
}

// Função de copiar (Páginas internas)
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
