/**
 * Lógica da Barra de Pesquisa na Home
 */
function filterGames() {
    const input = document.getElementById('gameSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.update-card');

    cards.forEach(card => {
        const titleElement = card.querySelector('.update-name');
        if (titleElement) {
            const title = titleElement.innerText.toLowerCase();
            if (title.includes(input)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        }
    });
}

/**
 * BUSCA DATA REAL DE MODIFICAÇÃO
 * Varre os cards na home e verifica quando o arquivo do link foi salvo
 */
async function updateLastModifiedDates() {
    const cards = document.querySelectorAll('.update-card');

    for (let card of cards) {
        const gameUrl = card.getAttribute('href');
        const dateElement = card.querySelector('.update-date');

        try {
            // Faz uma requisição HEAD para pegar a data do arquivo sem baixar a página toda
            const response = await fetch(gameUrl, { method: 'HEAD' });
            const lastModified = response.headers.get('Last-Modified');

            if (lastModified) {
                const date = new Date(lastModified);
                dateElement.innerText = date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit'
                });
            }
        } catch (error) {
            // Se der erro (ex: rodando localmente sem servidor), mantém o que está no HTML
            console.log("Data real disponível apenas em servidor (GitHub Pages/Hospedagem)");
        }
    }
}

/**
 * Função de Copiar Código
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

// Executa a atualização de datas assim que a página carrega
window.addEventListener('DOMContentLoaded', updateLastModifiedDates);
