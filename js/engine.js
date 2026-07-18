// js/engine.js
// js/engine.js
class RasterEngine {
    constructor() {
        this.canvas = document.getElementById('raster-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.layer = document.getElementById('interaction-layer');
        this.a11y = document.getElementById('a11y-shadow');
        
        // Hardcoded key for demo purposes (matching Python script)
        this.rawKey = new TextEncoder().encode('12345678901234567890123456789012');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Add scrolling support for large datasets
        this.scrollY = 0;
        window.addEventListener('wheel', (e) => this.handleScroll(e));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if(this.currentBlueprint) this.renderBlueprint(this.currentBlueprint);
    }

    handleScroll(e) {
        this.scrollY += e.deltaY;
        this.scrollY = Math.max(0, this.scrollY); // Prevent negative scroll
        if (this.currentBlueprint) this.renderBlueprint(this.currentBlueprint);
    }

    async getCryptoKey() {
        return await crypto.subtle.importKey(
            "raw", this.rawKey, "AES-GCM", true, ["encrypt", "decrypt"]
        );
    }

    async decryptPayload(encryptedPayload) {
        const key = await this.getCryptoKey();
        
        // Decode Base64 to ArrayBuffer
        const iv = Uint8Array.from(atob(encryptedPayload.iv), c => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(encryptedPayload.ciphertext), c => c.charCodeAt(0));
        const tag = Uint8Array.from(atob(encryptedPayload.tag), c => c.charCodeAt(0));
        
        // Combine ciphertext and tag for WebCrypto
        const data = new Uint8Array(ciphertext.length + tag.length);
        data.set(ciphertext);
        data.set(tag, ciphertext.length);

        try {
            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv }, key, data
            );
            const decryptedText = new TextDecoder().decode(decryptedBuffer);
            return JSON.parse(decryptedText);
        } catch (e) {
            console.error("Decryption failed. Integrity compromised or wrong key.", e);
            throw e;
        }
    }

   async loadBlueprint(url) {
        try {
            const response = await fetch(url);
            
            let blueprint;
            if (url.endsWith('.enc')) {
                const encryptedData = await response.json();
                blueprint = await this.decryptPayload(encryptedData);
            } else {
                blueprint = await response.json();
            }
            
            // Check if this is a partial update or a full page load
            if (blueprint.type === 'delta') {
                this.applyDelta(blueprint);
            } else {
                this.currentBlueprint = blueprint;
                this.scrollY = 0; // Reset scroll on new full page
                this.renderBlueprint(blueprint);
            }
            
        } catch (error) {
            console.error("Failed to load/decrypt blueprint:", error);
            this.ctx.fillStyle = 'red';
            this.ctx.fillText("Error loading secure stream", 50, 50);
        }
    }

    applyDelta(deltaBlueprint) {
        if (!this.currentBlueprint) return; // Cannot patch if nothing is loaded

        // Loop through the new chunks and replace the existing ones by ID
        deltaBlueprint.chunks.forEach(newChunk => {
            const existingIndex = this.currentBlueprint.chunks.findIndex(c => c.id === newChunk.id);
            
            if (existingIndex !== -1) {
                // Overwrite existing chunk
                this.currentBlueprint.chunks[existingIndex] = newChunk;
            } else {
                // If the chunk ID doesn't exist, append it as a new visual layer
                this.currentBlueprint.chunks.push(newChunk);
            }
        });

        // Re-render the canvas with the patched blueprint
        this.renderBlueprint(this.currentBlueprint);
    }

    renderBlueprint(blueprint) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.layer.innerHTML = '';
        this.a11y.innerHTML = '';
        this.ctx.font = blueprint.meta.font;
        this.ctx.textBaseline = 'top';

        // Apply global scroll offset
        this.ctx.save();
        this.ctx.translate(0, -this.scrollY);

        blueprint.chunks.forEach(chunk => {
            this.processChunk(chunk);
        });
        
        this.ctx.restore();
    }

    processChunk(chunk) {
        const sandbox = new DrawingSandbox(this.ctx, chunk.x, chunk.y);
        sandbox.saveContext();
        this.executeRenderCode(chunk.render_code, sandbox);
        sandbox.restoreContext();

        if (chunk.interaction_layer) {
            chunk.interaction_layer.forEach(hotspot => {
                this.createHotspot(hotspot, chunk.x, chunk.y);
            });
        }
        if (chunk.a11y_content) {
            this.createA11yContent(chunk.a11y_content);
        }
    }

    executeRenderCode(code, sandbox) {
        code.forEach(cmd => {
            const method = sandbox[cmd.cmd];
            if (method) method.apply(sandbox, cmd.args);
        });
    }

    createHotspot(hotspot, chunkX, chunkY) {
        const el = document.createElement('div');
        el.className = 'hotspot';
        const absX = hotspot.x + chunkX;
        const absY = hotspot.y + chunkY - this.scrollY; // Adjust for scroll
        
        el.style.left = absX + 'px';
        el.style.top = absY + 'px';
        el.style.width = hotspot.w + 'px';
        el.style.height = hotspot.h + 'px';
        
        el.onclick = () => {
            if (hotspot.action.includes('.json') || hotspot.action.includes('.enc')) {
                this.loadBlueprint(hotspot.action);
            } else {
                alert("Action triggered: " + hotspot.action);
            }
        };
        this.layer.appendChild(el);
    }

    createA11yContent(content) {
        const div = document.createElement('div');
        div.innerHTML = content;
        this.a11y.appendChild(div);
    }
}
