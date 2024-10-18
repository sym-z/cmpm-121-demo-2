import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

// Makes the appending process into a loop.
// Add app's elements as you go.
const PAGE : HTMLElement[] = [];

// App title
const title = document.createElement("h1");
PAGE.push(title);

// Create drawing canvas
const canvas = document.createElement("canvas");
const WIDTH : number = 256;
const HEIGHT : number = 256;
canvas.width = WIDTH;
canvas.height = HEIGHT;
PAGE.push(canvas)

const APP_NAME = "Jack's Paint App";

title.textContent = APP_NAME;
document.title = APP_NAME;

for(const element of PAGE)
    {
        app.appendChild(element)
    }