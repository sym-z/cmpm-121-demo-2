import "./style.css";
import { createCanvas } from "./utilities.ts";

// We assume that index.html offers a div that id == 'app'
const app = document.querySelector<HTMLDivElement>("#app")!;

// App title
const title = document.createElement("h1");
app.appendChild(title);

// Export button
const exportButton = document.createElement("button");
exportButton.innerHTML = "EXPORT";
app.appendChild(exportButton);
exportButton.addEventListener("click", () => {
  const big_canvas = document.createElement("canvas");
  //4x Larger Canvas
  big_canvas.width = 1024;
  big_canvas.height = 1024;
  app.appendChild(big_canvas);
  const ctx2 = big_canvas.getContext("2d");
  if (ctx2 != null) {
    //4x Larger Canvas
    ctx2.scale(4, 4);
    for (const line of total_lines) {
      line.display(ctx2, currThickness);

      //save drawings
      saveJSON();
    }
    // Export code given by Professor Smith
    const anchor = document.createElement("a");
    anchor.href = big_canvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();
    big_canvas.remove();
  }
});

function saveJSON(){
  const json = JSON.stringify(total_lines);
  localStorage.setItem("lines", json);
}

//load from json button
const loadButton = document.createElement("button");
loadButton.innerHTML = "LOAD";
loadButton.title = "Load last exported drawing";
app.appendChild(loadButton);
loadButton.addEventListener("click", () => {
  const savedLines = localStorage.getItem("lines");
  if (savedLines) {
    const parsedLines = JSON.parse(savedLines);
    total_lines.length = 0; // Clear the current lines
    parsedLines.forEach((line: any) => {
      total_lines.push(new LineCommand(line.points, line.thickness, line.isSticker, line.symbol, line.color, line.rotation));
    });
    canvas.dispatchEvent(new CustomEvent("drawing_changed"));
  }
});

makeDiv();

// THE DRAWING CANVAS
const canvas = createCanvas();
app.appendChild(canvas);
const ctx = canvas.getContext("2d")!;

const drawing_changed = new MouseEvent("drawing_changed");

// Line thickness of thin and thick markers
const THIN_DEF = 2;
const THICK_DEF = 8;
let currThickness = THIN_DEF;

const DEFAULT_COLOR: string = "rgb(0,0,0)";
let currColor: string = DEFAULT_COLOR;

let currRotation: number = 0;

interface Point {
  x: number;
  y: number;
}
// LINES AND STICKERS
interface Drawable {
  draw(ctx: CanvasRenderingContext2D): void;
}

class LineCommand {
  thickness: number = 5;
  symbol: string = "";
  color: string = DEFAULT_COLOR;
  rotation: number = 0;
  constructor(
    private points: Point[],
    private thick: number,
    private isSticker: boolean,
    sym: string,
    col: string,
    rot: number
  ) {
    this.thickness = thick;
    this.symbol = sym;
    this.color = col;
    this.rotation = rot;
  }

  toJSON(){
    return {
      points: this.points,
      thickness: this.thickness,
      isSticker: this.isSticker,
      symbol: this.symbol,
      color: this.color,
      rotation: this.rotation
    }
  }

  display(ctx: CanvasRenderingContext2D, thickness: number) {
    const { x, y } = this.points[0];
    if (this.points.length > 1) {
      // Brace told me about lineWidth property
      ctx.strokeStyle = this.color;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (const { x, y } of this.points) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      // If we are drawing a sticker, we only need to draw one point.
    } else if (this.isSticker) {
      rotateAtPoint(ctx, x, y, this.symbol, this.rotation);
    }
  }
  // If we are dragging a sticker, do not preserve the history
  drag(x: number, y: number) {
    if (this.isSticker) {
      this.points.splice(0, this.points.length);
    }
    this.points.push({ x: x, y: y });
  }
}
// MOUSE TOOLTIP
// Controls the icon that follows the mouse on the canvas.
const THICK_FONT: string = "48px monospace";
const THIN_FONT: string = "24px monospace";
const STICKER_FONT: string = "32px monospace";
let currFont: string = "32px monospace";
// Pen offsets
const THIN_OFFSET_X: number = -6;
const THIN_OFFSET_Y: number = 12;
const THICK_OFFSET_X: number = -12;
const THICK_OFFSET_Y: number = 24;
// Sticker Placement offset
const STICKER_OFFSET_X: number = -22;
const STICKER_OFFSET_Y: number = 4;
// Mouse Icon offset
let icon_offsetX: number = -8;
let icon_offsetY: number = 16;

