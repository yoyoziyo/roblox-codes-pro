function filterGames() {
    const input = document.getElementById('gameSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.update-card');
    const sectionTitle = document.getElementById('sectionTitle');
    const sectionSub = document.getElementById('sectionSub');
    const noResults = document.getElementById('noResults');
    let hasResults = false;

    // Se o usuário estiver digitando
    if (input.length > 0) {
        sectionTitle.innerText = "Resultados da Pesquisa";
        sectionSub.innerText = `Mostrando resultados para: "${input}"`;
    } else {
        sectionTitle.innerText = "Last Updates";
        sectionSub.innerText = "Códigos verificados e atualizados recentemente";
    }

    cards.forEach(card => {
        const title = card.querySelector('.update-name').innerText.toLowerCase();
        
        if (title.includes(input)) {
            card.style.display = "flex";
            hasResults = true;
        } else {
            card.style.display = "none";
        }
    });

    // Mostra mensagem se não encontrar nada
    noResults.style.display = hasResults ? "none" : "block";
}

// Função de cópia mantida
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
