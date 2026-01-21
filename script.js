// Função para filtrar jogos na busca manual (que você já tinha)
function filterGames() {
    let input = document.getElementById('gameSearch').value.toLowerCase();
    let cards = document.getElementsByClassName('card');

    for (let i = 0; i < cards.length; i++) {
        let title = cards[i].getElementsByTagName('h3')[0].innerText.toLowerCase();
        if (title.includes(input)) {
            cards[i].style.display = "";
        } else {
            cards[i].style.display = "none";
        }
    }
}

// FUNÇÃO PARA POPULAR O RANKING AUTOMATICAMENTE
async function fetchTopGames() {
    const rankingContainer = document.getElementById('topGamesRanking');
    
    try {
        // Usamos uma URL que retorna os jogos mais populares. 
        // Nota: Em alguns ambientes, pode ser necessário um proxy para evitar erro de CORS.
        const response = await fetch('https://games.roblox.com/v1/games/list?model.sortToken=top-grossing&model.maxRows=12');
        const data = await response.json();

        if (data && data.games) {
            rankingContainer.innerHTML = ''; // Limpa o "Carregando..."

            data.games.forEach((game, index) => {
                const rank = index + 1;
                const players = formatNumber(game.playerCount);
                
                // Monta o card com os dados da API
                const cardHTML = `
                    <div class="top-game-card">
                        <div class="game-rank">${rank}</div>
                        <img src="${game.imageToken}" class="game-img-api" alt="${game.name}" onerror="this.src='https://via.placeholder.com/60?text=Roblox'">
                        <div class="top-game-info">
                            <span class="top-game-name">${game.name}</span>
                            <span class="top-game-players"><strong>${players}</strong> Players</span>
                        </div>
                    </div>
                `;
                rankingContainer.innerHTML += cardHTML;
            });
        }
    } catch (error) {
        rankingContainer.innerHTML = '<p style="color: #444;">O ranking está temporariamente indisponível.</p>';
        console.error("Erro ao carregar ranking:", error);
    }
}

// Formata números grandes (Ex: 1500000 -> 1.5M)
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}

// Iniciar funções ao carregar a página
window.onload = () => {
    fetchTopGames();
};
