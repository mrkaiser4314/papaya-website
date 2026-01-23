// Configuración de la API
const API_URL = 'https://papayas-api-production.up.railway.app/api';

let currentMode = 'overall';
let allPlayers = {};

console.log('📜 scripts.js cargado');
console.log('📡 API configurada:', API_URL);

// Función de inicialización
function init() {
    console.log('🚀 Iniciando Papayas tierlist Rankings');
    console.log('📡 API URL:', API_URL);
    console.log('🔍 Estado del DOM:', document.readyState);
    
    loadRankings('overall');
    setupModeButtons();
    
    // Auto-refresh cada 30 segundos (NO cada 10 para evitar loop)
    // COMENTADO PARA DEBUGGING - Descomentar cuando todo funcione
    // setInterval(() => loadRankings(currentMode), 30000);
}

// Cargar rankings al iniciar
if (document.readyState === 'loading') {
    console.log('⏳ DOM aún cargando, esperando...');
    document.addEventListener('DOMContentLoaded', init);
} else {
    console.log('✅ DOM ya listo, ejecutando init()');
    init();
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
        
        displayRankings(data, mode);
        
    } catch (error) {
        console.error('❌ Error cargando rankings:', error);
        showError(error.message);
    }
}

// Mostrar rankings en formato lista
function displayRankings(data, mode) {
    const container = document.getElementById('rankings-container');
    
    if (!container) {
        console.error('❌ No se encontró #rankings-container');
        return;
    }
    
    if (!data || !data.players || data.players.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <h2>📊 No hay jugadores testeados aún</h2>
                <p>Los rankings aparecerán cuando se publiquen los primeros resultados</p>
            </div>
        `;
        return;
    }
    
    console.log(`📊 Renderizando ${data.players.length} jugadores`);
    
    // Crear lista de jugadores
    let html = '<div class="player-list">';
    
    data.players.forEach((player, index) => {
        const rank = index + 1;
        const skinUrl = getSkinUrl(player.name, player.es_premium);
        const tiersList = getTiersHTML(player.modalidades);
        const title = getTitleFromPoints(player.points);
        
        html += `
            <div class="player-row" onclick="showPlayerModal('${player.id}')">
                <div class="player-rank">${rank}.</div>
                <img src="${skinUrl}" alt="${player.name}" class="player-skin">
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-title">
                        <span>💎</span> ${title} <span style="color: #888;">(${player.points} points)</span>
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
    
    console.log('✅ Rankings renderizados correctamente');
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
        console.log(`📥 Cargando datos del jugador: ${playerId}`);
        const response = await fetch(`${API_URL}/player/${playerId}`);
        
        if (!response.ok) {
            throw new Error(`Error cargando jugador: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Datos del jugador:', data);
        
        const modal = document.getElementById('player-modal');
        const modalBody = document.getElementById('modal-body');
        
        if (!modal || !modalBody) {
            console.error('❌ Modal elements not found');
            return;
        }
        
        const skinUrl = data.es_premium === 'si' 
            ? `https://mc-heads.net/body/${data.name}`
            : `https://mc-heads.net/body/Steve`;
        const title = getTitleFromPoints(data.puntos_totales);
        
        let tiersHTML = '';
        if (data.tiers && Object.keys(data.tiers).length > 0) {
            tiersHTML = Object.entries(data.tiers).map(([mode, info]) => {
                const tierDisplay = info.tier_display || info.tier;
                return `
                <div class="modal-tier-item">
                    <span class="modal-tier-icon">${getModeEmoji(mode)}</span>
                    <div class="modal-tier-info">
                        <div class="modal-tier-mode">${mode}</div>
                        <div class="modal-tier-value">${tierDisplay} (${info.puntos} pts)</div>
                    </div>
                </div>
            `}).join('');
        } else {
            tiersHTML = '<p style="color: #888;">No tested yet</p>';
        }
        
        modalBody.innerHTML = `
            <img src="${skinUrl}" alt="${data.name}" class="modal-player-skin">
            <h2 class="modal-player-name">${data.name}</h2>
            <div class="modal-player-rank">💎 ${title}</div>
            <div class="modal-region">Region: N/A</div>
            <a href="https://namemc.com/profile/${data.name}" target="_blank" class="modal-namemc">
                🔗 NameMC
            </a>
            
            <div class="modal-position">
                <h3>POSITION</h3>
                <div class="modal-position-value">
                    #${data.position}. 🏆 OVERALL (${data.puntos_totales} points)
                </div>
            </div>
            
            <div class="modal-tiers">
                <h3>TIERS</h3>
                <div class="modal-tiers-grid">
                    ${tiersHTML}
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('❌ Error cargando jugador:', error);
        alert('Error al cargar información del jugador');
    }
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('player-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Mostrar error
function showError(errorMsg) {
    const container = document.getElementById('rankings-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <h2>⚠️ Error al cargar rankings</h2>
            <p>No se pudo conectar con la API</p>
            <div style="background: rgba(255,68,68,0.2); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <strong>Error:</strong> ${errorMsg}
            </div>
            <p style="font-size: 14px; opacity: 0.7;">URL de API: ${API_URL}</p>
            <button onclick="loadRankings(currentMode)" class="retry-btn">
                🔄 Reintentar
            </button>
        </div>
    `;
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('player-modal');
    if (event.target === modal) {
        closeModal();
    }
}
