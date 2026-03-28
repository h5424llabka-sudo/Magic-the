const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// 【battle.js 追加箇所：先頭付近】
// --- ▼ 追加：マナ支払い関連の関数 ▼ ---
function batCanPayMana(card, playerObj) {
    if (card.type === 'LAND' || card.cost === 0) return true;
    let untappedLands = playerObj.lands.filter(l => !l.tapped);
    let colorLands = untappedLands.filter(l => l.color === card.color);
    
    // 色マナと全体の土地の数が足りているか
    return (colorLands.length >= card.colorCost && untappedLands.length >= card.cost);
}

function batPayMana(card, playerObj) {
    if (card.type === 'LAND' || card.cost === 0) return;
    let untappedLands = playerObj.lands.filter(l => !l.tapped);
    let colorLands = untappedLands.filter(l => l.color === card.color);
    
    // 1. 色マナの支払い
    let paidColor = 0;
    colorLands.forEach(l => {
        if (paidColor < card.colorCost) {
            l.tapped = true;
            paidColor++;
        }
    });
    
    // 2. 残りの無色マナの支払い
    let paidAny = 0;
    playerObj.lands.filter(l => !l.tapped).forEach(l => {
        if (paidAny < card.anyCost) {
            l.tapped = true;
            paidAny++;
        }
    });
}
// --- ▲ 追加ここまで ▲ ---

//const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let BAT = {
    active: false, turn: 'PLAYER', phase: 'INIT', prevPhase: 'INIT', isProcessing: false,
    player: { life: 15, deck: [], hand: [], lands: [], creatures: [], landPlayed: false },
    cpu: { life: 15, deck: [], hand: [], lands: [], creatures: [], landPlayed: false, id: null, reward: 0 },
    combat: { attackers: [], blockerMap: {} }, pendingSpell: null, pendingAbility: null, orderingList: [], currentOrderAttacker: null, currentOrderSelected: [],
    isFirstTurn: true // ▼ 追加：先攻1ターン目のドロー制御用 ▼
};
let uidCounter = 0;
function createBattleCard(idKey) { let data = DB_CARDS[idKey]; return { uid: ++uidCounter, idKey: idKey, ...data, abilities: data.abilities || [], tapped: false, sickness: false, damage: 0, state: 'normal', deathtouchKilled: false }; }
function batFindCard(uid) { return BAT.player.hand.find(c=>c.uid===uid) || BAT.player.creatures.find(c=>c.uid===uid) || BAT.player.lands.find(c=>c.uid===uid) || BAT.cpu.creatures.find(c=>c.uid===uid) || BAT.cpu.lands.find(c=>c.uid===uid); }

// 【battle.js 置き換え箇所：batStart関数の前半部分】

function batStart(cpuId) {
    // ▼ 修正：現在選択しているデッキを参照する ▼
    let currentDeck = SYS.decks[SYS.currentDeckIndex];
// ▼ 修正：40枚未満は出撃不可に ▼
    if(currentDeck.length < 40) { uiShowMsg("デッキが40枚未満です！"); return; }
    
    let cpuData = DB_CPU.find(c => c.id === cpuId); BAT.cpu.id = cpuId; BAT.cpu.reward = cpuData.reward;
    
    BAT.player.life = 15; BAT.cpu.life = 15; 
    
    BAT.player.lands = []; BAT.player.creatures = []; BAT.player.hand = [];
    BAT.cpu.lands = []; BAT.cpu.creatures = []; BAT.cpu.hand = [];
    selectedDefenderUid = null; BAT.pendingSpell = null; BAT.pendingAbility = null; BAT.isProcessing = false;
    BAT.isFirstTurn = true;

    // ▼ 修正：現在のデッキをコピーしてシャッフル ▼
    BAT.player.deck = currentDeck.map(id => createBattleCard(id)).sort(()=>Math.random()-0.5);
    BAT.cpu.deck = cpuData.deck.map(id => createBattleCard(id)).sort(()=>Math.random()-0.5);
    
    // （※以下、for(let i=0; i<7; i++) の手札ドロー処理などはそのままです）
    
    // ▼ 変更：初期手札を7枚に ▼
    for(let i=0; i<7; i++) { 
        if (BAT.player.deck.length > 0) BAT.player.hand.push(BAT.player.deck.pop()); 
        if (BAT.cpu.deck.length > 0) BAT.cpu.hand.push(BAT.cpu.deck.pop()); 
    }
    
    changeScreen('screen-battle'); BAT.active = true; 
    
    // ▼ 変更：先攻後攻のランダム決定 ▼
    let isPlayerFirst = Math.random() < 0.5;
    if (isPlayerFirst) {
        uiShowMsg("あなたが先攻です！", 1500);
        batStartPlayerTurn();
    } else {
        uiShowMsg("敵が先攻です！", 1500);
        batStartCpuTurn();
    }
}

