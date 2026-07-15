class RasterEngine {
    constructor() {
        this.canvas = document.getElementById('raster-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.layer = document.getElementById('interaction-layer');
        this.a11y = document.getElementById('a11y-shadow');
        
        // Set canvas resolution
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
            const blueprint = await response.json();
            
            this.renderBlueprint(blueprint);
        } catch (error) {
            console.error("Failed to load blueprint:", error);
            this.ctx.fillStyle = 'red';
            this.ctx.fillText("Error loading stream", 50, 50);
        }
    }

    renderBlueprint(blueprint) {
        // 1. Clear Canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 2. Clear Interaction Layer
        this.layer.innerHTML = '';
        this.a11y.innerHTML = '';

        // 3. Set Global Styles (from blueprint meta)
        this.ctx.font = blueprint.meta.font;
        this.ctx.textBaseline = 'top';

        // 4. Process Chunks
        blueprint.chunks.forEach(chunk => {
            this.processChunk(chunk);
        });
    }

    processChunk(chunk) {
        // A. Create Sandbox for this chunk
        const sandbox = new DrawingSandbox(this.ctx, chunk.x, chunk.y);
        sandbox.saveContext();

        // B. Execute Render Code
        // In this demo, we assume the code is a simple function call structure
        // In production, this would be a safer AST execution
        this.executeRenderCode(chunk.render_code, sandbox);

        sandbox.restoreContext();

        // C. Build Interaction Layer (Hotspots)
        if (chunk.interaction_layer) {
            chunk.interaction_layer.forEach(hotspot => {
                this.createHotspot(hotspot, chunk.x, chunk.y);
            });
        }

        // D. Build Accessibility Shadow
        if (chunk.a11y_content) {
            this.createA11yContent(chunk.a11y_content);
        }
    }


    executeRenderCode(code, sandbox) {
        code.forEach(cmd => {
            const method = sandbox[cmd.cmd];
            if (method) {
                // FIX: Bind 'sandbox' as the 'this' context for the method
                method.apply(sandbox, cmd.args); 
            }
        });
    }

    createHotspot(hotspot, chunkX, chunkY) {
        const el = document.createElement('div');
        el.className = 'hotspot';
        
        // Calculate absolute position
        const absX = hotspot.x + chunkX;
        const absY = hotspot.y + chunkY;
        
        el.style.left = absX + 'px';
        el.style.top = absY + 'px';
        el.style.width = hotspot.w + 'px';
        el.style.height = hotspot.h + 'px';
        
        // Handle Click
        el.onclick = () => {
            console.log(`Navigating to: ${hotspot.action}`);
            // Simulate navigation by loading a new blueprint
            if (hotspot.action.startsWith('data/')) {
                this.loadBlueprint(hotspot.action);
            } else {
                alert("External link: " + hotspot.action);
            }
        };

        // Add tooltip for demo purposes
        el.title = hotspot.label || "Interactive Element";
        
        this.layer.appendChild(el);
    }

    createA11yContent(content) {
        const div = document.createElement('div');
        div.innerHTML = content;
        this.a11y.appendChild(div);
    }
}
