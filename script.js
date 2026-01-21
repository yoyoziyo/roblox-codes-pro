function filterGames() {
    const input = document.getElementById('gameSearch');
    const filter = input.value.toLowerCase();
    const grid = document.getElementById('gameGrid');
    
    if (grid) {
        const cards = grid.getElementsByClassName('card');
        for (let i = 0; i < cards.length; i++) {
            let name = cards[i].querySelector('h3').innerText.toLowerCase();
            
            if (filter === "") {
                cards[i].style.display = "none";
            } else if (name.indexOf(filter) > -1) {
                cards[i].style.display = "block";
            } else {
                cards[i].style.display = "none";
            }
        }
    }
}

function copyCode(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const oldText = button.innerText;
        button.innerText = "COPIADO!";
        setTimeout(() => { button.innerText = oldText; }, 2000);
    });
}
