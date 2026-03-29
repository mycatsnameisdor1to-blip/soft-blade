let img;
let points = [];

let silhouette;
let ghosts = [];

let buffer;
let trailBuffer;

let myFont;

let t = 0;

let tracks = [
  "ZERKALO",
  "LAURA",
  "PESHYA VOLCHONKA",
  "UNTITLED28",
  "INTRO",
];

let trackStates = []; // состояние свечения треков
let wavePoints = [];  // глобальный массив средней волны
let cursorTrail = []; // для линии от мыши

let grainBuffer;

function preload() {
  silhouette = loadImage('silhouette.png');
  myFont = loadFont('Director-Regular.otf');
}

function setup() {
  createCanvas(1140, 1600);
  pixelDensity(1);

  baseX = width * 0.75;
  baseY = height * 0.55;

  buffer = createGraphics(width, height);
  trailBuffer = createGraphics(width, height);

  // фоновые призраки силуэта
  for (let i = 0; i < 3; i++) {
    ghosts.push({
      phase: random(TWO_PI),
      offsetX: random(-60, 60),
      offsetY: random(-40, 40),
      scale: random(1.1, 1.1)
    });
  }

  // инициализация свечения треков
  trackStates = tracks.map(() => 0);
  
  grainBuffer = createGraphics(width, height);
grainBuffer.loadPixels();

for (let x = 0; x < width; x++) {
  for (let y = 0; y < height; y++) {

    let i = (x + y * width) * 4;

    let n = random(255);

    grainBuffer.pixels[i] = n;
    grainBuffer.pixels[i + 1] = n;
    grainBuffer.pixels[i + 2] = n;
    grainBuffer.pixels[i + 3] = 10; // прозрачность зерна
  }
}

grainBuffer.updatePixels();
}

function drawSpacedLine(str, y, spacing) {
    let totalWidth = (str.length - 1) * spacing;
    let startX = width/2 - totalWidth/2;
    for (let i = 0; i < str.length; i++) {
      // glowText
      let pulse = sin(frameCount * 0.02) * 0.5 + 0.5;
      fill(220, 230, 255, 30 * pulse);
      text(str[i], startX + i * spacing + 1, y + 1);
      fill(220, 230, 255, 160 + pulse * 40);
      text(str[i], startX + i * spacing, y);
    }
  }

