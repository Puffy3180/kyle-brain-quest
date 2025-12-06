class ResearchManager {
    constructor(game) {
        this.game = game;
    }

    init() {
        this.game.research = getInitialResearch();
    }

    buyResearch(key) {
        const item = this.game.research[key];
        if (!item.purchased && this.game.resources[item.currency] >= item.cost) {
            // Check prereqs
            if (item.prereq && !this.game.research[item.prereq].purchased) return;

            this.game.resources[item.currency] -= item.cost;
            item.purchased = true;
            item.effect(this.game); // Pass game instance
            this.game.log(`Researched ${item.name}`, "unlock");
            this.game.updateUI();
        }
    }

    checkUnlocks() {
        if (!this.game.tabUnlocks.research && this.game.resources.ideas > 0) {
            this.game.tabUnlocks.research = true;
            this.game.updateUI();
        }

        Object.values(this.game.research).forEach(item => {
            if (!item.visible && item.unlockCondition && item.unlockCondition(this.game)) {
                item.visible = true;
                item.newlyUnlocked = true;
                this.game.log(`${item.name} unlocked!`, "unlock");
            }
        });
    }
}
