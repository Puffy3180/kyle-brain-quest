class Game {
    constructor() {
        this.resources = {
            braindead: 0,
            ideas: 0,
            immunity: 100 // Starts at 100, lower is better (higher multiplier)
        };

        this.production = {
            braindead: 0,
            ideas: 0
        };

        this.clickValue = {
            braindead: 1
        };

        this.multipliers = {
            braindead: 1
        };

        this.upgrades = {
            enhancedClick: {
                id: 'enhancedClick',
                name: "Enhanced Click",
                description: "+1 Braindead per click",
                cost: 10,
                costScale: 1.5,
                currency: "braindead",
                count: 0,
                effect: () => { this.clickValue.braindead += 1; }
            },
            autoclicker: {
                id: 'autoclicker',
                name: "Autoclicker",
                description: "Generates Braindead automatically",
                cost: 100,
                costScale: 2.0,
                currency: "braindead",
                count: 0,
                effect: () => { this.production.braindead += 1; }
            },
            thoughtCondenser: {
                id: 'thoughtCondenser',
                name: "Thought Condenser",
                description: "Generates Ideas slowly",
                cost: 50,
                costScale: 1.5,
                currency: "braindead",
                count: 0,
                effect: () => { this.production.ideas += 0.1; }
            },
            ideaAmplifier: {
                id: 'ideaAmplifier',
                name: "Idea Amplifier",
                description: "Boosts Idea generation",
                cost: 100,
                costScale: 1.5,
                currency: "braindead",
                count: 0,
                effect: () => { this.production.ideas += 0.5; }
            }
        };

        this.research = {
            think: {
                id: 'think',
                name: "Think",
                description: "Unlock the power of your mind.",
                cost: 1,
                currency: "ideas",
                purchased: false,
                prereq: null,
                effect: () => {
                    this.log("How can I increase my braindead? It must be something to do with my brain...", "lore");
                }
            },
            thinkMore: {
                id: 'thinkMore',
                name: "Think some more",
                description: "Dig deeper.",
                cost: 5,
                currency: "ideas",
                purchased: false,
                prereq: 'think',
                effect: () => {
                    this.log("There seems to be some sort of 'immunity' stopping me from increasing my braindead quickly...", "lore");
                    document.getElementById('immunity-display').style.display = 'block';
                }
            },
            immunityResearch: {
                id: 'immunityResearch',
                name: "Immunity Research",
                description: "Study the resistance.",
                cost: 10,
                currency: "ideas",
                purchased: false,
                prereq: 'thinkMore',
                effect: () => {
                    this.log("Aha! I can just create a vaccine to decrease my immunity. That's how vaccines work right?", "lore");
                }
            },
            vaccineV1: {
                id: 'vaccineV1',
                name: "Vaccine V1",
                description: "Reduces immunity.",
                cost: 25,
                currency: "ideas",
                purchased: false,
                prereq: 'immunityResearch',
                effect: () => {
                    this.resources.immunity = Math.max(1, this.resources.immunity - 10); // Example reduction
                    this.log("Immunity reduced! Braindead gain increased.", "general");
                }
            }
        };

        this.lastTick = Date.now();
        this.tickRate = 100; // 10 ticks per second

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.gameLoop();
        this.log("Welcome to Kyle's Brainquest.", "lore");
        document.getElementById('immunity-display').style.display = 'none'; // Hide initially
    }

    setupEventListeners() {
        document.getElementById('brain-button').addEventListener('click', (e) => {
            this.clickBrain(e);
        });

        // Setup upgrade buttons
        Object.values(this.upgrades).forEach(upgrade => {
            const btn = document.getElementById(`btn-${upgrade.id}`);
            if (btn) {
                btn.addEventListener('click', () => this.buyUpgrade(upgrade.id));
            }
        });

        // Setup research buttons (will be created dynamically or need to be in HTML)
        // For now, let's assume we render them dynamically or they are in HTML hidden
        this.renderResearch();
    }

    clickBrain(e) {
        const immunityMult = 100 / this.resources.immunity;
        const gain = this.clickValue.braindead * immunityMult;
        this.addResource('braindead', gain);
        this.createFloatingText(e.clientX, e.clientY, `+${gain.toFixed(1)} Bd`);
    }

    addResource(type, amount) {
        this.resources[type] += amount;
        this.updateUI();
    }

    buyUpgrade(key) {
        const upgrade = this.upgrades[key];
        if (this.resources[upgrade.currency] >= upgrade.cost) {
            this.resources[upgrade.currency] -= upgrade.cost;
            upgrade.count++;
            upgrade.cost = Math.floor(upgrade.cost * upgrade.costScale);
            upgrade.effect();
            this.log(`Purchased ${upgrade.name}`, "upgrade");
            this.updateUI();
        }
    }

    buyResearch(key) {
        const item = this.research[key];
        if (!item.purchased && this.resources[item.currency] >= item.cost) {
            this.resources[item.currency] -= item.cost;
            item.purchased = true;
            item.effect();
            this.log(`Researched ${item.name}`, "unlock");
            this.renderResearch(); // Re-render to show new unlocks or hide purchased
            this.updateUI();
        }
    }

    renderResearch() {
        const container = document.getElementById('research-list');
        if (!container) return;

        container.innerHTML = ''; // Clear current

        Object.values(this.research).forEach(item => {
            if (item.purchased) return; // Hide if purchased? Or keep as "Completed"? Let's hide for now or show as disabled.
            
            // Check prereq
            if (item.prereq && !this.research[item.prereq].purchased) return;

            const btn = document.createElement('button');
            btn.className = 'upgrade-btn research-btn';
            btn.innerHTML = `
                <span class="upgrade-name">${item.name}</span>
                <span class="upgrade-cost">${item.cost} Ideas</span>
                <span class="upgrade-desc">${item.description}</span>
            `;
            btn.onclick = () => this.buyResearch(item.id);
            btn.disabled = this.resources[item.currency] < item.cost;
            container.appendChild(btn);
        });
    }

    gameLoop() {
        const now = Date.now();
        const dt = (now - this.lastTick) / 1000;
        
        if (dt >= 0.1) { // Update every 0.1s
            const immunityMult = 100 / this.resources.immunity;
            
            this.resources.braindead += (this.production.braindead * immunityMult) * dt;
            this.resources.ideas += this.production.ideas * dt;
            
            this.lastTick = now;
            this.updateUI();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    updateUI() {
        // Update Resources
        document.getElementById('res-braindead').textContent = Math.floor(this.resources.braindead);
        document.getElementById('res-ideas').textContent = this.resources.ideas.toFixed(1);
        document.getElementById('res-immunity').textContent = Math.floor(this.resources.immunity);

        // Update Upgrades
        Object.values(this.upgrades).forEach(upgrade => {
            const btn = document.getElementById(`btn-${upgrade.id}`);
            if (btn) {
                const costSpan = btn.querySelector('.upgrade-cost');
                costSpan.textContent = `${upgrade.cost} ${upgrade.currency === 'braindead' ? 'Bd' : 'Id'}`;
                btn.disabled = this.resources[upgrade.currency] < upgrade.cost;
            }
        });

        // Update Research Buttons state
        const researchBtns = document.querySelectorAll('.research-btn');
        researchBtns.forEach(btn => {
            // This is a bit hacky, better to re-render or bind properly. 
            // Since renderResearch recreates them, we just need to re-render if affordability changes? 
            // Or just re-render every UI update? It might be expensive.
            // Let's just re-render for simplicity in this prototype.
        });
        this.renderResearch();
    }

    log(message, type = 'general') {
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContent.prepend(entry);
    }

    createFloatingText(x, y, text) {
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.textContent = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }
}

window.onload = () => {
    window.game = new Game();
};
