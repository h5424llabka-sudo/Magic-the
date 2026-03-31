// 【effects.js まるごと置き換え】

// 【effects.js 修正箇所①：MagicEngine の先頭を上書き】

const MagicEngine = {
    async resolve(effectStr, playerObj, oppObj, initialTargetObj, sourceCard = null) {
        if (!effectStr) return;
        let effects = effectStr.split(','); 
        let isCpu = (playerObj === BAT.cpu); // CPUの行動かどうか判定
        
        // 1回目の効果は最初に選んだ対象を使用
        let currentTargetObj = initialTargetObj;

        for (let i = 0; i < effects.length; i++) {
            let eStr = effects[i];
            let parts = eStr.trim().split('_'); 
            let eff = parts[0]; let rule = parts[1]; 
            let val1 = parseInt(parts[2]) || 0; 
            let val2 = parseInt(parts[3] || parts[2]) || 0;
            
            // ▼ 2回目以降で「対象を取る効果」の場合、新しく対象を選ばせる ▼
            if (i > 0 && ['cr', 'p', 'any'].includes(rule)) {
                currentTargetObj = await this.waitForNextTarget(rule, playerObj, oppObj, isCpu);
                if (!currentTargetObj) continue; // 対象がいなければこの効果をスキップ
            }

            let tCr = null; let tP = null;
            if (currentTargetObj) {
                if(currentTargetObj.type === 'creature') tCr = playerObj.creatures.find(c=>c.uid === currentTargetObj.uid) || oppObj.creatures.find(c=>c.uid === currentTargetObj.uid); 
                else if(currentTargetObj.type === 'player') tP = currentTargetObj.id === (playerObj === BAT.cpu ? 'cpu' : 'player') ? playerObj : oppObj; 
            }

            if (this[eff]) {
                await this[eff](rule, val1, val2, playerObj, oppObj, tCr, tP, sourceCard);
                if (typeof uiRenderBattle === 'function') uiRenderBattle();
                await new Promise(r => setTimeout(r, 600)); 
            } else {
                console.warn("未実装の能力です:", eff);
            }
        }
    },

    // ▼ 追加：連続効果の際に途中で対象を選ばせる関数 ▼
    async waitForNextTarget(rule, playerObj, oppObj, isCpu) {
        // 選べる対象が場にいるか事前チェック（誰もいないなら自動スキップ）
        let validCount = 0;
        if (rule === 'cr' || rule === 'any') validCount += playerObj.creatures.length + oppObj.creatures.length;
        if (rule === 'p' || rule === 'any') validCount += 2;
        if (validCount === 0) return null;

        if (isCpu) {
            // CPUはランダムに自動選択
            await new Promise(r => setTimeout(r, 600));
            let valid = [];
            if (rule === 'cr' || rule === 'any') {
                valid.push(...playerObj.creatures.map(c => ({type:'creature', uid: c.uid})));
                valid.push(...oppObj.creatures.map(c => ({type:'creature', uid: c.uid})));
            }
            if (rule === 'p' || rule === 'any') {
                valid.push({type:'player', id:'player'}, {type:'player', id:'cpu'});
            }
            return valid[Math.floor(Math.random() * valid.length)];
        } else {
            // プレイヤーの入力待ち状態にする
            uiShowMsg("連続効果！次の対象を選んでください", 0); // 0は文字を自動で消さない設定
            return new Promise(resolve => {
                // グローバル変数に「待機状態」をセット
                window._midEffectTargetResolve = resolve;
                window._midEffectTargetRule = rule;
            });
        }
    },

    // ... （これ以降の dmg: などの処理はそのまま残してください）

    dmg: (rule, v1, v2, p, opp, tCr, tP) => {
        if(rule === 'allcr') { p.creatures.concat(opp.creatures).forEach(c => c.damage += v1); uiShowMsg(`💥 全体に${v1}ダメージ！`); }
        else if(tCr) { tCr.damage += v1; uiShowMsg(`💥 ${v1}ダメージ！`); }
        else if(tP) { tP.life -= v1; uiShowMsg(`💥 ${v1}ダメージ！`); }
        else if(rule === 'p') { opp.life -= v1; uiShowMsg(`💥 ${v1}ダメージ！`); }
    },
    heal: (rule, v1, v2, p) => { p.life += v1; uiShowMsg(`✨ ${v1}回復！`); },
    draw: async (rule, v1, v2, p) => { 
        uiShowMsg(`🃏 ${v1}ドロー`);
        for(let d=0; d<v1; d++) { if(p.deck.length > 0) { p.hand.push(p.deck.pop()); uiRenderBattle(); await new Promise(r=>setTimeout(r,400)); } }
    },
    buff: (rule, v1, v2, p, opp, tCr) => { if(tCr) { tCr.power += v1; tCr.toughness += v2; uiShowMsg(`💪 単体強化！`); } },
    buffall: (rule, v1, v2, p) => { p.creatures.forEach(c => { c.power += v1; c.toughness += v2; }); uiShowMsg(`💪 全体強化！`); },
    buffself: (rule, v1, v2, p, opp, tCr, tP, sourceCard) => { if(sourceCard) { sourceCard.power += v1; sourceCard.toughness += v2; uiShowMsg(`🔥 自己強化！`); } },
    drain: (rule, v1, v2, p, opp, tCr, tP) => {
        if(tCr) { tCr.damage += v1; p.life += v1; } else if(tP) { tP.life -= v1; p.life += v1; } else if(rule === 'p') { opp.life -= v1; p.life += v1; }
        uiShowMsg(`🦇 ${v1}吸収！`);
    },
    destroy: (rule, v1, v2, p, opp, tCr) => {
        if(rule === 'allcr') { p.creatures.forEach(c => c.damage += 999); opp.creatures.forEach(c => c.damage += 999); uiShowMsg(`💀 全破壊！`); }
        else if(tCr) { tCr.damage += 999; uiShowMsg(`💀 破壊！`); }
    },
    // ▼ バウンス時のトークンエラー防止 ▼
    bounce: (rule, v1, v2, p, opp, tCr) => {
        let resetCard = (c) => {
            let base = DB_CARDS[c.idKey];
            if (base) { c.power = base.power; c.toughness = base.toughness; c.abilities = [...(base.abilities || [])]; }
            c.damage = 0; c.tapped = false; c.sickness = false; return c;
        };
        if(rule === 'allcr') {
            p.creatures.forEach(c => { if(DB_CARDS[c.idKey]) p.hand.push(resetCard(c)); }); 
            opp.creatures.forEach(c => { if(DB_CARDS[c.idKey]) opp.hand.push(resetCard(c)); });
            p.creatures = []; opp.creatures = []; uiShowMsg(`🌊 全バウンス！`);
        } else if(tCr) {
            if(p.creatures.includes(tCr)) { p.creatures = p.creatures.filter(c=>c.uid!==tCr.uid); if(DB_CARDS[tCr.idKey]) p.hand.push(resetCard(tCr)); }
            else { opp.creatures = opp.creatures.filter(c=>c.uid!==tCr.uid); if(DB_CARDS[tCr.idKey]) opp.hand.push(resetCard(tCr)); }
            uiShowMsg(`🌊 手札に戻した！`);
        }
    },
    tap: (rule, v1, v2, p, opp) => { if(rule === 'opp') { opp.creatures.forEach(c => c.tapped = true); uiShowMsg(`💤 敵全員タップ！`); } },
    // ▼ マナ加速が複数枚に対応 ▼
    ramp: (rule, v1, v2, p) => {
        let count = Math.max(1, v1); let ramped = 0;
        for(let i=0; i<count; i++) {
            let landIdx = p.deck.findIndex(c => c.type === 'LAND');
            if(landIdx >= 0) { let land = p.deck.splice(landIdx, 1)[0]; land.tapped = true; p.lands.push(land); ramped++; }
        }
        if (ramped > 0) uiShowMsg(`🌱 ${ramped}マナ加速！`);
    },
    discard: (rule, v1, v2, p, opp) => { for(let i=0; i<v1; i++) { if(opp.hand.length > 0) { let rIdx = Math.floor(Math.random() * opp.hand.length); opp.hand.splice(rIdx, 1); uiShowMsg(`🗑 ハンデス！`); } } },
    // ▼ トークン生成 ▼
    token: (rule, v1, v2, p) => {
        uiShowMsg(`🐣 トークン生成！`);
        let token = { 
            uid: ++uidCounter, idKey: 'token', name: 'トークン', type: 'CREATURE', color: 'light', cost: 0, 
            power: v1, toughness: v2, 
            // ▼ 追加：ターン終了時のリセット用に基本値を記憶させておく ▼
            basePower: v1, baseToughness: v2, 
            haste: false, rarity: 'C', text: '生成されたトークン', abilities: [], tapped: false, sickness: true, damage: 0, state: 'normal', deathtouchKilled: false 
        };
        p.creatures.push(token);
    }
};

