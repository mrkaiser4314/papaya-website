// Configuración de la API
const API_URL = 'https://papayas-api-production.up.railway.app/api';

let currentMode = 'overall';
let allPlayers = [];
let searchTerm = '';

console.log('📜 scripts.js cargado');
console.log('📡 API configurada:', API_URL);

// Función de inicialización
function init() {
    console.log('🚀 Iniciando Papayas tierlist Rankings');
    
    loadRankings('overall');
    setupModeButtons();
    setupSearch();
}

// Cargar rankings al iniciar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Configurar búsqueda
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) {
        console.warn('⚠️ No se encontró input de búsqueda');
        return;
    }
    
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase().trim();
        filterPlayers();
    });
}

// Filtrar jugadores por búsqueda
function filterPlayers() {
    let filtered = allPlayers || [];
    
    // Filtrar por búsqueda
    if (searchTerm) {
        filtered = filtered.filter(player => 
            player.name.toLowerCase().includes(searchTerm)
        );
    }
    
    displayFilteredPlayers(filtered);
}

// Mostrar jugadores filtrados
function displayFilteredPlayers(players) {
    const container = document.getElementById('rankings-container');
    
    if (!container) {
        console.error('❌ No se encontró #rankings-container');
        return;
    }
    
    if (!players || players.length === 0) {
        // Determinar mensaje apropiado
        let message = '';
        let subtitle = '';
        
        if (searchTerm) {
            // Búsqueda sin resultados
            message = '🔍 No se encontraron jugadores';
            subtitle = `No hay jugadores con el nombre "${searchTerm}"`;
        } else if (currentMode !== 'overall') {
            // Modalidad específica sin jugadores
            message = `📊 No hay jugadores testeados en ${currentMode}`;
            subtitle = 'Prueba con otra modalidad o espera a que se publiquen resultados';
        } else {
            // Sin jugadores en general
            message = '📊 No hay jugadores testeados aún';
            subtitle = 'Los rankings aparecerán cuando se publiquen los primeros resultados';
        }
        
        container.innerHTML = `
            <div class="no-data">
                <h2>${message}</h2>
                <p>${subtitle}</p>
            </div>
        `;
        return;
    }
    
    // Crear lista de jugadores
    let html = '<div class="player-list">';
    
    players.forEach((player, index) => {
        const rank = index + 1;
        const skinUrl = getSkinUrl(player.name, player.es_premium);
        const tiersList = getTiersHTML(player.modalidades);
        const title = getTitleFromPoints(player.points);
        
        // Mostrar puntos de la modalidad específica si no es overall
        const pointsDisplay = currentMode === 'overall' 
            ? player.points 
            : (player.mode_points || player.points);
        
        html += `
            <div class="player-row" onclick="showPlayerModal('${player.id}')">
                <div class="player-rank">${rank}.</div>
                <img src="${skinUrl}" alt="${player.name}" class="player-skin">
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-title">
                        <span>💎</span> ${title} <span style="color: #888;">(${pointsDisplay} pts)</span>
                    </div>
                </div>
                <div class="player-tiers">
                    ${tiersList}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Configurar botones de modalidad
function setupModeButtons() {
    const buttons = document.querySelectorAll('.mode-btn');
    if (buttons.length === 0) {
        console.warn('⚠️ No se encontraron botones de modo');
        return;
    }
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            loadRankings(currentMode);
        });
    });
}

// Cargar rankings desde la API
async function loadRankings(mode) {
    try {
        console.log(`📥 Cargando rankings para: ${mode}`);
        const response = await fetch(`${API_URL}/rankings/${mode}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        // Guardar todos los jugadores
        allPlayers = data.players || [];
        
        // Filtrar y mostrar
        filterPlayers();
        
    } catch (error) {
        console.error('❌ Error cargando rankings:', error);
        showError(error.message);
    }
}

// Obtener URL de skin
function getSkinUrl(playerName, esPremium) {
    if (esPremium === 'si') {
        return `https://mc-heads.net/avatar/${playerName}/50`;
    } else {
        return `https://mc-heads.net/avatar/Steve/50`;
    }
}

// Obtener título basado en puntos
function getTitleFromPoints(points) {
    if (points >= 400) return 'Combat Grandmaster';
    if (points >= 300) return 'Combat Master';
    if (points >= 200) return 'Combat Expert';
    if (points >= 100) return 'Combat Ace';
    if (points >= 50) return 'Fighter';
    return 'Rookie';
}

// Crear HTML de tiers
function getTiersHTML(modalidades) {
    if (!modalidades || Object.keys(modalidades).length === 0) {
        return '<span style="color: #888;">No tested</span>';
    }
    
    let html = '';
    const modes = ['Mace', 'Sword', 'UHC', 'Crystal', 'NethOP', 'SMP', 'Axe', 'Dpot'];
    
    modes.forEach(mode => {
        if (modalidades[mode]) {
            const modeData = modalidades[mode];
            const tierDisplay = modeData.tier_display || modeData.tier;
            const tierClass = getTierClassFromName(tierDisplay);
            const emoji = getModeEmoji(mode);
            
            html += `
                <div class="tier-badge ${tierClass}">
                    <span class="tier-icon">${emoji}</span>
                    <span>${tierDisplay}</span>
                </div>
            `;
        }
    });
    
    return html || '<span style="color: #888;">No tested</span>';
}

// Obtener clase de tier desde nombre
function getTierClassFromName(tierName) {
    if (!tierName) return 'tier-T5';
    if (tierName.includes('1')) return 'tier-T1';
    if (tierName.includes('2')) return 'tier-T2';
    if (tierName.includes('3')) return 'tier-T3';
    if (tierName.includes('4')) return 'tier-T4';
    if (tierName.includes('5')) return 'tier-T5';
    return 'tier-T5';
}

// Obtener emoji de modalidad
function getModeEmoji(mode) {
    const emojis = {
        'Mace': '🔨',
        'Sword': '⚔️',
        'UHC': '❤️',
        'Crystal': '💎',
        'NethOP': '🧪',
        'SMP': '🪓',
        'Axe': '🪓',
        'Dpot': '🧪'
    };
    return emojis[mode] || '🎮';
}

// Mostrar modal de jugador
async function showPlayerModal(playerId) {
    try {
        const response = await fetch(`${API_URL}/player/${playerId}`);
        if (!response.ok) {
            throw new Error('Player not found');
        }
        
        const player = await response.json();
        
        // Crear modal
        let modalHTML = `
            <div class="modal-overlay" onclick="closePlayerModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="closePlayerModal()">✕</button>
                    <div class="modal-header">
                        <img src="${getSkinUrl(player.nick || player.discord_name, player.es_premium)}" 
                             alt="${player.nick}" class="modal-skin">
                        <div>
                            <h2>${player.nick || player.discord_name}</h2>
                            <p class="modal-rank">Rank #${player.position}</p>
                            <p class="modal-points">${player.total_points} puntos totales</p>
                        </div>
                    </div>
                    <div class="modal-tiers">
                        <h3>Tiers por Modalidad</h3>
        `;
        
        if (player.tiers && Object.keys(player.tiers).length > 0) {
            for (const [mode, data] of Object.entries(player.tiers)) {
                const emoji = getModeEmoji(mode);
                const tierClass = getTierClassFromName(data.tier);
                modalHTML += `
                    <div class="modal-tier-row">
                        <span class="modal-tier-mode">${emoji} ${mode}</span>
                        <span class="tier-badge ${tierClass}">${data.tier}</span>
                        <span class="modal-tier-points">${data.puntos} pts</span>
                    </div>
                `;
            }
        } else {
            modalHTML += '<p style="color: #888;">Sin tiers registrados</p>';
        }
        
        modalHTML += `
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Error loading player:', error);
        alert('Error cargando información del jugador');
    }
}

// Cerrar modal
function closePlayerModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Mostrar error
function showError(message) {
    const container = document.getElementById('rankings-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <h2>❌ Error cargando datos</h2>
                <p>${message}</p>
                <button onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }
}
