function changeScreen(screenId) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(screenId).classList.add('active'); if(screenId === 'screen-home') uiRenderHome(); }
function uiShowMsg(text, ms = 1500) { let box = document.getElementById('msg-box'); box.innerText = text; box.style.display = 'block'; setTimeout(() => box.style.display = 'none', ms); }

let selectedDefenderUid = null; 
const ABILITY_JP = { 'flying':'飛', 'first_strike':'先', 'deathtouch':'接', 'trample':'貫', 'vigilance':'警', 'lifelink':'絆', 'defender':'防', 'reach':'到' };
const ATTR_JP = { 'fire':'🔥火', 'forest':'🌲森', 'water':'💧水', 'light':'✨光', 'dark':'🌑闇' };
// --- ▼ ここから追加 ▼ ---
function uiRenderManaCost(card, isLarge = false) {
    if (card.type === 'LAND') return '';
    let cClass = isLarge ? 'c-cost-mtg-large' : 'c-cost-mtg';
    if (card.cost === 0) return `<div class="${cClass}" style="background:#ccc">0</div>`;
    
    let icons = { 'fire':'🔥', 'forest':'🌲', 'water':'💧', 'light':'✨', 'dark':'🌑' };
    let html = '<div style="display:flex; gap:2px; justify-content: flex-end;">';
    
    // 無色マナ（anyCost）
    if (card.anyCost > 0) {
        html += `<div class="${cClass}" style="background:#ccc">${card.anyCost}</div>`;
    }
    // 色マナ（colorCost）
    for (let i = 0; i < card.colorCost; i++) {
        html += `<div class="${cClass}" style="font-size:${isLarge ? '0.8rem' : '0.5rem'}">${icons[card.color]}</div>`;
    }
    html += '</div>';
    return html;
}
// --- ▲ ここまで追加 ▲ ---
async function handleUniversalTap(idKey, context, uid, isPlayer, uniqueParam) {
    if (BAT.active && BAT.isProcessing) return; let card = uid ? batFindCard(uid) : DB_CARDS[idKey]; if(!card) return;
    if (BAT.active) {
        if (BAT.phase === 'TARGETING' && context === 'field' && card.type === 'CREATURE') { await batSelectTarget({ type: 'creature', uid: uid, isPlayerOwner: isPlayer }); return; }
        if (BAT.phase === 'ORDER_BLOCKERS' && context === 'field' && !isPlayer && card.type === 'CREATURE') {
            let atkId = BAT.currentOrderAttacker; let blockers = BAT.combat.blockerMap[atkId] || [];
            if (blockers.includes(uid) && !BAT.currentOrderSelected.includes(uid)) { BAT.currentOrderSelected.push(uid); if (BAT.currentOrderSelected.length === blockers.length) { BAT.combat.blockerMap[atkId] = [...BAT.currentOrderSelected]; BAT.orderingList.shift(); batNextOrder(); } uiRenderBattle(); } return;
        }
        if(BAT.turn === 'PLAYER' && BAT.phase === 'ATTACK' && context === 'field' && isPlayer && card.type === 'CREATURE') {
            if(card.tapped || card.sickness) { uiShowModal(card, context, uid, uniqueParam); return; } if(card.abilities.includes('defender')) { uiShowMsg("防衛のため攻撃不可"); return; }
            if(card.state === 'attacking') { card.state = 'normal'; BAT.combat.attackers = BAT.combat.attackers.filter(id => id !== uid); } else { card.state = 'attacking'; BAT.combat.attackers.push(uid); } uiRenderBattle(); return;
        }
        
        if(BAT.turn === 'CPU' && BAT.phase === 'BLOCK' && context === 'field' && card.type === 'CREATURE') {
            if(isPlayer) {
                if(card.tapped) { uiShowModal(card, context, uid, uniqueParam); return; }
                if(card.state === 'blocking' || card.state === 'selected_blocker') { 
                    for(let atkId in BAT.combat.blockerMap) BAT.combat.blockerMap[atkId] = BAT.combat.blockerMap[atkId].filter(id => id !== uid); 
                    card.state = 'normal'; selectedDefenderUid = null; 
                } else { 
                    selectedDefenderUid = uid; 
                    BAT.player.creatures.forEach(c => { if(c.state !== 'blocking') c.state = 'normal'; }); 
                    card.state = 'selected_blocker'; 
                    uiShowMsg("⚔️ 止める敵（赤枠）をタップ！", 1500);
                }
            } else {
                if(selectedDefenderUid && BAT.combat.attackers.includes(uid)) {
                    let defender = BAT.player.creatures.find(c => c.uid === selectedDefenderUid);
                    if(card.abilities.includes('flying') && !defender.abilities.includes('flying') && !defender.abilities.includes('reach')) { uiShowMsg("飛行を持つ敵は【飛行】か【到達】でのみブロック可能"); return; }
                    for(let atkId in BAT.combat.blockerMap) BAT.combat.blockerMap[atkId] = BAT.combat.blockerMap[atkId].filter(id => id !== selectedDefenderUid);
                    if (!BAT.combat.blockerMap[uid]) BAT.combat.blockerMap[uid] = []; 
                    BAT.combat.blockerMap[uid].push(selectedDefenderUid);
                    defender.state = 'blocking'; selectedDefenderUid = null;
                } else if (BAT.combat.attackers.includes(uid)) {
                    uiShowMsg("先にブロックする味方をタップしてください", 2000); return;
                } else { 
                    uiShowModal(card, context, uid, uniqueParam); return; 
                }
            } 
            uiRenderBattle(); return;
        }
    } uiShowModal(card, context, uid, uniqueParam);
}

