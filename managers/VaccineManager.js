class VaccineManager {
    constructor(game) {
        this.game = game;
    }

    init() {
        this.game.vaccines = getInitialVaccines();
    }

    buyVaccine(key) {
        const item = this.game.vaccines[key];
        if (!item.purchased && this.game.resources[item.currency] >= item.cost) {
            // Check prereqs
            if (item.prereq && !this.game.vaccines[item.prereq].purchased) return;

            this.game.resources[item.currency] -= item.cost;
            item.purchased = true;
            item.effect(this.game); // Pass game instance
            this.game.log(`Administered ${item.name}`, "unlock");
            this.game.updateUI();
        }
    }

    triggerVaccine(tier) {
        if (tier === 1) {
            // Reset resources
            this.game.resources.braindead = 0;
            this.game.resources.ideas = 0;
            this.game.resources.immunity = 80; // Reduced immunity
            this.game.resources.currency = 0;
            this.game.resources.suspicion = 0;
            
            // Reset Upgrades
            Object.values(this.game.upgrades).forEach(u => {
                u.count = 0;
                // We rely on reload to reset costs properly as they are not stored in save except current cost
                // But since we reload, we just need to save the state.
                // Actually, the save logic saves current state.
                // If we reload, we load from save.
                // So we need to ensure the save reflects the reset.
            });
            
            // Reset Research
            Object.values(this.game.research).forEach(r => {
                r.purchased = false;
                r.visible = false;
            });

            // Apply global multiplier
            this.game.productionMultipliers.braindead *= 1.5;
            this.game.productionMultipliers.ideas *= 1.5;
            
            this.game.log("Vaccine V1 Administered. Immunity reduced.", "lore");
            this.game.save();
            location.reload(); 
            
        } else if (tier === 2) {
             // Reset resources
            this.game.resources.braindead = 0;
            this.game.resources.ideas = 0;
            this.game.resources.immunity = 60; 
            this.game.resources.currency = 0;
            this.game.resources.suspicion = 0;
            
            // Reset Upgrades & Research
             Object.values(this.game.upgrades).forEach(u => { u.count = 0; });
             Object.values(this.game.research).forEach(r => { r.purchased = false; r.visible = false; });
             
            // Apply global multiplier
            this.game.productionMultipliers.braindead *= 2.5; 
            this.game.productionMultipliers.ideas *= 2.5;
            
            this.game.log("Vaccine V2 Administered. I feel... different.", "lore");
            this.game.save();
            location.reload();
        }
    }

    checkUnlocks() {
        Object.values(this.game.vaccines).forEach(item => {
            if (!item.visible && item.unlockCondition && item.unlockCondition(this.game)) {
                item.visible = true;
                item.newlyUnlocked = true;
                this.game.log(`${item.name} unlocked!`, "unlock");
            }
        });
    }
}
