/**
 * Lógica de Troca de Frames (Pesquisa vs Last Updates)
 */
function filterGames() {
    const input = document.getElementById('gameSearch').value.toLowerCase();
    const searchSection = document.getElementById('searchSection');
    const updatesSection = document.getElementById('updatesSection');
    const searchQueryText = document.getElementById('searchQueryText');
    const searchResultsGrid = document.getElementById('searchResultsGrid');
    const noResults = document.getElementById('noResults');
    
    // Pega todos os cards que existem na lista principal (All Games)
    const allCards = document.querySelectorAll('#allGamesList .update-card');

    if (input.length > 0) {
        // Ativa modo Pesquisa
        updatesSection.style.display = "none";
        searchSection.style.display = "block";
        searchQueryText.innerText = `Mostrando resultados para: "${input}"`;
        
        // Limpa grid de busca e filtra
        searchResultsGrid.innerHTML = "";
        let found = false;

        allCards.forEach(card => {
            const name = card.querySelector('.update-name').innerText.toLowerCase();
            if (name.includes(input)) {
                const clone = card.cloneNode(true); 
                searchResultsGrid.appendChild(clone);
                found = true;
            }
        });

        noResults.style.display = found ? "none" : "block";

    } else {
        // Volta ao modo Last Updates padrão
        updatesSection.style.display = "block";
        searchSection.style.display = "none";
    }
}

/**
 * Função de copiar para as páginas de códigos
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
    });
}