// ui.js 内の uiShowModal 関数をまるごと上書き

function uiShowModal(card, context, uid, uniqueParam) {
    document.getElementById('modal-card').style.display = 'flex';
    
    // --- 色（カラーフレーム）の自動適用 ---
    let wrapper = document.getElementById('m-card-wrapper');
    wrapper.className = `card-mtg-large ${card.color} ${card.type === 'LAND' ? 'land' : ''}`;

    // --- ヘッダー ---
    document.getElementById('m-name').innerText = card.name; 
    
    // ▼ 変更箇所：マナコンテナへの表示 ▼
    let costContainer = document.getElementById('m-cost-container');
    if (card.type === 'LAND') {
        costContainer.innerHTML = '';
    } else {
        costContainer.innerHTML = uiRenderManaCost(card, true);
    }
    // ▲ 変更箇所ここまで ▲

    // --- 画像（PNG/JPGフォールバック対応） ---
    let mImg = document.getElementById('m-image'); 
    let imgSrc = card.img || `img/${card.idKey}.png`;
    mImg.dataset.fallback = "false";
    mImg.src = imgSrc; 
    mImg.style.display = 'block'; 
    mImg.onerror = function() { 
        if (this.dataset.fallback === "false") {
            this.dataset.fallback = "true";
            this.src = card.img ? card.img : `img/${card.idKey}.jpg`;
        } else {
            this.style.display = 'none';
        }
    };

    // --- タイプとレアリティ ---
    document.getElementById('m-type').innerText = card.type === 'LAND' ? '土地' : (card.type === 'SPELL' ? '呪文' : 'クリーチャー'); 
    let rEl = document.getElementById('m-rarity'); 
    rEl.style.backgroundColor = RARITY_COLORS[card.rarity];

// --- テキスト（能力アイコンと効果を合成・重複削除） ---
    let abs = []; 
    if(card.haste) abs.push('速攻'); 
    if(card.abilities) card.abilities.forEach(a => { if(ABILITY_JP[a]) abs.push(ABILITY_JP[a]); });
    let abText = abs.length > 0 ? `【${abs.join(', ')}】\n` : '';
    // ▼ 追加：元のテキストから【】で囲まれた部分（改行含む）を削除して重複を防ぐ ▼
    let cleanText = (card.text || '効果なし').replace(/【[^】]+】\n?/g, '').trim();
    document.getElementById('m-text').innerText = abText + cleanText;

    // --- ステータス (右下のP/T枠) ---
    let stats = document.getElementById('m-stats'); 
    if(card.type === 'CREATURE') { 
        let dmg = card.damage || 0;
        stats.innerText = `${card.power}/${card.toughness - dmg}`;
        stats.style.color = dmg > 0 ? '#e03131' : '#000';
        stats.style.display = 'block'; 
    } else { 
        stats.style.display = 'none'; 
    }
    
    // --- アクションボタン群 ---
    let actionDiv = document.getElementById('m-action'); actionDiv.innerHTML = '';
    if(BAT.active && BAT.turn === 'PLAYER' && (BAT.phase === 'MAIN1' || BAT.phase === 'MAIN2') && !BAT.isProcessing) {
        if(context === 'hand') actionDiv.innerHTML = `<button class="btn btn-play" onclick="batPlayCard(${uid}); uiCloseModal()">✨ プレイする</button>`;
        else if(context === 'field' && card.activated && card.damage < card.toughness) actionDiv.innerHTML = `<button class="btn btn-gold" onclick="batActivateAbility(${uid}); uiCloseModal()">⚡ 能力を使う</button>`;
    } else if (context === 'deck_active') actionDiv.innerHTML = `<button class="btn btn-red" onclick="sysRemoveFromDeck('${card.idKey}'); uiCloseModal()">デッキから外す</button>`; 
    else if (context === 'deck_pool') actionDiv.innerHTML = `<button class="btn btn-green" onclick="sysAddToDeck('${card.idKey}'); uiCloseModal()">デッキに入れる</button>`;
} // <-- uiShowModal の閉じカッコ

function uiCloseModal(e) { if(e) e.stopPropagation(); document.getElementById('modal-card').style.display = 'none'; }

// ui.js の該当部分を以下にまるごと上書き

