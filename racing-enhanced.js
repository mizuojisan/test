// 拡張レーシング機能
class RacingGame {
    constructor() {
        this.player = {
            name: 'プレイヤー',
            position: { lat: 35.6762, lng: 139.6503 },
            currentVehicle: 0,
            money: 1000,
            experience: 0,
            level: 1
        };
        
        this.vehicles = [
            {
                name: 'コンパクトカー',
                maxSpeed: 120,
                acceleration: 0.8,
                handling: 0.9,
                price: 0,
                owned: true,
                description: '燃費が良く扱いやすい初心者向けの車'
            },
            {
                name: 'スポーツカー',
                maxSpeed: 200,
                acceleration: 1.2,
                handling: 0.7,
                price: 5000,
                owned: false,
                description: '高速走行に特化したパフォーマンスカー'
            },
            {
                name: 'SUV',
                maxSpeed: 150,
                acceleration: 0.6,
                handling: 0.8,
                price: 3000,
                owned: false,
                description: '悪路に強く安定性の高い車両'
            },
            {
                name: 'レーシングカー',
                maxSpeed: 300,
                acceleration: 1.5,
                handling: 0.6,
                price: 15000,
                owned: false,
                description: '最高性能を誇るプロ仕様のレーシングマシン'
            }
        ];
        
        this.currentRace = null;
        this.raceHistory = [];
        this.checkpoints = [];
        this.currentSpeed = 0;
        this.raceStartTime = null;
        this.isRacing = false;
        this.currentLap = 1;
        this.totalLaps = 3;
        this.bestTimes = {};
        
        this.courses = [
            {
                name: '市街地サーキット',
                difficulty: 'Easy',
                laps: 2,
                description: '街中を駆け抜ける初心者向けコース',
                reward: 200
            },
            {
                name: '高速道路チャレンジ',
                difficulty: 'Medium',
                laps: 3,
                description: '高速道路での直線スピード勝負',
                reward: 500
            },
            {
                name: '山道ドリフト',
                difficulty: 'Hard',
                laps: 5,
                description: '曲がりくねった山道でのテクニカルコース',
                reward: 1000
            }
        ];
    }
    
    // 車両変更
    changeVehicle() {
        const ownedVehicles = this.vehicles.filter(v => v.owned);
        if (ownedVehicles.length <= 1) {
            return { message: '他に所有している車両がありません。ショップで購入してください。' };
        }
        
        this.player.currentVehicle = (this.player.currentVehicle + 1) % this.vehicles.length;
        
        // 所有していない車両はスキップ
        while (!this.vehicles[this.player.currentVehicle].owned) {
            this.player.currentVehicle = (this.player.currentVehicle + 1) % this.vehicles.length;
        }
        
        const currentVehicle = this.vehicles[this.player.currentVehicle];
        return {
            message: `車両を${currentVehicle.name}に変更しました！`,
            vehicle: currentVehicle
        };
    }
    
    // 車両購入
    buyVehicle(vehicleIndex) {
        if (vehicleIndex >= this.vehicles.length) {
            return { error: 'その車両は存在しません' };
        }
        
        const vehicle = this.vehicles[vehicleIndex];
        
        if (vehicle.owned) {
            return { error: 'その車両は既に所有しています' };
        }
        
        if (this.player.money < vehicle.price) {
            return { error: `お金が足りません。必要額: ${vehicle.price}、所持金: ${this.player.money}` };
        }
        
        this.player.money -= vehicle.price;
        vehicle.owned = true;
        
        return {
            message: `${vehicle.name}を購入しました！`,
            vehicle: vehicle,
            remainingMoney: this.player.money
        };
    }
    
