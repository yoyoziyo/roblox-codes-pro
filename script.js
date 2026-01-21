/**
 * Função para filtrar os jogos na página inicial (Home)
 * Esta função é acionada sempre que o usuário digita na barra de pesquisa do Navbar.
 */
function filterGames() {
    // 1. Pega o valor digitado e transforma em minúsculas para facilitar a busca
    const input = document.getElementById('gameSearch');
    const filter = input.value.toLowerCase();
    
    // 2. Localiza o container onde os cards de jogos estão
    const grid = document.getElementById('gameGrid');
    
    // Verifica se estamos na página inicial (onde a grid existe)
    if (grid) {
        const cards = grid.getElementsByClassName('card');

        // 3. Percorre todos os cards da lista
        for (let i = 0; i < cards.length; i++) {
            // Pega o título (h3) dentro de cada card
            let titleElement = cards[i].querySelector('h3');
            let gameName = titleElement.textContent || titleElement.innerText;

            // 4. Se o nome do jogo contiver o que foi digitado, mostra o card, senão esconde
            if (gameName.toLowerCase().indexOf(filter) > -1) {
                cards[i].style.display = ""; // Mostra o card
            } else {
                cards[i].style.display = "none"; // Esconde o card
            }
        }
    }
}

/**
 * Função para copiar o código para a área de transferência
 * @param {string} text - O código que será copiado
 * @param {HTMLElement} button - O botão que foi clicado
 */
function copyCode(text, button) {
    // Usa a API do navegador para copiar o texto
    navigator.clipboard.writeText(text).then(() => {
        // Guarda o texto original do botão
        const originalText = button.innerText;
        
        // Altera o texto e adiciona a classe visual de sucesso
        button.innerText = "COPIADO!";
        button.classList.add("copied");
        
        // Feedback visual: o botão "pulsa" via CSS (scale)
        button.style.transform = "scale(0.95)";

        // Volta ao estado original após 2 segundos
        setTimeout(() => {
            button.innerText = originalText;
            button.classList.remove("copied");
            button.style.transform = ""; // Reseta o tamanho
        }, 2000);
        
    }).catch(err => {
        console.error('Erro ao copiar o código: ', err);
        alert("Erro ao copiar. Por favor, tente selecionar manualmente.");
    });
}

/**
 * Ajuste para o Navbar:
 * Garante que se o usuário pesquisar e mudar de página, o filtro resete.
 */
window.onload = () => {
    const searchInput = document.getElementById('gameSearch');
    if (searchInput) {
        searchInput.value = ""; // Limpa a busca ao carregar/recarregar a página
    }
};