function draw() {
  background('#0b0c10');

  // (фоновый силуэт)

buffer.clear();

let cx = width * 0.5;
let cy = height * 0.7;

buffer.imageMode(CENTER);

for (let g of ghosts) {

  let phase = t * 0.6 + g.phase;

  let alpha = map(sin(phase), -1, 1, 80, 160);

  let scalePulse = 1 + sin(phase) * 0.04;

  let driftX = sin(t * 0.15 + g.phase) * 30;
  let driftY = cos(t * 0.12 + g.phase) * 18;

  let w = silhouette.width * g.scale * scalePulse * 2.2;
  let h = silhouette.height * g.scale * scalePulse * 2.2;

  buffer.push();
  buffer.translate(
    cx + g.offsetX + driftX,
    cy + g.offsetY + driftY
  );

  // свечение
  buffer.tint(160, 180, 220, alpha * 0.25);
  buffer.image(silhouette, 0, 0, w * 1.08, h * 1.08);

  // основная форма
 buffer.tint(200, 210, 235, alpha * 0.6);
buffer.image(silhouette, 0, 0, w, h);

  buffer.pop();
  
  tint(255, 180);
  image(buffer, 0, 0);
  // текстура поверх силуэта
blendMode(OVERLAY);
image(grainBuffer, 0, 0);
blendMode(BLEND);
  noTint();

  blendMode(MULTIPLY);
  // затемнение снизу (имитация fade)
  push();
  noStroke();

  for (let y = height * 0.55; y < height; y += 4) {

  let alpha = map(y, height * 0.55, height, 0, 180);

  fill(11, 12, 16, alpha);
  rect(0, y, width, 4);
}
pop();
  blendMode(BLEND);
  
  

  // (нижняя волна)

  push();
  let baseY = height * 0.82;
  let layers = 6;
  let spacing = 10;
  stroke(220, 230, 255, 90);
  strokeWeight(0.8);
  noFill();
  wavePoints = [];

  for (let l = 0; l < layers; l++) {
    beginShape();
    let layerOffset = (l - layers/2) * spacing;
    for (let x = 0; x <= width; x += 18) {
      let nx = x * 0.004;
      let envelope = noise(nx * 0.5, l * 10) * 60;
      let breath = 0.8 + 0.2 * sin(frameCount * 0.01 + l);
      let y = baseY + layerOffset + sin(x * 0.008 + t * 0.5 + l) * envelope * breath
        + cos(x * 0.003 + t * 0.3) * 20 + (noise(nx, t + l * 20) - 0.5) * 25;
      curveVertex(x, y);
      if (l === floor(layers/2)) wavePoints.push({x, y});
    }
    endShape();
  }

  // штрихи на волне
  for (let p of wavePoints) {
    if (random() < 0.4) continue;
    let nx = p.x * 0.01;
    let ny = p.y * 0.01;
    let flowX = (noise(nx, ny, t) - 0.5) * 8;
    let flowY = (noise(nx + 100, ny + 100, t) - 0.5) * 8;
    let x = p.x + flowX * 0.3;
    let y = p.y + flowY * 0.3;
    line(x - 2, y, x + 2, y);
  }
  pop();

  
  // (трек-лист текстово + подсветка при наведении)

  textSize(14);
  textFont(myFont);
  textAlign(CENTER, CENTER);
  noStroke();

  for (let i = 0; i < tracks.length; i++) {
    let index = floor(map(i, 0, tracks.length - 1, 50, wavePoints.length - 50));
    index = constrain(index, 0, wavePoints.length - 1);
    let p = wavePoints[index];
    if (!p) continue;

    let drift = sin(frameCount * 0.015 + i) * 6;

    // расстояние от мыши > > яркость
    let d = dist(mouseX, mouseY, p.x, p.y - 25);
    let glow = map(d, 0, 100, 1, 0, true);

    // мягкое свечение
    fill(220, 230, 255, 60 * glow);
    text(tracks[i], p.x + 1, p.y - 25 + drift + 1);

    // основной слой текста
    fill(220, 230, 255, 140 + glow * 120);
    text(tracks[i], p.x, p.y - 25 + drift);
  }


  // (статичная типографика)

  textFont(myFont);
  textAlign(CENTER);

  fill(200, 200, 210, 160);
  textSize(22);
  drawSpacedLine("EP                                         ZERKALO", 126, 17);
  drawSpacedLine("RELEASED             FEBRUARY 18,             2018", 445, 17);
  drawSpacedLine("ALL TRACKS   WRITTEN, PRODUCED & MIXED   BY VIOLET", 475, 17);
  drawSpacedLine("SOFT                                         BLADE", 925, 17);


  // (сетка из +)

  push();
  textFont(myFont);
  textAlign(CENTER, CENTER);
  textSize(30);
  let topMargin = 120;
  let bottomMargin = 120;
  let stepY = 160;
  let cols = [width * 0.12, width * 0.5, width * 0.88];
  let drift = sin(frameCount * 0.03) * 2;

  for (let x of cols) {
    for (let y = topMargin; y < height - bottomMargin; y += stepY) {
      let d = dist(mouseX, mouseY, x, y);
      let alphaBoost = map(d, 0, 150, 80, 0, true);
      let pulse = sin(frameCount * 0.02 + x*0.01) * 10;
      fill(180, 190, 210, 60 + alphaBoost + pulse);
      text("+", x, y + drift);
    }
  }
  pop();
  
   // (фоновый градиент слева)

  let ctx = drawingContext;

let grad = ctx.createLinearGradient(0, 0, width * 0.35, 0);

grad.addColorStop(0, "rgba(255,255,255,0.04)");
grad.addColorStop(0.3, "rgba(255,255,255,0.02)");
grad.addColorStop(1, "rgba(255,255,255,0)");

ctx.fillStyle = grad;
ctx.fillRect(0, 0, width * 0.45, height);
  
  // (анимация линии от курсора)

  cursorTrail.push({x: mouseX, y: mouseY, alpha: 255});
  for (let i = cursorTrail.length-1; i >= 0; i--) {
    let p = cursorTrail[i];
    p.alpha -= 6; // растворение
    if (p.alpha <= 0) cursorTrail.splice(i, 1);
  }

  noFill();
  stroke(220, 230, 255, 90);
  strokeWeight(1);
  beginShape();
  for (let p of cursorTrail) {
    curveVertex(p.x, p.y);
  }
  endShape();

  t += 0.01;
}
}