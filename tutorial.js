// 【tutorial.js】 実在カード使用・完全安定版

const Tutorial = {
    active: false,
    step: 0,
    box: null,
    backupDeck: [],
    hooked: false,

    init() {
        if (!this.box) {
            let div = document.createElement('div');
            div.id = 'tut-guide';
            div.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:90%; max-width:500px; background:rgba(0,0,0,0.95); border:3px solid #fcc419; color:#fff; padding:20px; border-radius:12px; z-index:9999; font-size:1.1rem; line-height:1.6; box-shadow:0 10px 30px rgba(0,0,0,0.8); display:none; flex-direction:column; text-align:left; cursor:pointer;';
            document.body.appendChild(div);
            this.box = div;
        }

        if (!this.hooked) {
            this.setupHooks();
            this.hooked = true;
        }
    },

    setupHooks() {
        // カードプレイの監視
        const origPay = window.batPayAndResolve;
        window.batPayAndResolve = async (uid, targetObj, isCpu) => {
            if (Tutorial.active && !isCpu) {
                let card = BAT.player.hand.find(c => c.uid === uid);
                if (!card) return;

                if (Tutorial.step === 1 && card.idKey !== 'fire_land') { uiShowMsg("まずは光っている【山】を出そう！"); return; }
                if (Tutorial.step === 2 && card.idKey !== 'f_c4') { uiShowMsg("今は【熱狂する戦士】を出そう！"); return; }
                if (Tutorial.step === 4 && card.idKey !== 'fire_land') { uiShowMsg("2枚目の【山】を出そう！"); return; }
                if (Tutorial.step === 5 && card.idKey !== 'f_s3') { uiShowMsg("手札の【呪文】を使おう！"); return; }
            }

            let handCountBefore = BAT.player.hand.length;
            await origPay(uid, targetObj, isCpu);
            
            if (Tutorial.active && !isCpu && BAT.player.hand.length < handCountBefore) {
                this.advanceStepAfterPlay();
            }
        };

        // フェイズ進行の監視
        const origAction = window.batPlayerAction;
        window.batPlayerAction = () => {
            if (Tutorial.active) {
                if ([1, 2, 4, 5].includes(Tutorial.step)) {
                    uiShowMsg("今は指示に従ってカードを出そう！");
                    return;
                }
            }
            origAction();
        };

        // 敵ターンの監視
        const origStartCpuTurn = window.batStartCpuTurn;
        window.batStartCpuTurn = async () => {
            await origStartCpuTurn();
            if (Tutorial.active && Tutorial.step === 3) {
                Tutorial.step = 4;
                Tutorial.showMessage("相手のターンだ。<br>相手は守りに適した『巨大ガニ』を出してきた。<br>君のターンだ！まずは2枚目の【山】を出そう。", false);
            }
        };

        // バトル終了の監視
        const origEndGame = window.batEndGame;
        window.batEndGame = (win) => {
            if (Tutorial.active) {
                Tutorial.showMessage("🎉 見事だ！相手のライフを減らして勝利したな！<br>これで基本ルールはバッチリだ。自分だけのデッキで戦いに挑もう！<br>（タップでホームに戻ります）", true, () => {
                    Tutorial.end();
                });
            } else {
                origEndGame(win);
            }
        };
    },

    advanceStepAfterPlay() {
        if (this.step === 1) {
            this.step = 2;
            this.showMessage("よし、マナが使えるようになった！<br>次はコスト1の『熱狂する戦士』を場に出そう。", false);
        } else if (this.step === 2) {
            this.step = 3;
            this.showMessage("召喚成功だ！<br>出たばかりのターンは「召喚酔い(💤)」で攻撃できない。<br>赤い『フェイズ進行』を押してターンを終了しよう。", false);
        } else if (this.step === 4) {
            this.step = 5;
            this.showMessage("これで2マナだ。<br>『小規模な爆発』を使って邪魔なカニを倒そう！<br>（呪文をクリック後、カニを選択）", false);
        } else if (this.step === 5) {
            this.step = 6;
            this.showMessage("ナイス！道は開けた。<br>『フェイズ進行』で戦闘に入り、戦士をタップして直接攻撃だ！", false);
        }
    },

    showMessage(text, waitClick, onClickFunc) {
        let nav = waitClick ? '<div style="text-align:right; font-size:0.9em; color:#fcc419; margin-top:10px; animation: pulse 1s infinite;">▼ タップして次へ</div>' : '';
        this.box.innerHTML = text + nav;
        this.box.style.display = 'flex';
        this.box.onclick = waitClick ? (onClickFunc || (() => { this.box.style.display = 'none'; })) : null;
    },

    async start() {
        this.init();
        this.active = true;

        if (!DB_CPU.find(c => c.id === 'tut_cpu')) {
            DB_CPU.push({ id: 'tut_cpu', name: 'チュートリアル教官', reward: 0, deck: Array(40).fill('water_land') });
        }
        
        this.backupDeck = [...SYS.decks[SYS.currentDeckIndex]];
        SYS.decks[SYS.currentDeckIndex] = Array(40).fill('fire_land');

        changeScreen('screen-battle');
        await window.batStart('tut_cpu');

        this.showMessage("バトルの準備中...", false);

        // バトル準備完了を1.5秒待ってから手札を書き換える（安全設計）
        setTimeout(() => {
            BAT.player.life = 20; BAT.cpu.life = 2; // 戦士の攻撃(パワー2)で勝てるライフ
            BAT.player.lands = []; BAT.cpu.lands = [];
            BAT.player.creatures = []; BAT.cpu.creatures = [];
            BAT.player.landPlayed = false; BAT.cpu.landPlayed = false;

            // UIDの安全な発番関数
            const getUid = () => typeof uidCounter !== 'undefined' ? ++uidCounter : Math.floor(Math.random() * 1000000);
            const makeCard = (id) => JSON.parse(JSON.stringify({ ...DB_CARDS[id], idKey: id, uid: getUid(), sickness: false, damage: 0, tapped: false, state: 'normal' }));

            // プレイヤーとCPUの山札
            BAT.player.deck = [makeCard('fire_land'), makeCard('fire_land')];
            BAT.cpu.deck = [makeCard('water_land'), makeCard('water_land')];

            // ▼ 実在のカード（SET1_CARDS）を手札に生成 ▼
            BAT.player.hand = [
                makeCard('fire_land'), // 山
                makeCard('fire_land'), // 山
                makeCard('f_c4'),      // 熱狂する戦士 (1マナ 2/1)
                makeCard('f_s3')       // 小規模な爆発 (2マナ 3点ダメージ)
            ];

            BAT.cpu.hand = [
                makeCard('water_land'), // 島
                makeCard('w_c1')        // 巨大ガニ (1マナ 1/3 防衛)
            ];

            uiRenderBattle();
            this.step = 1;
            this.showMessage("ようこそ！<br>まずはあなたの手札（画面下）から<b>【山】（土地）</b>をタップして場に出してみよう。", false);

        }, 1500);
    },

    end() {
        this.active = false;
        this.box.style.display = 'none';
        SYS.decks[SYS.currentDeckIndex] = this.backupDeck;
        document.getElementById('modal-result').style.display = 'none';
        changeScreen('screen-home');
    }
};