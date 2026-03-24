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

// 初期デッキ生成ロジック
function getStarterDeck(color) {
    let deck = []; let land = color + '_land';
    for(let i=0; i<12; i++) deck.push(land);
    let poolC = Object.keys(DB_CARDS).filter(id => DB_CARDS[id].color === color && DB_CARDS[id].type === 'CREATURE' && DB_CARDS[id].rarity === 'C');
    let poolU = Object.keys(DB_CARDS).filter(id => DB_CARDS[id].color === color && DB_CARDS[id].type === 'CREATURE' && DB_CARDS[id].rarity === 'U');
    let spellsC = Object.keys(DB_CARDS).filter(id => DB_CARDS[id].color === color && DB_CARDS[id].type === 'SPELL' && DB_CARDS[id].rarity === 'C');
    for(let i=0; i<8; i++) deck.push(poolC[i % poolC.length]);
    for(let i=0; i<4; i++) deck.push(poolU[i % poolU.length]);
    for(let i=0; i<6; i++) deck.push(spellsC[i % spellsC.length]);
    return deck;
}

/* const DB_CPU = [
    { id: 'cpu_fire', name: '見習い炎使い', desc: '火属性の速攻デッキ', reward: 100, deck: getStarterDeck('fire') },
    { id: 'cpu_forest', name: '森の番人', desc: '森属性の巨大獣デッキ', reward: 150, deck: getStarterDeck('forest') },
    { id: 'cpu_water', name: '海賊の長', desc: '水属性のテクニックデッキ', reward: 150, deck: getStarterDeck('water') },
    { id: 'cpu_light', name: '聖騎士団長', desc: '光属性の鉄壁デッキ', reward: 200, deck: getStarterDeck('light') },
    { id: 'cpu_dark', name: '魔王', desc: '闇属性の破壊デッキ', reward: 300, deck: getStarterDeck('dark') }
]; */

// 【database.js 貼り付け箇所：ファイルの一番下】

// --- ▼ 追加：ストーリーモード用の敵データ自動生成 ▼ ---
let DB_CPU = [];

(function generateStoryCPU() {
    const colors = ['fire', 'forest', 'water', 'light', 'dark'];
    const ATTR_JP = { 'fire':'🔥火', 'forest':'🌲森', 'water':'💧水', 'light':'✨光', 'dark':'🌑闇' };
    
    // ステージごとのレアリティ構成比と報酬額
    const stageConfig = [
        { reward: 100, counts: { 'C': 16, 'U': 2,  'R': 0, 'M': 0 } }, // ステージ1: コモン主体
        { reward: 150, counts: { 'C': 12, 'U': 6,  'R': 0, 'M': 0 } }, // ステージ2: アンコモン増加
        { reward: 200, counts: { 'C': 8,  'U': 8,  'R': 2, 'M': 0 } }, // ステージ3: レア登場
        { reward: 300, counts: { 'C': 4,  'U': 8,  'R': 6, 'M': 0 } }, // ステージ4: レア主力
        { reward: 500, counts: { 'C': 0,  'U': 8,  'R': 8, 'M': 2 } }  // ステージ5: ボス級(神話レア)
    ];

    colors.forEach(color => {
        // 色ごとのカードプールを作成
        let pools = { 'C': [], 'U': [], 'R': [], 'M': [] };
        Object.keys(DB_CARDS).forEach(id => {
            let c = DB_CARDS[id];
            if (c.type !== 'LAND' && c.color === color) pools[c.rarity].push(id);
        });

        // 5ステージ分のデッキを構築
        for (let stage = 1; stage <= 5; stage++) {
            let deck = [];
            for (let i = 0; i < 12; i++) deck.push(`${color}_land`); // 土地12枚
            
            let rules = stageConfig[stage - 1].counts;
            ['C', 'U', 'R', 'M'].forEach(rarity => {
                let count = rules[rarity];
                let pool = pools[rarity].length > 0 ? pools[rarity] : pools['C']; 
                for (let i = 0; i < count; i++) {
                    deck.push(pool[Math.floor(Math.random() * pool.length)]);
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
// --- ▲ 追加ここまで ▲ ---