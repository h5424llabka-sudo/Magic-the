// 第1弾カードパックのリスト
const SET1_CARDS = {
    // 【土地】
    fire_land: { name: '山', type: 'LAND', color: 'fire', cost: 0, rarity: 'C', text: '🔥を生む', abilities: [] },
    forest_land: { name: '森', type: 'LAND', color: 'forest', cost: 0, rarity: 'C', text: '🌲を生む', abilities: [] },
    water_land: { name: '島', type: 'LAND', color: 'water', cost: 0, rarity: 'C', text: '💧を生む', abilities: [] },
    light_land: { name: '平原', type: 'LAND', color: 'light', cost: 0, rarity: 'C', text: '✨を生む', abilities: [] },
    dark_land: { name: '沼', type: 'LAND', color: 'dark', cost: 0, rarity: 'C', text: '🌑を生む', abilities: [] },
    
    // 【🔥 火属性】
    // クリーチャー(20)
    f_c1: { name: 'ゴブリン', type: 'CREATURE', color: 'fire', cost: 1, power: 1, toughness: 1, haste: true, rarity: 'C', text: '【速攻】', abilities: [] },
    f_c2: { name: '火炎トカゲ', type: 'CREATURE', color: 'fire', cost: 2, power: 2, toughness: 2, haste: false, rarity: 'C', text: '標準的な戦力。', abilities: [] },
    f_c3: { name: '炎の祈祷師', type: 'CREATURE', color: 'fire', cost: 3, power: 3, toughness: 2, haste: false, rarity: 'C', text: '【起動】(タップ): 対象に1ダメージ', abilities: [], activated: { cost: 0, tap: true, effect: 'dmg_any_1' } },
    f_c4: { name: '熱狂する戦士', type: 'CREATURE', color: 'fire', cost: 1, power: 2, toughness: 1, haste: false, rarity: 'C', text: '血の気が多い。', abilities: [] },
    f_c5: { name: 'ファイアバット', type: 'CREATURE', color: 'fire', cost: 2, power: 1, toughness: 1, haste: true, rarity: 'C', text: '【飛行】【速攻】', abilities: ['flying'] },
    f_c6: { name: '炭鉱のドワーフ', type: 'CREATURE', color: 'fire', cost: 2, power: 3, toughness: 1, haste: false, rarity: 'C', text: 'パワーが高い。', abilities: [] },
    f_c7: { name: '溶岩歩き', type: 'CREATURE', color: 'fire', cost: 3, power: 2, toughness: 4, haste: false, rarity: 'C', text: '熱に強い。', abilities: [] },
    f_c8: { name: '火だるまの巨漢', type: 'CREATURE', color: 'fire', cost: 4, power: 4, toughness: 3, haste: false, rarity: 'C', text: '突進あるのみ。', abilities: [] },
    f_c9: { name: 'ヘルハウンド', type: 'CREATURE', color: 'fire', cost: 2, power: 2, toughness: 1, haste: true, rarity: 'U', text: '【速攻】\n【起動】(①): ターン終了時まで+1/+0', abilities: [], activated: { cost: 1, tap: false, effect: 'buffself_self_1_0' } },
    f_c10:{ name: '火の精霊', type: 'CREATURE', color: 'fire', cost: 3, power: 4, toughness: 2, haste: true, rarity: 'U', text: '【速攻】【トランプル】', abilities: ['trample'] },
    f_c11:{ name: 'マグマゴーレム', type: 'CREATURE', color: 'fire', cost: 4, power: 4, toughness: 4, haste: false, rarity: 'U', text: '熱を帯びた岩。', abilities: [] },
    f_c12:{ name: '炎の壁', type: 'CREATURE', color: 'fire', cost: 2, power: 0, toughness: 5, haste: false, rarity: 'U', text: '【防衛】', abilities: ['defender'] },
    f_c13:{ name: 'ゴブリンの長', type: 'CREATURE', color: 'fire', cost: 3, power: 3, toughness: 3, haste: true, rarity: 'U', text: '【速攻】', abilities: [] },
    f_c14:{ name: '紅蓮の騎士', type: 'CREATURE', color: 'fire', cost: 4, power: 3, toughness: 2, haste: false, rarity: 'U', text: '【先制攻撃】', abilities: ['first_strike'] },
    f_c15:{ name: '不死鳥', type: 'CREATURE', color: 'fire', cost: 4, power: 3, toughness: 3, haste: true, rarity: 'R', text: '【飛行】【速攻】', abilities: ['flying'] },
    f_c16:{ name: '真紅の竜', type: 'CREATURE', color: 'fire', cost: 5, power: 5, toughness: 5, haste: true, rarity: 'R', text: '【飛行】【速攻】【トランプル】', abilities: ['flying', 'trample'] },
    f_c17:{ name: '業火の魔神', type: 'CREATURE', color: 'fire', cost: 6, power: 6, toughness: 4, haste: true, rarity: 'R', text: '【速攻】【トランプル】', abilities: ['trample'] },
    f_c18:{ name: '火山の巨人', type: 'CREATURE', color: 'fire', cost: 6, power: 5, toughness: 7, haste: false, rarity: 'R', text: '巨大な壁。', abilities: [] },
    f_c19:{ name: '暴君竜', type: 'CREATURE', color: 'fire', cost: 7, power: 7, toughness: 7, haste: true, rarity: 'M', text: '【速攻】【トランプル】', abilities: ['trample'] },
    f_c20:{ name: '災厄の化身', type: 'CREATURE', color: 'fire', cost: 5, power: 5, toughness: 5, haste: true, rarity: 'M', text: '【飛行】\n【起動】(①): ターン終了時まで+1/+0', abilities: ['flying'], activated: { cost: 1, tap: false, effect: 'buffself_self_1_0' }},
    // 呪文(12)
    f_s1: { name: '火花', type: 'SPELL', color: 'fire', cost: 1, effect: 'dmg_any_2', rarity: 'C', text: '対象に2ダメージ。', abilities: [] },
    f_s2: { name: 'ショック', type: 'SPELL', color: 'fire', cost: 2, effect: 'dmg_p_3', rarity: 'C', text: '相手に3ダメージ。', abilities: [] }, // 1マナ3点は強すぎるため2マナに
    f_s3: { name: '小規模な爆発', type: 'SPELL', color: 'fire', cost: 2, effect: 'dmg_any_3', rarity: 'C', text: '対象に3ダメージ。', abilities: [] },
    f_s4: { name: '武器の強化', type: 'SPELL', color: 'fire', cost: 1, effect: 'buff_cr_2_0', rarity: 'C', text: '対象を+2/+0。', abilities: [] },
    f_s5: { name: 'ゴブリンの奇襲', type: 'SPELL', color: 'fire', cost: 4, effect: 'dmg_p_5', rarity: 'C', text: '相手に5ダメージ。', abilities: [] }, // プレイヤーへの5点は重めに
    f_s6: { name: '稲妻', type: 'SPELL', color: 'fire', cost: 3, effect: 'dmg_cr_4', rarity: 'U', text: '対象クリーチャーに4ダメージ。', abilities: [] }, // MTG基準で3マナに
    f_s7: { name: '焼却', type: 'SPELL', color: 'fire', cost: 4, effect: 'dmg_cr_5', rarity: 'U', text: '対象クリーチャーに5ダメージ。', abilities: [] },
    f_s8: { name: '怒りの一撃', type: 'SPELL', color: 'fire', cost: 4, effect: 'dmg_any_5', rarity: 'U', text: '対象に5ダメージ。', abilities: [] },
    f_s9: { name: '血の代償', type: 'SPELL', color: 'fire', cost: 2, effect: 'draw_self_2', rarity: 'U', text: '2枚ドロー。', abilities: [] },
    f_s10:{ name: '焦熱の嵐', type: 'SPELL', color: 'fire', cost: 4, effect: 'dmg_allcr_3', rarity: 'R', text: '全クリーチャーに3ダメージ。', abilities: [] },
    f_s11:{ name: '連続魔法', type: 'SPELL', color: 'fire', cost: 5, effect: 'dmg_any_6', rarity: 'R', text: '対象に6ダメージ。', abilities: [] },
    f_s12:{ name: '隕石落下', type: 'SPELL', color: 'fire', cost: 6, effect: 'dmg_p_10', rarity: 'M', text: '相手に10ダメージ。', abilities: [] },

    // 【🌲 森属性】
    g_c1: { name: 'エルフの戦士', type: 'CREATURE', color: 'forest', cost: 1, power: 1, toughness: 2, haste: false, rarity: 'C', text: '【起動】(タップ): マナ加速', abilities: [], activated: { cost: 0, tap: true, effect: 'ramp_self_1' } },
    g_c2: { name: '蜘蛛', type: 'CREATURE', color: 'forest', cost: 2, power: 1, toughness: 4, haste: false, rarity: 'C', text: '【到達】【接死】', abilities: ['reach', 'deathtouch'] },
    g_c3: { name: '灰色熊', type: 'CREATURE', color: 'forest', cost: 2, power: 2, toughness: 2, haste: false, rarity: 'C', text: '標準的。', abilities: [] },
    g_c4: { name: '茨の壁', type: 'CREATURE', color: 'forest', cost: 1, power: 0, toughness: 4, haste: false, rarity: 'C', text: '【防衛】', abilities: ['defender'] },
    g_c5: { name: '猪', type: 'CREATURE', color: 'forest', cost: 3, power: 3, toughness: 3, haste: false, rarity: 'C', text: '猪突猛進。', abilities: [] },
    g_c6: { name: '大狼', type: 'CREATURE', color: 'forest', cost: 3, power: 3, toughness: 3, haste: false, rarity: 'C', text: '【先制攻撃】', abilities: ['first_strike'] }, // 森の特権で3/3に強化
    g_c7: { name: '森の狩人', type: 'CREATURE', color: 'forest', cost: 4, power: 4, toughness: 4, haste: false, rarity: 'C', text: '巨大な弓。', abilities: [] },
    g_c8: { name: '暴れサイ', type: 'CREATURE', color: 'forest', cost: 5, power: 5, toughness: 5, haste: false, rarity: 'C', text: '【トランプル】', abilities: ['trample'] },
    g_c9: { name: 'ケンタウロス', type: 'CREATURE', color: 'forest', cost: 3, power: 3, toughness: 4, haste: false, rarity: 'U', text: '【警戒】', abilities: ['vigilance'] },
    g_c10:{ name: '大地の精霊', type: 'CREATURE', color: 'forest', cost: 4, power: 4, toughness: 5, haste: false, rarity: 'U', text: '硬い岩。', abilities: [] },
    g_c11:{ name: '長老樹', type: 'CREATURE', color: 'forest', cost: 5, power: 5, toughness: 6, haste: false, rarity: 'U', text: '【防衛】【到達】', abilities: ['defender', 'reach'] },
    g_c12:{ name: '猛毒蛇', type: 'CREATURE', color: 'forest', cost: 2, power: 1, toughness: 1, haste: false, rarity: 'U', text: '【接死】【先制攻撃】', abilities: ['deathtouch', 'first_strike'] },
    g_c13:{ name: 'エルフの王', type: 'CREATURE', color: 'forest', cost: 3, power: 3, toughness: 3, haste: false, rarity: 'U', text: 'エルフの統率者。', abilities: [] }, // 3/3に強化
    g_c14:{ name: '巨象', type: 'CREATURE', color: 'forest', cost: 6, power: 6, toughness: 6, haste: false, rarity: 'U', text: '【トランプル】', abilities: ['trample'] },
    g_c15:{ name: '大地の獣', type: 'CREATURE', color: 'forest', cost: 6, power: 7, toughness: 7, haste: false, rarity: 'R', text: '【トランプル】', abilities: ['trample'] },
    g_c16:{ name: 'マンモス', type: 'CREATURE', color: 'forest', cost: 7, power: 8, toughness: 8, haste: false, rarity: 'R', text: '【トランプル】', abilities: ['trample'] },
    g_c17:{ name: 'ティラノサウルス', type: 'CREATURE', color: 'forest', cost: 7, power: 9, toughness: 8, haste: false, rarity: 'R', text: 'ジュラシック。', abilities: [] }, // 9/8に強化
    g_c18:{ name: '自然の化身', type: 'CREATURE', color: 'forest', cost: 5, power: 5, toughness: 5, haste: false, rarity: 'R', text: '【警戒】【トランプル】', abilities: ['vigilance', 'trample'] },
    g_c19:{ name: '世界樹の化身', type: 'CREATURE', color: 'forest', cost: 8, power: 10, toughness: 10, haste: false, rarity: 'M', text: '【防衛】【到達】', abilities: ['defender', 'reach'] },
    g_c20:{ name: 'ガイアの巨神', type: 'CREATURE', color: 'forest', cost: 9, power: 12, toughness: 12, haste: false, rarity: 'M', text: '【トランプル】', abilities: ['trample'] },
    g_s1: { name: '巨大化', type: 'SPELL', color: 'forest', cost: 1, effect: 'buff_cr_3_3', rarity: 'C', text: '対象を+3/+3。', abilities: [] },
    g_s2: { name: '自然の恵み', type: 'SPELL', color: 'forest', cost: 2, effect: 'heal_self_5', rarity: 'C', text: 'ライフ5回復。', abilities: [] },
    g_s3: { name: '野生の力', type: 'SPELL', color: 'forest', cost: 2, effect: 'buff_cr_2_2', rarity: 'C', text: '対象を+2/+2。', abilities: [] },
    g_s4: { name: '蜘蛛の糸', type: 'SPELL', color: 'forest', cost: 1, effect: 'tap_opp_all', rarity: 'C', text: '敵全員タップ。', abilities: [] },
    g_s5: { name: '生命の芽吹き', type: 'SPELL', color: 'forest', cost: 2, effect: 'ramp_self_1', rarity: 'C', text: 'マナ加速。', abilities: [] }, // MTG基準で2マナ
    g_s6: { name: '豊かな森', type: 'SPELL', color: 'forest', cost: 4, effect: 'ramp_self_2', rarity: 'U', text: '2マナ加速。', abilities: [] }, // MTG基準で4マナ
    g_s7: { name: '狩人の知恵', type: 'SPELL', color: 'forest', cost: 3, effect: 'draw_self_2', rarity: 'U', text: '2枚ドロー。', abilities: [] },
    g_s8: { name: '大地の癒し', type: 'SPELL', color: 'forest', cost: 4, effect: 'heal_self_8', rarity: 'U', text: 'ライフ8回復。', abilities: [] },
    g_s9: { name: '獣の群れ', type: 'SPELL', color: 'forest', cost: 4, effect: 'buffall_self_1_1', rarity: 'U', text: '味方全体+1/+1。', abilities: [] },
    g_s10:{ name: '踏み荒らし', type: 'SPELL', color: 'forest', cost: 5, effect: 'buffall_self_2_2', rarity: 'R', text: '味方全体+2/+2。', abilities: [] },
    g_s11:{ name: '自然の怒り', type: 'SPELL', color: 'forest', cost: 6, effect: 'destroy_cr_1', rarity: 'R', text: '対象を破壊。', abilities: [] },
    g_s12:{ name: '生命の輝き', type: 'SPELL', color: 'forest', cost: 7, effect: 'heal_self_20', rarity: 'M', text: 'ライフ20回復。', abilities: [] },

    // 【💧 水属性】
    w_c1: { name: '巨大ガニ', type: 'CREATURE', color: 'water', cost: 1, power: 1, toughness: 3, haste: false, rarity: 'C', text: '【防衛】', abilities: ['defender'] },
    w_c2: { name: 'セイレーン', type: 'CREATURE', color: 'water', cost: 2, power: 2, toughness: 2, haste: false, rarity: 'C', text: '【飛行】', abilities: ['flying'] }, // 青の補強(タフネスUP)
    w_c3: { name: '人魚', type: 'CREATURE', color: 'water', cost: 2, power: 2, toughness: 2, haste: false, rarity: 'C', text: '【出たとき】: 1枚ドロー', abilities: [], triggered: { condition: 'etb', effect: 'draw_self_1' } },
    w_c4: { name: '水兵', type: 'CREATURE', color: 'water', cost: 3, power: 3, toughness: 4, haste: false, rarity: 'C', text: '船乗り。', abilities: [] }, // 青の補強
    w_c5: { name: '海亀', type: 'CREATURE', color: 'water', cost: 3, power: 1, toughness: 5, haste: false, rarity: 'C', text: '【防衛】', abilities: ['defender'] },
    w_c6: { name: 'サメ', type: 'CREATURE', color: 'water', cost: 4, power: 4, toughness: 4, haste: false, rarity: 'C', text: '海のハンター。', abilities: [] }, // 青の補強
    w_c7: { name: 'イルカ', type: 'CREATURE', color: 'water', cost: 3, power: 2, toughness: 4, haste: false, rarity: 'C', text: '賢い。', abilities: [] }, // 青の補強
    w_c8: { name: '大魚', type: 'CREATURE', color: 'water', cost: 5, power: 5, toughness: 5, haste: false, rarity: 'C', text: 'ただ大きい。', abilities: [] }, // 青の補強
    w_c9: { name: '水の精霊', type: 'CREATURE', color: 'water', cost: 3, power: 3, toughness: 3, haste: false, rarity: 'U', text: '【飛行】', abilities: ['flying'] },
    w_c10:{ name: '大蛇', type: 'CREATURE', color: 'water', cost: 4, power: 4, toughness: 4, haste: false, rarity: 'U', text: '船を沈める。', abilities: [] },
    w_c11:{ name: '海賊の長', type: 'CREATURE', color: 'water', cost: 4, power: 3, toughness: 5, haste: false, rarity: 'U', text: '【先制攻撃】', abilities: ['first_strike'] }, // 青の補強
    w_c12:{ name: '氷の壁', type: 'CREATURE', color: 'water', cost: 2, power: 0, toughness: 6, haste: false, rarity: 'U', text: '【防衛】', abilities: ['defender'] },
    w_c13:{ name: '幻影の竜', type: 'CREATURE', color: 'water', cost: 5, power: 5, toughness: 5, haste: false, rarity: 'U', text: '【飛行】', abilities: ['flying'] }, // 青の補強
    w_c14:{ name: '深海のヤリイカ', type: 'CREATURE', color: 'water', cost: 5, power: 4, toughness: 5, haste: false, rarity: 'U', text: '【警戒】', abilities: ['vigilance'] },
    w_c15:{ name: '海竜', type: 'CREATURE', color: 'water', cost: 6, power: 6, toughness: 6, haste: false, rarity: 'R', text: '【トランプル】', abilities: ['trample'] },
    w_c16:{ name: '氷の巨人', type: 'CREATURE', color: 'water', cost: 6, power: 6, toughness: 7, haste: false, rarity: 'R', text: '凍てつく拳。', abilities: [] },
    w_c17:{ name: '大ダコ', type: 'CREATURE', color: 'water', cost: 7, power: 7, toughness: 7, haste: false, rarity: 'R', text: '足を絡めとる。', abilities: [] },
    w_c18:{ name: '霧の天使', type: 'CREATURE', color: 'water', cost: 4, power: 3, toughness: 4, haste: false, rarity: 'R', text: '【飛行】【警戒】', abilities: ['flying', 'vigilance'] },
    w_c19:{ name: 'クラーケン', type: 'CREATURE', color: 'water', cost: 8, power: 8, toughness: 8, haste: false, rarity: 'M', text: '【トランプル】', abilities: ['trample'] },
    w_c20:{ name: 'リバイアサン', type: 'CREATURE', color: 'water', cost: 9, power: 10, toughness: 10, haste: false, rarity: 'M', text: '【トランプル】', abilities: ['trample'] },
    w_s1: { name: '考慮', type: 'SPELL', color: 'water', cost: 1, effect: 'draw_self_1', rarity: 'C', text: '1枚ドロー。', abilities: [] },
    w_s2: { name: '送還', type: 'SPELL', color: 'water', cost: 2, effect: 'bounce_cr_1', rarity: 'C', text: '対象を手札に戻す。', abilities: [] },
    w_s3: { name: '予言', type: 'SPELL', color: 'water', cost: 3, effect: 'draw_self_2', rarity: 'C', text: '2枚ドロー。', abilities: [] },
    w_s4: { name: '冷気', type: 'SPELL', color: 'water', cost: 2, effect: 'tap_opp_all', rarity: 'C', text: '敵全員タップ。', abilities: [] },
    w_s5: { name: '打ち消し', type: 'SPELL', color: 'water', cost: 2, effect: 'discard_opp_1', rarity: 'C', text: '相手の手札を1枚捨てる。', abilities: [] }, // 1枚ハンデスは2マナへ
    w_s6: { name: '集中', type: 'SPELL', color: 'water', cost: 5, effect: 'draw_self_3', rarity: 'U', text: '3枚ドロー。', abilities: [] }, // MTG基準で5マナ
    w_s7: { name: '大波', type: 'SPELL', color: 'water', cost: 4, effect: 'dmg_cr_4', rarity: 'U', text: '対象に4ダメージ。', abilities: [] },
    w_s8: { name: '睡眠', type: 'SPELL', color: 'water', cost: 4, effect: 'tap_opp_all', rarity: 'U', text: '敵全員タップ。', abilities: [] },
    w_s9: { name: '知識の泉', type: 'SPELL', color: 'water', cost: 6, effect: 'draw_self_4', rarity: 'U', text: '4枚ドロー。', abilities: [] }, // 適正化
    w_s10:{ name: '激流', type: 'SPELL', color: 'water', cost: 5, effect: 'bounce_allcr_1', rarity: 'R', text: '全クリーチャーを手札に。', abilities: [] }, // バウンスは少し軽く
    w_s11:{ name: '精神支配', type: 'SPELL', color: 'water', cost: 5, effect: 'destroy_cr_1', rarity: 'R', text: '対象を破壊(支配代用)。', abilities: [] },
    w_s12:{ name: '時空へのバウンス', type: 'SPELL', color: 'water', cost: 6, effect: 'bounce_allcr_1', rarity: 'M', text: '全クリーチャーを手札に。', abilities: [] },

    // 【✨ 光属性】
    l_c1: { name: '護衛犬', type: 'CREATURE', color: 'light', cost: 1, power: 1, toughness: 2, haste: false, rarity: 'C', text: '【警戒】', abilities: ['vigilance'] },
    l_c2: { name: '僧侶', type: 'CREATURE', color: 'light', cost: 1, power: 0, toughness: 3, haste: false, rarity: 'C', text: '【防衛】【絆魂】', abilities: ['defender', 'lifelink']},
    l_c3: { name: '聖職者', type: 'CREATURE', color: 'light', cost: 2, power: 1, toughness: 3, haste: false, rarity: 'C', text: '【絆魂】\n【起動】(①,タップ): ライフ2回復', abilities: ['lifelink'], activated: { cost: 1, tap: true, effect: 'heal_self_2' } },
    l_c4: { name: '騎士', type: 'CREATURE', color: 'light', cost: 2, power: 2, toughness: 2, haste: false, rarity: 'C', text: '【先制攻撃】', abilities: ['first_strike'] },
    l_c5: { name: '歩兵', type: 'CREATURE', color: 'light', cost: 1, power: 2, toughness: 1, haste: false, rarity: 'C', text: '兵士。', abilities: [] },
    l_c6: { name: 'グリフォン', type: 'CREATURE', color: 'light', cost: 3, power: 2, toughness: 2, haste: false, rarity: 'C', text: '【飛行】', abilities: ['flying'] },
    l_c7: { name: '槍兵', type: 'CREATURE', color: 'light', cost: 3, power: 3, toughness: 2, haste: false, rarity: 'C', text: '長い槍。', abilities: [] },
    l_c8: { name: '城壁の守備兵', type: 'CREATURE', color: 'light', cost: 4, power: 2, toughness: 5, haste: false, rarity: 'C', text: '【防衛】', abilities: ['defender'] },
    l_c9: { name: '天馬', type: 'CREATURE', color: 'light', cost: 3, power: 3, toughness: 3, haste: false, rarity: 'U', text: '【飛行】', abilities: ['flying'] },
    l_c10:{ name: '聖騎士', type: 'CREATURE', color: 'light', cost: 4, power: 3, toughness: 4, haste: false, rarity: 'U', text: '【警戒】【先制攻撃】', abilities: ['vigilance', 'first_strike'] },
    l_c11:{ name: '癒し手', type: 'CREATURE', color: 'light', cost: 2, power: 1, toughness: 4, haste: false, rarity: 'U', text: '【絆魂】', abilities: ['lifelink'] },
    l_c12:{ name: '銀の騎士', type: 'CREATURE', color: 'light', cost: 3, power: 3, toughness: 3, haste: false, rarity: 'U', text: '【先制攻撃】', abilities: ['first_strike'] },
    l_c13:{ name: '光の精霊', type: 'CREATURE', color: 'light', cost: 4, power: 4, toughness: 4, haste: false, rarity: 'U', text: '光る体。', abilities: [] },
    l_c14:{ name: '天使の雛', type: 'CREATURE', color: 'light', cost: 3, power: 2, toughness: 2, haste: false, rarity: 'U', text: '【飛行】【絆魂】', abilities: ['flying', 'lifelink'] },
    l_c15:{ name: '戦乙女', type: 'CREATURE', color: 'light', cost: 4, power: 4, toughness: 4, haste: false, rarity: 'R', text: '【飛行】【警戒】', abilities: ['flying', 'vigilance'] },
    l_c16:{ name: '天使', type: 'CREATURE', color: 'light', cost: 5, power: 5, toughness: 5, haste: false, rarity: 'R', text: '【飛行】【警戒】', abilities: ['flying', 'vigilance'] },
    l_c17:{ name: '百人隊長', type: 'CREATURE', color: 'light', cost: 5, power: 5, toughness: 5, haste: false, rarity: 'R', text: '【先制攻撃】', abilities: ['first_strike'] },
    l_c18:{ name: '守護神', type: 'CREATURE', color: 'light', cost: 6, power: 4, toughness: 8, haste: false, rarity: 'R', text: '【防衛】【絆魂】', abilities: ['defender', 'lifelink'] },
    l_c19:{ name: '大天使', type: 'CREATURE', color: 'light', cost: 7, power: 7, toughness: 7, haste: false, rarity: 'M', text: '【飛行】【絆魂】', abilities: ['flying', 'lifelink'] },
    l_c20:{ name: '聖龍', type: 'CREATURE', color: 'light', cost: 8, power: 8, toughness: 8, haste: false, rarity: 'M', text: '【飛行】【絆魂】', abilities: ['flying', 'lifelink'] },
    l_s1: { name: '治癒', type: 'SPELL', color: 'light', cost: 1, effect: 'heal_self_3', rarity: 'C', text: 'ライフ3回復。', abilities: [] },
    l_s2: { name: '神聖なる盾', type: 'SPELL', color: 'light', cost: 2, effect: 'buff_cr_1_2', rarity: 'C', text: '対象を+1/+2。', abilities: [] },
    l_s3: { name: '平和の訪れ', type: 'SPELL', color: 'light', cost: 2, effect: 'heal_self_5', rarity: 'C', text: 'ライフ5回復。', abilities: [] },
    l_s4: { name: '正義の光', type: 'SPELL', color: 'light', cost: 2, effect: 'dmg_cr_3', rarity: 'C', text: '対象に3ダメージ。', abilities: [] },
    l_s5: { name: '鼓舞', type: 'SPELL', color: 'light', cost: 3, effect: 'buffall_self_1_1', rarity: 'C', text: '味方全体+1/+1。', abilities: [] },
    l_s6: { name: '大治癒', type: 'SPELL', color: 'light', cost: 4, effect: 'heal_self_8', rarity: 'U', text: 'ライフ8回復。', abilities: [] },
    l_s7: { name: '天罰', type: 'SPELL', color: 'light', cost: 4, effect: 'dmg_cr_5', rarity: 'U', text: '対象に5ダメージ。', abilities: [] },
    l_s8: { name: '追放', type: 'SPELL', color: 'light', cost: 3, effect: 'destroy_cr_1', rarity: 'U', text: '対象を破壊。', abilities: [] },
    l_s9: { name: '結束', type: 'SPELL', color: 'light', cost: 4, effect: 'buffall_self_2_2', rarity: 'U', text: '味方全体+2/+2。', abilities: [] },
    l_s10:{ name: '神の怒り', type: 'SPELL', color: 'light', cost: 5, effect: 'destroy_allcr_1', rarity: 'R', text: '全クリーチャー破壊。', abilities: [] },
    l_s11:{ name: '奇跡の光', type: 'SPELL', color: 'light', cost: 6, effect: 'heal_self_12', rarity: 'R', text: 'ライフ12回復。', abilities: [] },
    l_s12:{ name: '審判の日', type: 'SPELL', color: 'light', cost: 6, effect: 'destroy_allcr_1', rarity: 'M', text: '全クリーチャー破壊。', abilities: [] },

    // 【🌑 闇属性】
    d_c1: { name: '吸血蝙蝠', type: 'CREATURE', color: 'dark', cost: 1, power: 1, toughness: 1, haste: false, rarity: 'C', text: '【飛行】【絆魂】', abilities: ['flying', 'lifelink'] },
    d_c2: { name: '骸骨兵', type: 'CREATURE', color: 'dark', cost: 2, power: 1, toughness: 1, haste: false, rarity: 'C', text: '【接死】\n【死亡時】: 相手に2ダメージ', abilities: ['deathtouch'], triggered: { condition: 'death', effect: 'dmg_p_2' } }, // 接死持ちはマナコストとスタッツを適正化
    d_c3: { name: 'ゾンビ', type: 'CREATURE', color: 'dark', cost: 2, power: 2, toughness: 2, haste: false, rarity: 'C', text: '腐肉の塊。', abilities: [] },
    d_c4: { name: 'ネズミ', type: 'CREATURE', color: 'dark', cost: 2, power: 1, toughness: 1, haste: false, rarity: 'C', text: '【接死】', abilities: ['deathtouch'] }, // 接死は1マナだと強すぎるため2マナに
    d_c5: { name: 'グール', type: 'CREATURE', color: 'dark', cost: 3, power: 3, toughness: 2, haste: false, rarity: 'C', text: '墓荒らし。', abilities: [] },
    d_c6: { name: '闇の信者', type: 'CREATURE', color: 'dark', cost: 2, power: 2, toughness: 1, haste: false, rarity: 'C', text: '儀式の生贄。', abilities: [] },
    d_c7: { name: 'カラス', type: 'CREATURE', color: 'dark', cost: 2, power: 1, toughness: 2, haste: false, rarity: 'C', text: '【飛行】', abilities: ['flying'] },
    d_c8: { name: '巨大ヒル', type: 'CREATURE', color: 'dark', cost: 4, power: 3, toughness: 4, haste: false, rarity: 'C', text: '血を吸う。', abilities: [] },
    d_c9: { name: '悪霊', type: 'CREATURE', color: 'dark', cost: 3, power: 3, toughness: 1, haste: false, rarity: 'U', text: '【飛行】', abilities: ['flying'] },
    d_c10:{ name: '死の騎士', type: 'CREATURE', color: 'dark', cost: 5, power: 4, toughness: 2, haste: false, rarity: 'U', text: '【先制攻撃】【接死】', abilities: ['first_strike', 'deathtouch'] }, // 強力な組み合わせのため重く
    d_c11:{ name: '吸血鬼', type: 'CREATURE', color: 'dark', cost: 4, power: 3, toughness: 3, haste: false, rarity: 'U', text: '【飛行】【絆魂】', abilities: ['flying', 'lifelink'] },
    d_c12:{ name: '毒蛇', type: 'CREATURE', color: 'dark', cost: 4, power: 1, toughness: 4, haste: false, rarity: 'U', text: '【接死】', abilities: ['deathtouch'] }, // 鉄壁の接死壁は重く
    d_c13:{ name: 'ワイト', type: 'CREATURE', color: 'dark', cost: 3, power: 4, toughness: 2, haste: false, rarity: 'U', text: 'アンデッド。', abilities: [] },
    d_c14:{ name: 'ガーゴイル', type: 'CREATURE', color: 'dark', cost: 4, power: 3, toughness: 4, haste: false, rarity: 'U', text: '【飛行】【防衛】', abilities: ['flying', 'defender'] },
    d_c15:{ name: '地獄の番犬', type: 'CREATURE', color: 'dark', cost: 5, power: 5, toughness: 3, haste: false, rarity: 'R', text: '【先制攻撃】', abilities: ['first_strike'] },
    d_c16:{ name: '悪魔', type: 'CREATURE', color: 'dark', cost: 5, power: 5, toughness: 5, haste: false, rarity: 'R', text: '【飛行】【トランプル】', abilities: ['flying', 'trample'] },
    d_c17:{ name: 'リッチ', type: 'CREATURE', color: 'dark', cost: 6, power: 5, toughness: 5, haste: false, rarity: 'R', text: '【接死】【絆魂】', abilities: ['deathtouch', 'lifelink'] },
    d_c18:{ name: '深淵のデーモン', type: 'CREATURE', color: 'dark', cost: 6, power: 6, toughness: 6, haste: false, rarity: 'R', text: '【飛行】', abilities: ['flying'] },
    d_c19:{ name: '魔王', type: 'CREATURE', color: 'dark', cost: 8, power: 8, toughness: 8, haste: false, rarity: 'M', text: '【飛行】【トランプル】【接死】', abilities: ['flying', 'trample', 'deathtouch'] },
    d_c20:{ name: '死の神', type: 'CREATURE', color: 'dark', cost: 9, power: 9, toughness: 9, haste: false, rarity: 'M', text: '【飛行】【接死】【絆魂】', abilities: ['flying', 'deathtouch', 'lifelink'] },
    d_s1: { name: '思考囲い', type: 'SPELL', color: 'dark', cost: 1, effect: 'discard_opp_1', rarity: 'C', text: '1枚ハンデス。', abilities: [] },
    d_s2: { name: '恐怖', type: 'SPELL', color: 'dark', cost: 4, effect: 'destroy_cr_1', rarity: 'C', text: '対象を破壊。', abilities: [] }, // コモンの確定除去は4マナへ
    d_s3: { name: '衰弱', type: 'SPELL', color: 'dark', cost: 2, effect: 'dmg_cr_3', rarity: 'C', text: '対象に3ダメージ。', abilities: [] },
    d_s4: { name: '吸血', type: 'SPELL', color: 'dark', cost: 3, effect: 'drain_any_2', rarity: 'C', text: '対象に2点吸収。', abilities: [] },
    d_s5: { name: '苦痛', type: 'SPELL', color: 'dark', cost: 1, effect: 'dmg_p_2', rarity: 'C', text: '相手に2ダメージ。', abilities: [] },
    d_s6: { name: '精神腐敗', type: 'SPELL', color: 'dark', cost: 3, effect: 'discard_opp_2', rarity: 'U', text: '2枚ハンデス。', abilities: [] },
    d_s7: { name: '殺害', type: 'SPELL', color: 'dark', cost: 3, effect: 'destroy_cr_1', rarity: 'U', text: '対象を破壊。', abilities: [] }, // アンコモンの確定除去は3マナ
    d_s8: { name: '生命吸収', type: 'SPELL', color: 'dark', cost: 6, effect: 'drain_p_4', rarity: 'U', text: '相手から4点吸収。', abilities: [] }, // 4点ドレインは非常に強力なため重く
    d_s9: { name: '魂の刈り取り', type: 'SPELL', color: 'dark', cost: 4, effect: 'dmg_cr_5', rarity: 'U', text: '対象に5ダメージ。', abilities: [] },
    d_s10:{ name: '破滅', type: 'SPELL', color: 'dark', cost: 5, effect: 'dmg_any_6', rarity: 'R', text: '対象に6ダメージ。', abilities: [] },
    d_s11:{ name: '滅び', type: 'SPELL', color: 'dark', cost: 6, effect: 'destroy_allcr_1', rarity: 'R', text: '全クリーチャー破壊。', abilities: [] }, // MTGより少し重めの6マナ
    d_s12:{ name: '死の宣告', type: 'SPELL', color: 'dark', cost: 7, effect: 'dmg_p_10', rarity: 'M', text: '相手に10ダメージ。', abilities: [] }
};