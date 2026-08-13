class YuanQiGame {
    constructor() {
        this.skills = {
            ramen: { name: '拉面', mpDelta: 2, attack: 0, type: 'charge', note: '获得 2 点元气' },
            slash: { name: '一斩', mpDelta: 0, attack: 0.5, type: 'slash', note: '造成 0.5 点伤害' },
            Ldef: { name: 'L 防', mpDelta: 1, attack: 0, type: 'defense', blocks: ['slash'], note: '获得 1 点元气，防一斩' },
            wave: { name: '波', mpDelta: -2, attack: 2, type: 'wave', note: '消耗 2 点元气，造成 2 点伤害' },
            Xdef: { name: 'X 防', mpDelta: 1, attack: 0, type: 'defense', blocks: ['wave', 'slash'], note: '获得 1 点元气，防波和一斩' }
        };
        this.settings = {
            rounds: 3,
            players: 2,
            ai: 'normal',
            timer: 10
        };
        this.mode = 'normal';
        this.match = null;
        this.timerId = null;
        this.timeLeft = 0;
        this.bindEvents();
        this.renderSkillButtons();
        this.showScreen('home');
    }

    bindEvents() {
        document.querySelectorAll('[data-start-mode]').forEach((button) => {
            button.addEventListener('click', () => this.startMatch(button.dataset.startMode));
        });
        document.querySelectorAll('[data-go-home]').forEach((button) => {
            button.addEventListener('click', () => {
                this.readSettings();
                this.showScreen('home');
            });
        });
        document.getElementById('open-settings').addEventListener('click', () => this.showScreen('settings'));
        document.getElementById('quick-start').addEventListener('click', () => this.startMatch('normal'));
        document.getElementById('crisis-mode').addEventListener('click', () => {
            window.alert('危机合约模式正在制作中：未来会加入词条、限制条件和高难奖励。');
        });
        document.getElementById('back-home').addEventListener('click', () => {
            this.stopTimer();
            this.showScreen('home');
        });
        document.getElementById('restart-match').addEventListener('click', () => this.startMatch(this.mode));
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
        document.getElementById(`${name}-screen`).classList.add('active');
    }

    readSettings() {
        this.settings.rounds = this.clamp(Number(document.getElementById('setting-rounds').value), 1, 9);
        this.settings.players = this.clamp(Number(document.getElementById('setting-players').value), 2, 4);
        this.settings.ai = document.getElementById('setting-ai').value;
        this.settings.timer = this.clamp(Number(document.getElementById('setting-timer').value), 3, 60);
    }

    clamp(value, min, max) {
        if (!Number.isFinite(value)) return min;
        return Math.min(max, Math.max(min, value));
    }

    startMatch(mode) {
        this.readSettings();
        this.mode = mode;
        this.stopTimer();
        this.match = {
            currentBattle: 1,
            totalBattles: mode === 'normal' ? this.settings.rounds : 1,
            round: 1,
            scores: {},
            fighters: this.createFighters(),
            selectedSkill: null,
            locked: false
        };
        this.match.fighters.forEach((fighter) => {
            this.match.scores[fighter.id] = 0;
        });
        this.showScreen('battle');
        this.addLog(`${mode === 'timed' ? '限时模式' : '普通模式'}开始。`);
        this.renderBattle();
        this.beginTurn();
    }

    createFighters() {
        const fighters = [{ id: 'player', name: '你', kind: 'human', alive: true, mp: 0, skill: null }];
        for (let index = 2; index <= this.settings.players; index += 1) {
            fighters.push({ id: `ai-${index - 1}`, name: `AI ${index - 1}`, kind: 'ai', alive: true, mp: 0, skill: null });
        }
        return fighters;
    }

    beginTurn() {
        this.match.locked = false;
        this.match.selectedSkill = null;
        this.match.fighters.forEach((fighter) => {
            fighter.skill = null;
        });
        this.renderBattle();
        if (this.mode === 'timed') this.startTimer();
    }

    startTimer() {
        this.timeLeft = this.settings.timer;
        this.updateTimer();
        this.timerId = window.setInterval(() => {
            this.timeLeft -= 1;
            this.updateTimer();
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.loseByTimeout();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerId) window.clearInterval(this.timerId);
        this.timerId = null;
    }

    updateTimer() {
        const pill = document.getElementById('timer-pill');
        pill.classList.toggle('hidden', this.mode !== 'timed');
        pill.textContent = `${this.timeLeft}s`;
        pill.classList.toggle('danger', this.timeLeft <= 3);
    }

    loseByTimeout() {
        if (!this.match || this.match.locked) return;
        this.match.locked = true;
        const player = this.match.fighters.find((fighter) => fighter.kind === 'human');
        player.alive = false;
        this.addLog('时间到，你没有出招，本局失败。');
        this.finishBattle();
    }

    renderSkillButtons() {
        const container = document.getElementById('skill-buttons');
        container.innerHTML = Object.entries(this.skills).map(([id, skill]) => (
            `<button class="skill" data-skill="${id}">
                <strong>${skill.name}</strong>
                <span>${skill.note}</span>
                <em>攻击 ${skill.attack} / 元气 ${skill.mpDelta >= 0 ? '+' : ''}${skill.mpDelta}</em>
            </button>`
        )).join('');
        container.querySelectorAll('.skill').forEach((button) => {
            button.addEventListener('click', () => this.chooseSkill(button.dataset.skill));
        });
    }

    renderBattle() {
        if (!this.match) return;
        document.getElementById('mode-label').textContent = this.mode === 'timed' ? '限时模式' : '普通模式';
        document.getElementById('battle-title').textContent = `第 ${this.match.currentBattle} / ${this.match.totalBattles} 局 · 第 ${this.match.round} 回合`;
        document.getElementById('round-status').textContent = this.match.locked ? '本回合结算中' : '请选择技能';
        this.renderScores();
        this.renderFighters();
        this.updateSkillButtons();
    }

    renderScores() {
        const scoreRow = document.getElementById('score-row');
        scoreRow.innerHTML = this.match.fighters.map((fighter) => (
            `<div class="score-card">
                <span>${fighter.name}</span>
                <strong>${this.match.scores[fighter.id] || 0}</strong>
            </div>`
        )).join('');
    }

    renderFighters() {
        const grid = document.getElementById('fighters-grid');
        grid.innerHTML = this.match.fighters.map((fighter) => {
            const skill = fighter.skill ? this.skills[fighter.skill].name : '未出招';
            return `<article class="fighter-card ${fighter.alive ? '' : 'down'}">
                <span>${fighter.kind === 'human' ? '玩家' : '电脑'}</span>
                <strong>${fighter.name}</strong>
                <p>元气 ${fighter.mp}</p>
                <em>${fighter.alive ? skill : '已阵亡'}</em>
            </article>`;
        }).join('');
    }

    updateSkillButtons() {
        const player = this.getPlayer();
        document.querySelectorAll('#skill-buttons .skill').forEach((button) => {
            const skill = this.skills[button.dataset.skill];
            const usable = player.alive && !this.match.locked && player.mp + skill.mpDelta >= 0;
            button.disabled = !usable;
            button.classList.toggle('selected', this.match.selectedSkill === button.dataset.skill);
        });
    }

    chooseSkill(skillId) {
        const player = this.getPlayer();
        const skill = this.skills[skillId];
        if (!this.match || this.match.locked || !player.alive || player.mp + skill.mpDelta < 0) return;
        this.stopTimer();
        this.match.locked = true;
        this.match.selectedSkill = skillId;
        player.skill = skillId;
        this.match.fighters.filter((fighter) => fighter.kind === 'ai' && fighter.alive).forEach((fighter) => {
            fighter.skill = this.chooseAiSkill(fighter);
        });
        this.addLog(`你选择了 ${skill.name}。`);
        window.setTimeout(() => this.resolveRound(), 450);
        this.renderBattle();
    }

    chooseAiSkill(fighter) {
        const usable = Object.keys(this.skills).filter((id) => fighter.mp + this.skills[id].mpDelta >= 0);
        if (this.settings.ai === 'easy') {
            return usable.includes('ramen') && Math.random() < 0.45 ? 'ramen' : usable[Math.floor(Math.random() * usable.length)];
        }
        if (this.settings.ai === 'hard') {
            const playerSkill = this.getPlayer().skill;
            if (playerSkill === 'wave' && usable.includes('Xdef')) return 'Xdef';
            if (playerSkill === 'slash' && usable.includes('Ldef')) return 'Ldef';
            if (fighter.mp >= 2 && usable.includes('wave')) return 'wave';
        }
        if (fighter.mp >= 2 && usable.includes('wave') && Math.random() < 0.55) return 'wave';
        if (usable.includes('slash')) return 'slash';
        return usable[0] || 'ramen';
    }

    resolveRound() {
        const alive = this.match.fighters.filter((fighter) => fighter.alive);
        alive.forEach((fighter) => {
            const skill = this.skills[fighter.skill];
            fighter.mp += skill.mpDelta;
            this.addLog(`${fighter.name} 使用 ${skill.name}，攻击 ${skill.attack}，元气变为 ${fighter.mp}。`);
        });

        alive.forEach((target) => {
            const targetAttack = this.skills[target.skill].attack;
            const incoming = alive
                .filter((attacker) => attacker.id !== target.id)
                .map((attacker) => this.getIncomingAttack(attacker, target));
            const strongestIncoming = Math.max(0, ...incoming);
            if (strongestIncoming > targetAttack) target.alive = false;
        });

        const survivors = this.match.fighters.filter((fighter) => fighter.alive);
        if (survivors.length <= 1) {
            this.finishBattle();
            return;
        }

        this.match.round += 1;
        this.addLog('无人完全压过全场，进入下一回合。');
        this.beginTurn();
    }

    getIncomingAttack(attacker, target) {
        const attackSkill = this.skills[attacker.skill];
        const defenseSkill = this.skills[target.skill];
        if (attackSkill.attack <= 0) return 0;
        if (defenseSkill.blocks?.includes(attackSkill.type)) return 0;
        return attackSkill.attack;
    }

    finishBattle() {
        this.stopTimer();
        const survivors = this.match.fighters.filter((fighter) => fighter.alive);
        if (survivors.length === 1) {
            this.match.scores[survivors[0].id] += 1;
            this.addLog(`${survivors[0].name} 赢下第 ${this.match.currentBattle} 局。`);
        } else {
            this.addLog(`第 ${this.match.currentBattle} 局无人获胜。`);
        }
        this.renderBattle();

        if (this.match.currentBattle >= this.match.totalBattles) {
            this.endMatch();
            return;
        }

        window.setTimeout(() => {
            this.match.currentBattle += 1;
            this.match.round = 1;
            this.match.fighters = this.createFighters();
            this.addLog(`第 ${this.match.currentBattle} 局开始。`);
            this.beginTurn();
        }, 900);
    }

    endMatch() {
        const sorted = Object.entries(this.match.scores).sort((a, b) => b[1] - a[1]);
        const winner = this.match.fighters.find((fighter) => fighter.id === sorted[0][0]);
        this.match.locked = true;
        this.addLog(`对战结束，胜者：${winner?.name || '无人'}。`);
        document.getElementById('round-status').textContent = '对战结束，可以重开或返回首页';
        this.updateSkillButtons();
    }

    getPlayer() {
        return this.match.fighters.find((fighter) => fighter.kind === 'human');
    }

    addLog(message) {
        const logContent = document.getElementById('battle-log-content');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        logContent.prepend(entry);
    }
}

window.addEventListener('DOMContentLoaded', () => new YuanQiGame());
