/**
 * JSQRGen: QRCode Canvas Renderer
 * @author Gerald <gera2ld@163.com>
 * @license MIT
 */

function renderByCanvas(options) {

  function isDark(i, j) {
    return i >= 0 && i < options.count && j >= 0 && j < options.count
      && (options.logo.clearEdges ? clear[i * options.count + j] : true)
      && options.qr.isDark(i, j);
  }

  function drawCorner(cornerX, cornerY, x, y, r) {
    var context = common.context;
    if(r) context.arcTo(cornerX, cornerY, x, y, r);
    else {
      context.lineTo(cornerX, cornerY);
      context.lineTo(x, y);
    }
  }

  function fillCorner(startX, startY, cornerX, cornerY, destX, destY) {
    var context = common.context;
    context.beginPath();
    context.moveTo(startX, startY);
    drawCorner(cornerX, cornerY, destX, destY, common.effect);
    context.lineTo(cornerX, cornerY);
    context.lineTo(startX, startY);
    //context.closePath();
    context.fill();
  }

  function drawSquare() {
    var cell = common.cell;
    var context = common.context;
    var cellSize = common.cellSize;
    if (isDark(cell.i, cell.j)) {
      context.fillStyle = colorDark;
      context.fillRect(cell.x, cell.y, cellSize, cellSize);
    }
  }

  function drawRound() {
    var cell = common.cell;
    var x = cell.x;
    var y = cell.y;
    var context = common.context;
    var cellSize = common.cellSize;
    var effect = common.effect;
    // draw cell if it should be dark
    if(isDark(cell.i, cell.j)) {
      context.fillStyle = colorDark;
      context.beginPath();
      context.moveTo(x + .5 * cellSize, y);
      drawCorner(x + cellSize, y, x + cellSize, y + .5*cellSize, effect);
      drawCorner(x + cellSize, y + cellSize, x + .5 * cellSize, y + cellSize, effect);
      drawCorner(x, y + cellSize, x, y + .5 * cellSize, effect);
      drawCorner(x, y, x + .5 * cellSize, y, effect);
      //context.closePath();
      context.fill();
    }
  }

  function drawLiquid() {
    var corners = [0, 0, 0, 0]; // NW, NE, SE, SW
    var cell = common.cell;
    var i = cell.i;
    var j = cell.j;
    var x = cell.x;
    var y = cell.y;
    var context = common.context;
    var effect = common.effect;
    var cellSize = common.cellSize;
    if(isDark(i-1, j)) {corners[0] ++; corners[1] ++;}
    if(isDark(i+1, j)) {corners[2] ++; corners[3] ++;}
    if(isDark(i, j-1)) {corners[0] ++; corners[3] ++;}
    if(isDark(i, j+1)) {corners[1] ++; corners[2] ++;}
    // draw cell
    context.fillStyle = colorDark;
    if(isDark(i, j)) {
      if(isDark(i-1, j-1)) corners[0] ++;
      if(isDark(i-1, j+1)) corners[1] ++;
      if(isDark(i+1, j+1)) corners[2] ++;
      if(isDark(i+1, j-1)) corners[3] ++;
      context.beginPath();
      context.moveTo(x + .5 * cellSize, y);
      drawCorner(x + cellSize, y, x + cellSize, y + .5 * cellSize, corners[1] ? 0 : effect);
      drawCorner(x + cellSize, y + cellSize, x + .5 * cellSize, y + cellSize, corners[2] ? 0 : effect);
      drawCorner(x, y + cellSize, x, y + .5 * cellSize, corners[3] ? 0 : effect);
      drawCorner(x, y, x + .5 * cellSize, y, corners[0] ? 0 : effect);
      //context.closePath();
      context.fill();
    } else {
      if(corners[0] == 2) fillCorner(x, y + .5 * cellSize, x, y, x + .5 * cellSize, y);
      if(corners[1] == 2) fillCorner(x + .5 * cellSize, y, x + cellSize, y, x + cellSize, y + .5 * cellSize);
      if(corners[2] == 2) fillCorner(x + cellSize, y + .5 * cellSize, x + cellSize, y + cellSize, x + .5 * cellSize, y + cellSize);
      if(corners[3] == 2) fillCorner(x + .5 * cellSize, y + cellSize, x, y + cellSize, x, y + .5 * cellSize);
    }
  }

  function drawCells() {
    var effect = options.effect;
    var func = drawSquare, i, j;
    // common.cellSize should be INTEGER
    var cellSize = common.cellSize;
    common.effect = effect.value * cellSize;
    // draw qrcode according to effect
    if(common.effect)
      switch (effect.key) {
        case 'liquid':
          func = drawLiquid;
          break;
        case 'round':
          func = drawRound;
          break;
      }
    // draw cells
    for(i = 0; i < options.count; i ++)
      for(j = 0; j < options.count; j ++) {
        common.cell = {
          i: i,
          j: j,
          x: j * cellSize,
          y: i * cellSize,
        };
        func();
      }
  }

  function prepareLogo(){
    // limit the logo size
    var logo = options.logo;
    var count = options.count;
    var context = common.context;
    var k, width, height, numberWidth, numberHeight;

    // if logo is an image
    if (logo.image) {
      k = logo.image;
      width = k.naturalWidth || k.width;
      height = k.naturalHeight || k.height;
    }
    // if logo is text
    else if (logo.text) {
      // get text width/height radio by assuming fontHeight=100px
      height = 100;
      k = '';
      if (logo.fontStyle) k += logo.fontStyle + ' ';
      k += height + 'px ' + logo.fontFace;
      context.font = k;
      width = context.measureText(logo.text).width;
    }
    // otherwise do nothing
    else return;

    // calculate the number of cells to be broken or covered by the logo
    k = width / height;
    numberHeight = ~~ (Math.sqrt(Math.min(width * height / common.size / common.size, logo.size) / k) * count);
    numberWidth = ~~ (k * numberHeight);
    // (count - [numberWidth | numberHeight]) must be even if the logo is in the middle
    if ((count - numberWidth) % 2) numberWidth ++;
    if ((count - numberHeight) % 2) numberHeight ++;

    // calculate the final width and height of the logo
    k = Math.min((numberHeight * common.cellSize - 2 * logo.margin) / height, (numberWidth * common.cellSize - 2 * logo.margin) / width, 1);
    logo.width = ~~ (k * width);
    logo.height = ~~ (k * height);
    logo.x = ((common.size - logo.width) >> 1) - logo.margin;
    logo.y = ((common.size - logo.height) >> 1) - logo.margin;

    // draw logo to a canvas
    logo.canvas = getCanvas(logo.width + logo.margin * 2, logo.height + logo.margin * 2);
    var ctx = logo.canvas.getContext('2d');
    if (logo.image)
      ctx.drawImage(logo.image, logo.margin, logo.margin, logo.width, logo.height);
    else {
      var font = '';
      if(logo.fontStyle) font += logo.fontStyle + ' ';
      font += logo.height + 'px ' + logo.fontFace;
      ctx.font = font;
      // draw text in the middle
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = logo.color;
      ctx.fillText(logo.text, logo.width >> 1 + logo.margin, logo.height >> 1 + logo.margin);
    }
    logo.edger = new Edger(logo.canvas, {margin: logo.margin, nobg: logo.clearEdges == 2});

    // whether to clear cells broken by the logo (incomplete cells)
    if(logo.clearEdges) {
      clear = new Uint8Array(options.count * options.count);
      for (var i = 0; i < options.count; i ++)
        for (var j = 0; j < options.count; j ++)
          clear[i * options.count + j] = logo.edger.isBackground(j * common.cellSize - logo.x, i * common.cellSize - logo.y, common.cellSize, common.cellSize);
    }
  }

  function clearLogo() {
    var logo = options.logo;
    var context = common.context;
    if((logo.image || logo.text) && !logo.clearEdges) {
      var canvas_logo_x = getCanvas(logo.width + 2 * logo.margin, logo.height + 2 * logo.margin);
      var ctx = canvas_logo_x.getContext('2d');
      ctx.fillStyle = colorLight;
      ctx.fillRect(0, 0, canvas_logo_x.width, canvas_logo_x.height);
      logo.edger.clearBackground(canvas_logo_x);
      context.drawImage(canvas_logo_x, logo.x, logo.y);
    }
  }

  /**
   * @desc Transform color to remove alpha channel
   */
  function transformColor(fg, bg, alpha) {
    return ~~ (fg * alpha / 255 + bg * (255 - alpha) / 255);
  }

  function transformAlpha() {
    var size = common.size;
    var context = common.context;
    var imageData = context.getImageData(0, 0, size, size);
    var total = size * size;
    for (var i = 0; i < total; i ++) {
      var offset = i * 4;
      var alpha = imageData.data[offset + 3];
      if (alpha < 255) {
        imageData.data[offset] = transformColor(imageData.data[offset], 255, alpha);
        imageData.data[offset + 1] = transformColor(imageData.data[offset + 1], 255, alpha);
        imageData.data[offset + 2] = transformColor(imageData.data[offset + 2], 255, alpha);
        imageData.data[offset + 3] = 255;
      }
    }
  }

  function drawForeground() {
    var size = common.size;
    var canvasFore = getCanvas(size, size);
    initCanvas(canvasFore, assign({}, common, {data: options.foreground}));
    var ctx = canvasFore.getContext('2d');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(common.canvasData, 0, 0);
    return canvasFore;
  }

  function draw() {
    // ensure size and cellSize are integers
    // so that there will not be gaps between cells
    common.cellSize = Math.ceil(options.cellSize);
    var size = common.size = common.cellSize * options.count;
    var canvasData = common.canvasData = getCanvas(size, size);
    var contextData = common.context = canvasData.getContext('2d');
    prepareLogo();
    drawCells();
    clearLogo();

    var fore = drawForeground();
    var canvas = getCanvas(size, size);
    initCanvas(canvas, assign({}, common, {data: options.background}));
    var context = canvas.getContext('2d');
    context.drawImage(fore, 0, 0);
    var logo = options.logo;
    if (logo.canvas) context.drawImage(logo.canvas, logo.x, logo.y);
    options.noAlpha && transformAlpha();
    common.context = null;

    var canvasTarget = options.reuseCanvas;
    if (canvasTarget) {
      canvasTarget.width = canvasTarget.height = options.size;
    } else if (size != options.size) {
      // strech image if the size is not expected
      canvasTarget = getCanvas(options.size, options.size);
    }
    if (canvasTarget) {
      var contextTarget = canvasTarget.getContext('2d');
      contextTarget.drawImage(canvas, 0, 0, options.size, options.size);
      canvas = canvasTarget;
    }

    return canvas;
  }

  var colorDark = 'black';
  var colorLight = 'white';
  var common = {};
  /**
   * Whether the cell is covered.
   * 0 - partially or completely covered.
   * 1 - clear.
   */
  var clear;
  return draw();
}

