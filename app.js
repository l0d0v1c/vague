const translations = {
    fr: {
        title: "Respiration Guidée",
        newbie: "Débutant",
        medium: "Intermédiaire",
        expert: "Expert",
        ready: "Prêt",
        inhaling: "Inspirez",
        holding: "Retenez",
        exhaling: "Expirez",
        cycles: "Cycles",
        totalTime: "Temps total",
        install: "Installer l'application"
    },
    en: {
        title: "Guided Breathing",
        newbie: "Beginner",
        medium: "Intermediate",
        expert: "Expert",
        ready: "Ready",
        inhaling: "Inhale",
        holding: "Hold",
        exhaling: "Exhale",
        cycles: "Cycles",
        totalTime: "Total Time",
        install: "Install App"
    }
};

class BreathingApp {
    constructor() {
        this.currentLang = 'fr';
        this.currentMode = 'medium';
        this.pattern = [3, 5, 6];
        this.isRunning = false;
        this.cycles = 0;
        this.startTime = null;
        this.totalElapsed = 0;
        this.animationId = null;
        this.currentPhase = null;
        
        this.initElements();
        this.initEventListeners();
        this.initPWA();
        this.updateLanguage();
        this.updateTimer();
        this.updateTriangle();
    }
    
    initElements() {
        this.langToggle = document.getElementById('langToggle');
        this.startBtn = document.getElementById('startBtn');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        this.cursor = document.getElementById('cursor');
        this.phaseIndicator = document.getElementById('phaseIndicator');
        this.cycleCount = document.getElementById('cycleCount');
        this.totalTime = document.getElementById('totalTime');
        this.modeBtns = document.querySelectorAll('.mode-btn');
        this.installBtn = document.getElementById('installBtn');
    }
    
