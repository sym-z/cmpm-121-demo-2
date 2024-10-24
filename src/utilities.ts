export function createCanvas() {
    // Create drawing canvas
    const canvas = document.createElement("canvas");
    const WIDTH: number = 256;
    const HEIGHT: number = 256;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    return canvas;
  }