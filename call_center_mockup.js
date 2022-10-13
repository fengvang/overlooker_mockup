p5.disableFriendlyErrors = true; // Helps with perf on deployed webpage; disable when working on code.
let boolWGL = 1;
let testDots = 0;
let testColor = 0;
let textSpacing = 0;
let fontRegular, fontBold;
let originX, originY;
let mouseHoverIndex = 0;

function preload() {
  fontRegular = loadFont('assets/Inconsolata-Regular.ttf');
  fontBold = loadFont('assets/Inconsolata-Bold.ttf');
}

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  cnv.style('display', 'block');
  smooth();
  pixelDensity(1); // Prevents issues on retina displays/mobile.
  noStroke();
  colorMode(HSB, 1, 1, 1, 1);
  textFont(fontBold);

  let dotPadding = 0.0; // Normalized: 1.0 deletes the entire circle.
  let totalTestDots = 1;

  testColor = new DotColor(totalTestDots);
  testDots = new DotGrid(totalTestDots, width, height, dotPadding);
  testDots.disabledDotColor = color(0.3, 0.1, 0.9);
  windowResized();
}

function draw() {
  layoutA();
}

function layoutA() {
  background(0.3, 0.1, 1.0);
  testColor.colorRandom();
  testDots.display();

  // Only update mouseHoverIndex if the mouse has moved.
  if (mouseX != pmouseX || mouseY != pmouseY) {
    testDots.mouseHover();
  }
  displayDebugHUD();
}

// Updates the grid anytime the window is resized:
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  textSpacing = height / 15;
  textSize(textSpacing);

  // The WebGL and P2D renderers use different coords, need to move the origin for webGL.
  if (boolWGL == 1) {
    originX = -width / 2;
    originY = -height / 2;
  } else {
    originX = 0;
    originY = 0;
  }

  testDots.updateTilingMaxSpan(width, height);
  testDots.mouseHover();
}

// Prints the current FPS and other info in the upper left corner:
function displayDebugHUD() {
  fill(color(1, 1, 0));
  text("Index " + mouseHoverIndex, textSpacing * 2.5 + originX, (3 * textSpacing) / 2 + originY);
  text(round(frameRate()), textSpacing + originX, (3 * textSpacing) / 2 + originY)
}

class DotColor {
  constructor(tempTotalColors) {
    this.totalColors = tempTotalColors;
    this.colorArray = [];
    this.initColorArray();
  }

  initColorArray() {
    for (let i = 0; i < this.totalColors; i++) {
      this.colorArray[i] = color(0);
    }
  }

  colorRandom() {
    for (let i = 0; i < this.colorArray.length; i++) {
      this.colorArray[i] = color(noise(i + millis() / 4000), 0.5, 1);
    }
  }
}

class DotGrid {
  constructor(tempDotCount, canvasWidth, canvasHeight, tempPadding) {
    this.dotCount = tempDotCount;
    this.dotPadding = tempPadding;
    this.disabledDotColor = 0;
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridMarginX = 0;
    this.gridMarginY = 0;
    this.tileSize = 0;
    this.gridRows = 0;
    this.gridColumns = 0;
    this.updateTilingMaxSpan(canvasWidth, canvasHeight);
    this.mouseHover();
  }

  // Main tiling algorithm:
  // Picks between spanning height or spanning width; whichever covers more area.
  // BUG: Low tilecounts cause wasted space.
  updateTilingMaxSpan(canvasWidth, canvasHeight) {
    let windowRatio = canvasWidth / canvasHeight;
    let cellWidth = sqrt(this.dotCount * windowRatio);
    let cellHeight = this.dotCount / cellWidth;

    let rowsH = ceil(cellHeight);
    let columnsH = ceil(this.dotCount / rowsH);
    while (rowsH * windowRatio < columnsH) {
      rowsH++;
      columnsH = ceil(this.dotCount / rowsH);
    }
    let tileSizeH = canvasHeight / rowsH;

    let columnsW = ceil(cellWidth);
    let rowsW = ceil(this.dotCount / columnsW);
    while (columnsW < rowsW * windowRatio) {
      columnsW++;
      rowsW = ceil(this.dotCount / columnsW);
    }
    let tileSizeW = canvasWidth / columnsW;

    // If the tiles best span height, update grid parameters to span height else...
    if (tileSizeH < tileSizeW) {
      this.gridRows = rowsH;
      this.gridColumns = columnsH;
      this.tileSize = tileSizeH;
      this.gridWidth = columnsH * tileSizeH;
      this.gridHeight = rowsH * tileSizeH;
    } else {
      this.gridRows = rowsW;
      this.gridColumns = columnsW;
      this.tileSize = tileSizeW;
      this.gridWidth = columnsW * tileSizeW;
      this.gridHeight = rowsW * tileSizeW;
    }
    this.gridMarginX = (width - this.gridWidth) / 2;
    this.gridMarginY = (height - this.gridHeight) / 2;
  }

  // Finds the index of the dot underneath the mouse:
  // Treats dots as circular if there are less than 100.
  mouseHover() {
    let tileX = floor((mouseX - this.gridMarginX) / this.tileSize);
    let tileY = floor((mouseY - this.gridMarginY) / this.tileSize);
    let tempHoverIndex = tileX + tileY * this.gridColumns;

    if (tileX < 0 || this.gridColumns <= tileX || tileY < 0 || this.dotCount <= tempHoverIndex) {
      mouseHoverIndex = "UDF";
    } else if (this.dotCount < 100) {
      let dotRadius = this.tileSize *  (1 - this.dotPadding) / 2;
      let inverseScanX = tileX * this.tileSize - this.gridWidth / 2 + this.tileSize / 2;
      let inverseScanY = tileY * this.tileSize - this.gridHeight / 2 + this.tileSize / 2;
      let centerDistance = sqrt(pow(mouseX + originX - inverseScanX, 2) + pow(mouseY + originY - inverseScanY, 2));
      // circle(mouseX + originX, mouseY + originY, 5);
      // circle(inverseScanX, inverseScanY, 10);
      if (centerDistance > dotRadius) {
        mouseHoverIndex = "MISS";
      } else {
        mouseHoverIndex = tileX + tileY * this.gridColumns;
      }
    } else {
      mouseHoverIndex = tileX + tileY * this.gridColumns;
    }
  }

  // Main grid display function:
  // Calculates all dot positions every frame (doesn't seem more expensive than accessing from an array).
  display() {
    let dotPerimeter = this.tileSize * (1 - this.dotPadding);
    let startX = originX + this.gridMarginX + this.tileSize / 2;
    let startY = originY + this.gridMarginY + this.tileSize / 2;
    let scanX = startX;
    let scanY = startY;
    let counter = 0;

    // Works like a scanline going from left to right and top to bottom.
    for (let y = 0; y < this.gridRows; y++) {
      for (let x = 0; x < this.gridColumns; x++) {
        if (counter < this.dotCount) {
          fill(testColor.colorArray[counter]);
          circle(scanX, scanY, dotPerimeter);
          scanX += this.tileSize;
          counter++;
        } else {
          // Once it hits dotCount it uses a while loop to display all of the grey dots; it breaks out
          // of the loop once the grey dots touch the right side of the screen.
          fill(this.disabledDotColor);
          while (scanX < startX + this.gridWidth - 0.001) {
            circle(scanX, scanY, dotPerimeter);
            scanX += this.tileSize;
          }
          break;
        }
      }
      scanX = startX;
      scanY += this.tileSize;
    }
  }
}