async function batStartPlayerTurn() {
    BAT.isProcessing = true; BAT.turn = 'PLAYER'; BAT.phase = 'UNTAP'; uiRenderBattle(); await sleep(300);
    BAT.player.lands.forEach(c => c.tapped = false); BAT.player.creatures.forEach(c => { c.tapped = false; c.sickness = false; }); BAT.player.landPlayed = false;
    // ▼▼▼ この行を追加 ▼▼▼
    await AbilityManager.triggerUpkeep(BAT.player, BAT.cpu);
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    BAT.phase = 'DRAW'; uiRenderBattle(); await sleep(300);
    
    // ▼ 変更：先攻1ターン目はドローしない ▼
    if (BAT.isFirstTurn) {
        BAT.isFirstTurn = false;
        uiShowMsg("先攻1ターン目：ドローなし", 1000);
        await sleep(500);
    } else {
        if(BAT.player.deck.length > 0) { BAT.player.hand.push(BAT.player.deck.pop()); uiRenderBattle(); await sleep(300); } else { batEndGame(false); return; }
    }
    
    BAT.phase = 'MAIN1'; BAT.isProcessing = false; uiRenderBattle(); uiShowMsg("あなたのターン！", 1000);
}

async function batCheckAndCleanDead() {
    let pDead = BAT.player.creatures.filter(c => c.damage >= c.toughness || c.deathtouchKilled);
    let cDead = BAT.cpu.creatures.filter(c => c.damage >= c.toughness || c.deathtouchKilled);
    BAT.player.creatures = BAT.player.creatures.filter(c => c.damage < c.toughness && !c.deathtouchKilled);
    BAT.cpu.creatures = BAT.cpu.creatures.filter(c => c.damage < c.toughness && !c.deathtouchKilled);

    for (let c of pDead) await AbilityManager.triggerDeath(c, BAT.player, BAT.cpu);
    for (let c of cDead) await AbilityManager.triggerDeath(c, BAT.cpu, BAT.player);
    
    if (BAT.player.creatures.some(c => c.damage >= c.toughness) || BAT.cpu.creatures.some(c => c.damage >= c.toughness)) await batCheckAndCleanDead();
    batCheckDeath();
}

async function batActivateAbility(uid) {
    if(BAT.isProcessing) return; uiCloseModal();
    let card = BAT.player.creatures.find(c => c.uid === uid); if(!card || !card.activated) return;
    
    let act = card.activated; 
    // ▼ 変更箇所：マナ判定 ▼
    let mockCard = { type: 'SPELL', cost: act.cost, color: card.color, colorCost: act.cost > 0 ? 1 : 0, anyCost: Math.max(0, act.cost - 1) }; // 仮のカードオブジェクトを作って判定
    if(!batCanPayMana(mockCard, BAT.player)) { uiShowMsg(`マナ（または ${ATTR_JP[card.color]} の色マナ）が足りません`); return; }
    if(act.tap && (card.tapped || card.sickness)) { uiShowMsg("タップ不可"); return; }
    
    BAT.isProcessing = true; uiRenderBattle();
    if (['any', 'cr', 'p'].includes(act.effect.split('_')[1])) {
        BAT.prevPhase = BAT.phase; BAT.phase = 'TARGETING'; BAT.pendingAbility = uid; BAT.isProcessing = false;
        uiRenderBattle(); uiShowMsg("対象を選択"); return;
    }
    await batResolveAbility(uid, null);
}

