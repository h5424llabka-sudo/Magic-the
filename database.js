// レアリティの定数
const RARITY_COLORS = { 'C': '#343a40', 'U': '#74c0fc', 'R': '#fcc419', 'M': '#ff6b6b' };
const RARITY_NAMES = { 'C': 'コモン', 'U': 'アンコモン', 'R': 'レア', 'M': '神話レア' };

// すべてのカードセットを合体させる
// 【修正後】ここに置き換えてください
const DB_CARDS = { ...SET1_CARDS }; 
for (let key in DB_CARDS) { 
    DB_CARDS[key].idKey = key; // IDを自動付与
    let c = DB_CARDS[key];
    if (c.type !== 'LAND') {
        if (c.cost > 0) {
            // コストに応じて必要な色マナ数を自動設定（最大3）
            c.colorCost = c.cost >= 5 ? 3 : (c.cost >= 3 ? 2 : 1);
            c.anyCost = c.cost - c.colorCost;
        } else {
            c.colorCost = 0;
            c.anyCost = 0;
        }
    }
}

// ショップで売られるパックの定義（今後 第2弾を追加可能）
const DB_PACKS = [
    { id: 'pack_set1', name: '第1弾：始まりの鼓動', cost: 150, cards: Object.keys(SET1_CARDS).filter(id => DB_CARDS[id].type !== 'LAND') }
];

// 【database.js 置き換え箇所：getStarterDeck からファイルの一番下まで】

// 初期デッキ生成ロジック（40枚：土地16枚、呪文/生物24枚）
function getStarterDeck(color) {
    let deck = []; let land = color + '_land';
    for(let i=0; i<16; i++) deck.push(land);
    
    let nonLands = Object.keys(DB_CARDS).filter(id => DB_CARDS[id].color === color && DB_CARDS[id].type !== 'LAND');
    // マナカーブ（低コスト10枚、中コスト10枚、高コスト4枚）
    let curveTarget = [ {min: 0, max: 2, count: 10}, {min: 3, max: 4, count: 10}, {min: 5, max: 99, count: 4} ];
    
    curveTarget.forEach(bracket => {
        let cands = nonLands.filter(id => DB_CARDS[id].rarity === 'C' && DB_CARDS[id].cost >= bracket.min && DB_CARDS[id].cost <= bracket.max);
        if(cands.length === 0) cands = nonLands.filter(id => DB_CARDS[id].cost >= bracket.min && DB_CARDS[id].cost <= bracket.max);
        for(let i=0; i<bracket.count; i++) deck.push(cands[i % cands.length]);
    });
    return deck;
}

// ストーリーモード用の敵データ自動生成（40枚・マナカーブ対応）
let DB_CPU = [];
(function generateStoryCPU() {
    const colors = ['fire', 'forest', 'water', 'light', 'dark'];
    const ATTR_JP = { 'fire':'🔥火', 'forest':'🌲森', 'water':'💧水', 'light':'✨光', 'dark':'🌑闇' };
    const stageConfig = [{ reward: 100 }, { reward: 150 }, { reward: 200 }, { reward: 300 }, { reward: 500 }];

    let getRarity = (stage) => {
        let r = Math.random();
        if(stage === 1) return (r < 0.1) ? 'U' : 'C';
        if(stage === 2) return (r < 0.3) ? 'U' : 'C';
        if(stage === 3) return (r < 0.1) ? 'R' : (r < 0.4) ? 'U' : 'C';
        if(stage === 4) return (r < 0.3) ? 'R' : (r < 0.6) ? 'U' : 'C';
        if(stage === 5) return (r < 0.1) ? 'M' : (r < 0.4) ? 'R' : 'U';
    };

    colors.forEach(color => {
        let nonLands = Object.keys(DB_CARDS).filter(id => DB_CARDS[id].color === color && DB_CARDS[id].type !== 'LAND');
        for (let stage = 1; stage <= 5; stage++) {
            let deck = [];
            for (let i = 0; i < 16; i++) deck.push(`${color}_land`); // 土地16枚
            
            // 24枚をマナカーブに沿って抽出
            let curveTarget = [ {min: 0, max: 2, count: 10}, {min: 3, max: 4, count: 10}, {min: 5, max: 99, count: 4} ];
            curveTarget.forEach(bracket => {
                for(let i=0; i<bracket.count; i++) {
                    let targetRarity = getRarity(stage);
                    let cands = nonLands.filter(id => DB_CARDS[id].rarity === targetRarity && DB_CARDS[id].cost >= bracket.min && DB_CARDS[id].cost <= bracket.max);
                    if (cands.length === 0) cands = nonLands.filter(id => DB_CARDS[id].cost >= bracket.min && DB_CARDS[id].cost <= bracket.max);
                    if (cands.length === 0) cands = nonLands; // フォールバック
                    deck.push(cands[Math.floor(Math.random() * cands.length)]);
                }
            });

            DB_CPU.push({
                id: `${color}_${stage}`,
                name: `${ATTR_JP[color]}の試練 (Lv.${stage})`,
                reward: stageConfig[stage - 1].reward,
                deck: deck
            });
        }
    });
})();