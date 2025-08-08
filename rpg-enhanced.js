
// 拡張RPG機能
class RPGGame {
    constructor() {
        this.player = {
            name: 'プレイヤー',
            level: 1,
            exp: 0,
            expNeeded: 100,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            gold: 100,
            stats: {
                attack: 10,
                defense: 5,
                speed: 8
            },
            inventory: [],
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            },
            skills: ['基本攻撃'],
            position: { lat: 35.6762, lng: 139.6503 }
        };
        
        this.enemies = [
            { name: 'スライム', hp: 30, attack: 8, defense: 2, exp: 15, gold: 10 },
            { name: 'ゴブリン', hp: 50, attack: 12, defense: 4, exp: 25, gold: 20 },
            { name: 'オーク', hp: 80, attack: 18, defense: 8, exp: 40, gold: 35 },
            { name: 'ドラゴン', hp: 200, attack: 35, defense: 15, exp: 100, gold: 100 }
        ];
        
        this.items = [
            { name: '回復薬', type: 'consumable', effect: 'heal', value: 50, price: 25 },
            { name: 'マナポーション', type: 'consumable', effect: 'mp', value: 30, price: 20 },
            { name: '鉄の剣', type: 'weapon', attack: 15, price: 100 },
            { name: '革の鎧', type: 'armor', defense: 8, price: 80 },
            { name: '力の指輪', type: 'accessory', attack: 5, price: 150 }
        ];
        
        this.quests = [
            {
                id: 1,
                title: '初心者の冒険',
                description: 'スライムを3匹倒してください',
                target: 'enemy',
                targetName: 'スライム',
                targetCount: 3,
                currentCount: 0,
                reward: { exp: 50, gold: 100 },
                completed: false
            },
            {
                id: 2,
                title: '宝探しの旅',
                description: '特定の場所でアイテムを5個収集してください',
                target: 'item',
                targetCount: 5,
                currentCount: 0,
                reward: { exp: 75, gold: 150 },
                completed: false
            }
        ];
        
