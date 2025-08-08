// ゲームの状態管理
let gameState = {
    currentMode: 'rpg',
    map: null,
    playerPosition: { lat: 35.6762, lng: 139.6503 }, // 東京駅
    playerMarker: null,
    
    // RPG関連
    rpg: {
        level: 1,
        exp: 0,
        expNeeded: 100,
        gold: 100,
        inventory: [],
        currentLocation: '探索中...'
    },
    
    // レーシング関連
    racing: {
        bestTime: null,
        currentTime: 0,
        speed: 0,
        vehicle: 'スポーツカー',
        isRacing: false,
        checkpoints: [],
        raceStartTime: null
    }
};

// Google Maps初期化
function initMap() {
    // デモ用のマップ（APIキーなしでも動作するように設定）
    const mapOptions = {
        zoom: 15,
        center: gameState.playerPosition,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "on" }]
            }
        ]
    };

    gameState.map = new google.maps.Map(document.getElementById('map'), mapOptions);
    
    // プレイヤーマーカーの作成
    createPlayerMarker();
    
    // マップクリックイベント
    gameState.map.addListener('click', function(event) {
        movePlayer(event.latLng);
    });
    
    // 現在地の取得を試行
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                gameState.playerPosition = pos;
                gameState.map.setCenter(pos);
                updatePlayerMarker();
                updateLocationInfo(pos);
            },
            function() {
                console.log('位置情報の取得に失敗しました。デフォルト位置を使用します。');
                updateLocationInfo(gameState.playerPosition);
            }
        );
    }
    
    // 初期化完了メッセージ
    addMessage('rpg', '🗺️ マップが読み込まれました！冒険を始めましょう！');
}

// プレイヤーマーカーの作成
function createPlayerMarker() {
    gameState.playerMarker = new google.maps.Marker({
        position: gameState.playerPosition,
        map: gameState.map,
        title: 'あなたの位置',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#ff4757',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        }
    });
}

// プレイヤーマーカーの更新
function updatePlayerMarker() {
    if (gameState.playerMarker) {
        gameState.playerMarker.setPosition(gameState.playerPosition);
    }
}

// プレイヤーの移動
function movePlayer(newPosition) {
    const oldPosition = gameState.playerPosition;
    gameState.playerPosition = {
        lat: newPosition.lat(),
        lng: newPosition.lng()
    };
    
    updatePlayerMarker();
    updateLocationInfo(gameState.playerPosition);
    
    if (gameState.currentMode === 'rpg') {
        // 拡張RPGシステムを使用
        if (window.rpgGame) {
            const result = window.rpgGame.movePlayer(gameState.playerPosition);
            addMessage('rpg', result.message);
            updateRPGDisplay();
            
            // ランダムエンカウントのチェック
            if (window.rpgGame.currentBattle) {
                showBattlePanel(window.rpgGame.currentBattle);
            }
        } else {
            // フォールバック処理
            const distance = calculateDistance(gameState.playerMarker.getPosition(), newPosition);
            const expGain = Math.floor(distance * 10);
            gainExperience(expGain);
            addMessage('rpg', `🚶 新しい場所に移動しました！経験値 +${expGain}`);
            
            if (Math.random() < 0.3) {
                triggerRandomEvent();
            }
        }
    } else if (gameState.currentMode === 'racing') {
        // レーシングモードでの移動処理
        if (gameState.racing.isRacing) {
            updateRaceProgress(newPosition);
        }
    }
}

