/**
 * Script principal para a página da Biblioteca FCAP
 * Controle de interações com os botões e descrições
 * Compatível com desktop e dispositivos móveis
 */

document.addEventListener('DOMContentLoaded', function() {
    const btnWrappers = document.querySelectorAll('.btn-wrapper');
    let maxDescHeight = 0;
    let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    let currentOpen = null;
    
    // Calcula a altura máxima de todas as descrições
    function calculateMaxDescriptionHeight() {
        btnWrappers.forEach(wrapper => {
            const description = wrapper.querySelector('.btn-description');
            
            // Mostra temporariamente para calcular a altura
            description.style.display = 'block';
            description.style.position = 'absolute';
            description.style.visibility = 'hidden';
            
            const descHeight = description.offsetHeight;
            if (descHeight > maxDescHeight) {
                maxDescHeight = descHeight;
            }
            
            // Restaura o estado original
            description.style.display = '';
            description.style.position = '';
            description.style.visibility = '';
        });
        
        document.documentElement.style.setProperty('--desc-height', maxDescHeight + 'px');
    }
    
    // Verifica se é uma tela pequena (mobile)
    function isMobile() {
        return window.matchMedia("(max-width: 600px)").matches;
    }
    
    // Fecha a descrição atualmente aberta
    function closeCurrentDescription() {
        if (currentOpen) {
            currentOpen.classList.remove('mobile-open');
            currentOpen = null;
        }
    }
    
    // Comportamento para toque em dispositivos móveis
    function setupTouchBehavior() {
        btnWrappers.forEach(wrapper => {
            const btn = wrapper.querySelector('.btn');
            
            wrapper.addEventListener('click', function(e) {
                // Se já está aberto e clicou no botão, segue o link
                if (wrapper === currentOpen && e.target.closest('.btn')) {
                    setTimeout(() => {
                        if (btn.href) {
                            window.open(btn.href, btn.target || '_self');
                        }
                    }, 300);
                    return;
                }
                
                // Fecha o atual se houver
                closeCurrentDescription();
                
                // Abre o novo se não for o mesmo
                if (wrapper !== currentOpen) {
                    wrapper.classList.add('mobile-open');
                    currentOpen = wrapper;
                    e.preventDefault();
                }
            });
        });
        
        // Fecha a descrição ao tocar fora
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.btn-wrapper') && currentOpen) {
                closeCurrentDescription();
            }
        });
    }
    
    // Comportamento hover para desktop
    function setupHoverBehavior() {
        btnWrappers.forEach(wrapper => {
            wrapper.addEventListener('mouseenter', function() {
                this.style.zIndex = '10';
            });
            
            wrapper.addEventListener('mouseleave', function() {
                this.style.zIndex = '';
            });
        });
    }
    
    // Inicialização
    function init() {
        calculateMaxDescriptionHeight();
        
        if (isTouchDevice) {
            setupTouchBehavior();
        } else {
            setupHoverBehavior();
        }
        
        // Redimensionamento da janela
        window.addEventListener('resize', function() {
            // Recalcula alturas se necessário
            if (Math.abs(maxDescHeight - calculateMaxDescriptionHeight()) > 10) {
                calculateMaxDescriptionHeight();
            }
            
            // Se mudou de mobile para desktop ou vice-versa
            if (!isMobile() && currentOpen) {
                closeCurrentDescription();
            }
        });
    }
    
    // Inicia o script
    init();
});