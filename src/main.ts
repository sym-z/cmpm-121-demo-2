import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

// Makes the appending process into a loop.

// App title
const title = document.createElement("h1");
app.appendChild(title);

// Create drawing canvas
const canvas = document.createElement("canvas");
const WIDTH: number = 256;
const HEIGHT: number = 256;
canvas.width = WIDTH;
canvas.height = HEIGHT;
app.appendChild(canvas);
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
const drawing_changed: MouseEvent = new MouseEvent("drawing_changed");
interface Point {
  x: number;
  y: number;
}
const lines: Point[][] = [];
const redo_lines: Point[][] = [];
let current_line: Point[] | null = null;

// Event Listeners
// Used the linked quant-paint.glitch.me/paint0.html and paint1.hmtl to help
const cursor = { active: false, x: 0, y: 0 };

// Major help from the paint1.html example
canvas.addEventListener("drawing_changed", () => {
  if (ctx != null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
      if (line.length > 1) {
        ctx.beginPath();
        const { x, y } = line[0];
        ctx.moveTo(x, y);
        for (const { x, y } of line) {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
});
canvas.addEventListener("mousedown", (e) => {
  current_line = [];
  lines.push(current_line);
  redo_lines.splice(0, redo_lines.length);
  cursor.active = true;
  addLine(e);
});
canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && ctx != null) {
    addLine(e);
  }
});
canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

// Div
const divider1 = document.createElement("div");
app.appendChild(divider1);

// Clear button
const clear_button = document.createElement("button");
clear_button.innerHTML = "CLEAR";
app.appendChild(clear_button);
clear_button.addEventListener("click", () => {
  clearDrawing();
  lines.splice(0, lines.length);
  current_line = null;
});

// Redo button
const redo_button = document.createElement("button");
redo_button.innerHTML = "REDO";
app.appendChild(redo_button);
redo_button.addEventListener("click", () => {
  if (redo_lines.length > 0) {
    const new_line: Point[] | undefined = redo_lines.pop();
    if (new_line != undefined) {
      lines.push(new_line);
      canvas.dispatchEvent(drawing_changed);
    }
  }
});

// Undo button
const undo_button = document.createElement("button");
undo_button.innerHTML = "UNDO";
app.appendChild(undo_button);
undo_button.addEventListener("click", () => {
  if (lines.length > 0) {
    const old_line: Point[] | undefined = lines.pop();
    if (old_line != undefined) {
      redo_lines.push(old_line);
      console.log(redo_lines)
      console.log("lines: ", lines)
      canvas.dispatchEvent(drawing_changed);
    }
  }
});

const APP_NAME = "Jack's Paint App";
title.textContent = APP_NAME;
document.title = APP_NAME;

function clearDrawing() {
  if (ctx != null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function addLine(e: MouseEvent) {
  if (current_line != null) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    current_line.push({ x: cursor.x, y: cursor.y });
    canvas.dispatchEvent(drawing_changed);
  }
}
