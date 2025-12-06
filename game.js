// game.js - Main Game Logic

class Game {
    constructor() {
        // Managers
        this.resourceManager = new ResourceManager(this);
        this.upgradeManager = new UpgradeManager(this);
        this.researchManager = new ResearchManager(this);
        this.vaccineManager = new VaccineManager(this);
        this.jobManager = new JobManager(this);
        this.settings = new SettingsManager(this);

        // Initialize Managers (State)
        this.resourceManager.init();
        this.upgradeManager.init();
        this.researchManager.init();
        this.vaccineManager.init();
        this.jobManager.init();

        // Initialize Settings (Save Version etc)
        // SettingsManager constructor sets saveVersion

        this.tabUnlocks = {
            upgrades: false,
            research: false
        };

        // CPS Limiter
        this.clickCount = 0;
        this.lastClickReset = Date.now();
        this.maxCps = 10;

        this.lastTick = Date.now();
        this.lastSave = Date.now(); // Initialize lastSave
        this.tickRate = 100;

        this.logs = [];
        this.currentLogFilter = 'all';
        this.options = {
            offlineProgress: true,
            brightness: 100
        };

        // Initialize UI Manager
        this.ui = new TerminalUI(this);

        this.isReady = false;
        this.isResetting = false;
        this.init();
    }

    init() {
        this.ui.init(); // Initialize Terminal UI listeners
        this.setupEventListeners();
        
        // Use SettingsManager for loading
        this.settings.load();
        
        // Autosave every 30 seconds (handled in tick or here?)
        // Original game.js had setInterval here AND check in tick.
        // settings.js has setupAutosave() but it wasn't called in original game.js.
        // Let's stick to game.js tick based autosave or setInterval.
        // Original game.js had:
        // setInterval(() => this.save(), 30000);
        // AND in tick: if (now - this.lastSave > 30000) ...
        // I'll use the tick one for consistency with loop, or setInterval.
        // Let's use setInterval as in original init (lines 95).
        setInterval(() => this.save(), 30000);
        
        // Save on close/refresh
        window.addEventListener('beforeunload', () => this.save());
    }

    save() {
        return this.settings.save();
    }

    load() {
        this.settings.load();
    }

    setupEventListeners() {
        // Most listeners are handled by TerminalUI or dynamic button creation
    }

    // Proxy Methods for UI calls
    clickBrain(e) {
        this.resourceManager.clickBrain();
    }

    buyUpgrade(key) {
        this.upgradeManager.buyUpgrade(key);
    }

    buyResearch(key) {
        this.researchManager.buyResearch(key);
    }

    buyVaccine(key) {
        this.vaccineManager.buyVaccine(key);
    }

    work() {
        this.jobManager.work();
    }

    steal() {
        this.jobManager.steal();
    }

    promote(jobId) {
        this.jobManager.promote(jobId);
    }

    triggerVaccine(tier) {
        this.vaccineManager.triggerVaccine(tier);
    }

    // Helper methods used by UI or Managers
    calculateCaps() {
        return this.resourceManager.calculateCaps();
    }
    
    
    getCost(item) {
        return item.cost;
    }

    tick() {
        const now = Date.now();
        const dt = (now - this.lastTick) / 1000;
        this.lastTick = now;

        this.resourceManager.tick(dt);
        this.jobManager.tick(dt);
        
        this.upgradeManager.checkUnlocks();
        this.researchManager.checkUnlocks();
        this.vaccineManager.checkUnlocks();
        
        this.updateUI();
        
        requestAnimationFrame(() => this.tick());
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
