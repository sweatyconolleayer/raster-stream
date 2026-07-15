# raster-stream
The Raster-Stream Architecture reimagines the web not as a document, but as a dynamic, interactive image stream.  it creates a hyper-secure, bandwidth-efficient, and visually consistent delivery method that could revolutionize how we deliver complex data visualizations, secure banking interfaces, and immersive web experiences.


# Raster-Stream Architecture (RSA) Demo

A proof-of-concept implementation of a novel web delivery method where content is sent as procedural drawing code rather than HTML/CSS.

## Features
- **Procedural Rendering**: The server sends JSON instructions to draw lines, text, and shapes on a canvas.
- **Chunked Delivery**: The page is broken into coordinate-based chunks for efficient loading.
- **Interaction Overlay**: Clickable elements are invisible DOM nodes layered over the static image.
- **Security**: No live DOM is rendered for the visual layer, mitigating XSS attacks.
- **Accessibility**: A hidden "Shadow DOM" is generated for screen readers.

## How to Run
1. Clone this repository.
2. Serve the files using a local server (e.g., `python3 -m http.server 8000`).
   *Note: This is required to load the JSON blueprints due to CORS.*
3. Open `http://localhost:8000` in your browser.

## Usage
- Click "View Transactions" in the top right to navigate to a new page.
- Hover over "Quick Actions" to see the interaction hotspots (red outlines).
- Switch to "Back to Dashboard" to return.

## Architecture
1. **Client**: Requests a JSON Blueprint.
2. **Engine**: Parses the blueprint, clears the canvas, and executes drawing commands for each chunk.
3. **Overlay**: Creates invisible `<div>` elements at specified coordinates to handle clicks.
4. **Navigation**: Clicking a hotspot triggers a new Blueprint request, redrawing the canvas with new data.
