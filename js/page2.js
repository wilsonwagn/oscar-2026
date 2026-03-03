/**
 * page2.js — Lógica de seleção de filmes e geração de PDF
 * Aposta Oscar 2026 — Wilson & Vinicius
 */

const RANKS     = ['🥇','🥈','🥉'];
const SEL_CLS   = ['sel-1','sel-2','sel-3'];
const STATE_KEY = 'oscar2026_picks';
const NAME_KEY  = 'oscar2026_name';
let state = {};

// ── Categorias (label para o PDF) ──
const CAT_LABELS = {
    'melhor-filme':        '🏆 Melhor Filme',
    'direcao':             '🎥 Direção',
    'ator':                '🧑‍🎤 Ator',
    'atriz':               '👩‍🎤 Atriz',
    'ator-coadjuvante':    '🎭 Ator Coadjuvante',
    'atriz-coadjuvante':   '🌟 Atriz Coadjuvante',
    'roteiro-original':    '✍️ Roteiro Original',
    'roteiro-adaptado':    '📖 Roteiro Adaptado',
    'animacao':            '🎨 Animação',
    'figurino':            '👗 Figurino',
    'fotografia':          '📷 Fotografia',
    'montagem':            '🎞️ Montagem',
    'filme-internacional': '🌍 Filme Internacional',
    'maquiagem':           '💄 Maquiagem/Penteado',
    'trilha-sonora':       '🎵 Trilha Sonora',
    'casting':             '🎤 Casting',
    'design-producao':     '🏛️ Design de Produção',
    'som':                 '🔊 Som',
    'efeitos-visuais':     '✨ Efeitos Visuais',
    'animacao-curta':      '🖼️ Animação Curta',
    'curta-metragem':      '🎬 Curta-Metragem',
    'documentario':        '📽️ Documentário',
    'documentario-curta':  '📹 Doc. Curta-Metragem',
    'cancao-original':     '🎶 Canção Original',
};

// ── Persistência ──
function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadState() {
    try { state = JSON.parse(localStorage.getItem(STATE_KEY)) || {}; }
    catch (e) { state = {}; }
    const name = localStorage.getItem(NAME_KEY) || '';
    const input = document.getElementById('playerName');
    if (input) input.value = name;
}

// ── Toggle filme (nominee-list) ──
function toggleItem(catId, film) {
    if (!state[catId]) state[catId] = {};
    const picks = state[catId];

    if (picks[film] !== undefined) {
        const removed = picks[film];
        delete picks[film];
        // Shift ranks down
        Object.keys(picks).forEach(f => { if (picks[f] > removed) picks[f]--; });
    } else {
        const count = Object.keys(picks).length;
        if (count >= 3) { shakeCat(catId); return; }
        picks[film] = count + 1;
    }
    saveState();
    renderCat(catId);
}

// ── Toggle filme (featured cards) ──
function toggleCard(catId, film) {
    toggleItem(catId, film); // same logic
}

// ── Render uma categoria ──
function renderCat(catId) {
    const picks = state[catId] || {};
    const count = Object.keys(picks).length;

    // Counter badge
    const ctr = document.getElementById('counter-' + catId);
    if (ctr) {
        ctr.textContent = catId === 'melhor-filme' ? `${count} / 3` : `${count}/3`;
        ctr.classList.toggle('full', count >= 3);
    }

    // Featured film-cards
    const featured = document.getElementById('cat-' + catId);
    if (featured) {
        featured.querySelectorAll('.film-card').forEach(card => {
            const film = card.dataset.film;
            const rank = picks[film];
            SEL_CLS.forEach(c => card.classList.remove(c));
            card.classList.remove('dimmed');
            const badge = card.querySelector('.film-rank');
            if (rank !== undefined) {
                card.classList.add(SEL_CLS[rank - 1]);
                badge.textContent = RANKS[rank - 1];
            } else {
                badge.textContent = '';
                if (count >= 3) card.classList.add('dimmed');
            }
        });
        return;
    }

    // Regular nominee lists
    const block = document.querySelector(`[data-cat="${catId}"]`);
    if (!block) return;
    block.querySelectorAll('.nominee-item').forEach(item => {
        const film  = item.dataset.film;
        const rank  = picks[film];
        const badge = item.querySelector('.rank-badge');
        item.classList.remove('selected', 'dimmed');
        if (rank !== undefined) {
            item.classList.add('selected');
            badge.textContent = RANKS[rank - 1];
        } else {
            badge.textContent = '';
            if (count >= 3) item.classList.add('dimmed');
        }
    });
}

// ── Shake feedback (max reached) ──
function shakeCat(catId) {
    const el = document.querySelector(`[data-cat="${catId}"]`)
            || document.getElementById('cat-' + catId);
    if (!el) return;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 400);
}

// ── Render todas as categorias ──
function renderAll() {
    const cats = new Set();
    document.querySelectorAll('[data-cat]').forEach(el => cats.add(el.dataset.cat));
    cats.forEach(renderCat);
}

// ── Limpar tudo ──
function resetAll() {
    if (!confirm('Limpar todas as escolhas?')) return;
    state = {};
    saveState();
    renderAll();
}

// ── Gerar PDF ──
function gerarPDF() {
    const player  = document.getElementById('playerName').value || 'Apostador';
    const section = document.getElementById('printSection');

    const rows = Object.entries(CAT_LABELS).map(([id, label]) => {
        const picks  = state[id] || {};
        const byRank = {};
        Object.entries(picks).forEach(([f, r]) => byRank[r] = f);

        const td = r => byRank[r]
            ? `<td class="pick-col">${RANKS[r - 1]} ${byRank[r]}</td>`
            : `<td class="pick-col empty-pick">—</td>`;

        return `<tr>
            <td class="cat-col">${label}</td>
            ${td(1)}${td(2)}${td(3)}
        </tr>`;
    }).join('');

    section.innerHTML = `
        <div class="print-header">
            <span class="print-title">Aposta Oscar 2026</span>
            <span class="print-player">✦ ${player} ✦</span>
        </div>
        <table class="print-table">
            <thead>
                <tr>
                    <th>Categoria</th>
                    <th>🥇 1ª Opção</th>
                    <th>🥈 2ª Opção</th>
                    <th>🥉 3ª Opção</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <p class="print-footer">✦ Oscar Night 2026 ✦</p>
    `;

    window.print();
}

// ── Inicializar handlers ──
function initHandlers() {
    // Film cards (Melhor Filme)
    document.querySelectorAll('.film-card').forEach(card => {
        const catEl = card.closest('[data-cat]');
        if (!catEl) return;
        card.addEventListener('click', () => toggleCard(catEl.dataset.cat, card.dataset.film));
    });

    // Nominee items
    document.querySelectorAll('.nominee-item').forEach(item => {
        const catEl = item.closest('[data-cat]');
        if (!catEl) return;
        item.addEventListener('click', () => toggleItem(catEl.dataset.cat, item.dataset.film));
    });

    // Player name
    document.getElementById('playerName').addEventListener('input', e => {
        localStorage.setItem(NAME_KEY, e.target.value);
    });
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initHandlers();
    renderAll();
});