// 距離計算（簡易版）
function calculateDistance(pos1, pos2) {
    const R = 6371; // 地球の半径（km）
    const dLat = (pos2.lat() - pos1.lat()) * Math.PI / 180;
    const dLng = (pos2.lng() - pos1.lng()) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat() * Math.PI / 180) * Math.cos(pos2.lat() * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// 位置情報の更新
function updateLocationInfo(position) {
    // 簡易的な位置表示（実際のアプリではGeocoding APIを使用）
    const lat = position.lat.toFixed(4);
    const lng = position.lng.toFixed(4);
    gameState.rpg.currentLocation = `緯度: ${lat}, 経度: ${lng}`;
    document.getElementById('current-location').textContent = gameState.rpg.currentLocation;
}

// ゲームモードの切り替え
function switchGame(mode) {
    gameState.currentMode = mode;
    
    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.game-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // パネルの表示切り替え
    document.getElementById('rpg-panel').style.display = mode === 'rpg' ? 'block' : 'none';
    document.getElementById('racing-panel').style.display = mode === 'racing' ? 'block' : 'none';
    
    // モード固有の初期化
    if (mode === 'rpg') {
        addMessage('rpg', '🏰 RPGモードに切り替えました！');
    } else if (mode === 'racing') {
        addMessage('racing', '🏎️ レーシングモードに切り替えました！');
    }
}

// RPG関連の関数
function exploreArea() {
    const events = [
        '🌟 隠された宝箱を発見しました！',
        '🗡️ 野生のモンスターと遭遇しました！',
        '🏪 商人を見つけました。',
        '🌿 薬草を発見しました。',
        '🏛️ 古い遺跡を発見しました。'
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    addMessage('rpg', randomEvent);
    
    // ランダムな報酬
    const goldGain = Math.floor(Math.random() * 50) + 10;
    gameState.rpg.gold += goldGain;
    updateRPGDisplay();
    addMessage('rpg', `💰 ${goldGain}ゴールドを獲得しました！`);
}

function findQuest() {
    const quests = [
        '📜 「失われた猫を探して」- 近くの公園で迷子の猫を探してください。',
        '📜 「配達クエスト」- 駅まで荷物を届けてください。',
        '📜 「モンスター退治」- 街に現れたモンスターを倒してください。',
        '📜 「宝探し」- 地図の印の場所で宝を探してください。'
    ];
    
    const randomQuest = quests[Math.floor(Math.random() * quests.length)];
    addMessage('rpg', randomQuest);
}

function collectItem() {
    const items = ['⚔️ 鉄の剣', '🛡️ 革の盾', '💊 回復薬', '🔮 魔法石', '🗝️ 古い鍵'];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    gameState.rpg.inventory.push(randomItem);
    addMessage('rpg', `📦 ${randomItem}を入手しました！`);
}

function openInventory() {
    if (gameState.rpg.inventory.length === 0) {
        addMessage('rpg', '🎒 インベントリは空です。');
    } else {
        addMessage('rpg', `🎒 所持アイテム: ${gameState.rpg.inventory.join(', ')}`);
    }
}

function gainExperience(exp) {
    gameState.rpg.exp += exp;
    
    while (gameState.rpg.exp >= gameState.rpg.expNeeded) {
        gameState.rpg.exp -= gameState.rpg.expNeeded;
        gameState.rpg.level++;
        gameState.rpg.expNeeded = Math.floor(gameState.rpg.expNeeded * 1.5);
        addMessage('rpg', `🎉 レベルアップ！レベル ${gameState.rpg.level} になりました！`);
    }
    
    updateRPGDisplay();
}

function triggerRandomEvent() {
    const events = [
        () => {
            const exp = Math.floor(Math.random() * 30) + 10;
            gainExperience(exp);
            addMessage('rpg', `✨ 神秘的な光に包まれました！経験値 +${exp}`);
        },
        () => {
            const gold = Math.floor(Math.random() * 100) + 20;
            gameState.rpg.gold += gold;
            updateRPGDisplay();
            addMessage('rpg', `💰 道端でお金を拾いました！${gold}ゴールド獲得！`);
        },
        () => {
            collectItem();
        }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();
}

// レーシング関連の関数
function startRace() {
    if (gameState.racing.isRacing) {
        // レース終了
        gameState.racing.isRacing = false;
        const finalTime = Date.now() - gameState.racing.raceStartTime;
        const timeString = formatTime(finalTime);
        
        if (!gameState.racing.bestTime || finalTime < gameState.racing.bestTime) {
            gameState.racing.bestTime = finalTime;
            document.getElementById('best-time').textContent = timeString;
            addMessage('racing', `🏆 新記録達成！タイム: ${timeString}`);
        } else {
            addMessage('racing', `🏁 レース終了！タイム: ${timeString}`);
        }
        
        document.querySelector('button[onclick="startRace()"]').textContent = '🏁 レース開始';
    } else {
        // レース開始
        gameState.racing.isRacing = true;
        gameState.racing.raceStartTime = Date.now();
        addMessage('racing', '🏁 レーススタート！マップをクリックして進んでください！');
        document.querySelector('button[onclick="startRace()"]').textContent = '🛑 レース終了';
        
        // タイマー開始
        updateRaceTimer();
    }
}

function updateRaceTimer() {
    if (gameState.racing.isRacing) {
        const currentTime = Date.now() - gameState.racing.raceStartTime;
        document.getElementById('current-time').textContent = formatTime(currentTime);
        setTimeout(updateRaceTimer, 100);
    }
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function setCheckpoint() {
    const checkpoint = {
        position: gameState.playerPosition,
        id: gameState.racing.checkpoints.length + 1
    };
    
    gameState.racing.checkpoints.push(checkpoint);
    
    // チェックポイントマーカーを追加
    new google.maps.Marker({
        position: gameState.playerPosition,
        map: gameState.map,
        title: `チェックポイント ${checkpoint.id}`,
        icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 8,
            fillColor: '#2ed573',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        }
    });
    
    addMessage('racing', `📍 チェックポイント ${checkpoint.id} を設定しました！`);
}

function changeVehicle() {
    const vehicles = ['🏎️ スポーツカー', '🚗 セダン', '🚙 SUV', '🏍️ バイク', '🚚 トラック'];
    const currentIndex = vehicles.indexOf('🏎️ ' + gameState.racing.vehicle);
    const nextIndex = (currentIndex + 1) % vehicles.length;
    
    gameState.racing.vehicle = vehicles[nextIndex].replace('🏎️ ', '').replace('🚗 ', '').replace('🚙 ', '').replace('🏍️ ', '').replace('🚚 ', '');
    document.getElementById('current-vehicle').textContent = gameState.racing.vehicle;
    addMessage('racing', `🔄 車両を ${vehicles[nextIndex]} に変更しました！`);
}

function viewLeaderboard() {
    if (gameState.racing.bestTime) {
        const timeString = formatTime(gameState.racing.bestTime);
        addMessage('racing', `🏆 あなたのベストタイム: ${timeString}`);
    } else {
        addMessage('racing', '🏆 まだレコードがありません。レースを完走してください！');
    }
}

function updateRaceProgress(newPosition) {
    // 簡易的な速度計算
    const speed = Math.floor(Math.random() * 60) + 20; // 20-80 km/h
    gameState.racing.speed = speed;
    document.getElementById('current-speed').textContent = speed;
}

// UI更新関数
function updateRPGDisplay() {
    document.getElementById('player-level').textContent = gameState.rpg.level;
    document.getElementById('player-exp').textContent = gameState.rpg.exp;
    document.getElementById('exp-needed').textContent = gameState.rpg.expNeeded;
    document.getElementById('player-gold').textContent = gameState.rpg.gold;
}

function addMessage(mode, message) {
    const messagesContainer = document.getElementById(`${mode}-messages`);
    const messageElement = document.createElement('p');
    messageElement.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    messageElement.style.marginBottom = '0.5rem';
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// エラーハンドリング（APIキーが無効な場合）
function handleMapError() {
    document.getElementById('map').innerHTML = `
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 2rem; text-align: center;">
            <h3>🗺️ デモモード</h3>
            <p>Google Maps APIキーが設定されていないため、デモモードで動作しています。</p>
            <p>実際の地図を表示するには、有効なAPIキーが必要です。</p>
            <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <p><strong>現在の機能:</strong></p>
                <ul style="text-align: left; margin-top: 1rem;">
                    <li>ゲームモードの切り替え</li>
                    <li>RPGゲームの基本機能</li>
                    <li>レーシングゲームの基本機能</li>
                    <li>UI/UXの確認</li>
                </ul>
            </div>
        </div>
    `;
    
    // デモ用の初期化
    addMessage('rpg', '🎮 デモモードで起動しました！各機能をお試しください。');
}

// Google Maps API読み込みエラー時の処理
window.gm_authFailure = handleMapError;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    updateRPGDisplay();
    
    // Google Maps APIが読み込まれない場合のフォールバック
    setTimeout(function() {
        if (!window.google || !window.google.maps) {
            handleMapError();
        }
    }, 5000);
});



// 拡張RPG機能のUI関数
function exploreArea() {
    if (window.rpgGame) {
        const result = window.rpgGame.triggerRandomEncounter();
        if (result && result.type === 'battle') {
            addMessage('rpg', result.message);
            showBattlePanel(window.rpgGame.currentBattle);
        } else {
            // 通常の探索
            const pois = window.rpgGame.findNearbyPOIs(gameState.playerPosition);
            if (pois.length > 0) {
                addMessage('rpg', `🏛️ 近くに${pois[0].name}を発見しました！`);
            } else {
                addMessage('rpg', '🔍 この辺りには何もないようです...');
            }
        }
        updateRPGDisplay();
    } else {
        // 元の処理
        const events = [
            '🌟 隠された宝箱を発見しました！',
            '🗡️ 野生のモンスターと遭遇しました！',
            '🏪 商人を見つけました。',
            '🌿 薬草を発見しました。',
            '🏛️ 古い遺跡を発見しました。'
        ];
        
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        addMessage('rpg', randomEvent);
        
        const goldGain = Math.floor(Math.random() * 50) + 10;
        gameState.rpg.gold += goldGain;
        updateRPGDisplay();
        addMessage('rpg', `💰 ${goldGain}ゴールドを獲得しました！`);
    }
}

function collectItem() {
    if (window.rpgGame) {
        const result = window.rpgGame.collectItem();
        addMessage('rpg', result.message);
        updateRPGDisplay();
    } else {
        // 元の処理
        const items = ['⚔️ 鉄の剣', '🛡️ 革の盾', '💊 回復薬', '🔮 魔法石', '🗝️ 古い鍵'];
        const randomItem = items[Math.floor(Math.random() * items.length)];
        
        gameState.rpg.inventory.push(randomItem);
        addMessage('rpg', `📦 ${randomItem}を入手しました！`);
    }
}

function openInventory() {
    if (window.rpgGame) {
        const status = window.rpgGame.getPlayerStatus();
        if (status.inventory.length === 0) {
            addMessage('rpg', '🎒 インベントリは空です。');
        } else {
            const itemNames = status.inventory.map(item => item.name).join(', ');
            addMessage('rpg', `🎒 所持アイテム: ${itemNames}`);
        }
    } else {
        // 元の処理
        if (gameState.rpg.inventory.length === 0) {
            addMessage('rpg', '🎒 インベントリは空です。');
        } else {
            addMessage('rpg', `🎒 所持アイテム: ${gameState.rpg.inventory.join(', ')}`);
        }
    }
}

function showPlayerStats() {
    if (window.rpgGame) {
        const status = window.rpgGame.getPlayerStatus();
        addMessage('rpg', `📊 ステータス - 攻撃力: ${status.stats.attack}, 防御力: ${status.stats.defense}, 素早さ: ${status.stats.speed}`);
        addMessage('rpg', `✨ 習得スキル: ${status.skills.join(', ')}`);
        
        if (status.quests.length > 0) {
            status.quests.forEach(quest => {
                addMessage('rpg', `📜 ${quest.title}: ${quest.currentCount}/${quest.targetCount}`);
            });
        }
    } else {
        addMessage('rpg', '📊 ステータス機能は拡張版で利用できます。');
    }
}

function visitNearbyPOI() {
    if (window.rpgGame) {
        const status = window.rpgGame.getPlayerStatus();
        if (status.nearbyPOIs.length > 0) {
            const result = window.rpgGame.visitPOI(0);
            addMessage('rpg', result.message);
            updateRPGDisplay();
        } else {
            addMessage('rpg', '🏛️ 近くに訪問できる施設はありません。');
        }
    } else {
        addMessage('rpg', '🏛️ 施設訪問機能は拡張版で利用できます。');
    }
}

function findQuest() {
    if (window.rpgGame) {
        const status = window.rpgGame.getPlayerStatus();
        if (status.quests.length > 0) {
            const quest = status.quests[0];
            addMessage('rpg', `📜 「${quest.title}」- ${quest.description}`);
        } else {
            addMessage('rpg', '📜 現在利用可能なクエストはありません。');
        }
    } else {
        // 元の処理
        const quests = [
            '📜 「失われた猫を探して」- 近くの公園で迷子の猫を探してください。',
            '📜 「配達クエスト」- 駅まで荷物を届けてください。',
            '📜 「モンスター退治」- 街に現れたモンスターを倒してください。',
            '📜 「宝探し」- 地図の印の場所で宝を探してください。'
        ];
        
        const randomQuest = quests[Math.floor(Math.random() * quests.length)];
        addMessage('rpg', randomQuest);
    }
}

function showBattlePanel(battle) {
    const battlePanel = document.getElementById('battle-panel');
    const enemyName = document.getElementById('enemy-name');
    const enemyHp = document.getElementById('enemy-hp');
    
    enemyName.textContent = battle.enemy.name;
    enemyHp.textContent = battle.enemy.hp;
    battlePanel.style.display = 'block';
    
    addMessage('rpg', `⚔️ ${battle.enemy.name}との戦闘が始まりました！`);
}

function hideBattlePanel() {
    document.getElementById('battle-panel').style.display = 'none';
}

function battleAction(action) {
    if (window.rpgGame && window.rpgGame.currentBattle) {
        const result = window.rpgGame.battle(action);
        
        if (result.error) {
            addMessage('rpg', result.error);
            return;
        }
        
        // バトルログを表示
        result.battleLog.forEach(log => {
            addMessage('rpg', log);
        });
        
        // HP更新
        updateRPGDisplay();
        document.getElementById('enemy-hp').textContent = result.enemyHp;
        
        // バトル終了チェック
        if (result.battleResult) {
            addMessage('rpg', result.battleResult.message);
            hideBattlePanel();
            updateRPGDisplay();
        }
    }
}

// UI更新関数の拡張
function updateRPGDisplay() {
    if (window.rpgGame) {
        const status = window.rpgGame.getPlayerStatus();
        document.getElementById('player-level').textContent = status.level;
        document.getElementById('player-hp').textContent = status.hp;
        document.getElementById('player-max-hp').textContent = status.maxHp;
        document.getElementById('player-mp').textContent = status.mp;
        document.getElementById('player-max-mp').textContent = status.maxMp;
        document.getElementById('player-exp').textContent = status.exp;
        document.getElementById('exp-needed').textContent = status.expNeeded;
        document.getElementById('player-gold').textContent = status.gold;
    } else {
        // 元の処理
        document.getElementById('player-level').textContent = gameState.rpg.level;
        document.getElementById('player-exp').textContent = gameState.rpg.exp;
        document.getElementById('exp-needed').textContent = gameState.rpg.expNeeded;
        document.getElementById('player-gold').textContent = gameState.rpg.gold;
    }
}


// 拡張レーシング機能のUI関数
function startRace() {
    if (window.racingGame) {
        const result = window.racingGame.startRace();
        if (result.error) {
            addMessage('racing', result.error);
            return;
        }
        
        addMessage('racing', result.message);
        updateRacingDisplay();
        
        if (window.racingGame.isRacing) {
            document.querySelector('button[onclick="startRace()"]').textContent = '🛑 レース終了';
            updateRaceTimer();
        } else {
            document.querySelector('button[onclick="startRace()"]').textContent = '🏁 レース開始';
        }
    } else {
        // 元の処理
        if (gameState.racing.isRacing) {
            gameState.racing.isRacing = false;
            const finalTime = Date.now() - gameState.racing.raceStartTime;
            const timeString = formatTime(finalTime);
            
            if (!gameState.racing.bestTime || finalTime < gameState.racing.bestTime) {
                gameState.racing.bestTime = finalTime;
                document.getElementById('best-time').textContent = timeString;
                addMessage('racing', `🏆 新記録達成！タイム: ${timeString}`);
            } else {
                addMessage('racing', `🏁 レース終了！タイム: ${timeString}`);
            }
            
            document.querySelector('button[onclick="startRace()"]').textContent = '🏁 レース開始';
        } else {
            gameState.racing.isRacing = true;
            gameState.racing.raceStartTime = Date.now();
            addMessage('racing', '🏁 レーススタート！マップをクリックして進んでください！');
            document.querySelector('button[onclick="startRace()"]').textContent = '🛑 レース終了';
            updateRaceTimer();
        }
    }
}

function setCheckpoint() {
    if (window.racingGame) {
        const result = window.racingGame.setCheckpoint(gameState.playerPosition);
        addMessage('racing', result.message);
        
        // マップにチェックポイントマーカーを追加
        if (gameState.map) {
            new google.maps.Marker({
                position: gameState.playerPosition,
                map: gameState.map,
                title: `チェックポイント ${result.checkpoint.id}`,
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 8,
                    fillColor: '#2ed573',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                }
            });
        }
    } else {
        // 元の処理
        const checkpoint = {
            position: gameState.playerPosition,
            id: gameState.racing.checkpoints.length + 1
        };
        
        gameState.racing.checkpoints.push(checkpoint);
        
        if (gameState.map) {
            new google.maps.Marker({
                position: gameState.playerPosition,
                map: gameState.map,
                title: `チェックポイント ${checkpoint.id}`,
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 8,
                    fillColor: '#2ed573',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                }
            });
        }
        
        addMessage('racing', `📍 チェックポイント ${checkpoint.id} を設定しました！`);
    }
}

