// Função para filtrar jogos na busca manual
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

// FUNÇÃO PARA POPULAR O RANKING AUTOMATICAMENTE (CORRIGIDA)
async function fetchTopGames() {
    const rankingContainer = document.getElementById('topGamesRanking');
    
    // Usando o proxy AllOrigins para contornar o erro de CORS
    const targetUrl = 'https://games.roblox.com/v1/games/list?model.sortToken=top-grossing&model.maxRows=12';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        const rawData = await response.json();
        
        // O AllOrigins retorna os dados dentro de uma string chamada 'contents'
        const data = JSON.parse(rawData.contents);

        if (data && data.games) {
            rankingContainer.innerHTML = ''; // Limpa o "Carregando..."

            data.games.forEach((game, index) => {
                const rank = index + 1;
                const players = formatNumber(game.playerCount);
                
                // Usamos o UniverseId para gerar a imagem se o imageToken falhar
                const thumbUrl = `https://www.roblox.com/asset-thumbnail/image?assetId=${game.universeId}&width=150&height=150&format=png`;

                const cardHTML = `
                    <a href="https://www.roblox.com/games/${game.rootPlaceId}" target="_blank" class="top-game-card">
                        <div class="game-rank">${rank}</div>
                        <img src="${thumbUrl}" class="game-img-api" alt="${game.name}" onerror="this.src='https://via.placeholder.com/60?text=RBX'">
                        <div class="top-game-info">
                            <span class="top-game-name">${game.name}</span>
                            <span class="top-game-players"><strong>${players}</strong> Players</span>
                        </div>
                    </a>
                `;
                rankingContainer.innerHTML += cardHTML;
            });
        }
    } catch (error) {
        rankingContainer.innerHTML = '<p style="color: #444;">O ranking está temporariamente indisponível devido a restrições de rede.</p>';
        console.error("Erro ao carregar ranking:", error);
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num;
}

window.onload = () => {
    fetchTopGames();
};