const AbilityManager = {
    async triggerETB(card, playerObj, oppObj, targetObj = null) {
        if (card.triggered && card.triggered.condition === 'etb') {
            uiShowMsg(`✨ ${card.name}の登場時能力！`, 1500);
            await MagicEngine.resolve(card.triggered.effect, playerObj, oppObj, targetObj, card);
        }
    },
    async triggerDeath(card, playerObj, oppObj) {
        if (card.triggered && card.triggered.condition === 'death') {
            uiShowMsg(`👻 ${card.name}の死亡時能力！`, 1500);
            await MagicEngine.resolve(card.triggered.effect, playerObj, oppObj, null, card);
        }
    },
    // ▼ ターン開始時の誘発 ▼
    async triggerUpkeep(playerObj, oppObj) {
        for (let c of playerObj.creatures) {
            if (c.triggered && c.triggered.condition === 'upkeep') {
                uiShowMsg(`⏳ ${c.name}の開始時誘発！`, 1500);
                await MagicEngine.resolve(c.triggered.effect, playerObj, oppObj, null, c);
            }
        }
    },
    async resolveActivated(card, playerObj, oppObj, targetObj) {
        if (card.activated) await MagicEngine.resolve(card.activated.effect, playerObj, oppObj, targetObj, card);
    }
};

