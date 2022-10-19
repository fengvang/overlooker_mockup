p5.disableFriendlyErrors = true; // Helps with perf on deployed webpage; disable when working on code.
let boolWGL = 1;
let testDots = 0;
let testColor = 0;
let textSpacing = 0;
let fontRegular, fontBold;
let originX, originY;
let mouseOverIndex = 0;
let logo;

function preload() {
  fontRegular = loadFont('assets/Inconsolata-Regular.ttf');
  fontBold = loadFont('assets/Inconsolata-Bold.ttf');
  logo = loadImage('assets/overlooker.jpg');
}

function setup() {
  var cnv = createCanvas(windowWidth - 300, windowHeight, WEBGL);
  cnv.style('display', 'block');
  cnv.style('position', 'absolute');
  cnv.style('right', '0');
  smooth();
  pixelDensity(1); // Prevents issues on retina displays/mobile.
  noStroke();
  colorMode(HSB, 1, 1, 1, 1);
  textFont(fontBold);

  let dotPadding = 0.10; // Normalized: 1.0 deletes the entire circle.
  let totalTestDots = 8000;

  testColor = new DotColor(totalTestDots);
  testDots = new DotGrid(totalTestDots, width, height, dotPadding);
  testDots.dotColorDisabled = color(0.3, 0.1, 0.9);
  windowResized();

  let sideMenu = createDiv('');
  let search = createButton('Search');
  let clear = createButton('Clear');
  let text = createInput('');

  sideMenu.size(300, windowHeight / 2);
  sideMenu.style('position', 'relative');
  sideMenu.style('top', '70px');
  // sideMenu.style('background-color', 'black');
  
  let img = createImg(
    'assets/overlooker.jpg',
    'Overlooker Demo'
  );
  img.position(10, 10);

  text.parent(sideMenu);
  text.size(125);
  text.style('position', 'relative');
  text.style('left', '5px');
  text.style('top', '5px');

  search.parent(sideMenu);
  search.style('position', 'relative');
  search.style('left', '10px');
  search.style('top', '5px');
  search.mousePressed(clearText);

  clear.parent(sideMenu);
  clear.style('position', 'relative');
  clear.style('left', '15px');
  clear.style('top', '5px');
  clear.mousePressed(clearText);

  function clearText() {
    text.value('');
  }

  let filterDiv = createDiv('');
  filterDiv.parent(sideMenu);
  filterDiv.style('position', 'relative');
  filterDiv.style('top', '10px');

  let status = createRadio();
  status.option('On Call');
  status.option('After Call');
  status.option('Idle');
  status.option('Offline');
  status.style('width', '125');
  status.parent(filterDiv);
}

function draw() {
  layoutA();
}

function mouseClicked() {
  testDots.updateMouseOverIndex();
}

function layoutA() {
  background(0.3, 0.1, 1.0);
  testColor.colorRandom();
  testDots.display();
  displayDebugHUD();
}

// Updates the grid anytime the window is resized:
function windowResized() {
  resizeCanvas(windowWidth - 300, windowHeight);
  textSpacing = height / 30;
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
}

// Prints the current FPS and other info in the upper left corner:
function displayDebugHUD() {
  fill(color(1, 1, 0));
  text("Index " + mouseOverIndex, textSpacing * 2.5 + originX, (3 * textSpacing) / 2 + originY);
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
    this.dotColorDisabled = color(0);
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridMarginX = 0;
    this.gridMarginY = 0;
    this.gridRows = 0;
    this.gridColumns = 0;
    this.tileSize = 0;
    this.updateTilingMaxSpan(canvasWidth, canvasHeight);
    this.updateMouseOverIndex();
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
  // Treats dots as circular if there are less than 1000.
  updateMouseOverIndex() {
    let inverseScanX = floor((mouseX - this.gridMarginX) / this.tileSize);
    let inverseScanY = floor((mouseY - this.gridMarginY) / this.tileSize);
    let tempMouseOverIndex = inverseScanX + inverseScanY * this.gridColumns;

    if (inverseScanX < 0 || this.gridColumns <= inverseScanX || inverseScanY < 0 || this.dotCount <= tempMouseOverIndex) {
      mouseOverIndex = "UDF";
    } else if (this.dotCount < 1000) {
      let dotRadius = this.tileSize *  (1 - this.dotPadding) / 2;
      let scanX = originX + this.gridMarginX + this.tileSize / 2 + inverseScanX * this.tileSize;
      let scanY = originY + this.gridMarginY + this.tileSize / 2 + inverseScanY * this.tileSize;
      let centerDistance = sqrt(pow(mouseX + originX - scanX, 2) + pow(mouseY + originY - scanY, 2));
      if (centerDistance > dotRadius) {
        mouseOverIndex = "MISS";
      } else {
        mouseOverIndex = inverseScanX + inverseScanY * this.gridColumns;
      }
    } else {
      mouseOverIndex = inverseScanX + inverseScanY * this.gridColumns;
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
        } // else {
        //   // Once it hits dotCount it uses a single color to represent the grey dots.
        //   fill(this.dotColorDisabled);
        //   circle(scanX, scanY, dotPerimeter);
        //   scanX += this.tileSize;
        // }
      }
      scanX = startX;
      scanY += this.tileSize;
    }
  }
}
