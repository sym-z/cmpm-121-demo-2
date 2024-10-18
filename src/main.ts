import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

// Makes the appending process into a loop.

// App title
const title = document.createElement("h1");
app.appendChild(title)

// Create drawing canvas
const canvas = document.createElement("canvas");
const WIDTH : number = 256;
const HEIGHT : number = 256;
canvas.width = WIDTH;
canvas.height = HEIGHT;
app.appendChild(canvas)
const ctx : CanvasRenderingContext2D | null = canvas.getContext("2d");

// Event Listeners
// Used the linked quant-paint.glitch.me/paint0.html to help
const cursor = {active: false, x: 0, y: 0};

canvas.addEventListener("mousedown", (e) => 
{
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
}
);

canvas.addEventListener("mousemove", (e) => 
{
    if(cursor.active && ctx != null)
        {
            ctx.beginPath();
            ctx.moveTo(cursor.x,cursor.y);
            ctx.lineTo(e.offsetX,e.offsetY);
            ctx.stroke();
            cursor.x = e.offsetX;
            cursor.y = e.offsetY;
        }
})

canvas.addEventListener("mouseup", (e) => 
{
    cursor.active = false;
})

// Clear button
const clear_button = document.createElement("button");
clear_button.innerHTML = "CLEAR";
app.appendChild(clear_button)
clear_button.addEventListener("click", () =>
{
    if(ctx != null)
    {
        ctx.clearRect(0,0,canvas.width, canvas.height)
    }
})


const APP_NAME = "Jack's Paint App";

title.textContent = APP_NAME;
document.title = APP_NAME;