function uiGenCardHTML(c, context='field', isPlayer=false, uniqueParam='') {
    let classes = `card ${c.color} ${c.type==='LAND'?'land':''} ${c.tapped?'tapped':''} ${c.sickness?'sickness':''} ${c.state==='attacking'?'attacking':''} ${c.state==='blocking'?'blocking':''} ${c.state==='selected_blocker'?'selected_blocker':''}`;
    
    // インタラクション状態（選択枠など）
    if(BAT.active && !BAT.isProcessing) {
        if(BAT.phase === 'TARGETING' && c.type === 'CREATURE') classes += ' selectable';
        if(BAT.phase === 'ATTACK' && isPlayer && c.type === 'CREATURE' && !c.tapped && !c.sickness && !c.abilities.includes('defender')) classes += ' selectable';
        if(BAT.phase === 'BLOCK' && BAT.turn === 'CPU' && c.type === 'CREATURE') {
            if (isPlayer && !c.tapped) classes += ' selectable';
            if (!isPlayer && BAT.combat.attackers.includes(c.uid)) {
                if (selectedDefenderUid) classes += ' targetable'; 
                else classes += ' selectable';
            }
        }
    }
    
    let orderBadgeHtml = '';
    if (BAT.active && BAT.phase === 'ORDER_BLOCKERS' && !isPlayer && BAT.combat.blockerMap[BAT.currentOrderAttacker]?.includes(c.uid)) {
        let idx = BAT.currentOrderSelected.indexOf(c.uid);
        if (idx !== -1) { orderBadgeHtml = `<div class="c-order">${idx + 1}</div>`; classes = classes.replace('selectable', ''); } else classes += ' selectable';
    }

    let onClick = `handleUniversalTap('${c.idKey}', '${context}', ${c.uid || 0}, ${isPlayer}, '${uniqueParam}')`;
    let blockTargetHtml = (BAT.active && BAT.combat.blockerMap[c.uid] && BAT.combat.blockerMap[c.uid].length > 0) ? `<div class="damage-marker">🛡️</div>` : '';

    // ▼ MTG風レイアウトの構成要素 ▼
    
    // ① イラスト（PNG/JPGフォールバック対応）
    let imgSrc = c.img || `img/${c.idKey}.png`;
    let imgHtml = `<img src="${imgSrc}" class="c-image-mtg" loading="lazy" onerror="if(!this.dataset.fallback){ this.dataset.fallback='1'; this.src='img/${c.idKey}.jpg'; } else { this.style.display='none'; }">`;

    // ② タイプ行（例：「クリーチャー」や「土地」）
    let typeText = c.type === 'LAND' ? '土地' : (c.type === 'SPELL' ? '呪文' : 'クリーチャー');

    // ③ 能力・効果テキスト
    // （システム側での自動付与をオフにし、エディターで作ったテキストをそのまま表示します）
    let textHtml = `<div class="c-text-box-mtg">${c.text || ''}</div>`;
    
    // ④ P/Tボックス（ダメージを受けていれば赤字に）
    let dmg = c.damage || 0;
    let statsHtml = c.type === 'CREATURE' ? `<div class="c-pt-box-mtg" ${dmg>0?'style="color:#e03131"':''}>${c.power}/${c.toughness - dmg}</div>` : '';
    // ⑤ コストマーク
    // ▼ 変更箇所：ここでマナアイコン表示関数を呼び出す ▼
    let costHtml = uiRenderManaCost(c);

    // HTML組み立て
    return `
    <div class="${classes}" data-uid="${c.uid || 0}" onclick="${onClick}">
        <div class="card-inner">
            <div class="c-header-mtg">
                <span class="c-name-mtg">${c.name}</span>
                ${costHtml}
            </div>
            <div class="c-image-container-mtg">
                ${imgHtml}
            </div>
            <div class="c-type-line-mtg">
                <span>${typeText}</span>
                <div class="c-rarity-mtg" style="background:${RARITY_COLORS[c.rarity]}"></div>
            </div>
            ${textHtml}
        </div>
        ${statsHtml}
        ${orderBadgeHtml}
        ${blockTargetHtml}
    </div>`;
}

function uiRenderHome() {
    document.getElementById('ui-gold').innerText = SYS.gold; document.getElementById('shop-gold').innerText = SYS.gold;
    document.getElementById('stage-list').innerHTML = DB_CPU.map(cpu => `<div style="background:#222; margin:10px auto; padding:15px; border-radius:8px; width:90%; border:1px solid #555;"><h3 style="margin:0 0 5px 0;">${cpu.name}</h3><p style="font-size:0.8rem; color:#aaa;">${cpu.desc}</p><button class="btn btn-red" style="width:100%;" onclick="batStart('${cpu.id}')">挑戦する (報酬:${cpu.reward}G)</button></div>`).join('');
}

function uiRenderShopMenu() {
    document.getElementById('shop-gold').innerText = SYS.gold; document.getElementById('gacha-result').innerHTML = '';
    document.getElementById('shop-packs').innerHTML = DB_PACKS.map(pack => `<div style="background:#222; padding:15px; border-radius:8px; border:1px solid #555; width: 100%; max-width: 300px; margin: 0 auto 10px;"><h3 style="margin:0 0 5px 0;">${pack.name}</h3><button class="btn btn-gold" style="width:100%; margin:0;" onclick="sysBuyPack('${pack.id}')">📦 パックを引く (${pack.cost}G)</button></div>`).join('');
}