async function batResolveAbility(uid, targetObj, isCpuCast = false) {
    let playerObj = isCpuCast ? BAT.cpu : BAT.player; let oppObj = isCpuCast ? BAT.player : BAT.cpu;
    let card = playerObj.creatures.find(c => c.uid === uid); if (!card || !card.activated) return;
    
    // ▼ 追加：能力発動演出（カットインと対象への線引き） ▼
    await uiShowCastSequence(card, targetObj);

    let mockCard = { type: 'SPELL', cost: card.activated.cost, color: card.color, colorCost: card.activated.cost > 0 ? 1 : 0, anyCost: Math.max(0, card.activated.cost - 1) };
    batPayMana(mockCard, playerObj);
    if(card.activated.tap) card.tapped = true;
    
    await AbilityManager.resolveActivated(card, playerObj, oppObj, targetObj);
    
    if(!isCpuCast && BAT.phase === 'TARGETING') { BAT.phase = BAT.prevPhase; BAT.pendingAbility = null; }
    await batCheckAndCleanDead(); if (!isCpuCast && BAT.active) BAT.isProcessing = false; uiRenderBattle();
}

// 【battle.js 置き換え箇所①：batPlayCard 関数】

async function batPlayCard(uid) {
    if (BAT.isProcessing) return; BAT.isProcessing = true; uiRenderBattle(); 
    uiCloseModal(); let card = BAT.player.hand.find(c => c.uid === uid);
    
    if(card.type === 'LAND') {
        if(BAT.player.landPlayed) { uiShowMsg("土地は1ターン1枚"); BAT.isProcessing = false; uiRenderBattle(); return; }
        await batPayAndResolve(uid, null);
    } else {
        if(!batCanPayMana(card, BAT.player)) { uiShowMsg(`マナ（または ${ATTR_JP[card.color]} の色マナ）が足りません`); BAT.isProcessing = false; uiRenderBattle(); return; }
        
        // ▼ 修正：呪文だけでなく、対象を取るETBを持つクリーチャーもターゲット選択フェイズへ移行させる ▼
        let isTargetingSpell = card.type === 'SPELL' && ['any', 'cr', 'p'].includes(card.effect.split('_')[1]);
        let isTargetingETB = card.type === 'CREATURE' && card.triggered && card.triggered.condition === 'etb' && ['any', 'cr', 'p'].includes(card.triggered.effect.split('_')[1]);
        
        if(isTargetingSpell || isTargetingETB) {
            BAT.prevPhase = BAT.phase; BAT.phase = 'TARGETING'; BAT.pendingSpell = uid; BAT.isProcessing = false; uiRenderBattle(); uiShowMsg("対象を選択"); return;
        }
        await batPayAndResolve(uid, null);
    }
}

function batCancelTargeting() { BAT.phase = BAT.prevPhase; BAT.pendingSpell = null; BAT.pendingAbility = null; BAT.isProcessing = false; uiRenderBattle(); }

async function batSelectTarget(targetObj) {
    if (BAT.phase !== 'TARGETING' || BAT.isProcessing) return;
    BAT.isProcessing = true; uiRenderBattle();

    try {
        if (BAT.pendingSpell) {
            await batPayAndResolve(BAT.pendingSpell, targetObj, false);
        } else if (BAT.pendingAbility) {
            await batResolveAbility(BAT.pendingAbility, targetObj, false);
        }
    } catch (e) {
        console.error("ターゲット解決中にエラーが発生しました:", e);
        uiShowMsg("エラー発生: 処理を中断します");
    }
    
    // 万が一エラーが起きても、フリーズさせずに操作可能な状態に戻す安全装置
    if (BAT.phase === 'TARGETING') {
        BAT.phase = BAT.prevPhase;
        BAT.pendingSpell = null;
        BAT.pendingAbility = null;
    }
    BAT.isProcessing = false;
    uiRenderBattle();
}