function changeVehicle() {
    if (window.racingGame) {
        const result = window.racingGame.changeVehicle();
        addMessage('racing', result.message);
        updateRacingDisplay();
    } else {
        // 元の処理
        const vehicles = ['🏎️ スポーツカー', '🚗 セダン', '🚙 SUV', '🏍️ バイク', '🚚 トラック'];
        const currentIndex = vehicles.indexOf('🏎️ ' + gameState.racing.vehicle);
        const nextIndex = (currentIndex + 1) % vehicles.length;
        
        gameState.racing.vehicle = vehicles[nextIndex].replace('🏎️ ', '').replace('🚗 ', '').replace('🚙 ', '').replace('🏍️ ', '').replace('🚚 ', '');
        document.getElementById('current-vehicle').textContent = gameState.racing.vehicle;
        addMessage('racing', `🔄 車両を ${vehicles[nextIndex]} に変更しました！`);
    }
}

function generateCourse() {
    if (window.racingGame) {
        const result = window.racingGame.generateCourse(gameState.playerPosition);
        addMessage('racing', result.message);
        
        // マップにチェックポイントマーカーを追加
        if (gameState.map) {
            result.checkpoints.forEach(checkpoint => {
                new google.maps.Marker({
                    position: checkpoint.position,
                    map: gameState.map,
                    title: `チェックポイント ${checkpoint.id}`,
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 8,
                        fillColor: '#ff6b6b',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    }
                });
            });
        }
    } else {
        addMessage('racing', '🗺️ コース生成機能は拡張版で利用できます。');
    }
}