    initEventListeners() {
        this.langToggle.addEventListener('click', () => this.toggleLanguage());
        this.startBtn.addEventListener('click', () => this.toggleBreathing());
        
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!this.isRunning) {
                    this.setMode(btn);
                }
            });
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.stopBreathing();
            }
        });
    }
    
    toggleLanguage() {
        this.currentLang = this.currentLang === 'fr' ? 'en' : 'fr';
        this.langToggle.textContent = this.currentLang === 'fr' ? 'EN' : 'FR';
        this.updateLanguage();
    }
    
    updateLanguage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[this.currentLang][key]) {
                el.textContent = translations[this.currentLang][key];
            }
        });
        
        document.documentElement.lang = this.currentLang;
        document.title = translations[this.currentLang].title;
    }
    
    setMode(btn) {
        this.modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentMode = btn.dataset.mode;
        const pattern = btn.dataset.pattern.split('-').map(Number);
        this.pattern = pattern;
        this.updateTriangle();
    }
    
    updateTriangle() {
        const [inhale, hold, exhale] = this.pattern;
        
        const width = 400;
        const height = 260;
        const margin = 30;
        const baseWidth = 300;
        
        const baseY = height - margin;
        const topY = margin;
        
        const scale = baseWidth / Math.sqrt(inhale * inhale + exhale * exhale);
        
        const inhaleWidth = inhale * scale;
        const holdWidth = hold * scale;
        const exhaleWidth = exhale * scale;
        
        const startX = (width - holdWidth) / 2;
        const topLeftX = startX;
        const topRightX = startX + holdWidth;
        const baseX = startX + (holdWidth / 2);
        
        // Separate paths for each edge
        const leftPath = `M ${baseX} ${baseY} L ${topLeftX} ${topY}`;
        const topPath = `M ${topLeftX} ${topY} L ${topRightX} ${topY}`;
        const rightPath = `M ${topRightX} ${topY} L ${baseX} ${baseY}`;
        const fillPath = `M ${baseX} ${baseY} L ${topLeftX} ${topY} L ${topRightX} ${topY} L ${baseX} ${baseY} Z`;
        
        document.getElementById('trianglePathLeft').setAttribute('d', leftPath);
        document.getElementById('trianglePathTop').setAttribute('d', topPath);
        document.getElementById('trianglePathRight').setAttribute('d', rightPath);
        document.getElementById('triangleFill').setAttribute('d', fillPath);
        
        // Reset all edges to normal width
        document.getElementById('trianglePathLeft').setAttribute('stroke-width', '4');
        document.getElementById('trianglePathTop').setAttribute('stroke-width', '4');
        document.getElementById('trianglePathRight').setAttribute('stroke-width', '4');
        
        this.cursor.setAttribute('cx', baseX);
        this.cursor.setAttribute('cy', baseY);
    }
    
    toggleBreathing() {
        if (this.isRunning) {
            this.stopBreathing();
        } else {
            this.startBreathing();
        }
    }
    
    startBreathing() {
        this.isRunning = true;
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'block';
        
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        this.modeBtns.forEach(btn => btn.disabled = true);
        
        this.animateBreathingCycle();
    }
    
    stopBreathing() {
        this.isRunning = false;
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.modeBtns.forEach(btn => btn.disabled = false);
        
        this.cursor.style.opacity = '0';
        this.phaseIndicator.querySelector('span').setAttribute('data-i18n', 'ready');
        this.updateLanguage();
        
        // Reset all edges to normal width
        document.getElementById('trianglePathLeft').setAttribute('stroke-width', '4');
        document.getElementById('trianglePathTop').setAttribute('stroke-width', '4');
        document.getElementById('trianglePathRight').setAttribute('stroke-width', '4');
        
        if (this.startTime) {
            this.totalElapsed += Date.now() - this.startTime;
            this.startTime = null;
        }
    }
    
    animateBreathingCycle() {
        const [inhale, hold, exhale] = this.pattern;
        const total = inhale + hold + exhale;
        const totalDuration = total * 1000;
        const cycleStartTime = Date.now();
        
        this.cursor.style.opacity = '1';
        
        const width = 400;
        const height = 260;
        const margin = 30;
        const baseWidth = 300;
        
        const baseY = height - margin;
        const topY = margin;
        
        const scale = baseWidth / Math.sqrt(inhale * inhale + exhale * exhale);
        const holdWidth = hold * scale;
        
        const startX = (width - holdWidth) / 2;
        const topLeftX = startX;
        const topRightX = startX + holdWidth;
        const baseX = startX + (holdWidth / 2);
        
        const animate = () => {
            if (!this.isRunning) return;
            
            const elapsed = Date.now() - cycleStartTime;
            const progress = elapsed / totalDuration;
            
            if (progress >= 1) {
                this.cycles++;
                this.cycleCount.textContent = this.cycles;
                this.animateBreathingCycle();
                return;
            }
            
            const inhaleEnd = inhale / total;
            const holdEnd = (inhale + hold) / total;
            
            let x, y, phase;
            
            if (progress < inhaleEnd) {
                const inhaleProgress = progress / inhaleEnd;
                x = baseX + (topLeftX - baseX) * inhaleProgress;
                y = baseY + (topY - baseY) * inhaleProgress;
                phase = 'inhaling';
            } else if (progress < holdEnd) {
                const holdProgress = (progress - inhaleEnd) / (holdEnd - inhaleEnd);
                x = topLeftX + (topRightX - topLeftX) * holdProgress;
                y = topY;
                phase = 'holding';
            } else {
                const exhaleProgress = (progress - holdEnd) / (1 - holdEnd);
                x = topRightX + (baseX - topRightX) * exhaleProgress;
                y = topY + (baseY - topY) * exhaleProgress;
                phase = 'exhaling';
            }
            
            this.cursor.setAttribute('cx', x);
            this.cursor.setAttribute('cy', y);
            
            if (phase !== this.currentPhase) {
                this.currentPhase = phase;
                this.phaseIndicator.querySelector('span').setAttribute('data-i18n', phase);
                this.updateLanguage();
                
                // Reset all edges to normal width
                document.getElementById('trianglePathLeft').setAttribute('stroke-width', '4');
                document.getElementById('trianglePathTop').setAttribute('stroke-width', '4');
                document.getElementById('trianglePathRight').setAttribute('stroke-width', '4');
                
                // Double the width of the active edge
                if (phase === 'inhaling') {
                    document.getElementById('trianglePathLeft').setAttribute('stroke-width', '8');
                } else if (phase === 'holding') {
                    document.getElementById('trianglePathTop').setAttribute('stroke-width', '8');
                } else if (phase === 'exhaling') {
                    document.getElementById('trianglePathRight').setAttribute('stroke-width', '8');
                }
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    updateTimer() {
        setInterval(() => {
            if (this.isRunning && this.startTime) {
                const total = this.totalElapsed + (Date.now() - this.startTime);
                const minutes = Math.floor(total / 60000);
                const seconds = Math.floor((total % 60000) / 1000);
                this.totalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else if (this.totalElapsed > 0) {
                const minutes = Math.floor(this.totalElapsed / 60000);
                const seconds = Math.floor((this.totalElapsed % 60000) / 1000);
                this.totalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    initPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('Service Worker registration failed:', err);
            });
        }
        
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.installBtn.style.display = 'block';
        });
        
        this.installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    this.installBtn.style.display = 'none';
                }
                
                deferredPrompt = null;
            }
        });
        
        window.addEventListener('appinstalled', () => {
            this.installBtn.style.display = 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BreathingApp();
});