// 【battle.js 置き換え箇所②：batPayAndResolve 関数】

async function batPayAndResolve(uid, targetObj, isCpuCast = false) {
    let playerObj = isCpuCast ? BAT.cpu : BAT.player; let oppObj = isCpuCast ? BAT.player : BAT.cpu;
    let handIdx = playerObj.hand.findIndex(c => c.uid === uid); 
    if (handIdx === -1) return; // エラー防止
    let card = playerObj.hand[handIdx];

    if(card.type !== 'LAND') {
        await uiShowCastSequence(card, targetObj);
    }
    
    // ▼ 修正：バグを防ぐため、効果を発動する「前」に手札から消す ▼
    playerObj.hand.splice(handIdx, 1); 
    
    if(card.type === 'LAND') { 
        playerObj.landPlayed = true; playerObj.lands.push(card); 
    } else {
        batPayMana(card, playerObj);
        
        if(card.type === 'CREATURE') { 
            card.sickness = !card.haste; playerObj.creatures.push(card); uiRenderBattle(); await sleep(300);
            await AbilityManager.triggerETB(card, playerObj, oppObj, targetObj); 
        } else if(card.type === 'SPELL') { 
            await MagicEngine.resolve(card.effect, playerObj, oppObj, targetObj); 
        }
    }
    
    if(!isCpuCast && BAT.phase === 'TARGETING') { BAT.phase = BAT.prevPhase; BAT.pendingSpell = null; }
    await batCheckAndCleanDead(); if (!isCpuCast && BAT.active) BAT.isProcessing = false; uiRenderBattle(); 
}

async function batPlayerAction() {
    if (BAT.isProcessing) return; BAT.isProcessing = true; uiRenderBattle(); 
    if(BAT.turn === 'PLAYER') {
        if(BAT.phase === 'MAIN1') { BAT.phase = 'ATTACK'; BAT.combat.attackers = []; BAT.isProcessing = false; uiRenderBattle(); uiShowMsg("攻撃する味方をタップ！", 1500); } 
        else if (BAT.phase === 'ATTACK') {
            BAT.combat.attackers.forEach(uid => { let c = BAT.player.creatures.find(cr=>cr.uid===uid); if (!c.abilities.includes('vigilance')) c.tapped = true; });
            if(BAT.combat.attackers.length > 0) { batCpuAutoBlock(); uiRenderBattle(); await sleep(1500); batCheckDamageOrder(); } else { BAT.phase = 'MAIN2'; BAT.isProcessing = false; uiRenderBattle(); }
        } else if (BAT.phase === 'MAIN2') { await batEndTurn(); }
    } else if (BAT.turn === 'CPU' && BAT.phase === 'BLOCK') { batCheckDamageOrder(); }
}

function batCheckDamageOrder() { BAT.orderingList = Object.keys(BAT.combat.blockerMap).filter(id => BAT.combat.blockerMap[id].length > 1); batNextOrder(); }

async function batNextOrder() {
    if (BAT.orderingList.length === 0) {
        await batResolveCombat(); uiRenderBattle(); await sleep(1500); BAT.phase = 'MAIN2'; uiRenderBattle(); await sleep(500);
        if(BAT.turn === 'CPU') { await playCpuMainPhase(); uiRenderBattle(); await sleep(1000); await batEndTurn(); } else { BAT.isProcessing = false; uiRenderBattle(); } return;
    }
    let atkId = BAT.orderingList[0];
    if (BAT.turn === 'CPU') {
        let defs = BAT.combat.blockerMap[atkId].map(uid => BAT.player.creatures.find(c=>c.uid===uid)).filter(Boolean).sort((a,b) => a.toughness - b.toughness);
        BAT.combat.blockerMap[atkId] = defs.map(c=>c.uid); BAT.orderingList.shift(); batNextOrder();
    } else { BAT.phase = 'ORDER_BLOCKERS'; BAT.currentOrderAttacker = atkId; BAT.currentOrderSelected = []; BAT.isProcessing = false; uiShowMsg("複数ブロックのダメージ順をタップ", 3000); uiRenderBattle(); }
}

