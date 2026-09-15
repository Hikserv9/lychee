const templateData = [
    {
        id: 1, name: "NeuralSaaS Spatial", price: 79, popular: true, isFree: false,
        description: "Ultra-modern AI platform landing page with real-time WebGL node visualizer and glassmorphic UI widgets.",
        icon: "3D CANVAS", demoPage: "novamind.html",
        techs: ["Next.js 14", "Three.js", "Tailwind"],
        config: { logoText: "Your Brand", primaryColor: "#00F0FF", secondaryColor: "#CCFF00", accentColor: "#A855F7", font: "Inter", sections: ["hero", "features", "faq"] }
    },
    {
        id: 2, name: "Aetherfolio 3D", price: 49, popular: false, isFree: false,
        description: "Sleek interactive portfolio featuring custom Spline 3D viewport canvas, kinetic typography, and audio FX.",
        icon: "PORTFOLIO", demoPage: "portfolio.html",
        techs: ["React", "Spline 3D", "Framer Motion"],
        config: { logoText: "My Portfolio", primaryColor: "#CCFF00", secondaryColor: "#00F0FF", accentColor: "#A855F7", font: "Space Grotesk", sections: ["hero", "projects", "contact"] }
    },
    {
        id: 3, name: "Vortex Protocol", price: 99, popular: false, isFree: false,
        description: "DeFi analytics and Web3 management dashboard with real-time WebSocket chart widgets and wallet connect.",
        icon: "DASHBOARD", demoPage: "aetherx.html",
        techs: ["Vue 3", "Chart.js", "Ethers.js"],
        config: { logoText: "Vortex Dashboard", primaryColor: "#00F0FF", secondaryColor: "#CCFF00", accentColor: "#A855F7", font: "JetBrains Mono", sections: ["overview", "charts", "swap"] }
    },
    {
        id: 4, name: "CyberCart Spatial", price: 85, popular: false, isFree: false,
        description: "High-tech spatial e-commerce storefront with AR product preview integration and interactive 3D product rotators.",
        icon: "STORE 3D", demoPage: "vortex-wear.html",
        techs: ["Next.js", "WebGL", "Shopify API"],
        config: { logoText: "CyberCart", primaryColor: "#CCFF00", secondaryColor: "#A855F7", accentColor: "#00F0FF", font: "Outfit", sections: ["hero", "products", "cart"] }
    },
    {
        id: 5, name: "Resonance Audio", price: 0, popular: false, isFree: true,
        description: "WebAudio API synthesis landing showcase page for music producers, podcasts, and generative sound engines.",
        icon: "AUDIO", demoPage: "portfolio.html",
        techs: ["WebAudio API", "Canvas 2D", "Tailwind"],
        config: { logoText: "Resonance", primaryColor: "#00F0FF", secondaryColor: "#CCFF00", accentColor: "#555555", font: "Inter", sections: ["hero", "player", "gallery"] }
    },
    {
        id: 6, name: "AetherVerse Spatial", price: 119, popular: false, isFree: false,
        description: "WebXR compatible virtual real estate showcase and interactive 3D spatial world hub.",
        icon: "AR WORLD", demoPage: "portfolio.html",
        techs: ["WebXR", "Three.js", "GSAP"],
        config: { logoText: "AetherVerse", primaryColor: "#A855F7", secondaryColor: "#CCFF00", accentColor: "#00F0FF", font: "Orbitron", sections: ["hero", "worlds", "gallery"] }
    }
];

window.templateStore = function() {
    return {
        templates: templateData,
        configOpen: false,
        activeConfig: null,
        purchaseOpen: false,
        freeUpgradeOpen: false,
        selectedTmpl: null,
        sectionsList: ["hero", "features", "projects", "faq", "contact", "charts", "swap", "cart", "gallery", "player", "overview", "products"],
        paymentLoading: false,
        paymentMode: 'stripe',

        selectTmpl(tmpl) {
            this.selectedTmpl = tmpl;
        },

        completePurchase() {
            this.purchaseOpen = false;
            this.selectedTmpl = null;
        },

        openConfig(tmpl) {
            this.activeConfig = JSON.parse(JSON.stringify(tmpl));
            this.configOpen = true;
        },

        closeConfig() {
            this.configOpen = false;
            setTimeout(() => { this.activeConfig = null; }, 300);
        },

        setPaymentMode(mode) {
            this.paymentMode = mode;
        },

        async checkout() {
            if (!this.selectedTmpl) return;
            const tmpl = this.selectedTmpl;
            this.purchaseLoading = true;

            try {
                if (tmpl.isFree) {
                    this.purchaseOpen = false;
                    this.freeUpgradeOpen = true;
                    this.purchaseLoading = false;
                    return;
                }

                if (this.paymentMode === 'stripe') {
                    const res = await fetch('/api/checkout/stripe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: tmpl.name, price: tmpl.price, currency: 'usd' })
                    });
                    const data = await res.json();
                    if (data.url) {
                        window.location.href = data.url;
                    } else {
                        this.downloadConfig();
                    }
                } else if (this.paymentMode === 'midtrans') {
                    const orderId = 'OMNIMIND-' + Date.now();
                    const res = await fetch('/api/checkout/midtrans', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: tmpl.name, price: tmpl.price, orderId: orderId })
                    });
                    const data = await res.json();
                    if (data.snapToken) {
                        window.location.href = '/midtrans-checkout.html?token=' + data.snapToken;
                    } else {
                        this.downloadConfig();
                    }
                }
            } catch (err) {
                console.error('Checkout error:', err);
                this.downloadConfig();
            }
            this.purchaseLoading = false;
        },

        downloadConfig() {
            if (!this.activeConfig) return;
            const c = this.activeConfig.config;
            let sectionsHTML = "";
            for (let i = 0; i < c.sections.length; i++) {
                sectionsHTML += '<div class="section"><h2>' + c.sections[i].toUpperCase() + '</h2></div>';
            }
            const htmlTemplate = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <style>\n        :root { --primary: ' + c.primaryColor + '; --secondary: ' + c.secondaryColor + '; --accent: ' + c.accentColor + '; }\n        body { font-family: \'' + c.font + '\', sans-serif; background: #0B0B0F; color: white; padding: 2rem; }\n        .logo { color: var(--primary); font-size: 2rem; font-weight: bold; }\n        .section { margin: 2rem 0; padding: 2rem; border: 1px solid var(--secondary); border-radius: 1rem; }\n    </style>\n</head>\n<body>\n    <div class="logo">' + c.logoText + '</div>\n' + sectionsHTML + '\n</body>\n</html>';
            const blob = new Blob([htmlTemplate], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.activeConfig.name.replace(/\s+/g, '-').toLowerCase() + '-customized.html';
            a.click();
            URL.revokeObjectURL(url);
        }
    };
};
