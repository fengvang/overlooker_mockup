let testDots = 0;
let boolWGL = 1;
p5.disableFriendlyErrors = true; // temp killing debugging for perf.

function setup() {
  var cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  cnv.style('display', 'block');
  smooth(8);
  noStroke();
  colorMode(HSB, 1, 1, 1, 1);

  testDots = new DotGrid(5000, windowWidth, windowHeight);
  testDots.initDotArray();
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
    this.spanW = 0;
    this.gridWidth = tempWidth;
    this.gridHeight = tempHeight;
    this.tileSize = 0;
    this.dotPadding = 0;
    this.gridRows = 0;
    this.gridColumns = 0;
    this.posMap = [];
    this.dotArray = [];
    this.disabledDotColor = color(0.3, 0.1, 0.9);
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

  updateSize() {
    if (this.dotPadding < 1.0) {
      for (let i = 0; i < this.dotCount; i++) {
        this.dotArray[i].radius = this.tileSize - this.dotPadding * this.tileSize;
      }
    } else {
      this.dotArray[i].radius = this.tileSize;
    }
  }

  // The WebGL and P2D renderers use different coord systems, so the grid has to be centered differently.
  centerGrid() {
    if (boolWGL == 1) {

      // If the tiles span width, then center by height.
      if (this.spanW == 1) {
        let offsetX = (testDots.tileSize - width) / 2;
        let offsetY = (testDots.tileSize - height) / 2 + (height - testDots.tileSize * testDots.gridRows) / 2;
        translate(offsetX, offsetY, 0);
      } else {
        let offsetX = (testDots.tileSize - width) / 2 + (width - testDots.tileSize * testDots.gridColumns) / 2;
        let offsetY = (testDots.tileSize - height) / 2;
        translate(offsetX, offsetY, 0);
      }
    } else {
      let centerX = (width - (testDots.dotColumns + 100) * testDots.tileSize) / 2;
      let centerY = (height - (testDots.dotRows - 1) * testDots.tileSize) / 2;
      translate(centerX, centerY);
    }
  }

  colorRandom() {
    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].dotColor = color(noise(this.dotArray[i].pos.x * this.dotArray[i].pos.y + i + millis() / 1800), 0.5, 1);
    }
  }

  display() {
    push();
    this.centerGrid();

    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].display();
    }

    let tempRadius = this.tileSize - this.dotPadding * this.tileSize;
    let disabledDotPosX = this.dotArray[this.dotArray.length - 1].pos.x + this.tileSize;
    let disabledDotPosY = this.dotArray[this.dotArray.length - 1].pos.y;
    let disabledDotSpan = width - disabledDotPosX;

    while (disabledDotPosX < this.gridColumns * this.tileSize - 0.001) {
      fill(this.disabledDotColor);
      circle(disabledDotPosX, disabledDotPosY, tempRadius);
      disabledDotPosX += this.tileSize;
      disabledDotSpan -= this.tileSize;
    }
    
    pop();
  }
}
