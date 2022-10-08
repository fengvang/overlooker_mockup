let testDots = 0;
//p5.disableFriendlyErrors = true;

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
  background(220);
  layoutA();
}

function layoutA() {
  if (frameCount < 2) {
    testDots.updateTilingSpanWidth();
    testDots.updatePosition();
    testDots.updateSize();
  }

  //offsetP2D();
  offsetWEBGL();
  testDots.colorRandom();
  testDots.display();
}

// The WebGL and P2D renderers use different coord systems, so we have to calculate offsets differently.
function offsetP2D() {
  let centerX = (width - (testDots.dotColumns - 1) * testDots.tileSize) / 2;
  let centerY = (height - (testDots.dotRows - 1) * testDots.tileSize) / 2;
  translate(centerX, centerY);
}

function offsetWEBGL() {
  let offsetX = (testDots.tileSize - width) / 2;
  let offsetY = (testDots.tileSize - height) / 2;
  translate(offsetX, offsetY, 0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  testDots.gridWidth = width;
  testDots.gridHeight = height;
  testDots.updateTilingSpanWidth();
  testDots.updatePosition();
  testDots.updateSize();
}

class simpleVector {
  constructor(tempx, tempy){
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

  updateTilingSpanWidth() {
    let offset = 1;

    let windowRatio = this.gridWidth / this.gridHeight;
    let cellWidth = sqrt(this.dotCount * windowRatio);
    let cellHeight = this.dotCount / cellWidth;

    let columnsW = ceil(cellWidth) + offset;
    let rowsW = ceil(this.dotCount / columnsW);
    while (columnsW < rowsW * windowRatio) {
      columnsW++;
      rowsW = ceil(this.dotCount / columnsW);
    }

    this.tileSize = this.gridWidth / columnsW;
    this.gridRows = rowsW + offset;
    this.gridColumns = columnsW;
  }

  updateTilingSpanHeight() {
    let offset = 1;

    let windowRatio = this.gridWidth / this.gridHeight;
    let cellWidth = sqrt(this.dotCount * windowRatio);
    let cellHeight = this.dotCount / cellWidth;

    let rowsH = ceil(cellHeight);
    let columnsH = ceil(this.dotCount / rowsH) + offset;
    while (rowsH * windowRatio < columnsH) {
      rowsH++;
      columnsH = ceil(this.dotCount / rowsH);
    }

    this.tileSize = this.gridHeight / rowsH;
    this.gridRows = rowsH;
    this.gridColumns = columnsH + offset;
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

  colorRandom() {
    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].dotColor = color(noise(this.dotArray[i].pos.x * this.dotArray[i].pos.y + i + frameCount / 100), 0.5, 1);
    }
  }

  display() {
    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].display();
    }

    if (this.dotCount != this.dotRows * this.dotColumns) {
      let tempRadius = this.tileSize - this.dotPadding * this.tileSize;
      for (let i = this.dotArray.length + 1; i < this.posMap.length; i++) {
        fill(this.disabledDotColor);
        circle(this.posMap[i].x, this.posMap[i].y, this.tempRadius);
      }
    }
  }
}
