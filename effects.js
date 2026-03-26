// 効果（魔法・起動・誘発）を実際に処理するエンジン
// 【effects.js 置き換え箇所：MagicEngine のすべて】

// 【effects.js 置き換え箇所：MagicEngine のすべて】

const MagicEngine = {
// ▼ 修正：sourceCard（能力の発動元）を受け取れるように拡張 ▼
    async resolve(effectStr, playerObj, oppObj, targetObj, sourceCard = null) {
        if (!effectStr) return;
        let parts = effectStr.split('_'); 
        let eff = parts[0]; let rule = parts[1]; 
        let val1 = parseInt(parts[2]) || 0; 
        let val2 = parseInt(parts[3] || parts[2]) || 0;
        
        let tCr = null; let tP = null;
        if (targetObj) {
            if(targetObj.type === 'creature') tCr = playerObj.creatures.find(c=>c.uid === targetObj.uid) || oppObj.creatures.find(c=>c.uid === targetObj.uid); 
            else if(targetObj.type === 'player') tP = targetObj.id === (playerObj === BAT.cpu ? 'cpu' : 'player') ? playerObj : oppObj; 
        }

        // sourceCard を引数に追加して実行
        if (this[eff]) await this[eff](rule, val1, val2, playerObj, oppObj, tCr, tP, sourceCard);
        else console.warn("未実装の能力です:", eff);
        
        uiRenderBattle();
    },

    dmg: async (rule, v1, v2, p, opp, tCr, tP) => {
        uiShowMsg(`💥 ${v1}ダメージ！`);
        if(rule === 'allcr') { p.creatures.concat(opp.creatures).forEach(c => c.damage += v1); }
        else if(tCr) { tCr.damage += v1; }
        else if(tP) { tP.life -= v1; uiShowPlayerDamage(tP === BAT.player, v1); } // プレイヤーへのダメージ表示
        else if(rule === 'p') { opp.life -= v1; uiShowPlayerDamage(opp === BAT.player, v1); } // プレイヤーへのダメージ表示
    },
    heal: async (rule, v1, v2, p) => { p.life += v1; uiShowMsg(`✨ ${v1}回復！`); },
    draw: async (rule, v1, v2, p) => { 
        uiShowMsg(`🃏 ${v1}ドロー`);
        for(let d=0; d<v1; d++) { if(p.deck.length > 0) { p.hand.push(p.deck.pop()); uiRenderBattle(); await new Promise(r=>setTimeout(r,300)); } }
    },
    buff: async (rule, v1, v2, p, opp, tCr) => { if(tCr) { tCr.power += v1; tCr.toughness += v2; uiShowMsg(`💪 単体強化！`); } },
    buffall: async (rule, v1, v2, p) => { uiShowMsg(`💪 全体強化！`); p.creatures.forEach(c => { c.power += v1; c.toughness += v2; }); },
    drain: async (rule, v1, v2, p, opp, tCr, tP) => {
        uiShowMsg(`🦇 ${v1}吸収！`);
        if(tCr) { tCr.damage += v1; } 
        else if(tP) { tP.life -= v1; uiShowPlayerDamage(tP === BAT.player, v1); } 
        else if(rule === 'p') { opp.life -= v1; uiShowPlayerDamage(opp === BAT.player, v1); }
        p.life += v1;
    },
    destroy: async (rule, v1, v2, p, opp, tCr) => {
        if(rule === 'allcr') { p.creatures.forEach(c => c.damage += 999); opp.creatures.forEach(c => c.damage += 999); uiShowMsg(`💀 全破壊！`); }
        else if(tCr) { tCr.damage += 999; uiShowMsg(`💀 破壊！`); }
    },
    bounce: async (rule, v1, v2, p, opp, tCr) => {
        let resetCard = (c) => {
            let base = DB_CARDS[c.idKey];
            if (base) { // トークンなどで元データがない場合のエラー回避
                c.power = base.power; 
                c.toughness = base.toughness;
                c.abilities = [...(base.abilities || [])]; 
            }
            c.damage = 0; c.tapped = false; c.sickness = false;
            return c;
        };
        
        if(rule === 'allcr') {
            p.creatures.forEach(c => { if(DB_CARDS[c.idKey]) p.hand.push(resetCard(c)); }); 
            opp.creatures.forEach(c => { if(DB_CARDS[c.idKey]) opp.hand.push(resetCard(c)); });
            p.creatures = []; opp.creatures = []; uiShowMsg(`🌊 全バウンス！`);
        } else if(tCr) {
            if(p.creatures.includes(tCr)) { 
                p.creatures = p.creatures.filter(c=>c.uid!==tCr.uid); 
                if(DB_CARDS[tCr.idKey]) p.hand.push(resetCard(tCr)); // トークンは手札に戻らず消滅する（MTGルール）
            } else { 
                opp.creatures = opp.creatures.filter(c=>c.uid!==tCr.uid); 
                if(DB_CARDS[tCr.idKey]) opp.hand.push(resetCard(tCr)); 
            }
            uiShowMsg(`🌊 手札に戻した！`);
        }
    },
    tap: async (rule, v1, v2, p, opp) => { if(rule === 'opp') { opp.creatures.forEach(c => c.tapped = true); uiShowMsg(`💤 敵全員タップ！`); } },
    ramp: async (rule, v1, v2, p) => {
        let landIdx = p.deck.findIndex(c => c.type === 'LAND');
        if(landIdx >= 0) { let land = p.deck.splice(landIdx, 1)[0]; land.tapped = true; p.lands.push(land); uiShowMsg(`🌱 マナ加速！`); }
    },
    discard: async (rule, v1, v2, p, opp) => { if(opp.hand.length > 0) { let rIdx = Math.floor(Math.random() * opp.hand.length); opp.hand.splice(rIdx, 1); uiShowMsg(`🗑 手札を捨てさせた！`); } },
// ▼ ここから新規追加：トークン生成と自己強化 ▼
    token: async (rule, v1, v2, p, opp) => {
        uiShowMsg(`🐣 トークン生成！`);
        // v1/v2 のスタッツを持つトークンを場に出す
        let token = { uid: ++uidCounter, idKey: 'token', name: '兵士・トークン', type: 'CREATURE', color: 'light', cost: 0, power: v1, toughness: v2, haste: false, rarity: 'C', text: '生成されたトークン', abilities: [], tapped: false, sickness: true, damage: 0, state: 'normal' };
        p.creatures.push(token);
    },
    buffself: async (rule, v1, v2, p, opp, tCr, tP, sourceCard) => {
        if(sourceCard) {
            sourceCard.power += v1; sourceCard.toughness += v2;
            uiShowMsg(`🔥 自己強化！`);
            if(typeof uiPlayAnim === 'function') uiPlayAnim(sourceCard, 'anim-buff', `+${v1}/+${v2}`);
        }
    },
    // ▲ ここまで追加 ▲
};

