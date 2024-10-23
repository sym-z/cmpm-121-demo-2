import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

// App title
const title = document.createElement("h1");
app.appendChild(title);

const canvas = createCanvas();
// Line thickness of thin and thick markers
const THIN_DEF: number = 1;
const THICK_DEF: number = 5;
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
  isSticker: boolean = false;
  thickness: number = 5;
  symbol: string = "";
  constructor(start: Point, thick: number, isStick: boolean, sym: string) {
    this.points.push(start);
    this.thickness = thick;
    this.isSticker = isStick;
    this.symbol = sym;
  }

  display(ctx: CanvasRenderingContext2D, t: number) {
    const { x, y } = this.points[0];
    if (this.points.length > 1) {
      // Brace told me about lineWidth property
      ctx.lineWidth = t;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (const { x, y } of this.points) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      // If we are drawing a sticker, we only need to draw one point.
    } else if (this.isSticker) {
      ctx.font = STICKER_FONT;
      ctx.fillText(this.symbol, x + STICKER_OFFSET_X, y + STICKER_OFFSET_Y);
    }
  }
  drag(x: number, y: number) {
    if (this.isSticker) {
      this.points.splice(0, this.points.length);
    }
    this.points.push({ x: x, y: y });
  }
}
// Controls the icon that follows the mouse on the canvas.
const THICK_FONT: string = "48px monospace";
const THIN_FONT: string = "24px monospace";
const STICKER_FONT: string = "48px monospace";
let curr_font: string = "32px monospace";
// Pen offsets
const THIN_OFFSET_X: number = -6;
const THIN_OFFSET_Y: number = 12;
const THICK_OFFSET_X: number = -12;
const THICK_OFFSET_Y: number = 24;
// Sticker Placement offset
const STICKER_OFFSET_X: number = -32;
const STICKER_OFFSET_Y: number = 4;
// Mouse Icon offset
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
    ctx.fillText(curr_symbol, this.x + icon_offsetX, this.y + icon_offsetY);
  }
}
// Default value for the mouse's icon
let custom_mouse: MouseIcon | null = null;
// Default mouse Icon
let curr_symbol: string = "*";

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
  if (ctx != null && on_canvas && custom_mouse != null && on_canvas) {
    //Clear the canvas and redraw only current cursor postion
    canvas.dispatchEvent(drawing_changed);
    custom_mouse.draw(ctx);
  }
});
canvas.addEventListener("mousedown", (e) => {
  //create empty line
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
  curr_line = new Line({ x: cursor.x, y: cursor.y }, thickness, false, "");
  if (sticker_mode) {
    curr_line.isSticker = true;
    curr_line.symbol = curr_symbol;
  }
  //push into line array
  total_lines.push(curr_line);
  //empty redo's
  total_redo_lines.splice(0, total_redo_lines.length);
  cursor.active = true;
  canvas.dispatchEvent(drawing_changed);
});
canvas.addEventListener("mousemove", (e) => {
  if (ctx != null && on_canvas) {
    if (cursor.active && curr_line != null) {
      cursor.x = e.offsetX;
      cursor.y = e.offsetY;
      curr_line.drag(cursor.x, cursor.y);
      canvas.dispatchEvent(drawing_changed);
    } else {
      // Moving the mouse over the canvas while not drawing should redraw the icon
      custom_mouse = new MouseIcon(e.offsetX, e.offsetY, curr_symbol);
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
  custom_mouse = new MouseIcon(e.offsetX, e.offsetY, curr_symbol);
  canvas.dispatchEvent(tool_moved);
});

canvas.addEventListener("mouseout", () => {
  on_canvas = false;
  canvas.dispatchEvent(tool_moved);
});

makeDiv();

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

makeDiv();

// Markers and Tools
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
curr_font = THIN_FONT;
icon_offsetX = THIN_OFFSET_X;
icon_offsetY = THIN_OFFSET_Y;
// Acts as a pointer to allow for any amount of thickness buttons in the future.
let ACTIVE_BUTTON: HTMLElement = DEFAULT_BUTTON;
let sticker_mode: boolean = false;
// STICKERS
const sticker_box = [{ icon: "🍏" }, { icon: "🤠" }, { icon: "🐢" }];
for (const sticker of sticker_box) {
  makeSticker(sticker.icon);
}

makeDiv();


// Prompt button
const prompt_button = document.createElement("button");
prompt_button.innerHTML = "Click here to add a custom sticker!";
app.appendChild(prompt_button);
prompt_button.addEventListener("click", () => {
  const user_response : string | null = prompt("Please type custom emoji here!", "Custom Sticker")
  if(user_response != null)
    {
      makeSticker(user_response)
    }
});

makeDiv();

const APP_NAME = "Jack's Paint App";
title.textContent = APP_NAME;
document.title = APP_NAME;

function createCanvas() {
  // Create drawing canvas
  const canvas = document.createElement("canvas");
  const WIDTH: number = 256;
  const HEIGHT: number = 256;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  app.appendChild(canvas);
  return canvas;
}
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
function changeTool(tool: Marker) {
  thickness = tool.size;
  curr_font = tool.font;
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
