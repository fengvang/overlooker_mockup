p5.disableFriendlyErrors = true; // Helps with perf on deployed webpage; disable when working on code.
let boolWGL = 1; // Need to set this if using WebGL.

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
  testDots.updateTilingMaxSpan();
}

// Main draw thread:
function draw() {
  layoutA();
}

function layoutA() {
  // Whatever appears first gets drawn over by things that appear later, so
  // background belongs at the top.
  background(0.3, 0.1, 1.0);

  // Main dot rendering.
  testDots.colorRandom();
  testDots.display();

  // Debug hud.
  testDots.mouseHover();
  displayFPS();
}

// P5.js calls this natively every time the window gets resized.
// Needed for refitting the grid when phones are rotated or the browser window is changed.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  testDots.gridWidth = width;
  testDots.gridHeight = height;
  testDots.updateTilingMaxSpan();
}

// Prints the current FPS in the upper-left hand corner:
function displayFPS() {
  push();
  fill(color(1, 1, 0));
  let fps = Math.round(frameRate());

  // Have to center the text depending on renderer due to different coord systems between P2D and webGL.
  if (boolWGL == 1) {
    translate(textSpacing - width / 2, (3 * textSpacing - height) / 2, 0);
    text(fps, 0, 0)
  } else {
    translate(textSpacing, (3 * textSpacing) / 2, 0);
    text(fps, 0, 0)
  }
  pop();
}

// Main dot class meant to represent the person working in the call center:
// Right now this class only stores color, in the future it might store ID#, call state,
// color gradient information, animation progress, etc.
// We need to give some thought about what sort of ADT would be best here.
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
    // The WebGL and P2D renderers use different coord systems, so the grid has to be centered differently for each.
    if (boolWGL == 1) {
      // WebGL centering:
      if (this.spanW == 1) {
        this.gridOffsetX = (this.tileSize - width) / 2;
        this.gridOffsetY = (this.tileSize * (1 - this.gridRows)) / 2;
      } else {
        this.gridOffsetX = (this.tileSize * (1 - this.gridColumns)) / 2;
        this.gridOffsetY = (this.tileSize - height) / 2;
      }
    } else {
      // P2D centering:
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
  // Going in the trash once we can get API calls (or simulate them).
  // Coloring is going to add complexity in the future since it will involve keeping track
  // of animation states.
  colorRandom() {
    for (let i = 0; i < this.dotCount; i++) {
      this.dotArray[i].dotColor = color(noise(i + millis() / 1800), 0.5, 1);
    }
  }

  // Prints the index of the dot underneath the mouse:
  // Uses tileSize/gridRows/gridColumns to figure out where the mouse is.
  // BUG: Currently it treats everything like a square.
  // FIX: if the distance between the mouse position and the nearest dot is greater than dotRadius
  // then we are in empty space (requires one computation of distance formula per frame, so should be cheap).
  mouseHover() {
    let tileIndex = 0;
    let offsetX = 0;
    let offsetY = 0;

    // The mouse position functions also use renderer-dependent coordinates, so we may need 2
    // different approaches depending on if we're using P2D or WebGL.
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
      let tileIndex = discreteXPos + discreteYPos * this.gridColumns;

      // Had trouble finding the offsets to do this, so saving for later.
      let centerDistance = sqrt(pow(0, 2) + pow(0, 2));

      if (discreteXPos < 0 || this.gridColumns <= discreteXPos || discreteYPos < 0 || this.dotCount <= tileIndex) {
        tileIndex = "UDF";
      } else if (centerDistance > this.tileSize * (1 - this.dotPadding)) {
        tileIndex = "MISS";
      }

      push();
      fill(color(1, 1, 0));
      translate(textSpacing * 2.5 - width / 2, (3 * textSpacing - height) / 2, 0);
      text("Index " + tileIndex, 0, 0)
        pop();
    } else {
      // TODO: get it working for P2D as well.
    }
  }

  // Main grid display function:
  // Instead of storing all positions in dotSingle[] and iterating thru them, I think we should
  // just calculate them every frame since it is less code and doesn't seem to perform any worse.
  // This same approach seems like it could be used in a shader so it might be good to work with it.
  // It also adjusts to changes in dotCount/width/height without needing to update an array.
  display() {
    push();
    translate(this.gridOffsetX, this.gridOffsetY);
    let liveY = 0;
    let liveX = 0;
    let tempRadius = this.tileSize - this.dotPadding * this.tileSize;
    let counter = 0;

    // Works like a scanline going from left to right and top to bottom.
    for (let y = 0; y < this.gridRows; y++) {
      for (let x = 0; x < this.gridColumns; x++) {
        if (counter < this.dotCount) {
          fill(this.dotArray[counter].dotColor);
          circle(liveX, liveY, tempRadius);
          liveX += this.tileSize;
          counter++;
        } else {

          // Once it hits dotCount it uses a while loop to display all of the grey dots; it breaks out
          // of the loop once the grey dots touch the right side of the screen.
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
