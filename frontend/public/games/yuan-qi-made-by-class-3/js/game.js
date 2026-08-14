class YuanQiGame {
    constructor() {
        this.skills = {
            slash1: { name: '一斩', mpDelta: 0, attack: 0.5, type: 'slash', category: '斩类', note: '0 魔，0.5 伤害' },
            slash2: { name: '二斩', mpDelta: -1, attack: 1, type: 'slash', category: '斩类', note: '1 魔，1 伤害' },
            slash3: { name: '三斩', mpDelta: -3, attack: 3, type: 'slash', category: '斩类', note: '3 魔，3 伤害' },
            slash6: { name: '六斩', mpDelta: -6, attack: 6, type: 'slash', category: '斩类', note: '6 魔，6 伤害' },
            slash11: { name: '十一斩', mpDelta: -11, attack: 11, type: 'slash', category: '斩类', note: '11 魔，11 伤害' },
            wave: { name: '波', mpDelta: -2, attack: 2, type: 'wave', category: '波类', note: '2 魔，2 伤害' },
            star5: { name: '五星连珠', mpDelta: -4, attack: 4, type: 'wave', category: '波类', note: '4 魔，4 伤害' },
            star7: { name: '七星连珠', mpDelta: -6, attack: 6, type: 'wave', category: '波类', note: '6 魔，6 伤害' },
            star9: { name: '九星连珠', mpDelta: -8, attack: 8, type: 'wave', category: '波类', note: '8 魔，8 伤害' },
            ramen: { name: '拉面', mpDelta: 2, attack: 0, type: 'charge', category: '攒魔/防御类', blocks: ['despise', 'airplane'], note: '获得 2 魔，可以防住鄙视和伟哲开飞机' },
            Ldef: { name: 'L 防', mpDelta: 1, attack: 0, type: 'defense', category: '攒魔/防御类', blocks: ['slash', 'gun', 'thunder'], maxBlockedAttack: 1, note: '+1 魔，防斩类、小枪、大枪、雷切和小于 1 伤害' },
            Xdef: { name: 'X 防', mpDelta: 1, attack: 0, type: 'defense', category: '攒魔/防御类', blocks: ['wave', 'gun', 'thunder'], maxBlockedAttack: 1, note: '+1 魔，防波类、小枪、大枪、雷切和小于 1 伤害' },
            equalDef: { name: '= 防', mpDelta: 1, attack: 0, type: 'defense', category: '攒魔/防御类', blocks: ['sweep'], bonusOnBlock: 5, note: '+1 魔，防扫堂腿，成功额外 +5 魔' },
            entryDef: { name: '入防', mpDelta: 1, attack: 0, type: 'defense', category: '攒魔/防御类', blocks: ['tsunami'], bonusOnBlock: 10, note: '+1 魔，防海啸，成功额外 +10 魔' },
            goldenBell: { name: '金钟罩', mpDelta: -1, attack: 0, type: 'defense', category: '攒魔/防御类', blockRange: [1, 5], brokenBy: ['gun'], note: '1 魔，防 1-5 伤害，小枪/大枪可破' },
            ironShirt: { name: '铁布衫', mpDelta: -1, attack: 0, type: 'defense', category: '攒魔/防御类', blockRange: [6, 10], note: '1 魔，防 6-10 伤害' },
            energyShield: { name: '能量罩', mpDelta: -1, attack: 0, type: 'defense', category: '攒魔/防御类', blockRange: [11, 100], note: '1 魔，防 11-100 伤害' },
            indifferent: { name: '无动于衷', mpDelta: 1, attack: 0, type: 'defense', category: '攒魔/防御类', blocks: ['gun', 'despise', 'absorb'], reflect: ['gun', 'despise', 'absorb'], note: '+1 魔，反弹小枪、大枪、鄙视，防吸' },
            selfKill: { name: '自杀', mpDelta: 0, attack: 0, type: 'self', category: '攒魔/防御类', note: '马上死亡；若死亡时遭受攻击则不死并 +2 魔' },
            absorb: { name: '吸', mpDelta: 0, attack: 0, type: 'absorb', category: '攒魔/防御类', note: '吸取其他人本回合效果，也会承接被吸对象受到的攻击' },
            store: { name: '屯', mpDelta: 0, attack: 0, type: 'store', category: '攒魔/防御类', note: '下回合攒魔 x2' },
            bell: { name: '铃', mpDelta: 1, attack: 0.25, type: 'bell', category: '攒魔/防御类', note: '+1 魔，0.25 伤害' },
            zeroSlash: { name: '零斩', mpDelta: 1, attack: 0, type: 'defense', category: '攒魔/防御类', blocks: ['mudslide'], bonusOnBlock: 5, note: '+1 魔，斩掉泥石流，成功额外 +5 魔' },
            scissors: { name: '剪刀', mpDelta: 0, attack: 0, type: 'defense', category: '攒魔/防御类', blocks: ['airplane'], reflect: ['airplane'], note: '反弹伟哲开飞机' },
            despise: { name: '鄙视', mpDelta: -3, attack: 2, type: 'despise', category: '精神类', note: '3 魔，2 伤害' },
            airplane: { name: '伟哲开飞机', mpDelta: -5, attack: 2, type: 'airplane', category: '精神类', note: '5 魔，2 伤害，可打高处目标' },
            tsunami: { name: '海啸', mpDelta: -10, attack: 10, type: 'tsunami', category: '精神类', note: '10 魔，10 伤害' },
            tornado: { name: '龙卷风', mpDelta: -30, attack: 30, type: 'finale', category: '决战技', note: '30 魔，30 伤害' },
            doomsday: { name: '世界末日', mpDelta: -100, attack: 100, type: 'finale', category: '决战技', note: '100 魔，100 伤害' },
            fireGun: { name: '火枪', mpDelta: -2, attack: 0.5, type: 'slash', category: '群攻', group: true, note: '2 魔，群体一斩' },
            cannon: { name: '火炮', mpDelta: -3, attack: 1, type: 'slash', category: '群攻', group: true, note: '3 魔，群体二斩' },
            volcano: { name: '火山', mpDelta: -5, attack: 2, type: 'wave', category: '群攻', group: true, note: '5 魔，群体波' },
            iceberg: { name: '冰山', mpDelta: -5, attack: 0, type: 'freeze', category: '群攻', group: true, note: '5 魔，群体冻' },
            bomber: { name: '伟哲开轰炸机', mpDelta: -12, attack: 2, type: 'airplane', category: '群攻', group: true, note: '12 魔，群体伟哲开飞机' },
            thunderStrike: { name: '雷霆万钧', mpDelta: -7, attack: 6, type: 'thunder', category: '群攻', group: true, breaks: ['ironShirt'], note: '7 魔，群体雷切，破铁布衫' },
            pistol: { name: '小枪', mpDelta: -2, attack: 3, type: 'gun', category: '特殊类', breaks: ['goldenBell'], note: '2 魔，3 伤害，破金钟罩' },
            rifle: { name: '大枪', mpDelta: -3, attack: 4, type: 'gun', category: '特殊类', breaks: ['goldenBell'], note: '3 魔，4 伤害，破金钟罩' },
            thunder: { name: '雷切', mpDelta: -4, attack: 6, type: 'thunder', category: '特殊类', breaks: ['ironShirt'], note: '4 魔，6 伤害，破铁布衫' },
            mudslide: { name: '泥石流', mpDelta: -5, attack: 5, type: 'mudslide', category: '特殊类', note: '5 魔，5 伤害，可打低处目标' },
            sweep: { name: '扫堂腿', mpDelta: -6, attack: 6, type: 'sweep', category: '特殊类', note: '6 魔，6 伤害' },
            bind: { name: '绑定', mpDelta: 0, attack: 0, type: 'special', category: '特殊类', note: '绑定两个技能，之后可同时使用' },
            curse: { name: '诅咒', mpDelta: 0, attack: 0, type: 'curse', category: '特殊类', note: '限制对方下回合可用技能' },
            freeze: { name: '冻', mpDelta: 0, attack: 0, type: 'freeze', category: '特殊类', note: '封印本轮某人的一个技能' },
            ignition: { name: '打火', mpDelta: 0, attack: 0, type: 'ignite', category: '特殊类', note: '连续三回合打火三次，可立即指定一人死亡' },
            upstairs: { name: '上楼', mpDelta: -1, attack: 0, type: 'height', category: '状态类', note: '1 魔，高度 +1' },
            downstairs: { name: '下楼', mpDelta: 1, attack: 0, type: 'height', category: '状态类', note: '+1 魔，高度 -1' },
            clearPool: { name: '举身赴清池', mpDelta: 0, attack: 0, type: 'state', category: '状态类', note: '免疫海啸和泥石流，再次使用视为自杀' },
            hangBranch: { name: '自挂东南枝', mpDelta: 0, attack: 0, type: 'state', category: '状态类', note: '免疫海啸和扫堂腿，再次使用视为自杀' },
            basketball: { name: '打篮球', mpDelta: 0, attack: 0, type: 'state', category: '状态类', note: '下次攻击伤害 x2' },
            volleyball: { name: '打排球', mpDelta: 0, attack: 0, type: 'state', category: '状态类', note: '下次攻击伤害 x0.5' }
        };
        Object.entries(this.skills).forEach(([id, skill]) => {
            skill.id = id;
        });
        this.skillCategories = [...new Set(Object.values(this.skills).map((skill) => skill.category))];
        this.activeSkillCategory = this.skillCategories[0];
        this.settings = {
            rounds: 3,
            players: 2,
            ai: 'normal',
            timer: 10
        };
        this.mode = 'normal';
        this.match = null;
        this.timerId = null;
        this.online = null;
        this.onlinePollId = null;
        this.timeLeft = 0;
        this.bindEvents();
        this.renderSkillCategoryNav();
        this.renderSkillButtons();
        this.showScreen('home');
    }

    bindEvents() {
        document.querySelectorAll('[data-start-mode]').forEach((button) => {
            button.addEventListener('click', () => this.startMatch(button.dataset.startMode));
        });
        document.querySelectorAll('[data-go-home]').forEach((button) => {
            button.addEventListener('click', () => {
                this.stopOnlinePolling();
                this.online = null;
                this.readSettings();
                this.showScreen('home');
            });
        });
        document.getElementById('open-settings').addEventListener('click', () => this.showScreen('settings'));
        document.getElementById('quick-start').addEventListener('click', () => this.startMatch('normal'));
        document.getElementById('online-mode').addEventListener('click', () => this.openOnlineScreen());
        document.getElementById('create-online-room').addEventListener('click', () => this.createOnlineRoom());
        document.getElementById('join-online-room').addEventListener('click', () => this.joinOnlineRoom());
        document.getElementById('crisis-mode').addEventListener('click', () => {
            window.alert('危机合约模式正在制作中：未来会加入词条、限制条件和高难奖励。');
        });
        document.getElementById('back-home').addEventListener('click', () => {
            this.stopTimer();
            this.stopOnlinePolling();
            this.online = null;
            this.showScreen('home');
        });
        document.getElementById('restart-match').addEventListener('click', () => {
            if (this.mode === 'online') {
                this.stopOnlinePolling();
                this.online = null;
                this.openOnlineScreen();
                return;
            }
            this.startMatch(this.mode);
        });
        document.getElementById('toggle-fullscreen').addEventListener('click', () => this.toggleFullscreen());
        document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
        document.getElementById(`${name}-screen`).classList.add('active');
    }

    openOnlineScreen() {
        this.stopTimer();
        this.stopOnlinePolling();
        this.online = null;
        this.mode = 'online';
        this.setOnlineStatus('创建房间后，把房间号发给对手；对手加入后会自动进入对战。');
        this.showScreen('online');
    }

    setOnlineStatus(message, tone = '') {
        const status = document.getElementById('online-status');
        status.textContent = message;
        status.dataset.tone = tone;
    }

    async yuanQiApi(path, options = {}) {
        const response = await fetch(`/api/yuan-qi${path}`, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.detail || '联网请求失败');
        }
        return data;
    }

    async createOnlineRoom() {
        this.readSettings();
        const playerName = document.getElementById('online-create-name').value || '玩家 1';
        this.setOnlineStatus('正在创建房间...');
        try {
            const payload = await this.yuanQiApi('/rooms', {
                method: 'POST',
                body: JSON.stringify({ playerName, rounds: this.settings.rounds })
            });
            this.enterOnlineRoom(payload);
            this.setOnlineStatus(`房间 ${payload.roomCode} 已创建，发给对手加入。`);
        } catch (error) {
            this.setOnlineStatus(error.message, 'error');
        }
    }

    async joinOnlineRoom() {
        const playerName = document.getElementById('online-join-name').value || '玩家 2';
        const code = document.getElementById('online-room-code').value.trim().toUpperCase();
        if (!code) {
            this.setOnlineStatus('先输入房间号。', 'error');
            return;
        }
        this.setOnlineStatus('正在加入房间...');
        try {
            const payload = await this.yuanQiApi(`/rooms/${encodeURIComponent(code)}/join`, {
                method: 'POST',
                body: JSON.stringify({ playerName })
            });
            this.enterOnlineRoom(payload);
        } catch (error) {
            this.setOnlineStatus(error.message, 'error');
        }
    }

    enterOnlineRoom(payload) {
        this.mode = 'online';
        this.online = {
            roomCode: payload.roomCode,
            playerId: payload.playerId,
            token: payload.token
        };
        this.match = payload.state;
        this.showScreen('battle');
        this.renderBattle();
        this.startOnlinePolling();
    }

    startOnlinePolling() {
        this.stopOnlinePolling();
        this.onlinePollId = window.setInterval(() => this.refreshOnlineRoom(), 1200);
        this.refreshOnlineRoom();
    }

    stopOnlinePolling() {
        if (this.onlinePollId) window.clearInterval(this.onlinePollId);
        this.onlinePollId = null;
    }

    async refreshOnlineRoom() {
        if (!this.online) return;
        try {
            const query = new URLSearchParams({
                playerId: this.online.playerId,
                token: this.online.token
            });
            const payload = await this.yuanQiApi(`/rooms/${encodeURIComponent(this.online.roomCode)}?${query.toString()}`);
            this.match = payload.state;
            this.renderBattle();
            if (this.match.status === 'finished') this.stopOnlinePolling();
        } catch (error) {
            document.getElementById('round-status').textContent = error.message;
        }
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
        this.stopOnlinePolling();
        this.online = null;
        this.match = {
            currentBattle: 1,
            totalBattles: mode === 'normal' ? this.settings.rounds : 1,
            round: 1,
            scores: {},
            fighters: this.createFighters(),
            selectedSkill: null,
            selectedTarget: null,
            locked: false
        };
        this.match.fighters.forEach((fighter) => {
            this.match.scores[fighter.id] = 0;
        });
        this.showScreen('battle');
        this.renderBattle();
        this.beginTurn();
    }

    createFighters() {
        const fighters = [{ id: 'player', name: '你', kind: 'human', alive: true, mp: 0, skill: null, targetId: null, lastSkill: null }];
        for (let index = 2; index <= this.settings.players; index += 1) {
            fighters.push({ id: `ai-${index - 1}`, name: `AI ${index - 1}`, kind: 'ai', alive: true, mp: 0, skill: null, targetId: null, lastSkill: null });
        }
        return fighters;
    }

    beginTurn() {
        this.match.locked = false;
        this.match.selectedSkill = null;
        this.match.fighters.forEach((fighter) => {
            fighter.skill = null;
            fighter.targetId = null;
        });
        this.ensureSelectedTarget();
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
        player.lastSkill = null;
        this.finishBattle();
    }

    renderSkillCategoryNav() {
        const nav = document.getElementById('skill-category-nav');
        nav.innerHTML = this.skillCategories.map((category) => (
            `<button class="${category === this.activeSkillCategory ? 'active' : ''}" type="button" data-category="${category}">
                ${category}
            </button>`
        )).join('');
        nav.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', () => {
                this.activeSkillCategory = button.dataset.category;
                this.renderSkillCategoryNav();
                this.renderSkillButtons();
                if (this.match) this.updateSkillButtons();
            });
        });
    }

    renderSkillButtons() {
        const container = document.getElementById('skill-buttons');
        container.innerHTML = Object.entries(this.skills)
            .filter(([, skill]) => skill.category === this.activeSkillCategory)
            .map(([id, skill]) => (
            `<button class="skill" data-skill="${id}" data-category="${skill.category}">
                <small>${skill.category}</small>
                <strong>${skill.name}</strong>
                <span>${skill.note}</span>
                <em>攻击 ${skill.attack} / 元气 ${skill.mpDelta >= 0 ? '+' : ''}${skill.mpDelta}</em>
            </button>`
        )).join('');
        container.querySelectorAll('.skill').forEach((button) => {
            button.addEventListener('click', () => this.chooseSkill(button.dataset.skill));
        });
    }

    async toggleFullscreen() {
        const shell = document.querySelector('.app-shell');
        try {
            if (!document.fullscreenElement) {
                await shell.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            window.open(window.location.href, '_blank', 'noopener');
        }
        this.updateFullscreenButton();
    }

    updateFullscreenButton() {
        const button = document.getElementById('toggle-fullscreen');
        if (!button) return;
        button.textContent = document.fullscreenElement ? '退出全屏' : '全屏';
    }

    renderBattle() {
        if (!this.match) return;
        this.ensureSelectedTarget();
        document.getElementById('mode-label').textContent = this.getModeLabel();
        document.getElementById('battle-title').textContent = `第 ${this.match.currentBattle} / ${this.match.totalBattles} 局 · 第 ${this.match.round} 回合`;
        document.getElementById('round-status').textContent = this.getRoundStatus();
        document.getElementById('restart-match').textContent = this.mode === 'online' ? '换房间' : '重开';
        document.getElementById('timer-pill').classList.toggle('hidden', this.mode !== 'timed');
        this.renderScores();
        this.renderFighters();
        this.renderTargetPicker();
        this.updateSkillButtons();
    }

    getModeLabel() {
        if (this.mode === 'online') return `联网双人 · 房间 ${this.online?.roomCode || this.match.code || ''}`;
        return this.mode === 'timed' ? '限时模式' : '普通模式';
    }

    getRoundStatus() {
        if (this.mode !== 'online') return this.match.locked ? '本回合结算中' : '请选择技能';
        if (this.match.status === 'waiting') return `房间 ${this.online?.roomCode || this.match.code} 已创建，等待对手加入`;
        if (this.match.status === 'finished') {
            const winner = this.match.fighters.find((fighter) => fighter.id === this.match.winnerId);
            return `对战结束，胜者：${winner?.name || '无人'}`;
        }
        const player = this.getPlayer();
        if (this.match.submitted?.includes(player?.id)) return '你已出招，等待对手';
        return '请选择技能';
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
            const lastSkill = fighter.lastSkill ? this.skills[fighter.lastSkill].name : '未出招';
            const submitted = this.mode === 'online' && this.match.submitted?.includes(fighter.id);
            const role = fighter.id === this.online?.playerId ? '你' : fighter.kind === 'human' ? '对手' : '电脑';
            return `<article class="fighter-card ${fighter.alive ? '' : 'down'}">
                <span>${role}${submitted ? ' · 已出招' : ''}</span>
                <strong>${fighter.name}</strong>
                <p>元气 ${fighter.mp}</p>
                <em>上一轮：${lastSkill}</em>
            </article>`;
        }).join('');
    }

    ensureSelectedTarget() {
        if (!this.match) return;
        const player = this.getPlayer();
        if (!player) {
            this.match.selectedTarget = null;
            return;
        }
        const targets = this.match.fighters.filter((fighter) => fighter.id !== player.id && fighter.alive);
        if (!targets.some((fighter) => fighter.id === this.match.selectedTarget)) {
            this.match.selectedTarget = targets[0]?.id || null;
        }
    }

    renderTargetPicker() {
        const picker = document.getElementById('target-picker');
        const player = this.getPlayer();
        if (!player || this.match.status === 'waiting' || this.match.status === 'finished') {
            picker.classList.add('hidden');
            picker.innerHTML = '';
            return;
        }
        const targets = this.match.fighters.filter((fighter) => fighter.id !== player.id && fighter.alive);
        picker.classList.toggle('hidden', targets.length <= 1);
        if (targets.length <= 1) {
            picker.innerHTML = '';
            return;
        }

        picker.innerHTML = `
            <span>攻击对象</span>
            <div>
                ${targets.map((fighter) => (
                    `<button type="button" class="${fighter.id === this.match.selectedTarget ? 'active' : ''}" data-target="${fighter.id}">
                        ${fighter.name}
                    </button>`
                )).join('')}
            </div>
        `;
        picker.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', () => {
                if (this.match.locked) return;
                this.match.selectedTarget = button.dataset.target;
                this.renderTargetPicker();
            });
        });
    }

    updateSkillButtons() {
        const player = this.getPlayer();
        document.querySelectorAll('#skill-buttons .skill').forEach((button) => {
            const skill = this.skills[button.dataset.skill];
            const lacksMagic = !player || player.mp + skill.mpDelta < 0;
            const waitingOnline = this.mode === 'online' && this.match.status !== 'playing';
            const submittedOnline = this.mode === 'online' && this.match.submitted?.includes(player?.id);
            const usable = player?.alive && !this.match.locked && !waitingOnline && !submittedOnline && !lacksMagic;
            button.disabled = !usable;
            button.classList.toggle('unaffordable', lacksMagic);
            button.classList.toggle('selected', this.match.selectedSkill === button.dataset.skill);
        });
    }

    chooseSkill(skillId) {
        const player = this.getPlayer();
        const skill = this.skills[skillId];
        if (!this.match || this.match.locked || !player.alive || player.mp + skill.mpDelta < 0) return;
        if (this.mode === 'online') {
            this.chooseOnlineSkill(skillId);
            return;
        }
        this.stopTimer();
        this.match.locked = true;
        this.match.selectedSkill = skillId;
        player.skill = skillId;
        player.targetId = skill.attack > 0 && !skill.group ? this.match.selectedTarget : null;
        this.match.fighters.filter((fighter) => fighter.kind === 'ai' && fighter.alive).forEach((fighter) => {
            fighter.skill = this.chooseAiSkill(fighter);
            fighter.targetId = this.chooseAiTarget(fighter, this.skills[fighter.skill]);
        });
        window.setTimeout(() => this.resolveRound(), 450);
        this.renderBattle();
    }

    async chooseOnlineSkill(skillId) {
        const player = this.getPlayer();
        const skill = this.skills[skillId];
        if (!this.online || !player || this.match.status !== 'playing') return;
        if (this.match.submitted?.includes(player.id)) return;
        if (player.mp + skill.mpDelta < 0) return;
        this.match.selectedSkill = skillId;
        this.updateSkillButtons();
        try {
            const payload = await this.yuanQiApi(`/rooms/${encodeURIComponent(this.online.roomCode)}/move`, {
                method: 'POST',
                body: JSON.stringify({
                    playerId: this.online.playerId,
                    token: this.online.token,
                    skillId,
                    targetId: skill.attack > 0 && !skill.group ? this.match.selectedTarget : null
                })
            });
            this.match = payload.state;
            this.renderBattle();
        } catch (error) {
            document.getElementById('round-status').textContent = error.message;
            this.match.selectedSkill = null;
            this.updateSkillButtons();
        }
    }

    chooseAiSkill(fighter) {
        const usable = Object.keys(this.skills).filter((id) => fighter.mp + this.skills[id].mpDelta >= 0);
        const attackSkills = usable
            .filter((id) => this.skills[id].attack > 0)
            .sort((a, b) => this.skills[b].attack - this.skills[a].attack);
        const defenseSkills = usable.filter((id) => this.skills[id].type === 'defense');

        if (this.settings.ai === 'easy') {
            return usable.includes('ramen') && Math.random() < 0.45 ? 'ramen' : usable[Math.floor(Math.random() * usable.length)];
        }

        if (this.settings.ai === 'hard') {
            const playerSkill = this.skills[this.getPlayer().skill];
            const counter = defenseSkills.find((id) => this.blocksAttack(this.skills[id], playerSkill));
            if (counter && Math.random() < 0.55) return counter;
            if (attackSkills[0]) return attackSkills[0];
        }

        if (attackSkills[0] && Math.random() < 0.62) return attackSkills[Math.min(attackSkills.length - 1, Math.floor(Math.random() * 3))];
        if (usable.includes('ramen') && fighter.mp < 3) return 'ramen';
        return usable[0] || 'ramen';
    }

    chooseAiTarget(fighter, skill) {
        if (!skill || skill.attack <= 0 || skill.group) return null;
        const candidates = this.match.fighters.filter((target) => target.id !== fighter.id && target.alive);
        const player = this.getPlayer();
        if (candidates.some((target) => target.id === player.id) && Math.random() < 0.72) return player.id;
        return candidates[Math.floor(Math.random() * candidates.length)]?.id || null;
    }

    resolveRound() {
        const alive = this.match.fighters.filter((fighter) => fighter.alive);
        alive.forEach((fighter) => {
            const skill = this.skills[fighter.skill];
            fighter.mp += skill.mpDelta;
            fighter.lastSkill = fighter.skill;
        });

        alive.forEach((target) => {
            const defenseSkill = this.skills[target.skill];
            if (!defenseSkill.bonusOnBlock) return;
            const blocked = alive
                .filter((attacker) => attacker.id !== target.id)
                .some((attacker) => this.attackTargetsFighter(attacker, target) && this.blocksAttack(defenseSkill, this.skills[attacker.skill]));
            if (blocked) target.mp += defenseSkill.bonusOnBlock;
        });

        alive.forEach((target) => {
            const targetSkill = this.skills[target.skill];
            if (targetSkill.type === 'self') {
                const wasAttacked = alive
                    .filter((attacker) => attacker.id !== target.id)
                    .some((attacker) => this.getIncomingAttack(attacker, target) > 0);
                target.alive = wasAttacked;
                if (wasAttacked) target.mp += 2;
                return;
            }

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
        this.beginTurn();
    }

    getIncomingAttack(attacker, target) {
        const attackSkill = this.skills[attacker.skill];
        const defenseSkill = this.skills[target.skill];
        if (attackSkill.attack <= 0) return 0;
        if (!this.attackTargetsFighter(attacker, target)) return 0;
        if (this.blocksAttack(defenseSkill, attackSkill)) return 0;
        return attackSkill.attack;
    }

    attackTargetsFighter(attacker, target) {
        const attackSkill = this.skills[attacker.skill];
        if (!attackSkill || attackSkill.attack <= 0) return false;
        return attackSkill.group || attacker.targetId === target.id;
    }

    blocksAttack(defenseSkill, attackSkill) {
        if (!defenseSkill || !attackSkill || attackSkill.attack <= 0) return false;
        if (attackSkill.breaks?.includes(defenseSkill.name) || attackSkill.breaks?.includes(defenseSkill.id)) return false;
        if (defenseSkill.brokenBy?.includes(attackSkill.type)) return false;
        if (defenseSkill.blocks?.includes(attackSkill.type)) return true;
        if (defenseSkill.maxBlockedAttack && attackSkill.attack < defenseSkill.maxBlockedAttack) return true;
        if (defenseSkill.blockRange) {
            const [min, max] = defenseSkill.blockRange;
            return attackSkill.attack >= min && attackSkill.attack <= max;
        }
        return false;
    }

    finishBattle() {
        this.stopTimer();
        const survivors = this.match.fighters.filter((fighter) => fighter.alive);
        if (survivors.length === 1) {
            this.match.scores[survivors[0].id] += 1;
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
            this.beginTurn();
        }, 900);
    }

    endMatch() {
        const sorted = Object.entries(this.match.scores).sort((a, b) => b[1] - a[1]);
        const winner = this.match.fighters.find((fighter) => fighter.id === sorted[0][0]);
        this.match.locked = true;
        document.getElementById('round-status').textContent = `对战结束，胜者：${winner?.name || '无人'}`;
        this.updateSkillButtons();
    }

    getPlayer() {
        if (this.mode === 'online' && this.online?.playerId) {
            return this.match.fighters.find((fighter) => fighter.id === this.online.playerId);
        }
        return this.match.fighters.find((fighter) => fighter.kind === 'human');
    }

}

window.addEventListener('DOMContentLoaded', () => new YuanQiGame());
