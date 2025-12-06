class ResourceManager {
    constructor(game) {
        this.game = game;
    }

    init() {
        // Initialize resources if not already present (handled by load, but good for defaults)
        if (!this.game.resources) {
            this.game.resources = {
                braindead: 0,
                ideas: 0,
                immunity: 100,
                currency: 0,
                suspicion: 0
            };
        }

        if (!this.game.caps) {
            this.game.caps = {
                braindead: 500, // Base cap
                ideas: 5 // Base cap
            };
        }

        if (!this.game.production) {
            this.game.production = {
                braindead: 0,
                ideas: 0
            };
        }

        if (!this.game.productionMultipliers) {
            this.game.productionMultipliers = {
                braindead: 1,
                ideas: 1
            };
        }

        if (!this.game.clickValue) {
            this.game.clickValue = {
                braindead: 1
            };
        }
        
        // Other resource related stats
        if (this.game.brainSize === undefined) this.game.brainSize = 1;
        if (this.game.scalingMulti === undefined) this.game.scalingMulti = 1.75;
    }

    clickBrain() {
        const now = Date.now();
        if (now - this.game.lastClickReset >= 1000) {
            this.game.clickCount = 0;
            this.game.lastClickReset = now;
        }

        if (this.game.clickCount >= this.game.maxCps) {
            return; // Rate limited
        }
        this.game.clickCount++;

        const immunityMult = 100 / Math.max(1, this.game.resources.immunity);
        const gain = this.game.clickValue.braindead * immunityMult;
        this.addResource('braindead', gain);
        
        this.game.log(`+${gain.toFixed(1)} Bd`);
    }

    addResource(type, amount) {
        this.game.resources[type] += amount;
        this.game.ui.updateResource(type, this.game.resources[type]);
    }

    calculateCaps() {
        const immunityFactor = Math.max(1, this.game.resources.immunity);
        
        // Ideas Caps
        const ideasSoftCap = (500 * this.game.brainSize) / immunityFactor;
        const ideasHardCap = (1000 * this.game.brainSize) / immunityFactor;

        // Braindead Cap
        const braindeadCap = (this.game.caps.braindead);

        return {
            ideas: {
                soft: ideasSoftCap,
                hard: ideasHardCap
            },
            braindead: braindeadCap
        };
    }

    checkCaps() {
        const caps = this.calculateCaps();

        // Enforce Hard Caps
        if (this.game.resources.ideas > caps.ideas.hard) {
            this.game.resources.ideas = caps.ideas.hard;
        }

        if (this.game.resources.braindead > caps.braindead) {
            this.game.resources.braindead = caps.braindead;
        }
        
        // Currency Cap
        const job = this.game.jobs[this.game.currentJob];
        if (job && this.game.resources.currency > job.maxCurrency) {
            this.game.resources.currency = job.maxCurrency;
        }
    }

    tick(dt) {
        const immunityMult = 100 / Math.max(1, this.game.resources.immunity);
        const caps = this.calculateCaps();
        
        // Braindead Production
        this.game.resources.braindead += (this.game.production.braindead * this.game.productionMultipliers.braindead * immunityMult) * dt;
        
        // Ideas Production with Soft Cap Logic
        let ideasProduction = this.game.production.ideas * this.game.productionMultipliers.ideas * dt;
        if (this.game.resources.ideas > caps.ideas.soft) {
            this.game.resources.ideas += ideasProduction / Math.pow(this.game.scalingMulti, (this.game.resources.ideas - caps.ideas.soft)); // Penalty if above soft cap
        }
        else {
            this.game.resources.ideas += ideasProduction;
        }
        
        this.checkCaps();
    }
}