function uiRenderShopResult(resultIds) { document.getElementById('shop-gold').innerText = SYS.gold; document.getElementById('gacha-result').innerHTML = resultIds.map(id => uiGenCardHTML(DB_CARDS[id], 'shop')).join(''); }

// 【ui.js 置き換え箇所：uiRenderDeck 関数とその周辺】

// ▼ 追加：属性ごとの表示・非表示を記憶する状態変数 ▼
let uiDeckPoolFilter = { fire: true, forest: true, water: true, light: true, dark: true };

// ▼ 追加：見出しをクリックしたときに表示を切り替える関数 ▼
function uiTogglePool(color) {
    uiDeckPoolFilter[color] = !uiDeckPoolFilter[color];
    uiRenderDeck();
}

function uiRenderDeck() {
    let dEl = document.getElementById('deck-active');
    let pEl = document.getElementById('deck-pool');
    document.getElementById('deck-count').innerText = editDeck.length;

    let deckCounts = {};
    editDeck.forEach(id => deckCounts[id] = (deckCounts[id] || 0) + 1);

    // コスト順に並び替え
    let sortFunc = (a, b) => (DB_CARDS[a].cost || 0) - (DB_CARDS[b].cost || 0);
    const ATTR_COLORS = { 'fire':'#e03131', 'forest':'#2b8a3e', 'water':'#1c7ed6', 'light':'#fcc419', 'dark':'#6741d9' };
    
    // 1. デッキの描画（変更なし・バッジの色だけ属性カラーに対応）
    let uniqueDeckIds = Object.keys(deckCounts).sort(sortFunc);
    let dHtml = '';
    uniqueDeckIds.forEach(id => {
        let col = DB_CARDS[id].color;
        let badgeBg = ATTR_COLORS[col] || '#555';
        let badgeCol = col === 'light' ? 'black' : 'white'; // 光属性だけ文字を黒にして見やすく
        let cardHtml = uiGenCardHTML(DB_CARDS[id], 'deck_active', false);
        dHtml += `<div style="position:relative; display:inline-block; margin: 4px;">
                    ${cardHtml}
                    <div style="position:absolute; top:-8px; right:-8px; background:${badgeBg}; color:${badgeCol}; border-radius:50%; width:28px; height:28px; text-align:center; line-height:28px; font-weight:bold; font-size:0.9rem; z-index:10; box-shadow:0 2px 4px rgba(0,0,0,0.5);">×${deckCounts[id]}</div>
                  </div>`;
    });
    dEl.innerHTML = dHtml;

    // 2. 所持プールの描画（属性ごとのグループ化＆折りたたみ機能）
    let uniquePoolIds = Object.keys(editPool).filter(id => editPool[id] > 0).sort(sortFunc);
    let pHtml = '';
    const colors = ['fire', 'forest', 'water', 'light', 'dark'];
    const ATTR_NAMES = { 'fire':'🔥 火属性', 'forest':'🌲 森属性', 'water':'💧 水属性', 'light':'✨ 光属性', 'dark':'🌑 闇属性' };

    colors.forEach(col => {
        // その属性のカードだけを抽出
        let cardsInColor = uniquePoolIds.filter(id => DB_CARDS[id].color === col);
        if(cardsInColor.length === 0) return; // 持っていない属性の見出しは表示しない

        let isVisible = uiDeckPoolFilter[col];
        let arrow = isVisible ? '▼' : '▶';
        
        // ▼ 開閉できる見出し（クリックで uiTogglePool を呼ぶ） ▼
        pHtml += `<div style="background:#333; color:white; padding:8px 15px; margin-top:10px; cursor:pointer; border-radius: 5px; border-left: 5px solid ${ATTR_COLORS[col]}; font-weight: bold;" onclick="uiTogglePool('${col}')">
                    ${arrow} ${ATTR_NAMES[col]} <span style="font-size: 0.8em; color: #ccc; margin-left: 10px;">(全 ${cardsInColor.length} 種類)</span>
                  </div>`;
        
        // ▼ カード一覧（isVisible が true のときだけ中身を描画） ▼
        if (isVisible) {
            pHtml += `<div style="padding: 10px 5px; display:flex; flex-wrap:wrap; background:#1a1a1a; border-radius: 0 0 5px 5px; margin-bottom: 10px;">`;
            cardsInColor.forEach(id => {
                let badgeCol = col === 'light' ? 'black' : 'white';
                let cardHtml = uiGenCardHTML(DB_CARDS[id], 'deck_pool', false);
                pHtml += `<div style="position:relative; display:inline-block; margin: 4px;">
                            ${cardHtml}
                            <div style="position:absolute; top:-8px; right:-8px; background:${ATTR_COLORS[col]}; color:${badgeCol}; border-radius:50%; width:28px; height:28px; text-align:center; line-height:28px; font-weight:bold; font-size:0.9rem; z-index:10; box-shadow:0 2px 4px rgba(0,0,0,0.5);">×${editPool[id]}</div>
                          </div>`;
            });
            pHtml += `</div>`;
        }
    });
    pEl.innerHTML = pHtml;
}