    // レース開始
    startRace(courseIndex = 0) {
        if (this.isRacing) {
            return this.finishRace();
        }
        
        const course = this.courses[courseIndex] || this.courses[0];
        
        this.currentRace = {
            course: course,
            startTime: Date.now(),
            lapTimes: [],
            currentLap: 1,
            totalLaps: course.laps,
            checkpointsHit: 0,
            totalCheckpoints: this.checkpoints.length
        };
        
        this.isRacing = true;
        this.raceStartTime = Date.now();
        this.currentLap = 1;
        this.currentSpeed = 0;
        
        return {
            message: `${course.name}でレース開始！${course.laps}周のレースです。`,
            course: course,
            vehicle: this.vehicles[this.player.currentVehicle]
        };
    }
    
    // レース終了
    finishRace() {
        if (!this.isRacing || !this.currentRace) {
            return { error: 'レース中ではありません' };
        }
        
        const totalTime = Date.now() - this.raceStartTime;
        const course = this.currentRace.course;
        
        // ベストタイム更新チェック
        const courseName = course.name;
        const isNewRecord = !this.bestTimes[courseName] || totalTime < this.bestTimes[courseName];
        
        if (isNewRecord) {
            this.bestTimes[courseName] = totalTime;
        }
        
        // 報酬計算
        let reward = course.reward;
        if (isNewRecord) {
            reward *= 1.5; // 新記録ボーナス
        }
        
        // 経験値とお金の獲得
        const expGain = Math.floor(course.reward / 10);
        this.player.money += reward;
        this.player.experience += expGain;
        
        // レベルアップチェック
        const levelUp = this.checkLevelUp();
        
        // レース履歴に追加
        this.raceHistory.push({
            course: courseName,
            time: totalTime,
            vehicle: this.vehicles[this.player.currentVehicle].name,
            reward: reward,
            date: new Date()
        });
        
        this.isRacing = false;
        this.currentRace = null;
        
        return {
            message: `レース完了！タイム: ${this.formatTime(totalTime)}`,
            totalTime: totalTime,
            formattedTime: this.formatTime(totalTime),
            isNewRecord: isNewRecord,
            reward: reward,
            expGain: expGain,
            levelUp: levelUp
        };
    }
    
    // レベルアップチェック
    checkLevelUp() {
        const expNeeded = this.player.level * 100;
        if (this.player.experience >= expNeeded) {
            this.player.level++;
            this.player.experience -= expNeeded;
            return {
                newLevel: this.player.level,
                message: `レベルアップ！レベル${this.player.level}になりました！`
            };
        }
        return null;
    }
    
    // チェックポイント設定
    setCheckpoint(position) {
        const checkpoint = {
            id: this.checkpoints.length + 1,
            position: position,
            hit: false
        };
        
        this.checkpoints.push(checkpoint);
        
        return {
            message: `チェックポイント ${checkpoint.id} を設定しました！`,
            checkpoint: checkpoint,
            totalCheckpoints: this.checkpoints.length
        };
    }
    
    // チェックポイント通過チェック
    checkCheckpoint(currentPosition) {
        if (!this.isRacing) return null;
        
        for (let checkpoint of this.checkpoints) {
            if (!checkpoint.hit) {
                const distance = this.calculateDistance(currentPosition, checkpoint.position);
                if (distance < 0.05) { // 50m以内
                    checkpoint.hit = true;
                    this.currentRace.checkpointsHit++;
                    
                    // 全チェックポイント通過でラップ完了
                    if (this.currentRace.checkpointsHit >= this.checkpoints.length) {
                        return this.completeLap();
                    }
                    
                    return {
                        message: `チェックポイント ${checkpoint.id} を通過！`,
                        checkpointsRemaining: this.checkpoints.length - this.currentRace.checkpointsHit
                    };
                }
            }
        }
        return null;
    }
    
