// =========================================
// FUNÇÃO COPIAR CÓDIGO
// =========================================
function copyCode(text, button) {
    // Copia para a área de transferência
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        
        // Feedback visual
        button.innerHTML = "✓ COPIADO!";
        button.classList.add('copied');
        
        // Reseta o botão após 2.5 segundos
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2500);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
        // Fallback para navegadores mais antigos
        fallbackCopy(text, button);
    });
}

// Função de fallback para navegadores sem suporte a clipboard API
function fallbackCopy(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        const originalText = button.innerHTML;
        button.innerHTML = "✓ COPIADO!";
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2500);
    } catch (err) {
        console.error('Erro no fallback de cópia: ', err);
        alert('Código: ' + text);
    }
    
    document.body.removeChild(textArea);
}

// =========================================
// SISTEMA DE BUSCA (INDEX)
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const gamesGrid = document.getElementById('gamesGrid');
    const emptyState = document.getElementById('emptyState');
    
    // Verifica se estamos na página index
    if (searchInput && gamesGrid) {
        // Evento de busca
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const gameCards = gamesGrid.querySelectorAll('.game-card');
            let visibleCount = 0;
            
            gameCards.forEach(card => {
                const gameName = card.getAttribute('data-game');
                
                if (gameName && gameName.includes(searchTerm)) {
                    card.style.display = 'flex';
                    visibleCount++;
                    // Animação de entrada
                    card.style.animation = 'fadeIn 0.3s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Mostra/esconde empty state
            if (visibleCount === 0 && searchTerm !== '') {
                emptyState.style.display = 'block';
                gamesGrid.style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                gamesGrid.style.display = 'grid';
            }
        });
        
        // Limpa busca ao pressionar ESC
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.blur();
            }
        });
    }
    
    // =========================================
    // ANIMAÇÃO DE SCROLL SUAVE
    // =========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // =========================================
    // PREVINE CLIQUE EM "COMING SOON"
    // =========================================
    const comingSoonCards = document.querySelectorAll('.game-card.coming-soon');
    comingSoonCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Este jogo está chegando em breve! 🎮');
        });
    });
});

// =========================================
// SISTEMA DE NOTIFICAÇÕES
// =========================================
function showNotification(message, duration = 3000) {
    // Remove notificações anteriores
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Cria nova notificação
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Adiciona estilos inline (caso não estejam no CSS)
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #00ff88 0%, #00cc6f 100%);
        color: #000;
        padding: 16px 32px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.95rem;
        box-shadow: 0 8px 24px rgba(0,255,136,0.4);
        z-index: 1000;
        animation: slideUp 0.3s ease forwards;
    `;
    
    document.body.appendChild(notification);
    
    // Remove após a duração especificada
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// =========================================
// ADICIONA ANIMAÇÕES CSS DINAMICAMENTE
// =========================================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, 20px);
        }
    }
`;
document.head.appendChild(style);

// =========================================
// PERFORMANCE: LAZY LOADING DE IMAGENS
// =========================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    // Observa todas as imagens com data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// =========================================
// ANALYTICS DE CÓDIGOS COPIADOS (OPCIONAL)
// =========================================
function trackCodeCopy(codeName) {
    // Você pode adicionar tracking aqui se quiser
    console.log(`Código copiado: ${codeName}`);
    
    // Exemplo com Google Analytics (se você tiver configurado):
    // if (typeof gtag !== 'undefined') {
    //     gtag('event', 'code_copied', {
    //         'code_name': codeName
    //     });
    // }
}

// =========================================
// ATUALIZA O COPYCODE PARA INCLUIR TRACKING
// =========================================
const originalCopyCode = copyCode;
copyCode = function(text, button) {
    trackCodeCopy(text);
    originalCopyCode(text, button);
};
