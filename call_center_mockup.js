p5.disableFriendlyErrors = true; // Helps with perf on deployed webpage; disable when working on code.
let boolWGL = 1; // The WebGL and P2D renderers use different coords, need to space differently for each.

let testDots = 0;
let textSpacing = 0;
let fontRegular, fontBold;

function preload() {
  fontRegular = loadFont('assets/Inconsolata-Regular.ttf');
  fontBold = loadFont('assets/Inconsolata-Bold.ttf');
}

function setup() {
  // The var cnv declaration stops a useless scroll bar from showing for some reason.
  var cnv = createCanvas(windowWidth, windowHeight, WEBGL);
  cnv.style('display', 'block');

  smooth();
  noStroke();
  colorMode(HSB, 1, 1, 1, 1);

  // Font size and spacing for the debug overlay.
  textFont(fontBold);
  textSpacing = height / 15;
  textSize(textSpacing);

  // Dot padding is the empty white space around each dot. Normalized: setting to 1.0 will eliminate the entire dot.
  let dotPadding = 0;

  testDots = new DotGrid(5000, windowWidth, windowHeight, dotPadding);
  testDots.disabledDotColor = color(0.3, 0.1, 0.9);
  testDots.mouseHover();
}

// Main draw thread:
function draw() {
  layoutA();
}

function layoutA() {
  background(0.3, 0.1, 1.0);

  // Main dot rendering.
  testDots.colorRandom();
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
  testDots.gridWidth = width;
  testDots.gridHeight = height;
  testDots.updateTilingMaxSpan();
}

// Prints the current FPS and other info in the upper left corner:
function displayDebugHUD() {
  fill(color(1, 1, 0));
  if (boolWGL == 1) {
    text("Index " + testDots.mouseHoverIndex, textSpacing * 2.5 - width / 2, (3 * textSpacing - height) / 2);
    text(round(frameRate()), textSpacing - width / 2, (3 * textSpacing - height) / 2)
  } else {
    text(round(frameRate()), (3 * textSpacing) / 2, 0)
  }
}

// Main dot class meant to represent the person working in the call center:
// Right now this class only stores color, in the future it might store ID#, call state,
// color gradient information, animation progress, etc.
class DotSingle {
  constructor() {
    this.dotColor = 0;
  }
}

class DotGrid {
  constructor(tempDotCount, tempWidth, tempHeight, tempPadding) {

    // These are the main inputs into the tiling algorithm.
    this.dotCount = tempDotCount;
    this.gridWidth = tempWidth;
    this.gridHeight = tempHeight;

    // We need to remember if the tiling algorithm spanned width or height to center things properly.
    this.spanW = 0;

    // Dot radius can differ from tileSize due to padding.
    this.dotRadius = 0;
    this.dotPadding = tempPadding;

    // These are the main grid attributes that will be found by the tiling algorithm.
    this.tileSize = 0;
    this.gridRows = 0;
    this.gridColumns = 0;

    // These are the grey dots that are printed at the bottom to keep an even rectangle on the screen.
    this.disabledDotColor = 0;

    // Used for centering the grid in the middle of the canvas.
    this.gridOffsetX = 0;
    this.gridOffsetY = 0;

    // This could be where we first start storing stuff from the API.
    this.dotArray = [];
    this.initDotArray();

    // Stores the index of the dot underneath the mouse.
    this.mouseHoverIndex = 0;

    // Calculate the initial attributes of the grid.
    this.updateTilingMaxSpan();
  }

  initDotArray() {
    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i] = new DotSingle();
    }
  }

  // Main tiling algorithm:
  // Determines how to cover the maximum area on a rectangle using n square tiles.
  // Picks between spanning height or spanning width; whichever covers more area.
  // BUG: Low tilecounts cause wasted space.
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

    // dotRadius and grid centering need to be updated anytime the tiling algorithm is called.
    this.dotRadius = this.tileSize - this.dotPadding * this.tileSize;
    this.updateGridOffsets();
  }

  // Function for figuring out how to center the grid in the middle of the canvas:
  updateGridOffsets() {
    if (boolWGL == 1) {
      if (this.spanW == 1) {
        this.gridOffsetX = (this.tileSize - width) / 2;
        this.gridOffsetY = (this.tileSize * (1 - this.gridRows)) / 2;
      } else {
        this.gridOffsetX = (this.tileSize * (1 - this.gridColumns)) / 2;
        this.gridOffsetY = (this.tileSize - height) / 2;
      }
    } else {
      if (this.spanW == 1) {
        this.gridOffsetX = this.tileSize / 2;
        this.gridOffsetY = (height - this.tileSize * (this.gridRows - 1)) / 2;
      } else {
        this.gridOffsetX = (width - this.tileSize * (this.gridColumns - 1)) / 2;
        this.gridOffsetY = this.tileSize / 2;
      }
    }
  }

  // Temp function for generating a random color:
  colorRandom() {
    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].dotColor = color(noise(i + millis() / 1800), 0.5, 1);
    }
  }

  // Finds the index of the dot underneath the mouse (needs cleanup, fixes):
  // BUG: Currently it treats everything like a square.
  // FIX: if the distance between the mouse position and the nearest dot is greater than dotRadius
  // then we are in empty space (requires one computation of distance formula per call, so should be cheap).
  mouseHover() {
    let offsetX = 0;
    let offsetY = 0;

    if (boolWGL == 1) {
      // Offsets needed due to the empty space in the margins.
      if (this.spanW == 1) {
        offsetY = (height - this.tileSize * this.gridRows) / 2;
      } else {
        offsetX = (width - this.tileSize * this.gridColumns) / 2;
      }
      let xPos = mouseX - offsetX;
      let yPos = mouseY - offsetY;
      let discreteXPos = floor(xPos / this.tileSize);
      let discreteYPos = floor(yPos / this.tileSize);
      this.mouseHoverIndex = discreteXPos + discreteYPos * this.gridColumns;

      // Had trouble finding the offsets to do this, so saving for later.
      // Could use dot product trick to get out of using sqrt?
      let centerDistance = sqrt(pow(0, 2) + pow(0, 2));

      if (discreteXPos < 0 || this.gridColumns <= discreteXPos || discreteYPos < 0 || this.dotCount <= this.mouseHoverIndex) {
        this.mouseHoverIndex = "UDF";
      } else if (centerDistance > this.tileRadius) {
        this.mouseHoverIndex = "MISS";
      }
    } else {
      // TODO: get it working for P2D as well.
    }
  }

  // Main grid display function:
  // Calculates all dot positions every frame (doesn't seem more expensive than accessing from an array).
  // This same approach seems like it could be used in a shader so it might be good to work with it.
  display() {
    push();
    translate(this.gridOffsetX, this.gridOffsetY);
    let scanX = 0;
    let scanY = 0;
    let counter = 0;

    // Works like a scanline going from left to right and top to bottom.
    for (let y = 0; y < this.gridRows; y++) {
      for (let x = 0; x < this.gridColumns; x++) {
        if (counter < this.dotCount) {
          fill(this.dotArray[counter].dotColor);
          circle(scanX, scanY, this.dotRadius);
          scanX += this.tileSize;
          counter++;
        } else {
          // Once it hits dotCount it uses a while loop to display all of the grey dots; it breaks out
          // of the loop once the grey dots touch the right side of the screen.
          fill(this.disabledDotColor);
          while (scanX < this.gridColumns * this.tileSize - 0.001) {
            circle(scanX, scanY, this.dotRadius);
            scanX += this.tileSize;
          }
          break;
        }
      }
      scanX = 0;
      scanY += this.tileSize;
    }
    pop();
  }
}