async function batResolveCombat() {
    let atkPlayer = BAT.turn === 'PLAYER' ? BAT.player : BAT.cpu; let defPlayer = BAT.turn === 'PLAYER' ? BAT.cpu : BAT.player;
    let activeAttackers = BAT.combat.attackers.map(uid => atkPlayer.creatures.find(c => c.uid === uid)).filter(Boolean);

    const dealDamage = (source, targetCreature, defPlayerTarget, amount) => {
        if (amount <= 0) return;
        if (source.abilities.includes('lifelink')) { let owner = BAT.player.creatures.find(c=>c.uid===source.uid) ? BAT.player : BAT.cpu; owner.life += amount; }
        if (targetCreature) { targetCreature.damage += amount; if (source.abilities.includes('deathtouch')) targetCreature.deathtouchKilled = true; } 
        else if (defPlayerTarget) defPlayerTarget.life -= amount; 
    };

    const combatStep = (isFirstStrikeStep) => {
        let pendingDamage = []; 
        activeAttackers.forEach(attacker => {
            let blkUids = BAT.combat.blockerMap[attacker.uid] || []; let blockers = blkUids.map(id => defPlayer.creatures.find(c => c.uid === id)).filter(Boolean);
            let atkCanStrike = (isFirstStrikeStep === attacker.abilities.includes('first_strike')) && (attacker.damage < attacker.toughness && !attacker.deathtouchKilled);
            if (atkCanStrike) {
                if (blockers.length === 0) pendingDamage.push(() => dealDamage(attacker, null, defPlayer, attacker.power));
                else {
                    let remainingDmg = attacker.power;
                    blockers.forEach((blocker, idx) => {
                        if (remainingDmg <= 0) return;
                        let assignDmg = (idx === blockers.length - 1 && !attacker.abilities.includes('trample')) ? remainingDmg : Math.min(remainingDmg, Math.max((attacker.abilities.includes('deathtouch') ? 1 : blocker.toughness - blocker.damage), 0));
                        pendingDamage.push(() => dealDamage(attacker, blocker, null, assignDmg)); remainingDmg -= assignDmg;
                    });
                    if (attacker.abilities.includes('trample') && remainingDmg > 0) pendingDamage.push(() => dealDamage(attacker, null, defPlayer, remainingDmg)); 
                }
            }
            blockers.forEach(blocker => { if ((isFirstStrikeStep === blocker.abilities.includes('first_strike')) && (blocker.damage < blocker.toughness && !blocker.deathtouchKilled)) pendingDamage.push(() => dealDamage(blocker, attacker, null, blocker.power)); });
        });
        pendingDamage.forEach(action => action());
    };
    combatStep(true); combatStep(false); await batCheckAndCleanDead();
    atkPlayer.creatures.forEach(c => c.state = 'normal'); defPlayer.creatures.forEach(c => c.state = 'normal'); BAT.combat = { attackers: [], blockerMap: {} }; selectedDefenderUid = null; 
}