const PHASE_JP = { 'UNTAP':'アンタップ', 'DRAW':'ドロー', 'MAIN1':'メイン1', 'TARGETING':'【対象を選択】', 'ATTACK':'攻撃', 'BLOCK':'防御', 'ORDER_BLOCKERS':'【順番決定】', 'MAIN2':'メイン2', 'END':'終了' };

function uiRenderBattle() {
    document.getElementById('b-cpu-header-content').innerHTML = `<span onclick="batSelectTarget({type:'player', id:'cpu'})" style="${BAT.phase==='TARGETING'?'cursor:pointer; color:#fcc419; animation:pulse 1s infinite;':''}">🌲 CPU: ♥${BAT.cpu.life} 🃏${BAT.cpu.hand.length}枚</span>`;
    document.getElementById('b-player-header-content').innerHTML = `<span onclick="batSelectTarget({type:'player', id:'player'})" style="${BAT.phase==='TARGETING'?'cursor:pointer; color:#fcc419; animation:pulse 1s infinite;':''}">🔥 あなた: ♥${BAT.player.life}</span> <button class="btn btn-small" style="background:#e03131; margin-left:10px; font-weight:bold;" onclick="batSurrender()">🏳 降参</button>`;
    
    document.getElementById('b-deck-count').innerText = BAT.player.deck.length; document.getElementById('b-phase').innerText = PHASE_JP[BAT.phase] || '';

    document.getElementById('b-player-lands').innerHTML = BAT.player.lands.map(c => uiGenCardHTML(c, 'field', true)).join('');
    document.getElementById('b-player-creatures').innerHTML = BAT.player.creatures.map(c => uiGenCardHTML(c, 'field', true)).join('');
    document.getElementById('b-cpu-lands').innerHTML = BAT.cpu.lands.map(c => uiGenCardHTML(c, 'field', false)).join('');
    document.getElementById('b-cpu-creatures').innerHTML = BAT.cpu.creatures.map(c => uiGenCardHTML(c, 'field', false)).join('');
    document.getElementById('b-player-hand').innerHTML = BAT.player.hand.map(c => uiGenCardHTML(c, 'hand', true)).join('');

    let btn = document.getElementById('b-action-btn');
    if (BAT.active && BAT.isProcessing) { btn.innerText = "処理中..."; btn.disabled = true; btn.className = "btn"; } 
    else {
        if(BAT.turn === 'PLAYER') {
            if(BAT.phase === 'MAIN1') { btn.innerText = "▶ 攻撃フェイズへ"; btn.disabled = false; btn.className = "btn btn-red"; btn.onclick = batPlayerAction;}
            else if(BAT.phase === 'ATTACK') { btn.innerText = "⚔ 攻撃を確定"; btn.disabled = false; btn.className = "btn btn-red"; btn.onclick = batPlayerAction;}
            else if(BAT.phase === 'MAIN2') { btn.innerText = "▶ ターン終了"; btn.disabled = false; btn.className = "btn btn-gold"; btn.onclick = batPlayerAction;}
            else if(BAT.phase === 'TARGETING') { btn.innerText = "✖ キャンセル"; btn.disabled = false; btn.className = "btn"; btn.onclick = batCancelTargeting; }
            else if(BAT.phase === 'ORDER_BLOCKERS') { btn.innerText = "順番を選択中..."; btn.disabled = true; btn.className = "btn"; }
            else { btn.innerText = "処理中..."; btn.disabled = true; btn.className = "btn";}
        } else {
            if(BAT.phase === 'BLOCK') { btn.innerText = "🛡 ブロック確定"; btn.disabled = false; btn.className = "btn btn-play"; btn.onclick = batPlayerAction;}
            else { btn.innerText = "敵のターン中..."; btn.disabled = true; btn.className = "btn"; }
        }
    }

    requestAnimationFrame(() => {
        uiDrawBlockLines();
        setTimeout(uiDrawBlockLines, 50);
        setTimeout(uiDrawBlockLines, 150);
    });
}

function uiDrawBlockLines() {
    let svg = document.getElementById('combat-lines');
    if (!svg) return;
    
    let linesHtml = "";
    if (!BAT.active || (BAT.phase !== 'BLOCK' && BAT.phase !== 'ORDER_BLOCKERS' && BAT.phase !== 'ATTACK')) {
        svg.innerHTML = ''; return;
    }

    let bf = document.querySelector('.battlefield').getBoundingClientRect();
    if (bf.width === 0 || bf.height === 0) return;

    for (let atkUid in BAT.combat.blockerMap) {
        let blockers = BAT.combat.blockerMap[atkUid];
        if (!blockers || blockers.length === 0) continue;

        let atkEl = document.querySelector(`div[data-uid="${atkUid}"]`);
        if (!atkEl) continue;
        let atkRect = atkEl.getBoundingClientRect();
        let atkX = atkRect.left + atkRect.width / 2 - bf.left;
        let atkY = atkRect.top + atkRect.height / 2 - bf.top;

        blockers.forEach(blkUid => {
            let blkEl = document.querySelector(`div[data-uid="${blkUid}"]`);
            if (!blkEl) return;
            let blkRect = blkEl.getBoundingClientRect();
            let blkX = blkRect.left + blkRect.width / 2 - bf.left;
            let blkY = blkRect.top + blkRect.height / 2 - bf.top;

            linesHtml += `<line x1="${blkX}" y1="${blkY}" x2="${atkX}" y2="${atkY}" stroke="#ff6b6b" stroke-width="3" stroke-dasharray="6,4" />`;
            linesHtml += `<circle cx="${atkX}" cy="${atkY}" r="5" fill="#ff6b6b" />`;
        });
    }
    
    svg.innerHTML = linesHtml;
}
// 【ui.js 追加箇所：ファイルの一番下など】

