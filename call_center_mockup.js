let testDots = 0;
let boolWGL = 1;
p5.disableFriendlyErrors = true; // helps a bit with perf.

let fontRegular, fontBold;
function preload() {
  fontRegular = loadFont('assets/Inconsolata-Regular.ttf');
  fontBold = loadFont('assets/Inconsolata-Bold.ttf');
}

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  cnv.style('display', 'block');
  smooth();
  noStroke();
  colorMode(HSB, 1, 1, 1, 1);
  textFont(fontBold);

  testDots = new DotGrid(5000, windowWidth, windowHeight);
  testDots.disabledDotColor = color(0.3, 0.1, 0.9);
}

function draw() {
  layoutA();
}

function layoutA() {
  background(0.3, 0.1, 1.0);

  if (frameCount < 2) {
    testDots.updateTilingMaxSpan();
    testDots.updatePosition();
    testDots.updateSize();
  }

  testDots.colorRandom();
  testDots.display();
  testDots.mouseHover();
  displayFPS();
}

// P5.js calls this natively every time the window gets resized.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  testDots.gridWidth = width;
  testDots.gridHeight = height;
  testDots.updateTilingMaxSpan();
  testDots.updatePosition();
  testDots.updateSize();
}

function displayFPS() {
  let fps = Math.round(frameRate());
  let textSpacing = height / 15;

  push();
  fill(color(1, 1, 0));
  textSize(textSpacing);

  if (boolWGL == 1) {
    translate(textSpacing - width / 2, (3 * textSpacing - height) / 2, 0);
    text(fps, 0, 0)
  } else {
    translate(textSpacing, (3 * textSpacing) / 2, 0);
    text(fps, 0, 0)
  }
  pop();
}

// Using this instead of builtin P5.Vectors because they're overkill for now.
class simpleVector {
  constructor(tempx, tempy) {
    this.x = tempx;
    this.y = tempy;
  }

  setVec(tempx, tempy) {
    this.x = tempx;
    this.y = tempy;
  }
}

class DotSingle {
  constructor() {
    this.pos = new simpleVector();
    this.radius = 0;
    this.dotColor = 0;
  }

  display() {
    fill(this.dotColor);
    circle(this.pos.x, this.pos.y, this.radius);
  }
}

class DotGrid {
  constructor(tempDotCount, tempWidth, tempHeight) {
    this.dotCount = tempDotCount;
    this.gridWidth = tempWidth;
    this.gridHeight = tempHeight;
    this.spanW = 0;
    this.tileSize = 0;
    this.dotPadding = 0;
    this.gridRows = 0;
    this.gridColumns = 0;
    this.dotArray = [];
    this.posMap = [];
    this.disabledDotColor = 0;

    this.initDotArray();
  }

