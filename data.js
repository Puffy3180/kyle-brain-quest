// data.js - Contains static game data and definitions

function getInitialUpgrades() {
    return {
        enhancedClick: {
            id: 'enhancedClick',
            name: "Enhanced Click",
            description: "+0.5 Braindead per click",
            cost: 25,
            costScale: 1.5,
            currency: "braindead",
            count: 0,
            effect: function(game) { game.clickValue.braindead += 0.5; },
            unlockCondition: function(game) { return game.resources.braindead >= 10; }
        },
        autoclicker: {
            id: 'autoclicker',
            name: "Autoclicker",
            description: "Generates Braindead automatically",
            cost: 250,
            costScale: 2.0,
            currency: "braindead",
            count: 0,
            effect: function(game) { game.production.braindead += 0.2; },
            unlockCondition: function(game) { return game.resources.braindead >= 50; }
        },
        thoughtCondenser: {
            id: 'thoughtCondenser',
            name: "Thought Condenser",
            description: "Generates Ideas slowly",
            cost: 150,
            costScale: 1.5,
            currency: "braindead",
            count: 0,
            effect: function(game) { game.production.ideas += 0.05; },
            unlockCondition: function(game) { return game.resources.braindead >= 10; }
        },
        ideaAmplifier: {
            id: 'ideaAmplifier',
            name: "Idea Amplifier",
            description: "Boosts Idea generation",
            cost: 500,
            costScale: 1.5,
            currency: "braindead",
            count: 0,
            effect: function(game) { game.production.ideas += 0.1; },
            unlockCondition: function(game) { return game.resources.ideas >= 1; }
        }
    };
}

function getInitialResearch() {
    return {
        think: {
            id: 'think',
            name: "Think",
            description: "Unlock the power of your mind.",
            cost: 5,
            currency: "ideas",
            purchased: false,
            prereq: null,
            effect: function(game) {
                game.log("How can I increase my braindead? It must be something to do with my brain...", "lore");
            },
            unlockCondition: function(game) { return game.resources.ideas >= 1; }
        },
        thinkMore: {
            id: 'thinkMore',
            name: "Think some more",
            description: "Dig deeper.",
            cost: 25,
            currency: "ideas",
            purchased: false,
            prereq: 'think',
            effect: function(game) {
                game.log("There seems to be some sort of 'immunity' stopping me from increasing my braindead quickly...", "lore");
                document.getElementById('immunity-display').style.display = 'flex';
            },
            unlockCondition: function(game) { return game.research.think.purchased && game.resources.ideas >= 2; }
        },
        immunityResearch: {
            id: 'immunityResearch',
            name: "Immunity Research",
            description: "Study the resistance.",
            cost: 100,
            currency: "ideas",
            purchased: false,
            prereq: 'thinkMore',
            effect: function(game) {
                game.log("Aha! I can just create a vaccine to decrease my immunity. That's how vaccines work right?", "lore");
            },
            unlockCondition: function(game) { return game.research.thinkMore.purchased && game.resources.ideas >= 5; }
        },
        vaccineV1: {
            id: 'vaccineV1',
            name: "Vaccine V1",
            description: "Reduces immunity.",
            cost: 250,
            currency: "ideas",
            purchased: false,
            prereq: 'immunityResearch',
            effect: function(game) {
                game.resources.immunity = Math.max(1, game.resources.immunity - 10);
                game.log("Immunity reduced! Braindead gain increased.", "general");
            },
            unlockCondition: function(game) { return game.research.immunityResearch.purchased && game.resources.ideas >= 10; }
        }
    };
}
