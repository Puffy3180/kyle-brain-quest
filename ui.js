// ui.js - Handles DOM updates and UI interactions

class UIManager {
    constructor(game) {
        this.game = game;
    }

    update(game) {
        // Update Resources
        document.getElementById('res-braindead').textContent = Math.floor(game.resources.braindead);
        document.getElementById('res-ideas').textContent = game.resources.ideas.toFixed(1);
        document.getElementById('res-immunity').textContent = Math.floor(game.resources.immunity);

        this.updateUpgrades(game);
        this.updateResearch(game);
    }

    updateUpgrades(game) {
        const upgradeContainer = document.querySelector('.upgrades-panel .upgrade-list');
        Object.values(game.upgrades).forEach(upgrade => {
            let btn = document.getElementById(`btn-${upgrade.id}`);
            
            // Unlock check
            const isUnlocked = upgrade.count > 0 || (upgrade.unlockCondition && upgrade.unlockCondition(game));
            
            if (!isUnlocked) {
                if (btn) btn.style.display = 'none';
                return;
            }

            if (!btn) {
                btn = document.createElement('button');
                btn.id = `btn-${upgrade.id}`;
                btn.className = 'upgrade-btn';
                btn.innerHTML = `
                    <span class="upgrade-name">${upgrade.name}</span>
                    <span class="upgrade-cost"></span>
                    <span class="upgrade-desc">${upgrade.description}</span>
                `;
                btn.addEventListener('click', () => game.buyUpgrade(upgrade.id));
                upgradeContainer.appendChild(btn);
            }
            
            btn.style.display = 'block';
            const costSpan = btn.querySelector('.upgrade-cost');
            costSpan.textContent = `${upgrade.cost} ${upgrade.currency === 'braindead' ? 'Bd' : 'Id'}`;
            btn.disabled = game.resources[upgrade.currency] < upgrade.cost;
        });
    }

    updateResearch(game) {
        const researchContainer = document.getElementById('research-list');
        Object.values(game.research).forEach(item => {
            if (item.purchased) {
                 const existingBtn = document.getElementById(`btn-research-${item.id}`);
                 if (existingBtn) existingBtn.style.display = 'none';
                 return;
            }

            let btn = document.getElementById(`btn-research-${item.id}`);

            // Unlock check
            const isUnlocked = item.unlockCondition && item.unlockCondition(game);
             if (!isUnlocked) {
                if (btn) btn.style.display = 'none';
                return;
            }

            if (!btn) {
                btn = document.createElement('button');
                btn.id = `btn-research-${item.id}`;
                btn.className = 'upgrade-btn research-btn';
                btn.innerHTML = `
                    <span class="upgrade-name">${item.name}</span>
                    <span class="upgrade-cost">${item.cost} Ideas</span>
                    <span class="upgrade-desc">${item.description}</span>
                `;
                btn.onclick = () => game.buyResearch(item.id);
                researchContainer.appendChild(btn);
            }

            btn.style.display = 'block';
            btn.disabled = game.resources[item.currency] < item.cost;
        });
    }

    addLog(log) {
        const logContent = document.getElementById('log-content');
        if (!logContent) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${log.type}`;
        entry.textContent = `[${log.timestamp}] ${log.message}`;
        logContent.appendChild(entry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    renderLogs(logs, filter) {
        const logContent = document.getElementById('log-content');
        logContent.innerHTML = '';

        logs.forEach(log => {
            if (filter !== 'all' && log.type !== filter) {
                let show = false;
                if (filter === 'resources') {
                    if (log.type === 'general' || log.type === 'upgrade') show = true;
                } else if (filter === 'lore') {
                    if (log.type === 'lore' || log.type === 'unlock') show = true;
                }

                if (!show) return;
            }

            const entry = document.createElement('div');
            entry.className = `log-entry ${log.type}`;
            entry.textContent = `[${log.timestamp}] ${log.message}`;
            logContent.appendChild(entry);
        });
    }

    showLorePopup(message) {
        // Create container if it doesn't exist
        let container = document.querySelector('.lore-popup-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'lore-popup-container';
            document.body.appendChild(container);
        }

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'lore-popup';
        
        const text = document.createElement('div');
        text.className = 'lore-popup-text';
        text.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'lore-popup-close';
        closeBtn.textContent = 'Dismiss';
        closeBtn.onclick = () => {
            popup.style.animation = 'popupFadeOut 0.3s ease forwards';
            setTimeout(() => popup.remove(), 300);
        };

        popup.appendChild(text);
        popup.appendChild(closeBtn);
        container.appendChild(popup);

        // Auto-dismiss after 10 seconds if not clicked
        setTimeout(() => {
            if (document.body.contains(popup)) {
                popup.style.animation = 'popupFadeOut 0.5s ease forwards';
                setTimeout(() => popup.remove(), 500);
            }
        }, 10000);
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

    playIntroSequence(onComplete) {
        const overlay = document.createElement('div');
        overlay.id = 'intro-overlay';
        document.body.appendChild(overlay);

        const lines = [
            "Initializing Neural Interface...",
            "Loading Core Modules...",
            "Synapse Link Established.",
            "Subject: Kyle.",
            "Objective: Brainquest.",
            "Welcome."
        ];

        let delay = 0;
        lines.forEach((line, index) => {
            setTimeout(() => {
                const p = document.createElement('div');
                p.className = 'intro-line intro-cursor';
                p.textContent = '> ' + line;
                overlay.appendChild(p);
                
                // Remove cursor from previous line
                if (index > 0) {
                    overlay.children[index-1].classList.remove('intro-cursor');
                }
                
                p.style.opacity = 1;
            }, delay);
            delay += 800 + Math.random() * 500;
        });

        setTimeout(() => {
            overlay.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => {
                overlay.remove();
                this.playMaterializeSequence(onComplete);
            }, 500);
        }, delay + 1000);
    }

    playMaterializeSequence(onComplete) {
        // Trigger Flash
        const flash = document.getElementById('flash-overlay');
        flash.classList.add('flash-active');

        setTimeout(() => {
            // Sequence Reveal with Corner Convergence
            const mapping = {
                'sidebar-section': 'corner-tl', // Top-Left
                'brain-section': 'corner-tr',   // Top-Right
                'panels-section': 'corner-bl',  // Bottom-Left
                'log-section': 'corner-br'      // Bottom-Right
            };

            Object.entries(mapping).forEach(([id, animClass], index) => {
                setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.classList.remove('hidden-ui');
                        el.classList.add(animClass);
                    }
                }, index * 100); // Fast stagger
            });

            // Ensure brain button exists
            const brainBtn = document.getElementById('brain-button');
            if (brainBtn) {
                // Remove old listener to prevent duplicates (though anonymous functions are hard to remove, 
                // we can rely on the fact that this sequence usually runs once per session or reload)
                // A better approach for the keydown is to add it in setupEventListeners in game.js, 
                // but since we are here:
                brainBtn.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                    }
                };
            }

            if (onComplete) onComplete();
        }, 300); // Wait for flash to peak
    }

    revealAll() {
        const elements = [
            'sidebar-section',
            'brain-section',
            'panels-section',
            'log-section'
        ];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('hidden-ui', 'corner-tl', 'corner-tr', 'corner-bl', 'corner-br');
            }
        });
    }

    hideAll() {
        const elements = [
            'sidebar-section',
            'brain-section',
            'panels-section',
            'log-section'
        ];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden-ui');
                el.classList.remove('corner-tl', 'corner-tr', 'corner-bl', 'corner-br');
            }
        });
    }
}
