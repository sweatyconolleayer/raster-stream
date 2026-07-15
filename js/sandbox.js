class DrawingSandbox {
    constructor(ctx, offsetX, offsetY) {
        this.ctx = ctx;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    // Wrapper to apply offsets to all drawing commands
    saveContext() {
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
    }

    restoreContext() {
        this.ctx.restore();
    }

    // Primitive: Draw Rectangle
    rect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }

    // Primitive: Draw Text
    text(str, x, y, font, color) {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.fillText(str, x, y);
    }

    // Primitive: Draw Line (for charts)
    line(x1, y1, x2, y2, color, width) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    // Primitive: Draw Circle
    circle(x, y, r, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    // Primitive: Draw Image (simulated with base64 or placeholder)
    image(src, x, y, w, h) {
        // In a real scenario, images would be decoded in a separate sandbox
        const img = new Image();
        img.src = src;
        if (img.complete) {
            this.ctx.drawImage(img, x, y, w, h);
        } else {
            this.rect(x, y, w, h, '#ccc'); // Placeholder
        }
    }
}