// 誘発型能力・起動型能力を管理するマネージャー（新規追加）
// 【effects.js 置き換え箇所：AbilityManager】

const AbilityManager = {
// 【effects.js 置き換え箇所：AbilityManager の triggerETB】

    // 場に出たとき (Enter The Battlefield)
    async triggerETB(card, playerObj, oppObj, targetObj = null) {
        if (card.triggered && card.triggered.condition === 'etb') {
            uiShowMsg(`✨ ${card.name}の登場時能力！`, 1500);
            // ▼ 修正：targetObj を resolve 関数に渡す ▼
            await MagicEngine.resolve(card.triggered.effect, playerObj, oppObj, targetObj, card);
        }
    },
    // 死亡したとき
    async triggerDeath(card, playerObj, oppObj) {
        if (card.triggered && card.triggered.condition === 'death') {
            uiShowMsg(`💀 ${card.name}の死亡誘発！`, 1500);
            await MagicEngine.resolve(card.triggered.effect, playerObj, oppObj, null, card);
        }
    },
    // ▼ 新規追加：ターン開始時（アップキープ）の誘発 ▼
    async triggerUpkeep(playerObj, oppObj) {
        // 場にいる全クリーチャーのアップキープ能力をチェック
        for (let c of playerObj.creatures) {
            if (c.triggered && c.triggered.condition === 'upkeep') {
                uiShowMsg(`⏳ ${c.name}の開始時誘発！`, 1500);
                await MagicEngine.resolve(c.triggered.effect, playerObj, oppObj, null, c);
                await new Promise(r => setTimeout(r, 800)); // 演出待ち
            }
        }
    },
    // ▼ 修正：起動型能力の発動時にも card 自身を渡す ▼
    async resolveActivated(card, playerObj, oppObj, targetObj) {
        await MagicEngine.resolve(card.activated.effect, playerObj, oppObj, targetObj, card);
    }
};