// The Tooltip
class MouseIcon {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly symbol: string
  ) {}
  draw(ctx: CanvasRenderingContext2D) {
    ctx.font = currFont;
    if (sticker_mode) {
      rotateAtPoint(ctx, this.x, this.y, this.symbol, currRotation);
    } else {
      ctx.fillStyle = currColor;
      ctx.fillText(curr_symbol, this.x + icon_offsetX, this.y + icon_offsetY);
    }
  }
}
// Default value for the mouse's icon
const blankMouse: Drawable = { draw(_ctx: CanvasRenderingContext2D) {} };
let custom_mouse: Drawable = blankMouse;
// Default mouse Icon
let curr_symbol: string = "*";

// Holds line commands
const total_lines: LineCommand[] = [];
const total_redo_lines: LineCommand[] = [];
let curr_line = new LineCommand([], 0, false, "", DEFAULT_COLOR, 0);

// Event Listeners
// Used the linked quant-paint.glitch.me/paint0.html and paint1.hmtl to help
const cursor = { active: false, x: 0, y: 0 };

// CUSTOM MOUSE EVENTS
// Major help from the paint1.html example
canvas.addEventListener("drawing_changed", () => {
  clearDrawing();
  for (const line of total_lines) {
    line.display(ctx, line.thickness);
  }
  //Clear the canvas and redraw only current cursor postion
  custom_mouse.draw(ctx);
});

// DEFAULT MOUSE EVENTS
canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  if (sticker_mode) {
    curr_line = new LineCommand(
      [{ x: cursor.x, y: cursor.y }],
      currThickness,
      true,
      curr_symbol,
      DEFAULT_COLOR,
      currRotation
    );
  } else {
    curr_line = new LineCommand(
      [{ x: cursor.x, y: cursor.y }],
      currThickness,
      false,
      "",
      currColor,
      0
    );
  }
  //push into line array
  total_lines.push(curr_line);
  //empty redo's
  total_redo_lines.splice(0, total_redo_lines.length);
  canvas.dispatchEvent(drawing_changed);
});
canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  if (cursor.active) {
    curr_line.drag(cursor.x, cursor.y);
  }
  // Moving the mouse over the canvas while not drawing should redraw the icon
  custom_mouse = new MouseIcon(e.offsetX, e.offsetY, curr_symbol);
  canvas.dispatchEvent(drawing_changed);
});
canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

// Borders of Canvas

canvas.addEventListener("mouseenter", (e) => {
  custom_mouse = new MouseIcon(e.offsetX, e.offsetY, curr_symbol);
  canvas.dispatchEvent(drawing_changed);
});

canvas.addEventListener("mouseout", () => {
  cursor.active = false;
  custom_mouse = blankMouse;
  canvas.dispatchEvent(drawing_changed);
});

makeDiv();

// IMAGE EDITING BUTTONS
// Clear button
const clearButton = document.createElement("button");
clearButton.innerHTML = "CLEAR";
app.appendChild(clearButton);
clearButton.addEventListener("click", () => {
  clearDrawing();
  total_lines.splice(0, total_lines.length);
});

// Redo button
const redoButton = document.createElement("button");
redoButton.innerHTML = "REDO";
app.appendChild(redoButton);
redoButton.addEventListener("click", () => {
  if (total_redo_lines) {
    total_lines.push(total_redo_lines.pop()!);
    canvas.dispatchEvent(drawing_changed);
  }
});

// Undo button
const undoButton = document.createElement("button");
undoButton.innerHTML = "UNDO";
app.appendChild(undoButton);
undoButton.addEventListener("click", () => {
  if (total_lines) {
    total_redo_lines.push(total_lines.pop()!);
    canvas.dispatchEvent(drawing_changed);
  }
});

makeDiv();

