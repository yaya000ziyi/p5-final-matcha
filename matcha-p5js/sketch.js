//This project uses an Arduino as a data source, so if there is no real-time data from the Arduino in this p5.js link, my project may not display on your computer.🥲
//☺️ I recorded a screen video of all the code and the final display to demonstrate that it actually works, I put it on my notebook~


//welcome to "drink a green"!


// Declare "SerialPort"
let serial;
let latestData = "waiting for data";

let sensorValue = 0;
let smoothValue = 0;
let drinkAmount = 0; // 0 = Full, 1 = Drank a lot
let gradeLabel = "you";

let video;
let step = 2;
let k = 0.9;

let cupX, cupY, cupW, cupH;
let foamH, matchaH;
let videoX, videoY, videoW, videoH;

let floatingTexts = [];
let questionPool = [
  "Are u cool enough?",
  "Are u premium enough?",
  "Are u authentic enough?",
  "Are u healthy enough?",
  "Are u green enough?",
  "Are u ceremonial enough?",
  "Are u worthy enough?",
];
let lastDrinkAmount = 0;
let spawnThreshold = 0.05; // If the value changes beyond this point, text is generated. 0.25 requires many sips before the text appears; 0.015 is too sensitive; 0.05 is just right

function preload() {
  video = createCapture(VIDEO);
}

function setup() {
  createCanvas(640, 480);

  //I learned this section of code from this tutorial: Connecting p5 & Arduino through the serial port [https://www.youtube.com/watch?v=MtO1nDoM41Y&list=PLz7Njlcb6AObFGV3Iu8dyCLKGdpOqI5qg]
  //serial_comms_arduino_example: [https://editor.p5js.org/jesse_harding/sketches/93DuTsrh_]
  serial = new p5.SerialPort();
  serial.list();
  serial.open("/dev/tty.usbmodem48CA435A03082");
  serial.on("connected", serverConnected);
  serial.on("list", gotList);
  serial.on("data", gotData);
  serial.on("error", gotError);
  serial.on("open", gotOpen);
  serial.on("close", gotClose);

  video.size(640, 480);
  video.hide();
  video.volume(0);
  noStroke();

  cupW = 210;
  cupH = 290;
  cupX = width / 2 - cupW / 2;
  cupY = 130;

  foamH = 80;
  matchaH = cupH - foamH;

  videoX = cupX;
  videoY = cupY + foamH;
  videoW = cupW;
  videoH = matchaH;
}

function draw() {
  background(0);

  // use lerp to obtain a smoother value
  smoothValue = lerp(smoothValue, sensorValue, 0.1);

  // Based on the data range from my Arduino pressure sensor test:
  // 3/4 of a cup is approximately 500–600, decreasing by 60–80 with each sip，so 450 is almost for start and 100 is good for almost finished.
  drinkAmount = map(smoothValue, 450, 100, 0, 1, true);

  //text(latestData, 50, 50);

  //Generate floating text when there is a significant change in drinkAmount
  if (abs(drinkAmount - lastDrinkAmount) > spawnThreshold) {
    let a = floor(random(1, 3)); // Control: 1–2 lines per time
    for (let i = 0; i < a; i++) {
      floatingText();
    }
    lastDrinkAmount = drinkAmount;
  }

  //critical part：The amount consumed results in varying degrees of labeling
  if (drinkAmount < 0.25) {
    gradeLabel = "Casual Matcha Consumer";
  } else if (drinkAmount < 0.5) {
    gradeLabel = "Premium Matcha Consumer";
  } else if (drinkAmount < 0.75) {
    gradeLabel = "Ceremonial Matcha Consumer";
  } else {
    gradeLabel = "Authenticity Verified";
  }

  fill(255);
  textSize(10);
  textAlign(LEFT);
  text("Matcha data: " + latestData, 30, 350);
  text("Grade: " + gradeLabel, 30, 365);

  // Control k(the level of distortion) using Arduino data
  let baseK = map(drinkAmount, 0, 1, 0.08, 0.28);

  k = baseK + sin(frameCount * 0.2) * 0.03;

  step = floor(map(drinkAmount, 0, 1, 1, 18));

  drawScene();
  drawVideoInMatchaArea(); // // Make the video fit within the matcha-colored area~

  updateFloatingTexts();
  displayFloatingTexts();

  // straw
  push();
  translate(cupX + 200, cupY - 80);
  rotate(radians(15));
  fill(255, 255, 255, 40);
  rect(0, 0, 15, 380);
  pop();

  // ice
  push();
  translate(cupX + 50, matchaH - 20);
  rotate(radians(40));
  fill(255, 255, 255, 80);
  rect(0, 0, 60, 60);
  pop();

  push();
  translate(cupX + 100, matchaH);
  rotate(radians(15));
  fill(255, 255, 255, 80);
  rect(0, 0, 60, 60);
  pop();

  // drawCupOverlay();
}

//The following section covers reading from and connecting to the Arduino serial port.
function serverConnected() {
  print("Connected to Server");
}

