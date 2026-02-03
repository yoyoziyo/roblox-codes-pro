/**
 * Lógica de Troca de Frames e Busca
 */
function filterGames() {
    const input = document.getElementById('gameSearch').value.toLowerCase();
    const searchSection = document.getElementById('searchSection');
    const updatesSection = document.getElementById('updatesSection');
    const searchQueryText = document.getElementById('searchQueryText');
    const searchResultsGrid = document.getElementById('searchResultsGrid');
    const noResults = document.getElementById('noResults');
    
    const allCards = document.querySelectorAll('#allGamesList .update-card');

    if (input.length > 0) {
        updatesSection.style.display = "none";
        searchSection.style.display = "block";
        searchQueryText.innerText = `Mostrando resultados para: "${input}"`;
        
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
        updatesSection.style.display = "block";
        searchSection.style.display = "none";
    }
}

/**
 * FUNÇÃO PARA BUSCAR A DATA REAL DE ATUALIZAÇÃO
 */
async function updateLastModifiedDates() {
    const cards = document.querySelectorAll('.update-card');

    for (let card of cards) {
        const gameUrl = card.getAttribute('href');
        const dateElement = card.querySelector('.update-date');

        try {
            // Faz uma requisição leve (HEAD) para pegar apenas o cabeçalho do arquivo
            const response = await fetch(gameUrl, { method: 'HEAD' });
            const lastModified = response.headers.get('Last-Modified');

            if (lastModified) {
                const date = new Date(lastModified);
                dateElement.innerText = date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (error) {
            console.error("Não foi possível obter a data de:", gameUrl);
        }
    }
}

/**
 * Função de copiar
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

// Inicia a verificação de datas ao carregar a página
window.addEventListener('DOMContentLoaded', updateLastModifiedDates);
