window.Game = {
    state: null,
    
    // Base Sigil Threshold: 10^6
    BASE_EXPONENT: 6,

    init() {
        this.state = window.GameStorage.load();
        this.processOfflineProgress();
    },

    tick(dt) {
        // 1. Produkce
        const prodPerSec = this.getTotalProduction();
        const produced = prodPerSec * dt;
        
        this.state.bytes += produced;
        this.state.lifetimeBytes += produced;
        
        // 2. Kontrola Ascension (Sigily)
        const threshold = this.getNextSigilThreshold();
        if (this.state.lifetimeBytes >= threshold) {
            this.gainSigil();
        }
    },

    gainSigil() {
        this.state.stars++;            // Měna k útratě
        this.state.totalSigilsEarned++; // Trvalý progress
    },

    // === GETTERS ===

    getTotalProduction() {
        return this.state.upgrades.reduce((sum, u) => sum + this.getUpgradeProduction(u), 0);
    },

    getUpgradeProduction(u) {
        if (u.count === 0) return 0;

        let prod = u.count * u.base;

        // Tier Boost (2x každých 25)
        prod *= Math.pow(2, Math.floor(u.count / 25));

        // ASCENSION BONUSY
        // PATH A: EXPANSION (×3 per level)
        prod *= Math.pow(3, this.state.ascension[0].count);

        // PATH D: ACCELERATION (×2 per level)
        prod *= Math.pow(2, this.state.ascension[3].count);

        // PATH E: OVERFLOW (Lifetime log bonus)
        if (this.state.ascension[4].count > 0 && this.state.lifetimeBytes > 10) {
            const logLife = Math.log10(this.state.lifetimeBytes);
            const overflowMult = 1 + (logLife * this.state.ascension[4].count * 0.5);
            prod *= overflowMult;
        }

        return prod;
    },

    getUpgradeCost(u, amount) {
        const baseInterest = 0.15;
        // PATH B: OPTIMIZATION (Snižuje růst cen - interest reduction)
        const interestReduction = Math.pow(0.8, this.state.ascension[1].count);
        const r = 1 + (baseInterest * interestReduction);

        const startPrice = u.cost * Math.pow(r, u.count);
        
        if (amount === 1) return startPrice;
        return startPrice * (Math.pow(r, amount) - 1) / (r - 1);
    },

    getMaxBuy(u) {
        const baseInterest = 0.15;
        const interestReduction = Math.pow(0.8, this.state.ascension[1].count);
        const r = 1 + (baseInterest * interestReduction);

        const nextPrice = u.cost * Math.pow(r, u.count);
        
        if (nextPrice > this.state.bytes) return 0;
        
        const num = 1 + (this.state.bytes * (r - 1)) / nextPrice;
        const max = Math.floor(Math.log(num) / Math.log(r));
        
        return Math.max(0, max);
    },

    getNextSigilThreshold() {
        // Cíl: 10^(Base + TotalSigilsEarned - TranscendenceBonus)
        // Používáme totalSigilsEarned, takže utrácení neovlivňuje threshold
        
        // PATH C: TRANSCENDENCE (Snižuje exponent o 1 per level)
        const transcendence = this.state.ascension[2].count; 

        const targetExponent = this.BASE_EXPONENT + this.state.totalSigilsEarned - transcendence;
        
        return Math.pow(10, targetExponent);
    },

    getAscensionCost(p) {
        // Cena: Base + Count
        return p.baseCost + p.count;
    },

    // === ACTIONS ===

    buyUpgrade(id) {
        const u = this.state.upgrades[id];
        if (!u) return false;

        let amount = 1;
        if (this.state.mode === 'MAX') {
            amount = this.getMaxBuy(u);
            if (amount === 0) amount = 1; 
        } else {
            const remainder = u.count % 25;
            amount = 25 - remainder;
        }

        const cost = this.getUpgradeCost(u, amount);
        
        if (this.state.bytes >= cost && amount > 0) {
            this.state.bytes -= cost;
            u.count += amount;
            return true;
        }
        return false;
    },

    buyAscension(id) {
        const p = this.state.ascension[id];
        if (!p) return false;
        if (p.max && p.count >= p.max) return false;

        const cost = this.getAscensionCost(p);
        
        if (this.state.stars >= cost) {
            this.state.stars -= cost;
            p.count++;
            return true;
        }
        return false;
    },

    toggleMode() {
        this.state.mode = this.state.mode === 'NEXT' ? 'MAX' : 'NEXT';
    },

    manualClick() {
        // Cheat: Přidá 10^7 pro rychlý test
        const cheat = 10000000;
        this.state.bytes += cheat;
        this.state.lifetimeBytes += cheat;
        return cheat;
    },

    processOfflineProgress() {
        if (!this.state.lastTimestamp) return;

        const now = Date.now();
        // Rozdíl v sekundách
        let offlineSeconds = (now - this.state.lastTimestamp) / 1000;

        // Ignorovat krátké výpadky (< 1s)
        if (offlineSeconds < 1) return;

        // Limit 8 hodin
        const maxSeconds = 8 * 60 * 60;
        if (offlineSeconds > maxSeconds) {
            offlineSeconds = maxSeconds;
        }

        const prodPerSec = this.getTotalProduction();
        if (prodPerSec <= 0) return;

        const offlineGain = prodPerSec * offlineSeconds;

        this.state.bytes += offlineGain;
        this.state.lifetimeBytes += offlineGain;

        // UI notifikace (pokud byl nějaký zisk)
        if (offlineGain > 0) {
            window.UI.showOfflineInfo(offlineSeconds, offlineGain);
        }
    }
};