// --- ▼ ここから追加：エフェクト表示用関数 ▼ ---
function uiPlayAnim(targetObj, animClass, floatText = '') {
    let el = null;
    
    // 対象のHTML要素を特定
    if (targetObj.uid) {
        el = document.querySelector(`div[data-uid="${targetObj.uid}"]`);
    } else if (targetObj.life !== undefined) {
        // プレイヤーまたはCPU（簡易判定）
        el = document.getElementById(targetObj === BAT.player ? 'b-player-header-content' : 'b-cpu-header-content');
    }

    if (el) {
        // アニメーションのリセットと再適用
        el.classList.remove(animClass);
        void el.offsetWidth; // リフロー強制（アニメーションを連続で再生させるため）
        el.classList.add(animClass);
        setTimeout(() => el.classList.remove(animClass), 600);
        
        // 浮かび上がるテキスト（ダメージや回復量）の表示
        if (floatText) {
            let rect = el.getBoundingClientRect();
            let textEl = document.createElement('div');
            textEl.className = 'floating-text';
            textEl.innerText = floatText;
            textEl.style.left = (rect.left + rect.width / 2 - 15) + 'px';
            textEl.style.top = (rect.top) + 'px';
            
            if (floatText.includes('-')) textEl.style.color = '#ff6b6b';
            else if (floatText.includes('+')) textEl.style.color = '#20c997';
            else textEl.style.color = '#fcc419';
            
            document.body.appendChild(textEl);
            setTimeout(() => textEl.remove(), 1000);
        }
    }
}
// --- ▲ ここまで追加 ▲ ---
// --- ▼ ここから追加：プレイヤーダメージ・キャスト演出 ▼ ---
function uiShowPlayerDamage(isPlayer, amount) {
    let flash = document.getElementById('damage-flash');
    if(flash) { flash.classList.add('flash'); setTimeout(() => flash.classList.remove('flash'), 300); }
    
    let elId = isPlayer ? 'b-player-header-content' : 'b-cpu-header-content';
    let el = document.getElementById(elId);
    if (el) {
        el.classList.remove('anim-damage'); void el.offsetWidth; el.classList.add('anim-damage');
        let rect = el.getBoundingClientRect();
        let textEl = document.createElement('div');
        textEl.className = 'floating-text'; textEl.innerText = `-${amount}`; textEl.style.color = '#ff6b6b';
        textEl.style.left = (rect.left + rect.width / 2 - 20) + 'px';
        textEl.style.top = (rect.top + 10) + 'px';
        document.body.appendChild(textEl);
        setTimeout(() => textEl.remove(), 1000);
    }
}

async function uiShowCastSequence(card, targetObj) {
    let overlay = document.getElementById('cast-overlay');
    let container = document.getElementById('cast-card-container');
    let svg = document.getElementById('cast-lines');
    if(!overlay || !container || !svg) return;

    // 画面右側に大きく表示するためのカードHTML生成（操作不能状態）
    container.innerHTML = uiGenCardHTML(card, 'display');
    overlay.style.display = 'block'; svg.innerHTML = '';

    await new Promise(r => setTimeout(r, 50)); // 描画完了を待つ

    if (targetObj) {
        let fromRect = container.firstElementChild.getBoundingClientRect();
        let fromX = fromRect.left; let fromY = fromRect.top + fromRect.height / 2;

        let toRect = null;
        if (targetObj.type === 'creature') {
            let tEl = document.querySelector(`div[data-uid="${targetObj.uid}"]`);
            if(tEl) toRect = tEl.getBoundingClientRect();
        } else if (targetObj.type === 'player') {
            let idStr = targetObj.id === 'player' ? 'b-player-header-content' : 'b-cpu-header-content';
            let tEl = document.getElementById(idStr);
            if(tEl) toRect = tEl.getBoundingClientRect();
        }

        if (toRect) {
            let toX = toRect.left + toRect.width / 2; let toY = toRect.top + toRect.height / 2;
            svg.innerHTML = `
            <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" stroke="#fcc419" stroke-width="4" stroke-dasharray="10,10">
                <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.5s" repeatCount="indefinite" />
            </line>
            <circle cx="${toX}" cy="${toY}" r="25" fill="none" stroke="#e03131" stroke-width="4">
                <animate attributeName="r" from="15" to="40" dur="0.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="1" to="0" dur="0.6s" repeatCount="indefinite"/>
            </circle>`;
        }
    }

    await new Promise(r => setTimeout(r, 1200)); // 演出を見せる時間
    overlay.style.display = 'none'; svg.innerHTML = ''; container.innerHTML = '';
}
// --- ▲ 追加ここまで ▲ ---