        this.currentBattle = null;
        this.nearbyPOIs = [];
    }
    
    // プレイヤーの移動処理
    movePlayer(newPosition) {
        const distance = this.calculateDistance(this.player.position, newPosition);
        this.player.position = newPosition;
        
        // 移動による経験値獲得
        const expGain = Math.floor(distance * 100);
        this.gainExperience(expGain);
        
        // ランダムエンカウント
        if (Math.random() < 0.2) {
            this.triggerRandomEncounter();
        }
        
        // 近くのPOIを検索
        this.findNearbyPOIs(newPosition);
        
        return {
            message: `${distance.toFixed(2)}km移動しました。経験値+${expGain}`,
            expGain: expGain
        };
    }
    
    // 距離計算
    calculateDistance(pos1, pos2) {
        const R = 6371; // 地球の半径（km）
        const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
        const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // 経験値獲得
    gainExperience(exp) {
        this.player.exp += exp;
        
        while (this.player.exp >= this.player.expNeeded) {
            this.levelUp();
        }
    }
    
    // レベルアップ
    levelUp() {
        this.player.exp -= this.player.expNeeded;
        this.player.level++;
        
        // ステータス上昇
        const hpIncrease = Math.floor(Math.random() * 20) + 10;
        const mpIncrease = Math.floor(Math.random() * 10) + 5;
        const attackIncrease = Math.floor(Math.random() * 5) + 2;
        const defenseIncrease = Math.floor(Math.random() * 3) + 1;
        
        this.player.maxHp += hpIncrease;
        this.player.hp = this.player.maxHp; // 全回復
        this.player.maxMp += mpIncrease;
        this.player.mp = this.player.maxMp;
        this.player.stats.attack += attackIncrease;
        this.player.stats.defense += defenseIncrease;
        
        this.player.expNeeded = Math.floor(this.player.expNeeded * 1.5);
        
        // 新しいスキル習得
        this.learnNewSkill();
        
        return {
            message: `レベルアップ！レベル${this.player.level}になりました！`,
            stats: {
                hp: hpIncrease,
                mp: mpIncrease,
                attack: attackIncrease,
                defense: defenseIncrease
            }
        };
    }
    
    // 新スキル習得
    learnNewSkill() {
        const skills = {
            3: 'ファイアボール',
            5: 'ヒール',
            7: '連続攻撃',
            10: 'メテオ',
            15: '究極奥義'
        };
        
        if (skills[this.player.level] && !this.player.skills.includes(skills[this.player.level])) {
            this.player.skills.push(skills[this.player.level]);
            return skills[this.player.level];
        }
        return null;
    }
    
    // ランダムエンカウント
    triggerRandomEncounter() {
        const enemy = { ...this.enemies[Math.floor(Math.random() * this.enemies.length)] };
        this.currentBattle = {
            enemy: enemy,
            playerTurn: true,
            battleLog: []
        };
        
        return {
            type: 'battle',
            enemy: enemy.name,
            message: `${enemy.name}が現れた！`
        };
    }
    
    // 戦闘処理
    battle(action, skillIndex = 0) {
        if (!this.currentBattle || !this.currentBattle.playerTurn) {
            return { error: 'バトル中ではありません' };
        }
        
        const battle = this.currentBattle;
        const enemy = battle.enemy;
        let battleResult = null;
        
        // プレイヤーのターン
        if (action === 'attack') {
            const damage = Math.max(1, this.player.stats.attack - enemy.defense + Math.floor(Math.random() * 10) - 5);
            enemy.hp -= damage;
            battle.battleLog.push(`${this.player.name}の攻撃！${enemy.name}に${damage}のダメージ！`);
            
            if (enemy.hp <= 0) {
                battleResult = this.winBattle();
            }
        } else if (action === 'skill') {
            const skill = this.player.skills[skillIndex];
            const result = this.useSkill(skill, enemy);
            battle.battleLog.push(result.message);
            
            if (enemy.hp <= 0) {
                battleResult = this.winBattle();
            }
        } else if (action === 'item') {
            // アイテム使用（実装省略）
            battle.battleLog.push('アイテムを使用しました');
        } else if (action === 'run') {
            if (Math.random() < 0.7) {
                this.currentBattle = null;
                return { message: '逃げることに成功しました！', battleEnd: true };
            } else {
                battle.battleLog.push('逃げることに失敗しました！');
            }
        }
        
        // 敵のターン（バトルが続いている場合）
        if (!battleResult && enemy.hp > 0) {
            const enemyDamage = Math.max(1, enemy.attack - this.player.stats.defense + Math.floor(Math.random() * 5) - 2);
            this.player.hp -= enemyDamage;
            battle.battleLog.push(`${enemy.name}の攻撃！${this.player.name}に${enemyDamage}のダメージ！`);
            
            if (this.player.hp <= 0) {
                battleResult = this.loseBattle();
            }
        }
        
        return {
            battleLog: battle.battleLog,
            playerHp: this.player.hp,
            enemyHp: enemy.hp,
            battleResult: battleResult
        };
    }
    
    // スキル使用
    useSkill(skillName, target) {
        switch (skillName) {
            case 'ファイアボール':
                if (this.player.mp >= 10) {
                    this.player.mp -= 10;
                    const damage = this.player.stats.attack * 1.5;
                    target.hp -= damage;
                    return { message: `ファイアボール！${target.name}に${damage}のダメージ！` };
                }
                return { message: 'MPが足りません！' };
                
            case 'ヒール':
                if (this.player.mp >= 15) {
                    this.player.mp -= 15;
                    const heal = 50;
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
                    return { message: `ヒール！HPが${heal}回復しました！` };
                }
                return { message: 'MPが足りません！' };
                
            default:
                const damage = this.player.stats.attack;
                target.hp -= damage;
                return { message: `${skillName}！${target.name}に${damage}のダメージ！` };
        }
    }
    
    // 戦闘勝利
    winBattle() {
        const enemy = this.currentBattle.enemy;
        this.gainExperience(enemy.exp);
        this.player.gold += enemy.gold;
        
        // クエスト進行チェック
        this.updateQuests('enemy', enemy.name);
        
        const result = {
            message: `${enemy.name}を倒しました！経験値+${enemy.exp}、ゴールド+${enemy.gold}`,
            exp: enemy.exp,
            gold: enemy.gold,
            battleEnd: true
        };
        
        this.currentBattle = null;
        return result;
    }
    
    // 戦闘敗北
    loseBattle() {
        this.player.hp = 1; // 気絶状態
        const goldLoss = Math.floor(this.player.gold * 0.1);
        this.player.gold -= goldLoss;
        
        const result = {
            message: `気絶してしまいました...ゴールドを${goldLoss}失いました`,
            goldLoss: goldLoss,
            battleEnd: true
        };
        
        this.currentBattle = null;
        return result;
    }
    
    // アイテム収集
    collectItem() {
        const item = this.items[Math.floor(Math.random() * this.items.length)];
        this.player.inventory.push({ ...item });
        
        // クエスト進行チェック
        this.updateQuests('item');
        
        return {
            message: `${item.name}を入手しました！`,
            item: item.name
        };
    }
    
    // クエスト更新
    updateQuests(type, targetName = null) {
        this.quests.forEach(quest => {
            if (!quest.completed && quest.target === type) {
                if (type === 'enemy' && quest.targetName === targetName) {
                    quest.currentCount++;
                } else if (type === 'item') {
                    quest.currentCount++;
                }
                
                if (quest.currentCount >= quest.targetCount) {
                    quest.completed = true;
                    this.completeQuest(quest);
                }
            }
        });
    }
    
    // クエスト完了
    completeQuest(quest) {
        this.gainExperience(quest.reward.exp);
        this.player.gold += quest.reward.gold;
        
        return {
            message: `クエスト「${quest.title}」を完了しました！経験値+${quest.reward.exp}、ゴールド+${quest.reward.gold}`,
            quest: quest.title
        };
    }
    
    // 近くのPOI検索（模擬）
    findNearbyPOIs(position) {
        const pois = [
            { name: '古い神社', type: 'shrine', bonus: 'mp_recovery' },
            { name: '商店', type: 'shop', bonus: 'items' },
            { name: '訓練場', type: 'training', bonus: 'exp' },
            { name: '宝箱', type: 'treasure', bonus: 'gold' }
        ];
        
        // ランダムに近くのPOIを生成
        this.nearbyPOIs = [];
        if (Math.random() < 0.4) {
            const poi = pois[Math.floor(Math.random() * pois.length)];
            this.nearbyPOIs.push(poi);
        }
        
        return this.nearbyPOIs;
    }
    
    // POI訪問
    visitPOI(poiIndex) {
        if (poiIndex >= this.nearbyPOIs.length) {
            return { error: 'そのような場所はありません' };
        }
        
        const poi = this.nearbyPOIs[poiIndex];
        let result = {};
        
        switch (poi.bonus) {
            case 'mp_recovery':
                this.player.mp = this.player.maxMp;
                result = { message: `${poi.name}を訪れました。MPが全回復しました！` };
                break;
                
            case 'items':
                const item = this.collectItem();
                result = { message: `${poi.name}で${item.item}を購入しました！` };
                break;
                
            case 'exp':
                const expGain = Math.floor(Math.random() * 50) + 25;
                this.gainExperience(expGain);
                result = { message: `${poi.name}で訓練しました！経験値+${expGain}` };
                break;
                
            case 'gold':
                const goldGain = Math.floor(Math.random() * 100) + 50;
                this.player.gold += goldGain;
                result = { message: `${poi.name}で宝を発見しました！ゴールド+${goldGain}` };
                break;
        }
        
        // 訪問後はPOIを削除
        this.nearbyPOIs.splice(poiIndex, 1);
        return result;
    }
    
    // プレイヤー状態取得
    getPlayerStatus() {
        return {
            name: this.player.name,
            level: this.player.level,
            exp: this.player.exp,
            expNeeded: this.player.expNeeded,
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            mp: this.player.mp,
            maxMp: this.player.maxMp,
            gold: this.player.gold,
            stats: this.player.stats,
            skills: this.player.skills,
            inventory: this.player.inventory,
            quests: this.quests.filter(q => !q.completed),
            completedQuests: this.quests.filter(q => q.completed),
            nearbyPOIs: this.nearbyPOIs,
            inBattle: !!this.currentBattle
        };
    }
}

// グローバルインスタンス
window.rpgGame = new RPGGame();

