// game.js - Main Game Logic

class Game {
    constructor() {
        this.resources = {
            braindead: 0,
            ideas: 0,
            immunity: 100
        };

        this.production = {
            braindead: 0,
            ideas: 0
        };

        this.clickValue = {
            braindead: 1
        };

        // Initialize from data.js
        this.upgrades = getInitialUpgrades();
        this.research = getInitialResearch();

        this.lastTick = Date.now();
        this.tickRate = 100;

        this.logs = [];
        this.currentLogFilter = 'all';
        this.options = {
            offlineProgress: true
        };

        // Initialize UI Manager
        this.ui = new UIManager(this);

        this.init();
    }

    init() {
        this.setupEventListeners();
        
        const saveExists = localStorage.getItem('kylesBrainquestSave');
        
        if (saveExists) {
            this.ui.hideAll(); // Ensure hidden first
            this.ui.playMaterializeSequence(() => {
                this.load();
                this.gameLoop();
                this.log("Game loaded.", "general");
            });
        } else {
            // New Game: Hide UI and play intro
            this.ui.hideAll();
            this.ui.playIntroSequence(() => {
                this.gameLoop();
                this.log("Welcome to Kyle's Brainquest.", "lore");
            });
        }
        
        // Autosave every 30 seconds
        setInterval(() => this.save(), 30000);
        
        // Save on close/refresh
        window.addEventListener('beforeunload', () => this.save());
    }

    save() {
        const saveData = {
            resources: this.resources,
            production: this.production,
            clickValue: this.clickValue,
            upgrades: Object.values(this.upgrades).map(u => ({
                id: u.id,
                count: u.count,
                cost: u.cost
            })),
            research: Object.values(this.research).map(r => ({
                id: r.id,
                purchased: r.purchased
            })),
            options: this.options,
            lastTick: Date.now(),
            logHistory: this.logs.slice(-50) // Save last 50 logs
        };
        
        const saveString = JSON.stringify(saveData);
        localStorage.setItem('kylesBrainquestSave', btoa(saveString));
        return btoa(saveString);
    }

    load() {
        const saveString = localStorage.getItem('kylesBrainquestSave');
        if (saveString) {
            this.importSave(saveString, true);
        }
    }

    importSave(saveString, isInitialLoad = false) {
        try {
            let jsonString = saveString;
            try {
                const decoded = atob(saveString);
                // Simple check to see if it looks like JSON
                if (decoded.trim().startsWith('{') || decoded.trim().startsWith('[')) {
                    jsonString = decoded;
                }
            } catch (e) {
                // Not base64 or decode failed, assume plain JSON
            }

            const saveData = JSON.parse(jsonString);
            
            if (saveData.resources) this.resources = { ...this.resources, ...saveData.resources };
            if (saveData.production) this.production = { ...this.production, ...saveData.production };
            if (saveData.clickValue) this.clickValue = { ...this.clickValue, ...saveData.clickValue };
            if (saveData.options) this.options = { ...this.options, ...saveData.options };
            
            // Validate critical values
            if (isNaN(this.resources.braindead)) this.resources.braindead = 0;
            if (isNaN(this.resources.ideas)) this.resources.ideas = 0;
            if (isNaN(this.resources.immunity)) this.resources.immunity = 100;

            if (saveData.upgrades) {
                saveData.upgrades.forEach(savedUpgrade => {
                    const upgrade = this.upgrades[savedUpgrade.id];
                    if (upgrade) {
                        upgrade.count = savedUpgrade.count;
                        upgrade.cost = savedUpgrade.cost;
                    }
                });
            }

            if (saveData.research) {
                saveData.research.forEach(savedResearch => {
                    const research = this.research[savedResearch.id];
                    if (research) {
                        research.purchased = savedResearch.purchased;
                    }
                });
            }

            if (saveData.logHistory) {
                this.logs = saveData.logHistory;
                // Restore logs to UI without animation/sound if possible, or just add them
                this.logs.forEach(entry => {
                    this.ui.addLog(entry);
                });
            }
            
            if (isInitialLoad && saveData.lastTick && this.options.offlineProgress) {
                const now = Date.now();
                const secondsOffline = (now - saveData.lastTick) / 1000;
                
                if (secondsOffline > 60) {
                    const maxOfflineSeconds = 7200;
                    const effectiveSeconds = Math.min(secondsOffline, maxOfflineSeconds);
                    
                    const immunityMult = 100 / this.resources.immunity;
                    const bdGained = (this.production.braindead * immunityMult) * effectiveSeconds;
                    const ideasGained = this.production.ideas * effectiveSeconds;
                    
                    if (bdGained > 0 || ideasGained > 0) {
                        this.resources.braindead += bdGained;
                        this.resources.ideas += ideasGained;
                        
                        let msg = `You were gone for ${Math.floor(secondsOffline)}s.`;
                        if (secondsOffline > maxOfflineSeconds) msg += ` (Capped at 2h)`;
                        msg += ` Gained ${Math.floor(bdGained)} Bd and ${ideasGained.toFixed(1)} Ideas.`;
                        
                        this.log(msg, "general");
                    }
                }
            }

            if (isInitialLoad) {
                this.log("Game loaded.", "general");
            } else {
                this.log("Save imported successfully!", "general");
                this.save();
            }

            this.updateUI();
            
            if (this.research.thinkMore.purchased) {
                document.getElementById('immunity-display').style.display = 'flex';
            }
            
            const offlineToggle = document.getElementById('offline-toggle');
            if (offlineToggle) offlineToggle.checked = this.options.offlineProgress;

        } catch (e) {
            console.error("Failed to load save:", e);
            if (!isInitialLoad) alert("Invalid save data!");
            this.log("Error loading save data.", "general");
        }
    }