// 【ui.js 追加箇所：ファイルの一番下など】

// --- ▼ 追加：ステージ選択画面の描画 ▼ ---
function uiRenderBattleMenu() {
    let html = '';
    let colors = ['fire', 'forest', 'water', 'light', 'dark'];
    let colorNames = {'fire':'🔥 火の試練', 'forest':'🌲 森の試練', 'water':'💧 水の試練', 'light':'✨ 光の試練', 'dark':'🌑 闇の試練'};
    let colorsCode = {'fire':'#e03131', 'forest':'#2b8a3e', 'water':'#1c7ed6', 'light':'#fcc419', 'dark':'#6741d9'};

    colors.forEach(col => {
        let progress = SYS.storyProgress[col]; // 現在の進行度
        
        html += `<h3 style="border-bottom: 2px solid ${colorsCode[col]}; padding-bottom:5px; margin-top:20px; text-align:left;">${colorNames[col]}</h3>`;
        html += `<div style="display:flex; flex-wrap:nowrap; overflow-x:auto; gap:10px; padding:10px 0;">`;
        
        for(let stage = 1; stage <= 5; stage++) {
            let isUnlocked = progress >= stage;
            let isCleared = progress > stage;
            let cpuObj = DB_CPU.find(c => c.id === `${col}_${stage}`);
            
            if (isUnlocked) {
                let btnStyle = `background: ${colorsCode[col]}; color: ${col === 'light' ? 'black' : 'white'}; min-width: 120px; flex-shrink: 0;`;
                let mark = isCleared ? '✅' : '⚔️';
                html += `<button class="btn" style="${btnStyle}" onclick="batStart('${col}_${stage}')">
                            ${mark} Stage ${stage}<br><small style="font-size:0.8rem">報酬: ${cpuObj.reward}G</small>
                         </button>`;
            } else {
                let btnStyle = `background: #444; color: #888; min-width: 120px; flex-shrink: 0; cursor: not-allowed; border: 2px dashed #666;`;
                html += `<button class="btn" style="${btnStyle}" disabled>🔒 Stage ${stage}</button>`;
            }
        }
        html += `</div>`;
    });
    
    document.getElementById('stage-list').innerHTML = html;
}
// --- ▲ 追加ここまで ▲ ---

