import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

// App title
const title = document.createElement("h1");
app.appendChild(title);

// Create drawing canvas
const canvas = document.createElement("canvas");
const WIDTH: number = 256;
const HEIGHT: number = 256;
const THIN_DEF: number = 1;
const THICK_DEF: number = 5;
canvas.width = WIDTH;
canvas.height = HEIGHT;
app.appendChild(canvas);
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
let thickness: number = THIN_DEF;
const drawing_changed: MouseEvent = new MouseEvent("drawing_changed");
interface Point {
  x: number;
  y: number;
}
class Line {
  points: Point[] = []
  thickness: number = 5
  constructor(start: Point, thick: number) {
    this.points.push(start)
    this.thickness = thick;
  }

  display(ctx: CanvasRenderingContext2D, t: number) {
    if (this.points.length > 1) {
      // Brace told me about lineWidth property
      ctx.lineWidth = t;
      ctx.beginPath();
      const { x, y } = this.points[0];
      ctx.moveTo(x, y);
      for (const { x, y } of this.points) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
// For new object
const total_lines: Line[] = [];
const total_redo_lines: Line[] = [];
let curr_line: Line | null = null;

// Event Listeners
// Used the linked quant-paint.glitch.me/paint0.html and paint1.hmtl to help
const cursor = { active: false, x: 0, y: 0 };

// Major help from the paint1.html example
canvas.addEventListener("drawing_changed", () => {
  if (ctx != null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of total_lines) {
      line.display(ctx, line.thickness)
    }
  }
});
canvas.addEventListener("mousedown", (e) => {
  //create empty line
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  curr_line = new Line({ x: cursor.x, y: cursor.y }, thickness);
  //push into line array
  total_lines.push(curr_line)
  //empty redo's
  total_redo_lines.splice(0, total_redo_lines.length);
  cursor.active = true;
  canvas.dispatchEvent(drawing_changed);
});
canvas.addEventListener("mousemove", (e) => {
  if (cursor.active && ctx != null) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    curr_line?.points.push({ x: cursor.x, y: cursor.y });
    canvas.dispatchEvent(drawing_changed);
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
  total_lines.splice(0, total_lines.length);
  curr_line = null;
});

// Redo button
const redo_button = document.createElement("button");
redo_button.innerHTML = "REDO";
app.appendChild(redo_button);
redo_button.addEventListener("click", () => {
  if (total_redo_lines.length > 0) {
    const new_line: Line | undefined = total_redo_lines.pop();
    if (new_line != undefined) {
      total_lines.push(new_line);
      canvas.dispatchEvent(drawing_changed);
    }
  }
});

// Undo button
const undo_button = document.createElement("button");
undo_button.innerHTML = "UNDO";
app.appendChild(undo_button);
undo_button.addEventListener("click", () => {
  if (total_lines.length > 0) {
    const old_line: Line | undefined = total_lines.pop();
    if (old_line != undefined) {
      total_redo_lines.push(old_line);
      canvas.dispatchEvent(drawing_changed);
    }
  }
});

// Div
const divider2 = document.createElement("div");
app.appendChild(divider2);

// Thin button
const thin_button = document.createElement("button");
thin_button.innerHTML = "THIN";
thin_button.classList.toggle("active")
app.appendChild(thin_button);
thin_button.addEventListener("click", () => {
  thickness = THIN_DEF;
  switch_button(thin_button)
});

// Thick button
const thick_button = document.createElement("button");
thick_button.innerHTML = "THICK";
app.appendChild(thick_button);
thick_button.addEventListener("click", () => {
  switch_button(thick_button)
  thickness = THICK_DEF;
});

// Acts as a pointer to allow for any amount of thickness buttons in the future.
let ACTIVE_BUTTON: HTMLElement = thin_button;

const APP_NAME = "Jack's Paint App";
title.textContent = APP_NAME;
document.title = APP_NAME;

function clearDrawing() {
  if (ctx != null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
function switch_button(button: HTMLElement) {
  if (button.classList.contains("active") == false) {
    button.classList.toggle("active");
    ACTIVE_BUTTON.classList.toggle("active");
    ACTIVE_BUTTON = button
  }
}