// MARKERS AND TOOLS
interface Marker {
  size: number;
  font: string;
  offsetX: number;
  offsetY: number;
}
// A reference to thin button is saved to activate it by default
const DEFAULT_BUTTON = makePen(
  "THIN",
  THIN_DEF,
  THIN_FONT,
  THIN_OFFSET_X,
  THIN_OFFSET_Y
);

makePen("THICK", THICK_DEF, THICK_FONT, THICK_OFFSET_X, THICK_OFFSET_Y);

makeDiv();

// Set the default tool set up
DEFAULT_BUTTON.classList.toggle("active");
currFont = THIN_FONT;
icon_offsetX = THIN_OFFSET_X;
icon_offsetY = THIN_OFFSET_Y;
// Acts as a pointer to allow for any amount of thickness buttons in the future.
let ACTIVE_BUTTON: HTMLElement = DEFAULT_BUTTON;
let sticker_mode: boolean = false;

// Prompt button
const prompt_button = document.createElement("button");
prompt_button.innerHTML = "Click here to add a custom sticker!";
app.appendChild(prompt_button);
prompt_button.addEventListener("click", () => {
  const user_response =
    prompt("Please type custom emoji here!", "Custom Sticker") || "#";
  makeSticker(user_response);
});

makeDiv();
// STICKERS
const sticker_box = [
  { icon: "🍏" },
  { icon: "🤠" },
  { icon: "🐢" },
  { icon: "🥴" },
  { icon: "👒" },
];
for (const sticker of sticker_box) {
  makeSticker(sticker.icon);
}

const APP_NAME = "Jack's Paint App";
title.textContent = APP_NAME;
document.title = APP_NAME;

function clearDrawing() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function switchButton(button: HTMLElement) {
  if (button.classList.contains("active") == false) {
    button.classList.toggle("active");
    ACTIVE_BUTTON.classList.toggle("active");
    ACTIVE_BUTTON = button;
  }
}
function changeTool(tool: Marker) {
  currColor = randColor();
  currRotation = randAngle();
  currThickness = tool.size;
  currFont = tool.font;
  icon_offsetX = tool.offsetX;
  icon_offsetY = tool.offsetY;
}
function makeDiv() {
  const divider = document.createElement("div");
  app.appendChild(divider);
}

function makeSticker(icon: string) {
  const button = document.createElement("button");
  button.innerHTML = icon;
  app.appendChild(button);
  button.addEventListener("click", () => {
    sticker_mode = true;
    curr_symbol = icon;
    changeTool(makeMarker(0, STICKER_FONT, STICKER_OFFSET_X, STICKER_OFFSET_Y));
    switchButton(button);
  });
}
function makePen(
  innerText: string,
  size: number,
  font: string,
  offsetX: number,
  offsetY: number
) {
  const button = document.createElement("button");
  button.innerHTML = innerText;
  app.appendChild(button);
  button.addEventListener("click", () => {
    sticker_mode = false;
    curr_symbol = "*";
    changeTool(makeMarker(size, font, offsetX, offsetY));
    switchButton(button);
  });
  return button;
}
function makeMarker(
  size: number,
  font: string,
  offsetX: number,
  offsetY: number
) {
  const mark: Marker = {
    size: size,
    font: font,
    offsetX: offsetX,
    offsetY: offsetY,
  };
  return mark;
}
// Returns a random rgb string
// Brace helped with understanding the Math.random() function
function randColor(): string {
  const max_byte = 256;
  const r = Math.floor(Math.random() * max_byte);
  const g = Math.floor(Math.random() * max_byte);
  const b = Math.floor(Math.random() * max_byte);
  return `rgb(${r},${g},${b})`;
}
function randAngle(): number {
  return Math.random() * 360;
}
// Brace helped heavily when figuring out how to deal with how to properly rotate the stickers in accordance with their origins
function rotateAtPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  symbol: string,
  rotation: number
) {
  ctx.save();
  // Translate to the sticker's center
  ctx.translate(x, y);
  // Rotate the canvas around the sticker's center
  ctx.rotate((rotation * Math.PI) / 180);
  // Draw the sticker symbol, adjusting offsets for proper centering
  ctx.font = STICKER_FONT;
  ctx.fillText(symbol, STICKER_OFFSET_X, STICKER_OFFSET_Y);
  // Restore the canvas state after transformations
  ctx.restore();
}
