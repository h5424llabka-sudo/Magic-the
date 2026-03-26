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

 // ③ 能力・効果テキスト（重複削除）
    let abs = []; if(c.haste) abs.push('速攻'); if(c.abilities) c.abilities.forEach(a => { if(ABILITY_JP[a]) abs.push(ABILITY_JP[a]); });
    let abHtml = abs.length > 0 ? `<b style="display:block; margin-bottom:2px;">${abs.join(', ')}</b>` : '';
    // ▼ 追加：元のテキストから【】で囲まれた部分を削除 ▼
    let cleanTextHTML = (c.text || '').replace(/【[^】]+】\n?/g, '').trim();
    let textHtml = `<div class="c-text-box-mtg">${abHtml}${cleanTextHTML}</div>`;
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

function uiRenderDeck() {
    let dEl = document.getElementById('deck-active');
    let pEl = document.getElementById('deck-pool');
    document.getElementById('deck-count').innerText = editDeck.length;

    // ▼ カードを種類ごとに集計 ▼
    let deckCounts = {};
    editDeck.forEach(id => deckCounts[id] = (deckCounts[id] || 0) + 1);

    // コスト順に並び替え
    let sortFunc = (a, b) => (DB_CARDS[a].cost || 0) - (DB_CARDS[b].cost || 0);
    
    // 1. デッキの描画（スタック表示）
    let uniqueDeckIds = Object.keys(deckCounts).sort(sortFunc);
    let dHtml = '';
    uniqueDeckIds.forEach(id => {
        let cardHtml = uiGenCardHTML(DB_CARDS[id], 'deck_active', false);
        dHtml += `<div style="position:relative; display:inline-block; margin: 4px;">
                    ${cardHtml}
                    <div style="position:absolute; top:-8px; right:-8px; background:#e03131; color:white; border-radius:50%; width:28px; height:28px; text-align:center; line-height:28px; font-weight:bold; font-size:0.9rem; z-index:10; box-shadow:0 2px 4px rgba(0,0,0,0.5);">×${deckCounts[id]}</div>
                  </div>`;
    });
    dEl.innerHTML = dHtml;

    // 2. 所持プールの描画（スタック表示）
    let uniquePoolIds = Object.keys(editPool).filter(id => editPool[id] > 0).sort(sortFunc);
    let pHtml = '';
    uniquePoolIds.forEach(id => {
        let cardHtml = uiGenCardHTML(DB_CARDS[id], 'deck_pool', false);
        pHtml += `<div style="position:relative; display:inline-block; margin: 4px;">
                    ${cardHtml}
                    <div style="position:absolute; top:-8px; right:-8px; background:#1c7ed6; color:white; border-radius:50%; width:28px; height:28px; text-align:center; line-height:28px; font-weight:bold; font-size:0.9rem; z-index:10; box-shadow:0 2px 4px rgba(0,0,0,0.5);">×${editPool[id]}</div>
                  </div>`;
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