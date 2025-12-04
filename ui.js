// ui.js - Terminal UI Manager

class TerminalUI {
    constructor(game) {
        this.game = game;
        this.elements = {
            resourceStrip: document.getElementById('resource-strip'),
            visualArea: document.getElementById('visual-area'),
            asciiArt: document.getElementById('ascii-art'),
            logDisplay: document.getElementById('log-display'),
            controlsArea: document.getElementById('controls-area'),
            navStrip: document.getElementById('nav-strip')
        };
        
        this.currentView = 'main'; // main, upgrades, research, jobs
        this.lastControlsHTML = '';
        this.lastNavHTML = '';
        this.lastResourceHTML = '';
        this.asciiBrain = `
      .---.
    .'     '.
   /   o  o  \\
  |    __    |
   \\  (  )  /
    '.____.'
        `;
    }

    init() {
        this.elements.asciiArt.textContent = ""; // Start empty
        this.elements.asciiArt.onclick = () => this.game.clickBrain();
        
        // Prevent double-click selection
        this.elements.asciiArt.addEventListener('mousedown', (e) => e.preventDefault());
    }

    update(game) {
        this.updateResources(game);
        this.updateControls(game);
        this.updateNav(game);
        this.checkProgression(game);
    }

    revealBrain() {
        if (!this.elements.asciiArt.textContent) {
            this.elements.asciiArt.textContent = this.asciiBrain;
        }
    }

    checkProgression(game) {
        // Phase 1: Brain appears
        // Handled by intro or load, but safety check:
        if (game.resources.braindead > 0 && !this.elements.asciiArt.textContent) {
             this.revealBrain();
             this.log("A shape forms in the void.");
        }


        // Phase 2: Resources appear
        if (game.resources.braindead > 0) {
            this.elements.resourceStrip.style.display = 'flex';
        }

        // Phase 3: Nav appears
        if (game.resources.braindead >= 10) {
            this.elements.navStrip.style.display = 'flex';
        }
    }

    updateResources(game) {
        if (this.elements.resourceStrip.style.display === 'none') return;

        const res = game.resources;
        let html = '';
        
        if (res.braindead > 0) html += `<div class="res-item">Braindead: <span class="res-val">${Math.floor(res.braindead)}</span></div>`;
        if (res.ideas > 0) html += `<div class="res-item">Ideas: <span class="res-val">${res.ideas.toFixed(1)}</span></div>`;
        if (res.immunity < 100) html += `<div class="res-item">Immunity: <span class="res-val">${Math.floor(res.immunity)}</span></div>`;
        if (res.currency > 0) html += `<div class="res-item">Currency: <span class="res-val">${Math.floor(res.currency)}</span></div>`;

        if (this.lastResourceHTML !== html) {
            this.elements.resourceStrip.innerHTML = html;
            this.lastResourceHTML = html;
        }
    }

    updateNav(game) {
        if (this.elements.navStrip.style.display === 'none') return;

        const views = ['main'];
        if (game.resources.braindead >= 10) views.push('upgrades');
        if (game.resources.ideas > 0) views.push('research');
        if (game.research.getAJob && game.research.getAJob.purchased) views.push('jobs');

        let html = '';
        views.forEach(view => {
            const active = this.currentView === view ? 'active' : '';
            html += `<a href="#" class="nav-link ${active}" onclick="game.ui.switchView('${view}'); return false;">[ ${view.toUpperCase()} ]</a>`;
        });
        
        // Settings link always there if nav is visible
        const active = this.currentView === 'settings' ? 'active' : '';
        html += `<a href="#" class="nav-link ${active}" onclick="game.ui.switchView('settings'); return false;">[ SETTINGS ]</a>`;

        if (this.lastNavHTML !== html) {
            this.elements.navStrip.innerHTML = html;
            this.lastNavHTML = html;
        }
    }

    switchView(view) {
        this.currentView = view;
        this.update(this.game); // Immediate update
    }

    updateControls(game) {
        const container = this.elements.controlsArea;
        let html = '';

        if (this.currentView === 'main') {
            // Main view
        } else if (this.currentView === 'upgrades') {
            html = this.getUpgradesHTML(game);
        } else if (this.currentView === 'research') {
            html = this.getResearchHTML(game);
        } else if (this.currentView === 'jobs') {
            html = this.getJobsHTML(game);
        } else if (this.currentView === 'settings') {
            html = this.getSettingsHTML(game);
        }

        if (this.lastControlsHTML !== html) {
            container.innerHTML = html;
            this.lastControlsHTML = html;
        }
    }