function batCpuAutoBlock() { 
    BAT.combat.blockerMap = {}; let availableBlockers = BAT.cpu.creatures.filter(c => !c.tapped);
    [...BAT.combat.attackers].sort((a,b) => (BAT.player.creatures.find(c=>c.uid===b)?.power||0) - (BAT.player.creatures.find(c=>c.uid===a)?.power||0)).forEach(atkUid => {
        let attacker = BAT.player.creatures.find(c => c.uid === atkUid); if (!attacker || availableBlockers.length === 0) return;
        let validBlockers = availableBlockers.filter(b => !attacker.abilities.includes('flying') || b.abilities.includes('flying') || b.abilities.includes('reach')); if (validBlockers.length === 0) return;
        BAT.combat.blockerMap[atkUid] = []; 
        
        // ▼ 賢いブロックAI：一方的に勝てる、または死なない壁（防衛など）なら積極的にブロック ▼
        let bestIdx = validBlockers.findIndex(b => b.power >= attacker.toughness && b.toughness > attacker.power && !attacker.abilities.includes('deathtouch'));
        if(bestIdx === -1) bestIdx = validBlockers.findIndex(b => b.toughness > attacker.power && !attacker.abilities.includes('deathtouch')); 
        if(bestIdx === -1) bestIdx = validBlockers.findIndex(b => b.power >= attacker.toughness || b.abilities.includes('deathtouch')); 
        if(bestIdx === -1 && BAT.cpu.life <= attacker.power) { validBlockers.sort((a,b) => a.power - b.power); bestIdx = 0; }
        
        if (bestIdx !== -1) { BAT.combat.blockerMap[atkUid].push(validBlockers[bestIdx].uid); validBlockers[bestIdx].state = 'blocking'; availableBlockers.splice(bestIdx, 1); }
    });
}

// 【battle.js 置き換え箇所③：playCpuMainPhase 関数】

async function playCpuMainPhase() {
    let lIdx = BAT.cpu.hand.findIndex(c=>c.type==='LAND'); if(lIdx >= 0 && !BAT.cpu.landPlayed) { BAT.cpu.lands.push(BAT.cpu.hand[lIdx]); BAT.cpu.hand.splice(lIdx,1); BAT.cpu.landPlayed = true;}
    for(let i=BAT.cpu.hand.length-1; i>=0; i--) {
        let c = BAT.cpu.hand[i]; let unLands = BAT.cpu.lands.filter(l=>!l.tapped);
        if(c.type!=='LAND' && unLands.length >= c.cost) {
            let targetObj = null; let effectStr = c.type === 'SPELL' ? c.effect : (c.type==='CREATURE' && c.triggered && c.triggered.condition==='etb' ? c.triggered.effect : null);
            
            // ▼ 賢い呪文AI：無駄打ちを防ぐ ▼
            if (effectStr) {
                if (effectStr.includes('heal') && BAT.cpu.life >= 15) continue; // ライフ満タンなら回復しない
                if (effectStr.includes('bounce_allcr') && BAT.player.creatures.length === 0) continue; // 敵がいないなら全体バウンスしない
                
                let rule = effectStr.split('_')[1];
                if (effectStr.startsWith('buff') || effectStr.startsWith('heal')) {
                    if (['any', 'cr'].includes(rule)) { let bt = [...BAT.cpu.creatures].sort((a,b)=>b.power - a.power)[0]; targetObj = bt ? { type: 'creature', uid: bt.uid } : (rule==='any' ? { type: 'player', id: 'cpu' } : null); } else if (rule === 'p') targetObj = { type: 'player', id: 'cpu' };
                } else {
                    if (['any', 'cr'].includes(rule)) { let bt = [...BAT.player.creatures].sort((a,b)=>b.power - a.power)[0]; targetObj = bt ? { type: 'creature', uid: bt.uid } : (rule==='any' ? { type: 'player', id: 'player' } : null); } else if (rule === 'p') targetObj = { type: 'player', id: 'player' };
                }
            }
            if(!effectStr || targetObj || !['any', 'cr', 'p'].includes(effectStr.split('_')[1])) { await batPayAndResolve(c.uid, targetObj, true); await sleep(500); }
        }
    }
}

// 【battle.js 置き換え箇所：batStartCpuTurn（下部）】