function viewVehicleShop() {
    if (window.racingGame) {
        const shop = window.racingGame.getVehicleShop();
        addMessage('racing', '🏪 車両ショップ:');
        
        shop.forEach(vehicle => {
            const status = vehicle.owned ? '(所有済み)' : 
                          vehicle.canBuy ? `(${vehicle.price}円)` : 
                          `(${vehicle.price}円 - 資金不足)`;
            addMessage('racing', `${vehicle.name} - 最高速度: ${vehicle.maxSpeed}km/h ${status}`);
        });
        
        const availableToBuy = shop.filter(v => v.canBuy);
        if (availableToBuy.length > 0) {
            addMessage('racing', '購入可能な車両があります！');
        }
    } else {
        addMessage('racing', '🏪 車両ショップ機能は拡張版で利用できます。');
    }
}

function viewLeaderboard() {
    if (window.racingGame) {
        const status = window.racingGame.getPlayerStatus();
        const leaderboard = window.racingGame.getLeaderboard();
        
        if (Object.keys(status.bestTimes).length > 0) {
            addMessage('racing', '🏆 あなたのベストタイム:');
            Object.keys(status.bestTimes).forEach(course => {
                const time = window.racingGame.formatTime(status.bestTimes[course]);
                addMessage('racing', `${course}: ${time}`);
            });
        } else {
            addMessage('racing', '🏆 まだレコードがありません。レースを完走してください！');
        }
        
        if (status.raceHistory.length > 0) {
            addMessage('racing', '📊 最近のレース履歴:');
            status.raceHistory.slice(-3).forEach(race => {
                const time = window.racingGame.formatTime(race.time);
                addMessage('racing', `${race.course} - ${time} (${race.vehicle})`);
            });
        }
    } else {
        // 元の処理
        if (gameState.racing.bestTime) {
            const timeString = formatTime(gameState.racing.bestTime);
            addMessage('racing', `🏆 あなたのベストタイム: ${timeString}`);
        } else {
            addMessage('racing', '🏆 まだレコードがありません。レースを完走してください！');
        }
    }
}