    getUpgradesHTML(game) {
        let html = '';
        Object.values(game.upgrades).forEach(u => {
            if (!u.visible && u.unlockCondition && u.unlockCondition(game)) u.visible = true;
            if (!u.visible && u.count === 0) return;

            const canAfford = game.resources[u.currency] >= u.cost;
            const disabled = canAfford ? '' : 'disabled';
            
            let text = `buy ${u.name.toLowerCase()} (${u.cost} ${u.currency === 'braindead' ? 'bd' : 'id'})`;
            if (u.count > 0) text += ` [owned: ${u.count}]`;
            
            html += `<button class="cmd-btn" ${disabled} onclick="game.buyUpgrade('${u.id}')" title="${u.description}">${text}</button>`;
        });
        return html;
    }

    getResearchHTML(game) {
        let html = '';
        Object.values(game.research).forEach(r => {
            if (r.purchased) return;
            
            if (!r.visible && r.unlockCondition && r.unlockCondition(game)) r.visible = true;
            if (!r.visible) return;

            const canAfford = game.resources[r.currency] >= r.cost;
            const disabled = canAfford ? '' : 'disabled';
            
            html += `<button class="cmd-btn" ${disabled} onclick="game.buyResearch('${r.id}')" title="${r.description}">research ${r.name.toLowerCase()} (${r.cost} id)</button>`;
        });
        return html;
    }

    getJobsHTML(game) {
        let html = '';
        // Job Info
        const job = game.jobs[game.currentJob];
        html += `<div style="margin-bottom: 10px; color: #888;">Current Job: ${job.name} (Salary: ${job.salary})</div>`;

        // Actions
        const cooldown = game.jobCooldown > 0;
        const btnText = cooldown ? `resting... (${Math.ceil(game.jobCooldown)})` : `work shift`;
        const disabled = cooldown ? 'disabled' : '';
        
        html += `<button class="cmd-btn" ${disabled} onclick="game.work()">${btnText}</button>`;
        
        return html;
    }

    getSettingsHTML(game) {
        let html = '';
        
        // Save Management
        html += `<div style="margin-bottom: 5px; color: #fff;">-- SYSTEM --</div>`;
        html += `<button class="cmd-btn" onclick="game.save(); game.ui.log('Game saved.', 'system')">force save</button>`;
        html += `<button class="cmd-btn" onclick="game.ui.exportSave()">export save</button>`;
        html += `<button class="cmd-btn" onclick="game.ui.importSave()">import save</button>`;
        html += `<button class="cmd-btn" style="color: #ff6666;" onclick="if(confirm('HARD RESET?')) game.reset()">hard reset</button>`;
        
        // Options
        html += `<div style="margin-top: 15px; margin-bottom: 5px; color: #fff;">-- CONFIG --</div>`;
        const offlineState = game.options.offlineProgress ? 'ON' : 'OFF';
        html += `<button class="cmd-btn" onclick="game.options.offlineProgress = !game.options.offlineProgress; game.save();">offline progress: ${offlineState}</button>`;
        
        return html;
    }

    exportSave() {
        const saveString = this.game.save();
        navigator.clipboard.writeText(saveString).then(() => {
            this.log("Save copied to clipboard.", "system");
        }).catch(err => {
            this.log("Failed to copy save.", "system");
            console.error(err);
        });
    }

    importSave() {
        const saveString = prompt("Paste save string:");
        if (saveString) {
            this.game.importSave(saveString);
        }
    }

    log(message, type = 'general') {
        const entry = document.createElement('div');
        entry.className = 'log-line new';
        entry.textContent = `> ${message}`;
        this.elements.logDisplay.appendChild(entry);
        this.elements.logDisplay.scrollTop = this.elements.logDisplay.scrollHeight;
        
        // Remove 'new' class after animation
        setTimeout(() => entry.classList.remove('new'), 500);
    }

    // Helper for game.js to call
    addLog(entry) {
        this.log(entry.message, entry.type);
    }
    
    hideAll() {
        // Reset to initial state
        this.elements.resourceStrip.style.display = 'none';
        this.elements.navStrip.style.display = 'none';
        this.elements.asciiArt.textContent = "";
    }
    
    playIntroSequence(onComplete) {
        this.log("Initializing...");
        setTimeout(() => {
            this.log("Subject: Kyle.");
            setTimeout(() => {
                this.log("Status: Dormant.");
                setTimeout(() => {
                    this.log("Wake up.");
                    // Reveal the brain
                    this.revealBrain();
                    if (onComplete) onComplete();
                }, 1500);
            }, 1500);
        }, 1500);
    }
}
