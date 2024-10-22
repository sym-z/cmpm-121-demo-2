import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

// App title
const title = document.createElement("h1");
app.appendChild(title);

// Create drawing canvas
const canvas = document.createElement("canvas");
const WIDTH: number = 256;
const HEIGHT: number = 256;
// Line thickness of thin and thick markers
const THIN_DEF: number = 1;
const THICK_DEF: number = 5;
canvas.width = WIDTH;
canvas.height = HEIGHT;
app.appendChild(canvas);
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
let thickness: number = THIN_DEF;
const drawing_changed: MouseEvent = new MouseEvent("drawing_changed");
const tool_moved: MouseEvent = new MouseEvent("tool_moved");
interface Point {
  x: number;
  y: number;
}
class Line {
  points: Point[] = [];
  thickness: number = 5;
  constructor(start: Point, thick: number) {
    this.points.push(start);
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
// Controls the icon that follows the mouse on the canvas.
const THICK_FONT: string = "48px monospace";
const THIN_FONT: string = "16px monospace";
let curr_font: string = "32px monospace";
const THIN_OFFSET_X: number = -4;
const THIN_OFFSET_Y: number = 8;
const THICK_OFFSET_X: number = -12;
const THICK_OFFSET_Y: number = 24;
let icon_offsetX: number = -8;
let icon_offsetY: number = 16;
class MouseIcon {
  x: number = 0;
  y: number = 0;
  symbol: string = "";
  constructor(x: number, y: number, sym: string) {
    this.x = x;
    this.y = y;
    this.symbol = sym;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = curr_font;
    ctx.fillText("*", this.x + icon_offsetX, this.y + icon_offsetY);
  }
}
// Default value for the mouse's icon
let custom_mouse: MouseIcon | null = null;

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
    clearDrawing();
    for (const line of total_lines) {
      line.display(ctx, line.thickness);
    }
  }
});
canvas.addEventListener("tool_moved", () => {
  if (ctx != null && on_canvas && custom_mouse != null) {
      //Clear the canvas and redraw only current cursor postion
      canvas.dispatchEvent(drawing_changed);
      custom_mouse.draw(ctx);
  }
});
canvas.addEventListener("mousedown", (e) => {
  //create empty line
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  curr_line = new Line({ x: cursor.x, y: cursor.y }, thickness);
  //push into line array
  total_lines.push(curr_line);
  //empty redo's
  total_redo_lines.splice(0, total_redo_lines.length);
  cursor.active = true;
  canvas.dispatchEvent(drawing_changed);
});
canvas.addEventListener("mousemove", (e) => {
  if (ctx != null) {
    if (cursor.active) {
      cursor.x = e.offsetX;
      cursor.y = e.offsetY;
      curr_line?.points.push({ x: cursor.x, y: cursor.y });
      canvas.dispatchEvent(drawing_changed);
    } else {
      custom_mouse = new MouseIcon(e.offsetX, e.offsetY, "*");
      canvas.dispatchEvent(tool_moved);
    }
  }
});
canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

let on_canvas: boolean = false;
canvas.addEventListener("mouseenter", (e) => {
  on_canvas = true;
  custom_mouse = new MouseIcon(e.offsetX, e.offsetY, "*");
  canvas.dispatchEvent(tool_moved);
});

canvas.addEventListener("mouseout", () => {
  on_canvas = false;
  canvas.dispatchEvent(tool_moved);
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

// Markers and Tools
interface Marker
{
  size: number;
  font: string;
  offsetX: number;
  offsetY: number;
}
const THICK_PEN : Marker = {size:THICK_DEF,font:THICK_FONT,offsetX:THICK_OFFSET_X,offsetY:THICK_OFFSET_Y}
const THIN_PEN : Marker = {size:THIN_DEF,font:THIN_FONT,offsetX:THIN_OFFSET_X,offsetY:THIN_OFFSET_Y}

// Thin button
const thin_button = document.createElement("button");
thin_button.innerHTML = "THIN";
// Set the default tool to be the thin marker
thin_button.classList.toggle("active");
curr_font = THIN_FONT;
icon_offsetX = THIN_OFFSET_X;
icon_offsetY = THIN_OFFSET_Y;
app.appendChild(thin_button);
thin_button.addEventListener("click", () => {
  changeTool(THIN_PEN)
  switchButton(thin_button);
});

// Thick button
const thick_button = document.createElement("button");
thick_button.innerHTML = "THICK";
app.appendChild(thick_button);
thick_button.addEventListener("click", () => {
  changeTool(THICK_PEN)
  switchButton(thick_button);
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
function switchButton(button: HTMLElement) {
  if (button.classList.contains("active") == false) {
    button.classList.toggle("active");
    ACTIVE_BUTTON.classList.toggle("active");
    ACTIVE_BUTTON = button;
  }
}
function changeTool(tool:Marker)
{
  thickness = tool.size;
  curr_font = tool.font;
  icon_offsetX = tool.offsetX;
  icon_offsetY = tool.offsetY;
}