  initDotArray() {
    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i] = new DotSingle();
    }
  }

  updateTilingMaxSpan() {
    let offset = 0;

    let windowRatio = this.gridWidth / this.gridHeight;
    let cellWidth = sqrt(this.dotCount * windowRatio);
    let cellHeight = this.dotCount / cellWidth;

    let rowsH = ceil(cellHeight);
    let columnsH = ceil(this.dotCount / rowsH) + offset;
    while (rowsH * windowRatio < columnsH) {
      rowsH++;
      columnsH = ceil(this.dotCount / rowsH);
    }
    let tileSizeH = this.gridHeight / rowsH;

    let columnsW = ceil(cellWidth) + offset;
    let rowsW = ceil(this.dotCount / columnsW);
    while (columnsW < rowsW * windowRatio) {
      columnsW++;
      rowsW = ceil(this.dotCount / columnsW);
    }
    let tileSizeW = this.gridWidth / columnsW;

    if (tileSizeH < tileSizeW) {
      this.gridRows = rowsH;
      this.gridColumns = columnsH + offset;
      this.tileSize = tileSizeH;
      this.spanW = 0;
    } else {
      this.gridRows = rowsW + offset;
      this.gridColumns = columnsW;
      this.tileSize = tileSizeW;
      this.spanW = 1;
    }
  }

  updatePosition() {
    var counter = 0;
    for (let y = 0; y < this.gridRows; y++) {
      for (let x = 0; x < this.gridColumns; x++) {
        this.posMap[counter] = new simpleVector(x * this.tileSize, y * this.tileSize);
        counter = counter + 1;
      }
    }

    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].pos = this.posMap[i];
    }
  }

  // Storing this as an attribute and then accessing for each dot is probably bad if it never varies.
  updateSize() {
    if (this.dotPadding < 1.0) {
      for (let i = 0; i < this.dotCount; i++) {
        this.dotArray[i].radius = this.tileSize - this.dotPadding * this.tileSize;
      }
    } else {
      this.dotArray[i].radius = this.tileSize;
      print("dotPadding was greater than or equal to one - defaulting to no padding");
    }
  }

  // The WebGL and P2D renderers use different coord systems, so the grid has to be centered differently.
  centerGrid() {
    let offsetX = 0;
    let offsetY = 0;

    if (boolWGL == 1) {
      if (this.spanW == 1) {
        offsetX = (this.tileSize - width) / 2;
        offsetY = (this.tileSize * (1 - this.gridRows)) / 2;
      } else {
        offsetX = (this.tileSize * (1 - this.gridColumns)) / 2;
        offsetY = (this.tileSize - height) / 2;
      }
    } else {
      if (this.spanW == 1) {
        offsetX = this.tileSize / 2;
        offsetY = (height - this.tileSize * (this.gridRows - 1)) / 2;
      } else {
        offsetX = (width - this.tileSize * (this.gridColumns - 1)) / 2;
        offsetY = this.tileSize / 2;
      }
    }
    translate(offsetX, offsetY, 0);
  }

  colorRandom() {
    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].dotColor = color(noise(this.dotArray[i].pos.x * this.dotArray[i].pos.y + i + millis() / 1800), 0.5, 1);
    }
  }

  // Haven't made it work with the P2D yet either.
  mouseHover() {
    let offsetX = 0;
    let offsetY = 0;

    push();
    fill(color(1, 1, 0));
    let textSpacing = height / 15;
    textSize(textSpacing);

    // Mouse functions depend on renderer's coord system.
    if (boolWGL == 1) {
      
      // Accounting for margins.
      if (this.spanW == 1) {
        offsetY = (height - this.tileSize * this.gridRows) / 2;
      } else {
        offsetX = (width - this.tileSize * this.gridColumns) / 2;
      }
      let xPos = floor((mouseX - offsetX) / this.tileSize);
      let yPos = floor((mouseY - offsetY) / this.tileSize) * this.gridColumns;
      let tileIndex = xPos + yPos;
      
      if (xPos < 0 || xPos >= this.gridColumns || yPos < 0 || yPos >= this.dotCount) {
        tileIndex = "UDF"; 
      }
      translate(textSpacing * 2.5 - width / 2, (3 * textSpacing - height) / 2, 0);
      text("Index " + tileIndex, 0, 0)
    } else {
      translate(0, (3 * textSpacing) / 2, 0);
      text(tileIndex, 0, 0)
    }
    pop();
  }

  display() {
    push();
    this.centerGrid();

    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].display();
    }

    // Draws disabledDots at the last line and stops before going offscreen.
    fill(this.disabledDotColor);
    let tempRadius = this.tileSize - this.dotPadding * this.tileSize;
    let disabledDotPosX = this.dotArray[this.dotArray.length - 1].pos.x + this.tileSize;
    let disabledDotPosY = this.dotArray[this.dotArray.length - 1].pos.y;

    while (disabledDotPosX < this.gridColumns * this.tileSize - 0.001) {
      circle(disabledDotPosX, disabledDotPosY, tempRadius);
      disabledDotPosX += this.tileSize;
    }

    pop();
  }

  // Test function where everything is calculated every frame instead of accessing parameters from dotArray.
  // Not useful yet, but may help get the logic down if we move to shaders in the future.
  displayImmediate() {
    push();
    this.centerGrid();
    let liveY = 0;
    let liveX = 0;
    let tempRadius = this.tileSize - this.dotPadding * this.tileSize;
    let immediateCounter = 0;

    for (let y = 0; y < this.gridRows; y++) {
      for (let x = 0; x < this.gridColumns; x++) {

        // Render the trailing dots and exit the loop after the last dot is reached.
        if (immediateCounter < this.dotCount) {
          fill(color(noise(liveX * liveY + immediateCounter + millis() / 1800), 0.5, 1));
          circle(liveX, liveY, tempRadius);
          liveX += this.tileSize;
          immediateCounter++;
        } else {
          fill(this.disabledDotColor);
          while (liveX < this.gridColumns * this.tileSize - 0.001) {
            circle(liveX, liveY, tempRadius);
            liveX += this.tileSize;
          }
          break;
        }
      }
      liveX = 0;
      liveY += this.tileSize;
    }

    pop();
  }
}
