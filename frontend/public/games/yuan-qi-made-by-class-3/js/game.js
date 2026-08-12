class YuanQiGame {
    constructor() {
        this.player = { alive: true, mp: 0, selectedSkill: null };
        this.ai = { alive: true, mp: 0, selectedSkill: null };
        this.round = 1;
        this.gameOver = false;
        this.skills = {
            ramen: { name: '拉面', mp: 2, damage: 0, type: 'magic' },
            slash: { name: '一斩', mp: 0, damage: 0.5, type: 'attack' },
            Ldef: { name: 'L 防', mp: 1, damage: 0, type: 'defense', defense: 'attack' },
            wave: { name: '波', mp: -2, damage: 2, type: 'wave' },
            Xdef: { name: 'X 防', mp: 1, damage: 0, type: 'defense', defense: ['wave', 'attack'] }
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.addBothLog('游戏开始！先攒元气，再找机会出招。');
    }

    bindEvents() {
        document.querySelectorAll('#skills1 .skill').forEach((button) => {
            button.addEventListener('click', (event) => this.selectSkill(event.currentTarget));
        });
        document.getElementById('restart').addEventListener('click', () => this.restart());
        document.getElementById('next-round').addEventListener('click', () => this.restart());
    }

    selectSkill(button) {
        if (this.gameOver || !this.player.alive || this.player.selectedSkill) return;

        const skill = button.dataset.skill;

        if (!this.canUseSkill(this.player, skill)) {
            this.addPlayerLog('元气不足，先用拉面或防御攒一点。');
            return;
        }

        this.player.selectedSkill = skill;
        this.highlightSelection(skill);
        this.addPlayerLog(`你使用了 ${this.skills[skill].name}`);

        setTimeout(() => this.aiSelectSkill(), 500);
    }

    aiSelectSkill() {
        const availableSkills = Object.keys(this.skills).filter((skill) => this.canUseSkill(this.ai, skill));
        const selectedSkill = availableSkills.length ? this.aiChooseSkill(availableSkills) : 'ramen';

        this.ai.selectedSkill = selectedSkill;
        this.addAILog(`AI 使用了 ${this.skills[selectedSkill].name}`);

        setTimeout(() => this.resolveRound(), 500);
    }

    aiChooseSkill(availableSkills) {
        const playerSelected = this.player.selectedSkill;

        if (playerSelected === 'slash' && availableSkills.includes('Ldef')) return 'Ldef';
        if (playerSelected === 'wave' && availableSkills.includes('Xdef')) return 'Xdef';
        if (this.ai.mp >= 2 && availableSkills.includes('wave')) return 'wave';
        if (availableSkills.includes('slash')) return 'slash';
        if (availableSkills.includes('ramen')) return 'ramen';

        return availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }

    canUseSkill(entity, skill) {
        const skillData = this.skills[skill];
        return entity.mp + skillData.mp >= 0;
    }

    highlightSelection(skill) {
        const container = document.getElementById('skills1');
        container.querySelectorAll('.skill').forEach((button) => button.classList.remove('selected'));
        container.querySelector(`[data-skill="${skill}"]`)?.classList.add('selected');
        this.updateUI();
    }

    resolveRound() {
        const playerSkill = this.skills[this.player.selectedSkill];
        const aiSkill = this.skills[this.ai.selectedSkill];

        this.addBothLog(`--- 第 ${this.round} 回合结算 ---`);

        const playerDamage = this.calculateDamage(playerSkill, aiSkill);
        const aiDamage = this.calculateDamage(aiSkill, playerSkill);

        if (playerDamage > 0) this.addBothLog(`你打出了 ${playerDamage} 点有效伤害。`);
        if (aiDamage > 0) this.addBothLog(`AI 打出了 ${aiDamage} 点有效伤害。`);

        if (playerDamage > aiDamage) {
            this.addBothLog('AI 阵亡，游戏结束。');
            this.ai.alive = false;
        } else if (aiDamage > playerDamage) {
            this.addBothLog('你阵亡了，游戏结束。');
            this.player.alive = false;
        } else {
            this.addBothLog('双方都顶住了，下一回合继续。');
        }

        this.updateMana(playerSkill, this.player);
        this.updateMana(aiSkill, this.ai);

        this.player.selectedSkill = null;
        this.ai.selectedSkill = null;
        this.round += 1;

        this.clearSelections();
        this.updateUI();

        if (!this.player.alive || !this.ai.alive) {
            this.endGame();
        }
    }

    calculateDamage(attackSkill, defenseSkill) {
        if (attackSkill.damage === 0) return 0;

        if (defenseSkill.type === 'defense') {
            const defenses = Array.isArray(defenseSkill.defense) ? defenseSkill.defense : [defenseSkill.defense];
            if (defenses.includes(attackSkill.type)) return 0;
        }

        return attackSkill.damage;
    }

    updateMana(skill, entity) {
        entity.mp += skill.mp;
    }

    clearSelections() {
        document.querySelectorAll('.skill').forEach((button) => button.classList.remove('selected'));
    }

    addPlayerLog(message) {
        this.addLog('player-log-content', message);
    }

    addAILog(message) {
        this.addLog('ai-log-content', message);
    }

    addBothLog(message) {
        this.addPlayerLog(message);
        this.addAILog(message);
    }

    addLog(targetId, message) {
        const logContent = document.getElementById(targetId);
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        logContent.appendChild(entry);
        logContent.parentElement.scrollTop = logContent.parentElement.scrollHeight;
    }

    updateUI() {
        document.getElementById('hp1').textContent = this.player.alive ? '存活' : '已阵亡';
        document.getElementById('hp2').textContent = this.ai.alive ? '存活' : '已阵亡';
        document.getElementById('mp1').textContent = this.player.mp;
        document.getElementById('mp2').textContent = this.ai.mp;
        document.getElementById('round').textContent = this.round;

        const status = !this.player.alive
            ? '你已阵亡'
            : !this.ai.alive
                ? 'AI 已阵亡'
                : this.player.selectedSkill
                    ? '等待 AI 选择...'
                    : `第 ${this.round} 回合 - 请选择技能`;

        document.getElementById('round-status').textContent = status;

        document.querySelectorAll('#skills1 .skill').forEach((button) => {
            const skill = button.dataset.skill;
            const canUse = this.canUseSkill(this.player, skill);
            button.disabled = !canUse || this.gameOver || !this.player.alive || Boolean(this.player.selectedSkill);
            button.style.opacity = canUse ? '1' : '0.5';
        });

        document.getElementById('next-round').style.display = this.gameOver ? 'inline-block' : 'none';
    }

    endGame() {
        this.gameOver = true;
        const result = document.getElementById('result');
        const winner = document.getElementById('winner');

        if (!this.player.alive && !this.ai.alive) {
            winner.textContent = '平局！双方同归于尽。';
        } else if (!this.player.alive) {
            winner.textContent = '你输了，AI 获胜。';
        } else {
            winner.textContent = '你赢了，AI 已阵亡！';
        }

        result.style.display = 'block';
        document.querySelectorAll('.skill').forEach((button) => {
            button.disabled = true;
        });
        this.updateUI();
    }

    restart() {
        this.player = { alive: true, mp: 0, selectedSkill: null };
        this.ai = { alive: true, mp: 0, selectedSkill: null };
        this.round = 1;
        this.gameOver = false;
        document.getElementById('player-log-content').innerHTML = '';
        document.getElementById('ai-log-content').innerHTML = '';
        document.getElementById('result').style.display = 'none';
        this.clearSelections();
        this.updateUI();
        this.addBothLog('游戏重新开始！');
    }
}

window.addEventListener('DOMContentLoaded', () => new YuanQiGame());