    // ラップ完了
    completeLap() {
        const lapTime = Date.now() - this.raceStartTime;
        this.currentRace.lapTimes.push(lapTime);
        this.currentLap++;
        
        // チェックポイントリセット
        this.checkpoints.forEach(cp => cp.hit = false);
        this.currentRace.checkpointsHit = 0;
        
        if (this.currentLap > this.currentRace.totalLaps) {
            // レース完了
            return this.finishRace();
        } else {
            // 次のラップ
            this.raceStartTime = Date.now(); // ラップタイマーリセット
            return {
                message: `ラップ ${this.currentLap - 1} 完了！タイム: ${this.formatTime(lapTime)}`,
                lapTime: lapTime,
                currentLap: this.currentLap,
                totalLaps: this.currentRace.totalLaps
            };
        }
    }
    
    // 移動時の処理
    updatePosition(newPosition) {
        this.player.position = newPosition;
        
        if (this.isRacing) {
            // 速度計算（簡易版）
            const vehicle = this.vehicles[this.player.currentVehicle];
            this.currentSpeed = Math.min(
                vehicle.maxSpeed,
                Math.floor(Math.random() * vehicle.maxSpeed * 0.8) + vehicle.maxSpeed * 0.2
            );
            
            // チェックポイント通過チェック
            const checkpointResult = this.checkCheckpoint(newPosition);
            if (checkpointResult) {
                return checkpointResult;
            }
        }
        
        return null;
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
    
    // 時間フォーマット
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    
    // ランキング表示
    getLeaderboard() {
        const rankings = {};
        
        this.raceHistory.forEach(race => {
            if (!rankings[race.course]) {
                rankings[race.course] = [];
            }
            rankings[race.course].push({
                time: race.time,
                vehicle: race.vehicle,
                date: race.date
            });
        });
        
        // 各コースのベストタイムでソート
        Object.keys(rankings).forEach(course => {
            rankings[course].sort((a, b) => a.time - b.time);
            rankings[course] = rankings[course].slice(0, 5); // トップ5のみ
        });
        
        return rankings;
    }
    
    // 車両ショップ
    getVehicleShop() {
        return this.vehicles.map((vehicle, index) => ({
            index: index,
            ...vehicle,
            canBuy: !vehicle.owned && this.player.money >= vehicle.price
        }));
    }
    
    // プレイヤー状態取得
    getPlayerStatus() {
        return {
            name: this.player.name,
            level: this.player.level,
            experience: this.player.experience,
            money: this.player.money,
            currentVehicle: this.vehicles[this.player.currentVehicle],
            ownedVehicles: this.vehicles.filter(v => v.owned),
            isRacing: this.isRacing,
            currentSpeed: this.currentSpeed,
            currentRace: this.currentRace,
            checkpoints: this.checkpoints,
            bestTimes: this.bestTimes,
            raceHistory: this.raceHistory.slice(-10) // 最新10件
        };
    }
    
    // コース選択
    selectCourse(courseIndex) {
        if (courseIndex >= this.courses.length) {
            return { error: 'そのコースは存在しません' };
        }
        
        const course = this.courses[courseIndex];
        return {
            message: `${course.name}を選択しました。難易度: ${course.difficulty}`,
            course: course
        };
    }
    
    // 自動コース生成（現在地周辺）
    generateCourse(centerPosition, radius = 1) {
        this.checkpoints = [];
        
        // 中心点の周りにランダムにチェックポイントを配置
        const numCheckpoints = 4 + Math.floor(Math.random() * 4); // 4-7個
        
        for (let i = 0; i < numCheckpoints; i++) {
            const angle = (i / numCheckpoints) * 2 * Math.PI;
            const distance = radius * (0.5 + Math.random() * 0.5); // 半径の50-100%
            
            const lat = centerPosition.lat + (distance / 111) * Math.cos(angle);
            const lng = centerPosition.lng + (distance / (111 * Math.cos(centerPosition.lat * Math.PI / 180))) * Math.sin(angle);
            
            this.checkpoints.push({
                id: i + 1,
                position: { lat: lat, lng: lng },
                hit: false
            });
        }
        
        return {
            message: `${numCheckpoints}個のチェックポイントでコースを生成しました！`,
            checkpoints: this.checkpoints
        };
    }
}

// グローバルインスタンス
window.racingGame = new RacingGame();

