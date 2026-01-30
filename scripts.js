// Configuración de la API
const API_URL = 'https://web-production-8abc3.up.railway.app/api';

let currentMode = 'overall';
let allPlayers = {};

// Cargar rankings al iniciar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando MCTiers Rankings');
    console.log('📡 API URL:', API_URL);
    loadRankings('overall');
    setupModeButtons();
    // Auto-refresh cada 10 segundos
    setInterval(() => loadRankings(currentMode), 10000);
});

// Configurar botones de modalidad
function setupModeButtons() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
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
        
        // Guardar todos los jugadores para el modal
        allPlayers = {};
        for (let tier = 1; tier <= 5; tier++) {
            const tierData = data[`tier${tier}`];
            if (tierData) {
                tierData.forEach(player => {
                    allPlayers[player.id] = player;
                });
            }
        }
        
        displayRankings(data, mode);
        
    } catch (error) {
        console.error('❌ Error cargando rankings:', error);
        showError(error.message);
    }
}

// Mostrar rankings en formato lista
function displayRankings(data, mode) {
    const container = document.getElementById('rankings-container');
    
    if (!data || data.total_players === 0) {
        container.innerHTML = `
            <div class="no-data">
                <h2>📊 No hay jugadores testeados aún</h2>
                <p>Los rankings aparecerán cuando se publiquen los primeros resultados</p>
            </div>
        `;
        return;
    }
    
    // Combinar todos los jugadores y ordenar por puntos
    let allPlayersList = [];
    for (let tier = 1; tier <= 5; tier++) {
        const tierData = data[`tier${tier}`];
        if (tierData) {
            allPlayersList = allPlayersList.concat(tierData);
        }
    }
    
    // Ordenar por puntos (mayor a menor)
    allPlayersList.sort((a, b) => b.points - a.points);
    
    // Crear lista de jugadores
    let html = '<div class="player-list">';
    
    allPlayersList.forEach((player, index) => {
        const rank = index + 1;
        const skinUrl = getSkinUrl(player.name);
        const tiersList = getTiersHTML(player.modalidades);
        
        // Determinar título basado en puntos
        let title = getTitleFromPoints(player.points);
        
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
}

// Obtener URL de skin
function getSkinUrl(playerName) {
    // Por ahora usar mc-heads para todos
    // El bot debe guardar si es premium o no
    return `https://mc-heads.net/avatar/${playerName}/50`;
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
    if (!modalidades) return '';
    
    let html = '';
    const modes = ['Mace', 'Sword', 'UHC', 'Crystal', 'NethOP'];
    
    modes.forEach(mode => {
        if (modalidades[mode]) {
            const modeData = modalidades[mode];
            const tierClass = getTierClass(modeData.tier);
            const emoji = getModeEmoji(mode);
            
            html += `
                <div class="tier-badge ${tierClass}">
                    <span class="tier-icon">${emoji}</span>
                    <span>${getTierShortName(modeData.tier)}</span>
                </div>
            `;
        }
    });
    
    return html;
}

// Obtener clase de tier
function getTierClass(tier) {
    if (tier === 1) return 'tier-HT1';
    if (tier === 2) return 'tier-HT2';
    if (tier === 3) return 'tier-HT3';
    if (tier === 4) return 'tier-HT4';
    if (tier === 5) return 'tier-HT5';
    return 'tier-LT5';
}

// Obtener nombre corto del tier
function getTierShortName(tier) {
    return `T${tier}`;
}

// Obtener emoji de modalidad
function getModeEmoji(mode) {
    const emojis = {
        'Mace': '🔨',
        'Sword': '⚔️',
        'UHC': '❤️',
        'Crystal': '💎',
        'NethOP': '🧪'
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
        
        const skinUrl = `https://mc-heads.net/body/${data.name}`;
        const title = getTitleFromPoints(data.puntos_totales);
        
        let tiersHTML = '';
        if (data.tiers) {
            tiersHTML = Object.entries(data.tiers).map(([mode, info]) => `
                <div class="modal-tier-item">
                    <span class="modal-tier-icon">${getModeEmoji(mode)}</span>
                    <div class="modal-tier-info">
                        <div class="modal-tier-mode">${mode}</div>
                        <div class="modal-tier-value">${info.tier} (${info.puntos} pts)</div>
                    </div>
                </div>
            `).join('');
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
    document.getElementById('player-modal').style.display = 'none';
}

// Mostrar error
function showError(errorMsg) {
    const container = document.getElementById('rankings-container');
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
