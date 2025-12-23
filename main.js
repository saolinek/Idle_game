window.Main = {
    lastTime: 0,
    saveTimer: 0,

    init() {
        console.log("Initializing Crystal Idle...");
        
        // 1. Load Data
        window.Game.init();
        
        // 2. Prepare UI (Generates DOM)
        window.UI.init();
        
        // 3. Start Loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));

        // 4. Auto-save on exit
        window.addEventListener('beforeunload', () => {
            window.GameStorage.save(window.Game.state);
        });

        console.log("Ready.");
    },

    loop(currentTime) {
        // Delta time v sekundách
        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Ochrana proti obřím skokům (např. tab na pozadí)
        // Pokud je dt > 1s, omezíme ho pro tento tick na 1s (nebo zpracujeme jinak, kdybychom měli offline progress)
        // Pro plynulost UI stačí, logika se při lagování "dožene" sama, ale chceme zabránit numerické nestabilitě
        if (dt > 1) dt = 1; 
        if (dt < 0) dt = 0;

        if (dt > 0) {
            // 1. Logic
            window.Game.tick(dt);

            // 2. Render
            window.UI.render();

            // 3. Save (každých 5s)
            this.saveTimer += dt;
            if (this.saveTimer >= 5) {
                window.GameStorage.save(window.Game.state);
                this.saveTimer = 0;
            }
        }

        requestAnimationFrame((t) => this.loop(t));
    }
};

// Spuštění po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    window.Main.init();
});