    setupEventListeners() {
        document.getElementById('brain-button').addEventListener('click', (e) => {
            this.clickBrain(e);
        });

        const tabs = document.querySelectorAll('.log-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentLogFilter = tab.textContent.toLowerCase();
                this.ui.renderLogs(this.logs, this.currentLogFilter);
            });
        });

        // Settings Modal
        const modal = document.getElementById('settings-modal');
        const settingsBtn = document.getElementById('settings-button');
        const closeBtn = document.getElementById('close-settings');
        const exportBtn = document.getElementById('export-save-btn');
        const importBtn = document.getElementById('import-save-btn');
        const hardResetBtn = document.getElementById('hard-reset-btn');
        const offlineToggle = document.getElementById('offline-toggle');
        const saveArea = document.getElementById('save-data-area');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
                saveArea.value = '';
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const saveString = this.save();
                saveArea.value = saveString;
                saveArea.select();
                document.execCommand('copy');
                this.log("Save copied to clipboard!", "general");
                exportBtn.textContent = "Copied!";
                setTimeout(() => exportBtn.textContent = "Export Save", 2000);
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const saveString = prompt("Paste your save string here:");
                if (saveString) {
                    this.importSave(saveString);
                    modal.style.display = 'none';
                }
            });
        }

        if (hardResetBtn) {
            hardResetBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to HARD RESET? This will wipe all progress.")) {
                    this.reset();
                }
            });
        }

        if (offlineToggle) {
            offlineToggle.addEventListener('change', (e) => {
                this.options.offlineProgress = e.target.checked;
                this.save();
                this.log(`Offline progress ${this.options.offlineProgress ? 'enabled' : 'disabled'}.`, "general");
            });
        }
    }

    reset() {
        localStorage.removeItem('kylesBrainquestSave');
        location.reload();
    }

    clickBrain(e) {
        const immunityMult = 100 / this.resources.immunity;
        const gain = this.clickValue.braindead * immunityMult;
        this.addResource('braindead', gain);
        this.ui.createFloatingText(e.clientX, e.clientY, `+${gain.toFixed(1)} Bd`);
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
            upgrade.effect(this); // Pass game instance
            this.log(`Purchased ${upgrade.name}`, "upgrade");
            this.updateUI();
        }
    }

    buyResearch(key) {
        const item = this.research[key];
        if (!item.purchased && this.resources[item.currency] >= item.cost) {
            this.resources[item.currency] -= item.cost;
            item.purchased = true;
            item.effect(this); // Pass game instance
            this.log(`Researched ${item.name}`, "unlock");
            this.updateUI();
        }
    }

    gameLoop() {
        const now = Date.now();
        const dt = (now - this.lastTick) / 1000;
        
        if (dt >= 0.1) {
            const immunityMult = 100 / this.resources.immunity;
            this.resources.braindead += (this.production.braindead * immunityMult) * dt;
            this.resources.ideas += this.production.ideas * dt;
            this.lastTick = now;
            this.updateUI();
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    updateUI() {
        try {
            this.ui.update(this);
        } catch (e) {
            console.error("UI Update failed:", e);
        }
    }

    log(message, type = 'general') {
        const entry = { message, type, timestamp: Date.now() };
        this.logs.push(entry);
        if (this.logs.length > 50) this.logs.shift(); // Keep last 50
        
        this.ui.addLog(entry);

        if (type === 'lore') {
            this.ui.showLorePopup(message);
        }
    }
}

window.onload = () => {
    window.game = new Game();
};
