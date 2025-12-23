window.UI = {
    elements: {},
    activeTab: 'production',
    
    upgradesCache: [],
    ascensionCache: [],

    init() {
        this.elements = {
            bytes: document.getElementById('displayBytes'),
            rate: document.getElementById('displayRate'),
            stars: document.getElementById('starCount'),
            ascensionStars: document.getElementById('prestigeStarCount'),
            evoBar: document.getElementById('evolutionBar'),
            nextEvo: document.getElementById('nextEvoText'),
            modeBtn: document.getElementById('modeBtn'),
            modeLabel: document.getElementById('modeLabel'),
            grid: document.getElementById('grid'),
            ascensionGrid: document.getElementById('prestige-upgrades'),
            statsContent: document.getElementById('stats-content'),
            
            tabs: {
                production: document.getElementById('tab-production'),
                prestige: document.getElementById('tab-prestige'),
                stats: document.getElementById('tab-stats')
            },
            nav: {
                production: document.getElementById('nav-production'),
                prestige: document.getElementById('nav-prestige'),
                stats: document.getElementById('nav-stats')
            }
        };

        // Events
        Object.keys(this.elements.nav).forEach(key => {
            this.elements.nav[key].addEventListener('click', () => this.switchTab(key));
        });

        this.elements.modeBtn.addEventListener('click', () => {
            window.Game.toggleMode();
            this.render();
        });

        document.getElementById('cheatBtn').addEventListener('click', (e) => {
            const amount = window.Game.manualClick();
            this.createFloatText(e.clientX, e.clientY, amount);
            this.render();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            window.GameStorage.reset();
        });

        // Grid Events
        this.elements.grid.addEventListener('click', (e) => {
            const card = e.target.closest('.card-press');
            if (card && card.dataset.id !== undefined) {
                e.preventDefault();
                const success = window.Game.buyUpgrade(parseInt(card.dataset.id));
                if (success) this.render();
            }
        });

        this.elements.ascensionGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-id]');
            if (btn && !btn.disabled) {
                e.preventDefault();
                const success = window.Game.buyAscension(parseInt(btn.dataset.id));
                if (success) this.render();
            }
        });

        // Generate Grids
        this.generateProductionGrid();
        this.generateAscensionGrid();
        
        this.render(true);
    },

    // --- GENERATORS ---

    generateProductionGrid() {
        const state = window.Game.state;
        let html = '';
        state.upgrades.forEach((u, i) => {
            html += `
                <div id="upg-card-${i}" class="card-press rounded-3xl p-4 flex flex-col justify-between border-2 transition-all select-none bg-white" data-id="${i}">
                    <div class="flex justify-between items-center mb-1 pointer-events-none">
                        <i class="fas ${u.icon} text-lg" style="color: ${u.color}"></i>
                        <span id="upg-lvl-${i}" class="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 uppercase">Lvl ${u.count}</span>
                    </div>
                    <div class="pointer-events-none">
                        <div class="font-black text-[13px] text-slate-800 tracking-tight leading-tight mb-0.5 uppercase">${u.name}</div>
                        <div id="upg-prod-${i}" class="text-[10px] font-bold text-slate-400 uppercase">Prod: 0</div>
                        <div class="w-full h-1.5 bg-slate-50 rounded-full mt-2 overflow-hidden border border-slate-100">
                            <div id="upg-bar-${i}" class="h-full transition-all duration-300" style="width: 0%; background: ${u.color}"></div>
                        </div>
                    </div>
                    <div class="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center pointer-events-none">
                        <span id="upg-amount-${i}" class="text-[9px] font-black text-slate-300 uppercase">+1</span>
                        <span id="upg-cost-${i}" class="text-xs font-black text-slate-900">0</span>
                    </div>
                </div>`;
        });
        this.elements.grid.innerHTML = html;
        state.upgrades.forEach((u, i) => {
            this.upgradesCache[i] = {
                card: document.getElementById(`upg-card-${i}`),
                lvl: document.getElementById(`upg-lvl-${i}`),
                prod: document.getElementById(`upg-prod-${i}`),
                bar: document.getElementById(`upg-bar-${i}`),
                amount: document.getElementById(`upg-amount-${i}`),
                cost: document.getElementById(`upg-cost-${i}`)
            };
        });
    },

    generateAscensionGrid() {
        const state = window.Game.state;
        let html = '';
        state.ascension.forEach((p, i) => {
            html += `
                <div id="asc-card-${i}" class="bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background: ${p.color}15; color: ${p.color}">
                        <i class="fas ${p.icon} text-xl"></i>
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-center">
                            <span class="font-black text-xs uppercase text-slate-800">${p.name}</span>
                            <span id="asc-lvl-${i}" class="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">LVL ${p.count}</span>
                        </div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase">${p.desc}</div>
                    </div>
                    <div class="shrink-0" id="asc-btn-container-${i}">
                        <button data-id="${i}" id="asc-btn-${i}" class="px-3 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1">
                            <span id="asc-cost-${i}">0</span> <i class="fas fa-certificate text-[8px]"></i>
                        </button>
                    </div>
                </div>`;
        });
        this.elements.ascensionGrid.innerHTML = html;
        state.ascension.forEach((p, i) => {
            this.ascensionCache[i] = {
                card: document.getElementById(`asc-card-${i}`),
                lvl: document.getElementById(`asc-lvl-${i}`),
                btn: document.getElementById(`asc-btn-${i}`),
                container: document.getElementById(`asc-btn-container-${i}`),
                cost: document.getElementById(`asc-cost-${i}`)
            };
        });
    },

    // --- RENDER ---

    render(force = false) {
        const state = window.Game.state;

        // Header
        this.elements.bytes.textContent = this.formatWithUnit(state.bytes, " 💎");
        this.elements.rate.textContent = this.formatWithUnit(window.Game.getTotalProduction(), " 💎/s");
        
        this.elements.stars.textContent = state.stars;
        this.elements.modeLabel.textContent = state.mode;

        // Evo Bar
        const threshold = window.Game.getNextSigilThreshold();
        const progress = Math.min(100, (state.lifetimeBytes / threshold) * 100);
        this.elements.evoBar.style.width = progress + "%";
        this.elements.nextEvo.textContent = this.format(threshold);

        // Tabs
        if (this.activeTab === 'production') {
            this.updateProductionGrid(state);
        } else if (this.activeTab === 'prestige') {
            this.updateAscensionGrid(state);
        } else if (this.activeTab === 'stats') {
            this.renderStats(state);
        }
    },

    updateProductionGrid(state) {
        state.upgrades.forEach((u, i) => {
            const cache = this.upgradesCache[i];
            const amount = state.mode === 'MAX' ? Math.max(1, window.Game.getMaxBuy(u)) : Math.max(1, 25 - (u.count % 25));
            const cost = window.Game.getUpgradeCost(u, amount);
            const canAfford = state.bytes >= cost;
            const prod = window.Game.getUpgradeProduction(u);

            cache.lvl.textContent = `Lvl ${u.count}`;
            cache.prod.textContent = `Prod: ${this.formatWithUnit(prod, " 💎/s")}`;
            cache.bar.style.width = ((u.count % 25) / 25) * 100 + "%";
            cache.amount.textContent = `+${amount}`;
            cache.cost.textContent = this.formatWithUnit(cost, " 💎");

            if (canAfford) {
                cache.card.classList.add('can-buy', 'glow-effect');
                cache.card.classList.remove('cannot-buy');
                cache.card.style.borderColor = u.color;
            } else {
                cache.card.classList.remove('can-buy', 'glow-effect');
                cache.card.classList.add('cannot-buy');
                cache.card.style.borderColor = '';
            }
        });
    },

    updateAscensionGrid(state) {
        this.elements.ascensionStars.textContent = state.stars;

        state.ascension.forEach((p, i) => {
            const cache = this.ascensionCache[i];
            const cost = window.Game.getAscensionCost(p);
            const canAfford = state.stars >= cost;
            const isMax = p.max && p.count >= p.max;

            cache.lvl.textContent = `LVL ${p.count}${p.max ? '/' + p.max : ''}`;

            if (isMax) {
                cache.container.innerHTML = '<span class="text-[10px] font-black text-emerald-500 uppercase">MAX</span>';
                cache.card.classList.add('opacity-60', 'border-emerald-100');
                cache.card.classList.remove('border-purple-200', 'shadow-sm');
            } else {
                cache.cost.textContent = cost;
                if (canAfford) {
                    cache.btn.disabled = false;
                    cache.btn.className = 'px-3 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1 bg-purple-600 text-white shadow-lg active:scale-95 cursor-pointer';
                    cache.card.classList.add('border-purple-200', 'shadow-sm');
                    cache.card.classList.remove('opacity-60', 'border-slate-100');
                } else {
                    cache.btn.disabled = true;
                    cache.btn.className = 'px-3 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1 bg-slate-100 text-slate-300 pointer-events-none cursor-default';
                    cache.card.classList.remove('border-purple-200', 'shadow-sm');
                    cache.card.classList.add('opacity-60', 'border-slate-100');
                }
            }
        });
    },

    renderStats(state) {
        const timePlayed = Math.floor((Date.now() - state.startTime) / 1000);
        const hours = Math.floor(timePlayed / 3600);
        const minutes = Math.floor((timePlayed % 3600) / 60);
        const seconds = timePlayed % 60;
        const totalUpgrades = state.upgrades.reduce((acc, u) => acc + u.count, 0);

        this.elements.statsContent.innerHTML = `
            <div class="grid grid-cols-1 gap-4">
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Lifetime</div>
                    <div class="text-3xl font-black text-indigo-600">${this.formatWithUnit(state.lifetimeBytes, " 💎")}</div>
                </div>
                 <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Doba v simulaci</div>
                    <div class="text-2xl font-black text-slate-800">${hours}h ${minutes}m ${seconds}s</div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                     <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                        <i class="fas fa-layer-group text-emerald-500 text-2xl mb-2"></i>
                        <div class="text-xl font-black text-slate-800">${totalUpgrades}</div>
                        <div class="text-[9px] text-slate-400 font-bold uppercase">Upgradů</div>
                    </div>
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                        <i class="fas fa-certificate text-purple-500 text-2xl mb-2"></i>
                        <div class="text-xl font-black text-slate-800">${state.stars}</div>
                        <div class="text-[9px] text-slate-400 font-bold uppercase">Available Sigils</div>
                    </div>
                </div>
            </div>`;
    },

    // --- UTILS ---

    switchTab(tabName) {
        this.activeTab = tabName;
        
        // 1. Skrýt vše
        Object.values(this.elements.tabs).forEach(el => {
            if(el) el.classList.add('hidden');
        });

        // 2. Zobrazit aktivní
        const targetTab = this.elements.tabs[tabName];
        if (targetTab) targetTab.classList.remove('hidden');

        // 3. Navigace styly
        Object.values(this.elements.nav).forEach(el => {
            if(el) {
                el.classList.remove('text-indigo-600', 'scale-110');
                el.classList.add('text-slate-400');
            }
        });

        const activeBtn = this.elements.nav[tabName];
        if (activeBtn) {
            activeBtn.classList.remove('text-slate-400');
            activeBtn.classList.add('text-indigo-600', 'scale-110');
        }
        
        this.render(true);
    },

    // --- FORMATTING LOGIC ---

    // Vrátí čistý string čísla (buď "1 234" nebo "1.23 × 10^6")
    format(n) {
        if (n === 0) return "0";
        if (n < 1000000) return Math.floor(n).toLocaleString('cs-CZ').replace(/\s/g, ' '); 
        
        const exponent = Math.floor(Math.log10(n));
        const mantissa = n / Math.pow(10, exponent);
        return `${mantissa.toFixed(2)} × 10^${exponent}`;
    },

    // Přidá jednotku ZA číslo (odděleno mezerou, pokud tam není 10^x)
    // Ale zadání říká: "jednotku přidej až ZA celý string"
    // Pokud je číslo vědecké, taky tam má být jednotka?
    // "1.23 × 10^6 💎" je validní.
    // Ale v bodě 1 zadání: "žádné kombinace 10 💎". To platilo pro ten starý formát, kde chyběla mantisa.
    // Teď s mantisou je to OK.
    formatWithUnit(n, suffix) {
        return this.format(n) + suffix;
    },

    createFloatText(x, y, amount) {
        const text = this.formatWithUnit(amount, " 💎");
        const el = document.createElement('div');
        el.className = 'float-text';
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.innerText = `+${text}`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }
};