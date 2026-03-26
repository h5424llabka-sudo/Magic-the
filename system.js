// 【system.js 置き換え箇所：一番上から sysLoadData 関数まで】

let SYS = { 
    gold: 0, collection: {}, decks: [], currentDeckIndex: 0,
    storyProgress: { fire: 1, forest: 1, water: 1, light: 1, dark: 1 } // ストーリー進行度
};

function sysLoadData() {
    let saved = localStorage.getItem('mana_coliseum_save');
    if (saved) {
        SYS = JSON.parse(saved);
        if (SYS.deck && !SYS.decks) { SYS.decks = [SYS.deck, [], [], [], []]; SYS.currentDeckIndex = 0; delete SYS.deck; }
        // ▼ 追加：古いセーブデータに進行度を追加 ▼
        if (!SYS.storyProgress) SYS.storyProgress = { fire: 1, forest: 1, water: 1, light: 1, dark: 1 };
        
        uiRenderHome(); changeScreen('screen-home');
    } else { 
        SYS.gold = 500; 
        SYS.decks = [getStarterDeck('fire'), getStarterDeck('forest'), getStarterDeck('water'), getStarterDeck('light'), getStarterDeck('dark')];
        SYS.currentDeckIndex = 0;
        SYS.storyProgress = { fire: 1, forest: 1, water: 1, light: 1, dark: 1 }; // 初回プレイ時の進行度
        SYS.decks.forEach(deck => { deck.forEach(id => { SYS.collection[id] = (SYS.collection[id] || 0) + 1; }); });
        sysSaveData();
        uiRenderHome(); changeScreen('screen-home');
    }
}

function sysResetData(force = false) {
    if (force || confirm("本当にデータを消去しますか？")) { localStorage.removeItem('mana_coliseum_save'); location.reload(); }
}

function sysSaveData() { localStorage.setItem('mana_coliseum_save', JSON.stringify(SYS)); }

function sysBuyPack(packId) {
    let pack = DB_PACKS.find(p => p.id === packId);
    if (!pack) return;
    if (SYS.gold < pack.cost) { uiShowMsg("お金が足りません！"); return; }
    SYS.gold -= pack.cost;
    
    let pools = { 'C': [], 'U': [], 'R': [], 'M': [] };
    pack.cards.forEach(id => pools[DB_CARDS[id].rarity].push(id));

    let results = [];
    for(let i=0; i<5; i++) {
        let r = Math.random();
        let rarity = (r < 0.025) ? 'M' : (r < 0.125) ? 'R' : (r < 0.400) ? 'U' : 'C';
        let pool = pools[rarity].length > 0 ? pools[rarity] : pools['C'];
        let randomId = pool[Math.floor(Math.random() * pool.length)];
        results.push(randomId);
        SYS.collection[randomId] = (SYS.collection[randomId] || 0) + 1;
    }
    sysSaveData(); uiRenderShopResult(results);
}

// --- ▼ デッキ編成・切り替え処理 ▼ ---
let editDeck = []; let editPool = {};

function sysInitDeckEdit() {
    // 現在選ばれているデッキを読み込む
    editDeck = [...SYS.decks[SYS.currentDeckIndex]]; 
    editPool = {...SYS.collection};
    ['fire_land', 'forest_land', 'water_land', 'light_land', 'dark_land'].forEach(land => editPool[land] = 99);
    editDeck.forEach(id => { if(editPool[id]) editPool[id]--; });
    
    let sel = document.getElementById('deck-selector');
    if(sel) sel.value = SYS.currentDeckIndex;
}

function sysChangeDeck(index) {
    sysSaveDeck(); // 切り替え前に今の編集内容を保存
    SYS.currentDeckIndex = parseInt(index);
    sysInitDeckEdit(); // 新しいデッキを読み込み
    uiRenderDeck();    // 画面を更新
}

function sysSaveDeck() { 
    SYS.decks[SYS.currentDeckIndex] = [...editDeck]; 
    sysSaveData(); 
}
// （※この下にある sysRemoveFromDeck や sysAddToDeck はそのまま残してください）

function sysRemoveFromDeck(idKey) {
    let idx = editDeck.indexOf(idKey);
    if (idx !== -1) {
        editDeck.splice(idx, 1);
        editPool[idKey] = (editPool[idKey] || 0) + 1;
        uiRenderDeck();
    }
}

function sysAddToDeck(idKey) {
    if (editDeck.length >= 40) { uiShowMsg("デッキは40枚までです！"); return; }
    
    // ▼ 追加：同名カードは4枚まで（MTGルール） ▼
    let countInDeck = editDeck.filter(id => id === idKey).length;
    if (DB_CARDS[idKey].type !== 'LAND' && countInDeck >= 4) {
        uiShowMsg("同名カードは4枚までです！"); return;
    }

    if (editPool[idKey] > 0) {
        editDeck.push(idKey);
        editPool[idKey]--;
        uiRenderDeck();
    }
}