class UpgradeManager {
    constructor(game) {
        this.game = game;
    }

    init() {
        this.game.upgrades = getInitialUpgrades();
    }

    buyUpgrade(key) {
        const upgrade = this.game.upgrades[key];
        if (this.game.resources[upgrade.currency] >= upgrade.cost) {
            this.game.resources[upgrade.currency] -= upgrade.cost;
            upgrade.count++;
            upgrade.cost = Math.floor(upgrade.cost * upgrade.costScale);
            upgrade.effect(this.game); // Pass game instance
            this.game.log(`Purchased ${upgrade.name}`, "upgrade");
            this.game.updateUI();
        }
    }

    checkUnlocks() {
        // Tab Unlocks
        if (!this.game.tabUnlocks.upgrades && this.game.resources.braindead >= 10) {
            this.game.tabUnlocks.upgrades = true;
            this.game.updateUI(); // Force update to show tab
        }

        Object.values(this.game.upgrades).forEach(item => {
            if (!item.visible && item.unlockCondition && item.unlockCondition(this.game)) {
                item.visible = true;
                item.newlyUnlocked = true;
                this.game.log(`${item.name} unlocked!`, "unlock");
            }
        });
    }
}
