// js/engine.js
class RasterEngine {
    constructor() {
        this.canvas = document.getElementById('raster-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.layer = document.getElementById('interaction-layer');
        this.a11y = document.getElementById('a11y-shadow');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    async loadBlueprint(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blueprint = await response.json();
            
            // Validate Blueprint Structure
            if (!blueprint.chunks || !Array.isArray(blueprint.chunks)) {
                throw new Error("Invalid blueprint structure");
            }

            this.renderBlueprint(blueprint);
        } catch (error) {
            console.error("Failed to load blueprint:", error);
            this.ctx.fillStyle = 'red';
            this.ctx.font = "20px Arial";
            this.ctx.fillText("Error: Stream Integrity Failed", 50, 50);
        }
    }

    renderBlueprint(blueprint) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.layer.innerHTML = '';
        this.a11y.innerHTML = '';

        blueprint.chunks.forEach(chunk => {
            this.processChunk(chunk);
        });
    }

    processChunk(chunk) {
        // A. Create Secure Sandbox
        const sandbox = new SecureDrawingSandbox(this.ctx, chunk.x, chunk.y);
        sandbox.saveContext();

        // B. Execute Render Code (Securely)
        if (chunk.render_code && Array.isArray(chunk.render_code)) {
            chunk.render_code.forEach(cmdObj => {
                // Validate command object structure
                if (cmdObj.cmd && Array.isArray(cmdObj.args)) {
                    sandbox.executeCommand(cmdObj.cmd, cmdObj.args);
                } else {
                    console.warn("Invalid command format skipped");
                }
            });
        }

        sandbox.restoreContext();

        // C. Build Interaction Layer (Securely)
        if (chunk.interaction_layer && Array.isArray(chunk.interaction_layer)) {
            chunk.interaction_layer.forEach(hotspot => {
                this.createSecureHotspot(hotspot, chunk.x, chunk.y);
            });
        }

        // D. Build Accessibility Shadow
        if (chunk.a11y_content) {
            this.createSecureA11yContent(chunk.a11y_content);
        }
    }

    createSecureHotspot(hotspot, chunkX, chunkY) {
        // Sanitize Coordinates
        const absX = Number(hotspot.x) + Number(chunkX);
        const absY = Number(hotspot.y) + Number(chunkY);
        const w = Number(hotspot.w);
        const h = Number(hotspot.h);

        if (isNaN(absX) || isNaN(absY) || isNaN(w) || isNaN(h)) return;

        const el = document.createElement('div');
        
        // Security: Use setAttribute for styles, not innerHTML
        el.style.position = 'absolute';
        el.style.left = `${absX}px`;
        el.style.top = `${absY}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.cursor = 'pointer';
        el.style.backgroundColor = 'transparent';
        
        // Security: Sanitize the action URL
        const action = this.sanitizeUrl(hotspot.action);
        
        el.onclick = () => {
            // Prevent malicious navigation
            if (action.startsWith('data/')) {
                this.loadBlueprint(action);
            } else if (action.startsWith('#')) {
                // Allow internal anchors
                window.location.hash = action;
            } else {
                // Block external links unless whitelisted
                console.warn("Blocked external navigation");
            }
        };

        // Optional: Add a title for debugging (sanitized)
        if (hotspot.label) {
            el.title = String(hotspot.label).replace(/[<>]/g, '');
        }

        this.layer.appendChild(el);
    }

    createSecureA11yContent(content) {
        // Security: Never use innerHTML with raw strings for A11y
        // Instead, create a text node or use a sanitizer library
        // For this demo, we strip tags and use textContent
        const div = document.createElement('div');
        div.textContent = String(content); 
        this.a11y.appendChild(div);
    }

    sanitizeUrl(url) {
        if (!url) return '';
        // Only allow relative paths or safe internal anchors
        if (url.startsWith('data/') || url.startsWith('#')) {
            return url;
        }
        // Block javascript: or data: URLs
        if (url.startsWith('javascript:') || url.startsWith('data:')) {
            return '';
        }
        return '';
    }
}
