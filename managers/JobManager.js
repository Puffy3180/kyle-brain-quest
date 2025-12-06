class JobManager {
    constructor(game) {
        this.game = game;
    }

    init() {
        this.game.jobs = getInitialJobs();
        this.game.currentJob = 'intern';
        this.game.jobCooldown = 0;
    }

    work() {
        if (this.game.jobCooldown > 0) return;
        
        const job = this.game.jobs[this.game.currentJob];
        this.game.resources.currency += job.salary;
        this.game.jobCooldown = 5; // 5 seconds cooldown
        
        // Suspicion check
        if (Math.random() * 100 < job.suspicionRate) {
            this.game.log("You were fired for suspicious behavior!", "warning");
            this.game.currentJob = 'intern'; // Demotion
            this.game.resources.suspicion = 0;
        }
        
        this.game.updateUI();
    }

    steal() {
        if (this.game.jobCooldown > 0) return;
        
        const job = this.game.jobs[this.game.currentJob];
        this.game.resources.suspicion += 1;
        this.game.resources.currency += job.maxCurrency * 0.05;
        this.game.jobCooldown = 5;
        
        this.game.updateUI();
    }

    promote(jobId) {
        if (this.game.jobs[jobId]) {
            this.game.currentJob = jobId;
            this.game.updateUI();
        }
    }

    tick(dt) {
        if (this.game.jobCooldown > 0) {
            this.game.jobCooldown -= dt;
        }
    }
}