// 【effects.js 修正箇所②：ファイルの一番下に追記】

// ▼ 連続効果のためのクリック乗っ取りシステム ▼
if (!window._patchedForMultiTarget) {
    window._patchedForMultiTarget = true;
    
    // クリーチャークリックの監視
    const origBatClickCreature = window.batClickCreature;
    if (typeof window.batClickCreature === 'function') {
        window.batClickCreature = function(uid, isCpuField) {
            // 連続効果の待機中であれば、クリックを「対象選択」として処理
            if (window._midEffectTargetResolve) {
                let rule = window._midEffectTargetRule;
                if (rule === 'p') { uiShowMsg("プレイヤーを選んでください！", 1500); return; }
                
                uiShowMsg("対象を決定しました！", 1000);
                let resolveFn = window._midEffectTargetResolve;
                window._midEffectTargetResolve = null; // 待機状態を解除
                resolveFn({ type: 'creature', uid: uid });
                return; // 本来の攻撃などの処理をここでキャンセル
            }
            origBatClickCreature(uid, isCpuField);
        };
    }

    // プレイヤークリックの監視
    const origBatClickPlayer = window.batClickPlayer;
    if (typeof window.batClickPlayer === 'function') {
        window.batClickPlayer = function(isCpuField) {
            // 連続効果の待機中であれば、クリックを「対象選択」として処理
            if (window._midEffectTargetResolve) {
                let rule = window._midEffectTargetRule;
                if (rule === 'cr') { uiShowMsg("クリーチャーを選んでください！", 1500); return; }
                
                uiShowMsg("対象を決定しました！", 1000);
                let resolveFn = window._midEffectTargetResolve;
                window._midEffectTargetResolve = null;
                resolveFn({ type: 'player', id: isCpuField ? 'cpu' : 'player' });
                return;
            }
            origBatClickPlayer(isCpuField);
        };
    }
}