// Got the list of ports
function gotList(thelist) {
  print("List of Serial Ports:");
  for (let i = 0; i < thelist.length; i++) {
    print(i + " " + thelist[i]);
  }
}

function gotOpen() {
  print("Serial Port is Open");
}

function gotClose() {
  print("Serial Port is Closed");
  latestData = "Serial Port is Closed";
}

// print error to console
function gotError(theerror) {
  print(theerror);
}

function gotData() {
  let currentString = serial.readLine();
  currentString = trim(currentString);
  if (!currentString) return;

  let val = Number(currentString);
  if (!isNaN(val)) {
    sensorValue = val;
    latestData = val;
  }
}

// got raw from the serial port
function gotRawData(thedata) {
  print("gotRawData" + thedata);
}

//visual setup
function drawScene() {
  fill(136, 117, 158);
  rect(0, 395, width, height - 395);

  drawTray();

  fill(235, 235, 235);
  rect(cupX, cupY, cupW, foamH);

  fill(185, 211, 105);
  rect(cupX, cupY + foamH, cupW, matchaH);
}

function drawTray() {
  // Draw a silver gradient effect on the bottom of the cup
  for (let i = 0; i < cupW; i++) {
    let amt = map(i, 0, cupW, 0, 1);

    let distanceToCenter = abs(amt - 0.5);
    let c = map(distanceToCenter, 0, 0.5, 235, 170);

    stroke(c);
    line(cupX + i, cupY + cupH, cupX + i, cupY + cupH + 18);
  }
  noStroke();
}

function drawVideoInMatchaArea() {
  video.loadPixels();

  // Set the center of the barrel distortion to the “center of the video area”
  let cx = videoX + videoW / 2;
  let cy = videoY + videoH / 2;

  let maxR = dist(videoX, videoY, cx, cy);

  //Control the area of the live webcam so that it loops only within the green area, without filling the entire canvas~
  for (let y = videoY; y < videoY + videoH; y += step) {
    for (let x = videoX; x < videoX + videoW; x += step) {
      let dx = x - cx;
      let dy = y - cy;

      let dr = dist(x, y, cx, cy);
      let rn = dr / maxR;

      // barrel distortion!!!
      //The code section here includes more detailed annotations and a step-by-step notes wroten by myself: [https://editor.p5js.org/ziyiwang603/sketches/mBtHutwps]
      let factor = 1 + k * rn * rn;

      // Determine the sampling position
      let srcX = cx + dx / factor;
      let srcY = cy + dy / factor;

      // Map canvas coordinates back to video coordinates
      let videoSX = map(srcX, videoX, videoX + videoW, 0, video.width - 1);
      let videoSY = map(srcY, videoY, videoY + videoH, 0, video.height - 1);

      let ix = floor(videoSX);
      let iy = floor(videoSY);

      let index = (iy * video.width + ix) * 4;

      let r = video.pixels[index + 0];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];

      // // Matcha color filter
      let matchaR = 145;
      let matchaG = 190;
      let matchaB = 110;
      let tintAmount = map(drinkAmount, 0, 1, 0.35, 0.9); // Arduino data control

      r = lerp(r, matchaR, tintAmount);
      g = lerp(g, matchaG, tintAmount);
      b = lerp(b, matchaB, tintAmount);

      fill(r, g, b);
      rect(x, y, step, step);
    }
  }

  for (let i = 0; i < videoH; i++) {
    let amt = map(i, 0, videoH, 0, 1);

    let r = lerp(255, 185, amt);
    let g = lerp(255, 211, amt);
    let b = lerp(255, 105, amt);

    stroke(r, g, b, 40);
    line(videoX, videoY + videoH - i, videoX + videoW, videoY + videoH - i);
  }
  noStroke();
}

/*function drawCupOverlay() {
  fill(255, 255, 255, 28);
  rect(cupX, cupY, cupW, cupH);

  fill(255, 255, 255, 35);
  rect(cupX + 8, cupY + 10, 10, cupH - 20);
}*/

function floatingText() {
  let txt = random(questionPool);

  //Generate problems text near the “liquid surface”
  let spawnX = random(videoX + 20, videoX + videoW - 20);
  let spawnY = videoY + random(-5, 10);

  let t = {
    text: txt,
    x: spawnX,
    y: spawnY,
    vx: random(-0.7, 0.7),
    vy: random(-1.4, -0.5),
    alpha: random(160, 255),
    size: random(16, 25),
    fade: random(1.0, 2.2),
  };

  floatingTexts.push(t);
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let t = floatingTexts[i];

    t.x += t.vx;
    t.y += t.vy;
    t.alpha -= t.fade;

    if (t.alpha <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

function displayFloatingTexts() {
  textAlign(CENTER, CENTER);
  textFont("Georgia");
  noStroke();

  for (let t of floatingTexts) {
    // Make the color lighter and more grayish
    let gray = map(t.alpha, 0, 255, 120, 255);
    fill(gray, gray, gray, t.alpha);
    textSize(t.size);
    text(t.text, t.x, t.y);
  }
}