async function batStartCpuTurn() {
    BAT.isProcessing = true; BAT.turn = 'CPU'; BAT.phase = 'UNTAP'; BAT.cpu.lands.forEach(c => c.tapped = false); BAT.cpu.creatures.forEach(c => { c.tapped = false; c.sickness = false; }); BAT.cpu.landPlayed = false;
    // ▼▼▼ この行を追加 ▼▼▼
    await AbilityManager.triggerUpkeep(BAT.cpu, BAT.player);
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    BAT.phase = 'DRAW'; uiRenderBattle(); await sleep(300); 
    
    // ▼ 変更：先攻1ターン目はドローしない ▼
    if (BAT.isFirstTurn) {
        BAT.isFirstTurn = false;
        uiShowMsg("敵の先攻：ドローなし", 1000);
        await sleep(500);
    } else {
        if(BAT.cpu.deck.length > 0) { BAT.cpu.hand.push(BAT.cpu.deck.pop()); uiRenderBattle(); await sleep(300); } else { batEndGame(true); return; }
    }
    
    BAT.phase = 'MAIN1'; await playCpuMainPhase(); uiRenderBattle(); await sleep(1000);
    BAT.phase = 'ATTACK';
    BAT.cpu.creatures.forEach(c => { 
        if(!c.tapped && !c.sickness && !c.abilities.includes('defender')) { 
            let freeEater = BAT.player.creatures.filter(pc => !pc.tapped && (!c.abilities.includes('flying') || pc.abilities.includes('flying') || pc.abilities.includes('reach'))).find(pc => pc.power >= c.toughness && pc.toughness > c.power && !c.abilities.includes('deathtouch'));
            if (!freeEater) { c.state='attacking'; if(!c.abilities.includes('vigilance')) c.tapped=true; BAT.combat.attackers.push(c.uid); }
        }
    });
    uiRenderBattle(); await sleep(1000);
    if(BAT.combat.attackers.length > 0) { BAT.phase = 'BLOCK'; BAT.isProcessing = false; uiRenderBattle(); uiShowMsg("敵の攻撃！\nブロックを選択", 2000); return; }
    BAT.phase = 'MAIN2'; uiRenderBattle(); await sleep(500); await playCpuMainPhase(); uiRenderBattle(); await sleep(1000); await batEndTurn();
}

// 【battle.js 置き換え箇所：batEndTurn 関数】
async function batEndTurn() { 
    let resetStats = (c) => {
        let base = DB_CARDS[c.idKey];
        if (base) {
            c.power = base.power;
            c.toughness = base.toughness;
        } else if (c.basePower !== undefined) {
            // ▼ 修正：トークンなどのDBにないカードは、生成時の基本値に戻す ▼
            c.power = c.basePower;
            c.toughness = c.baseToughness;
        }
        c.damage = 0;
        c.deathtouchKilled = false;
    };

    BAT.player.creatures.forEach(resetStats); 
    BAT.cpu.creatures.forEach(resetStats); 

    BAT.phase = 'END'; 
    uiRenderBattle(); 
    await sleep(500); 

    if(BAT.turn === 'PLAYER') batStartCpuTurn(); 
    else batStartPlayerTurn(); 
}

function batCheckDeath() { if(BAT.cpu.life <= 0) batEndGame(true); else if(BAT.player.life <= 0) batEndGame(false); }
// 【battle.js 置き換え箇所：batEndGame 関数】

function batEndGame(isWin) { 
    BAT.active = false; 
    let m = document.getElementById('modal-result'); 
    
    if(isWin) { 
        document.getElementById('res-title').innerText = "勝利！"; 
        document.getElementById('res-reward').innerText = `+${BAT.cpu.reward} G`; 
        SYS.gold += BAT.cpu.reward; 
        
        // ▼ 追加：ストーリー進行度の更新と保存 ▼
        if (BAT.cpu.id) {
            let parts = BAT.cpu.id.split('_'); // 例: "fire", "1"
            if (parts.length === 2) {
                let color = parts[0];
                let stage = parseInt(parts[1]);
                if (SYS.storyProgress[color] === stage) {
                    SYS.storyProgress[color] = stage + 1; // 次のステージを解放
                }
            }
        }
        sysSaveData();
    } else { 
        document.getElementById('res-title').innerText = "敗北..."; 
        document.getElementById('res-reward').innerText = "+0 G"; 
        // 参加賞の10G追加処理を削除しました
        sysSaveData();
    } 
    m.style.display = 'flex'; 
}

// ▼追加: サレンダー機能▼
function batSurrender() {
    if (confirm("本当にサレンダー（降参）しますか？")) {
        batEndGame(false);
    }
}