var defaults = {
  // typeNumber belongs to 1..10
  // will be increased to the smallest valid number if too small
  typeNumber: 1,

  // correctLevel can be 'L', 'M', 'Q' or 'H'
  correctLevel: 'M',

  // foreground and background may be an image or a style string
  // or an array of objects with attributes below:
  // * row | x: default 0
  // * col | y: default 0
  // * cols | width: default size
  // * rows | height: default size
  // * style: default 'black'
  foreground: 'black',
  background: null,

  // data MUST be a string
  data: '',

  // effect: {key: [round|liquid], value: 0-0.5}
  effect: {},

  // Remove alpha channel to make the image not transparent
  noAlpha: true,

  // Null or a canvas to be reused
  reuseCanvas: null,

  /**
   * an image or text can be used as a logo
   * logo: {
   *   // image
   *   image: Image,

   *   // text
   *   text: string,
   *   color: string, default 'black'
   *   fontStyle: string, e.g. 'italic bold'
   *   fontFace: string, default 'Cursive'

   *   // common
   *   clearEdges: number, default 0
   *       0 - not clear, just margin
   *       1 - clear incomplete cells
   *       2 - clear a larger rectangle area
   *   margin: number, default 2 for text and 0 for image
   *   size: float, default .15 stands for 15% of the QRCode
   * }
   */
  logo: {},
};

