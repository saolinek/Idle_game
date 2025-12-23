window.GameStorage = {
    KEY: 'crystal_idle_v8_fix',

    getInitialState() {
        return {
            bytes: 25,
            lifetimeBytes: 25,
            startTime: Date.now(),
            lastTimestamp: Date.now(),
            stars: 0, // Available Sigils
            totalSigilsEarned: 0, // Lifetime Sigils (pro výpočet thresholdu)
            mode: 'NEXT',
            upgrades: [
                { id: 0, name: "Data Node", base: 4, cost: 10, count: 0, color: "#3b82f6", icon: "fa-microchip" },
                { id: 1, name: "Network", base: 30, cost: 250, count: 0, color: "#10b981", icon: "fa-wifi" },
                { id: 2, name: "Server Farm", base: 150, cost: 2000, count: 0, color: "#f59e0b", icon: "fa-server" },
                { id: 3, name: "Orbital Link", base: 800, cost: 25000, count: 0, color: "#ef4444", icon: "fa-satellite" },
                { id: 4, name: "Neural Core", base: 5000, cost: 300000, count: 0, color: "#a855f7", icon: "fa-brain" },
                { id: 5, name: "Quantum Matrix", base: 30000, cost: 4000000, count: 0, color: "#ec4899", icon: "fa-project-diagram" }
            ],
            // 5 CEST (Paths)
            ascension: [
                { id: 0, name: "Expansion", desc: "Produkce ×3", count: 0, baseCost: 1, max: 10, color: "#3b82f6", icon: "fa-chart-line" },
                { id: 1, name: "Optimization", desc: "Ceny růst -20%", count: 0, baseCost: 1, max: 10, color: "#10b981", icon: "fa-sliders" },
                { id: 2, name: "Transcendence", desc: "Sigily o 1 řád dříve", count: 0, baseCost: 2, max: 5, color: "#a855f7", icon: "fa-eye" },
                { id: 3, name: "Acceleration", desc: "Rychlost ×2", count: 0, baseCost: 2, max: 10, color: "#f59e0b", icon: "fa-forward" },
                { id: 4, name: "Overflow", desc: "Lifetime posiluje", count: 0, baseCost: 3, max: 5, color: "#ec4899", icon: "fa-infinity" }
            ]
        };
    },

    load() {
        try {
            // Zkusíme načíst z aktuálního klíče
            let saved = localStorage.getItem(this.KEY);
            
            // Pokud není, zkusíme migraci ze staré verze v7
            if (!saved) {
                saved = localStorage.getItem('crystal_idle_v7_ascension_rework');
            }

            if (!saved) return this.getInitialState();
            
            const parsed = JSON.parse(saved);
            const def = this.getInitialState();
            const newState = { ...def, ...parsed };
            
            // Migrace: Pokud chybí totalSigilsEarned, dopočítáme ho
            if (newState.totalSigilsEarned === undefined) {
                // Spočítáme utracené
                let spent = 0;
                if (newState.ascension) {
                    newState.ascension.forEach(p => {
                        // Vzorec pro cenu: Base + Count
                        // Suma = p.count/2 * (2*Base + (count-1))
                        if (p.count > 0) {
                            spent += (p.count / 2) * (2 * p.baseCost + (p.count - 1));
                        }
                    });
                }
                newState.totalSigilsEarned = newState.stars + spent;
            }
            
            // Mapování polí
            newState.upgrades = def.upgrades.map((u, i) => ({
                ...u,
                count: parsed.upgrades && parsed.upgrades[i] ? parsed.upgrades[i].count : 0
            }));
            
            newState.ascension = def.ascension.map((p, i) => ({
                ...p,
                count: parsed.ascension && parsed.ascension[i] ? parsed.ascension[i].count : 0
            }));

            return newState;
        } catch (e) {
            console.error("Save corrupted, resetting:", e);
            return this.getInitialState();
        }
    },

    save(state) {
        try {
            state.lastTimestamp = Date.now();
            localStorage.setItem(this.KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Save failed:", e);
        }
    },

    reset() {
        if(confirm("Opravdu provést tvrdý reset?")) {
            localStorage.removeItem(this.KEY);
            // Vymazat i starý klíč pro jistotu
            localStorage.removeItem('crystal_idle_v7_ascension_rework');
            location.reload();
        }
    }
};