// --- ▼ デバッグ：敵デッキ一覧表示＆グラフ視覚化機能（グラフ修正版） ▼ ---
function showDebugCpuDecks() {
    const container = document.getElementById('debug-cpu-list');
    let html = '';

    if (typeof DB_CPU === 'undefined' || DB_CPU.length === 0) {
        container.innerHTML = '<p style="text-align:center;">敵のデータが見つかりません。</p>';
        document.getElementById('modal-debug-cpu').style.display = 'flex';
        return;
    }

    DB_CPU.forEach(cpu => {
        if (cpu.id === 'tut_cpu') return; 

        html += `<div style="background: #333; padding: 15px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #555;">`;
        html += `<h3 style="margin: 0 0 10px 0; color: #3bc9db; font-size: 1.3rem;">${cpu.name}</h3>`;
        
        if (!cpu.deck || cpu.deck.length === 0) {
            html += `<p style="margin:0; color:#aaa;">デッキが設定されていません</p>`;
        } else {
            let costCounts = { '0':0, '1':0, '2':0, '3':0, '4':0, '5':0, '6+':0 };
            let rarityCounts = { 'C':0, 'U':0, 'R':0, 'M':0 };
            let landCount = 0;
            let totalCards = cpu.deck.length;

            cpu.deck.forEach(cardId => {
                let cardObj = (typeof DB_CARDS !== 'undefined' && DB_CARDS[cardId]) ? DB_CARDS[cardId] : 
                              (typeof SET1_CARDS !== 'undefined' && SET1_CARDS[cardId]) ? SET1_CARDS[cardId] : null;
                
                if(cardObj) {
                    let r = cardObj.rarity || 'C';
                    if(rarityCounts[r] !== undefined) rarityCounts[r]++;
                    
                    if(cardObj.type === 'LAND') {
                        landCount++;
                    } else {
                        let c = cardObj.cost || 0;
                        if(c >= 6) costCounts['6+']++;
                        else costCounts[c.toString()]++;
                    }
                }
            });

            let maxCostCount = Math.max(...Object.values(costCounts));
            if (maxCostCount === 0) maxCostCount = 1; 

            // ▼ 修正：マナカーブの描画（高さ指定を厳密にし、グラフらしい背景を追加） ▼
            html += `<h4 style="margin: 10px 0 5px; color: #fff; font-size: 0.95rem;">📊 マナカーブ <span style="font-size:0.7rem; color:#aaa;">(土地除く)</span></h4>`;
            
            // グラフの背景エリア（下線付き）
            html += `<div style="display: flex; align-items: flex-end; height: 100px; gap: 4px; padding-top: 15px; border-bottom: 2px solid #666; background: repeating-linear-gradient(0deg, transparent, transparent 19px, #444 19px, #444 20px);">`;
            
            for(let cost in costCounts) {
                let count = costCounts[cost];
                // 棒の高さ（0枚の時は0%）
                let heightPct = count > 0 ? (count / maxCostCount) * 100 : 0;
                
                // 棒グラフの1本 (height: 100% を追加して高さを確保)
                html += `<div style="flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; position: relative;">`;
                
                // 枚数ラベル（棒の上）
                html += `<span style="font-size: 0.75rem; color: #fcc419; font-weight: bold; margin-bottom: 2px;">${count > 0 ? count : ''}</span>`;
                
                // バー本体
                html += `<div style="width: 100%; max-width: 25px; height: ${heightPct}%; background: linear-gradient(to top, #1c7ed6, #4dabf7); border-radius: 4px 4px 0 0; box-shadow: 0 0 5px rgba(0,0,0,0.5); transition: height 0.3s;"></div>`;
                
                // コストの数字（棒の下、グラフの枠外に配置）
                html += `<span style="font-size: 0.8rem; color: #ddd; font-weight: bold; position: absolute; bottom: -20px;">${cost}</span>`;
                
                html += `</div>`;
            }
            html += `</div>`;
            // グラフ下の余白（コストの数字用）
            html += `<div style="height: 25px;"></div>`;

            // ▼ レアリティの描画（カラーバー） ▼
            html += `<h4 style="margin: 10px 0 5px; color: #fff; font-size: 0.95rem; border-bottom: 1px solid #555;">💎 レアリティ構成</h4>`;
            html += `<div style="display: flex; width: 100%; height: 16px; border-radius: 8px; overflow: hidden; margin-bottom: 5px; border: 1px solid #222;">`;
            
            let rColors = { 'C': '#868e96', 'U': '#74c0fc', 'R': '#fcc419', 'M': '#e03131' };
            let rLabels = { 'C': 'コモン', 'U': 'アンコモン', 'R': 'レア', 'M': '神話レア' };
            
            ['C', 'U', 'R', 'M'].forEach(r => {
                let count = rarityCounts[r];
                if(count > 0) {
                    let pct = (count / totalCards) * 100;
                    html += `<div style="width: ${pct}%; background-color: ${rColors[r]};" title="${rLabels[r]}: ${count}枚"></div>`;
                }
            });
            html += `</div>`;
            
            html += `<div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #ccc;">`;
            ['C', 'U', 'R', 'M'].forEach(r => {
                if(rarityCounts[r] > 0) {
                    html += `<span><span style="color:${rColors[r]}; font-size: 1.2rem; vertical-align: middle;">■</span>${rarityCounts[r]}</span>`;
                }
            });
            html += `</div>`;

            html += `<div style="margin-top: 15px; text-align: right; font-size: 0.9rem; color: #aaa;">`;
            html += `土地: <span style="color:#fff; font-weight:bold;">${landCount}</span> 枚 / 合計: <span style="color:#fcc419; font-weight:bold;">${totalCards}</span> 枚`;
            html += `</div>`;

            html += `<details style="margin-top: 10px; background: #222; border-radius: 5px; padding: 5px;">`;
            html += `<summary style="cursor: pointer; color: #8ce99a; font-size: 0.9rem; outline: none; padding: 5px;">📋 カードリスト詳細を見る</summary>`;
            html += `<div style="margin-top: 5px; max-height: 150px; overflow-y: auto; padding: 5px;">`;
            
            let cardCounts = {};
            cpu.deck.forEach(cardId => cardCounts[cardId] = (cardCounts[cardId] || 0) + 1);
            let cardList = [];
            for (let cardId in cardCounts) {
                let cardObj = (typeof DB_CARDS !== 'undefined' && DB_CARDS[cardId]) ? DB_CARDS[cardId] : 
                              (typeof SET1_CARDS !== 'undefined' && SET1_CARDS[cardId]) ? SET1_CARDS[cardId] : null;
                cardList.push({
                    id: cardId,
                    name: cardObj ? cardObj.name : '不明',
                    type: cardObj ? cardObj.type : '?',
                    cost: cardObj ? cardObj.cost : 99,
                    count: cardCounts[cardId]
                });
            }
            cardList.sort((a, b) => {
                if (a.type === 'LAND' && b.type !== 'LAND') return -1;
                if (a.type !== 'LAND' && b.type === 'LAND') return 1;
                return a.cost - b.cost;
            });

            html += `<ul style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #ddd; line-height: 1.5;">`;
            cardList.forEach(c => {
                let costStr = c.type === 'LAND' ? '🌍' : `🔹${c.cost}`;
                html += `<li>${c.name} <span style="color:#888;">(${costStr})</span> × ${c.count}</li>`;
            });
            html += `</ul>`;
            html += `</div></details>`;
        }
        html += `</div>`;
    });

    container.innerHTML = html;
    document.getElementById('modal-debug-cpu').style.display = 'flex';
}