function getQRCode(_options) {
  var logo = {
    color: 'black',
    fontFace: 'Cursive',
    clearEdges: 0,
    margin: -1,
    size: .15,
  };
  var options = assign({}, defaults, _options, {
    logo: logo,
  });
  var _logo = _options.logo;
  if (_logo && (_logo.image || _logo.text)) assign(logo, _logo);
  // if a logo is to be added, correctLevel is set to H
  if (logo.image || logo.text) {
    options.correctLevel = 'H';
    if (logo.margin < 0) logo.margin = logo.image ? 0 : 2;
  }

  // Generate QRCode data with qrcode-light.js
  var qr = qrcode(options.typeNumber, options.correctLevel);
  qr.addData(options.data);
  qr.make();

  // calculate QRCode and cell sizes
  var count = qr.getModuleCount();
  // cellSize is used if assigned
  // otherwise size is used
  var cellSize = options.cellSize;
  var size = options.size;
  if (!cellSize && !size) cellSize = 2;
  if (cellSize) size = cellSize * count;
  else if (size) {
    size = options.size;
    cellSize = size / count;
  }
  return assign(options, {
    cellSize: cellSize,
    size: size,
    qr: qr,
    count: count,
  });
}

function QRCanvas(options) {
  return renderByCanvas(getQRCode(options));
}
