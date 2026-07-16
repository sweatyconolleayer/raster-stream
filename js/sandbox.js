// js/sandbox.js
class SecureDrawingSandbox {
    constructor(ctx, offsetX, offsetY) {
        this.ctx = ctx;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        
        // Whitelist of allowed commands
        this.allowedCommands = ['rect', 'line', 'circle', 'text', 'image'];
    }

    saveContext() {
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
    }

    restoreContext() {
        this.ctx.restore();
    }

    /**
     * The Secure Executor
     * Validates the command against the whitelist before execution.
     * No eval(), no dynamic function calls.
     */
    executeCommand(cmd, args) {
        // 1. Check if command is in whitelist
        if (!this.allowedCommands.includes(cmd)) {
            console.warn(`[SECURITY] Blocked unauthorized command: ${cmd}`);
            return;
        }

        // 2. Validate Arguments (Basic Type Checking)
        if (!Array.isArray(args)) {
            console.warn(`[SECURITY] Args must be an array for command: ${cmd}`);
            return;
        }

        // 3. Execute Specific Logic
        switch (cmd) {
            case 'rect':
                this._drawRect(args);
                break;
            case 'line':
                this._drawLine(args);
                break;
            case 'circle':
                this._drawCircle(args);
                break;
            case 'text':
                this._drawText(args);
                break;
            case 'image':
                this._drawImage(args);
                break;
            default:
                // Fallback (should not happen due to whitelist)
                break;
        }
    }

    // --- Internal Drawing Methods (Safe) ---

    _drawRect(args) {
        const [x, y, w, h, color] = args;
        if (typeof x !== 'number' || typeof y !== 'number') return;
        
        this.ctx.fillStyle = this._sanitizeColor(color);
        this.ctx.fillRect(x, y, w, h);
    }

    _drawLine(args) {
        const [x1, y1, x2, y2, color, width] = args;
        if (typeof x1 !== 'number' || typeof y1 !== 'number') return;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = this._sanitizeColor(color);
        this.ctx.lineWidth = typeof width === 'number' ? width : 1;
        this.ctx.stroke();
    }

    _drawCircle(args) {
        const [x, y, r, color] = args;
        if (typeof x !== 'number' || typeof y !== 'number') return;

        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = this._sanitizeColor(color);
        this.ctx.fill();
    }

    _drawText(args) {
        const [str, x, y, font, color] = args;
        if (typeof x !== 'number' || typeof y !== 'number') return;

        // Sanitize font string to prevent CSS injection
        const safeFont = this._sanitizeFont(font);
        
        this.ctx.fillStyle = this._sanitizeColor(color);
        this.ctx.font = safeFont;
        this.ctx.fillText(str, x, y);
    }

    _drawImage(args) {
        const [src, x, y, w, h] = args;
        // In a real app, 'src' must be validated against a CDN or internal asset list
        // to prevent loading malicious images.
        if (!src || typeof x !== 'number') return;

        const img = new Image();
        img.crossOrigin = "anonymous"; // Prevent CORS issues with external assets
        img.onload = () => this.ctx.drawImage(img, x, y, w, h);
        img.onerror = () => {
            // Fallback to a gray box if image fails
            this.ctx.fillStyle = '#ccc';
            this.ctx.fillRect(x, y, w, h);
        };
        img.src = src;
    }

    // --- Sanitization Helpers ---

    _sanitizeColor(color) {
        // Only allow #RRGGBB, rgb(), or predefined safe colors
        if (!color) return '#000000';
        if (typeof color !== 'string') return '#000000';
        
        // Simple regex for hex
        if (color.match(/^#[0-9A-F]{6}$/i)) return color;
        
        // Allow rgb/rgba with numbers only
        if (color.match(/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/)) return color;

        // Fallback
        return '#000000';
    }

    _sanitizeFont(font) {
        if (!font) return "16px Arial";
        // Strip any potential CSS injection (e.g., "12px Arial, expression(...)")
        // Only allow numbers, px, pt, and common font names
        const safe = font.replace(/[^a-zA-Z0-9\s.,pxpt]/g, '');
        return safe;
    }
}