function updateRaceProgress(newPosition) {
    if (window.racingGame) {
        const result = window.racingGame.updatePosition(newPosition);
        if (result) {
            addMessage('racing', result.message);
            if (result.lapTime) {
                // ラップ完了
                updateRacingDisplay();
            }
        }
        updateRacingDisplay();
    } else {
        // 元の処理
        const speed = Math.floor(Math.random() * 60) + 20;
        gameState.racing.speed = speed;
        document.getElementById('current-speed').textContent = speed;
    }
}

function updateRaceTimer() {
    if (window.racingGame && window.racingGame.isRacing) {
        const currentTime = Date.now() - window.racingGame.raceStartTime;
        document.getElementById('current-time').textContent = window.racingGame.formatTime(currentTime);
        setTimeout(updateRaceTimer, 100);
    } else if (gameState.racing.isRacing) {
        // 元の処理
        const currentTime = Date.now() - gameState.racing.raceStartTime;
        document.getElementById('current-time').textContent = formatTime(currentTime);
        setTimeout(updateRaceTimer, 100);
    }
}

function updateRacingDisplay() {
    if (window.racingGame) {
        const status = window.racingGame.getPlayerStatus();
        document.getElementById('racing-level').textContent = status.level;
        document.getElementById('racing-money').textContent = status.money;
        document.getElementById('racing-exp').textContent = status.experience;
        document.getElementById('current-vehicle').textContent = status.currentVehicle.name;
        document.getElementById('current-speed').textContent = status.currentSpeed;
        
        // ベストタイム表示
        const bestTimes = Object.values(status.bestTimes);
        if (bestTimes.length > 0) {
            const bestTime = Math.min(...bestTimes);
            document.getElementById('best-time').textContent = window.racingGame.formatTime(bestTime);
        }
    }
}

// プレイヤー移動時のレーシング処理を更新
const originalMovePlayer = movePlayer;
function movePlayer(newPosition) {
    originalMovePlayer(newPosition);
    
    if (gameState.currentMode === 'racing' && window.racingGame) {
        updateRaceProgress(newPosition);
    }
}

