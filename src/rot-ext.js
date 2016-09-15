ROT.FOV.GradientShadowcasting = function(lightPassesCallback, options) {
	ROT.FOV.call(this, lightPassesCallback, options);
};

ROT.FOV.GradientShadowcasting.extend(ROT.FOV);
ROT.FOV.GradientShadowcasting.prototype.compute = function(x, y, R, callback) {
	/* this place is always visible */
  callback(x, y, 0, 1);

  var shadows = {},
      nextShadows = {};
  shadows[x + ',' + y] = 0;
  for(var r = 1; r<=R; r++) {
    var circle = this._getCircle(x, y, r);
    
    var angle = 360 / circle.length;
    for (var i = 0; i < circle.length; i++) {
      var cx = circle[i][0];
      var cy = circle[i][1];
      // Direction towards center of circle.
      var dir = (i / circle.length * 6 + 
                 1 // Magic number one = towards inside
                ) % 6;
      // Extend shadow from the one or two adjacent blocks on the previous
      // circle
      var d0 = Math.floor(dir);
      var d1 = Math.floor(d0 + 1) % 6;

      var diff = dir - d0; // Should be 1 for straight angles
      var ix0 = cx + ROT.DIRS[6][d0][0],
          iy0 = cy + ROT.DIRS[6][d0][1],
          ix1 = cx + ROT.DIRS[6][d1][0],
          iy1 = cy + ROT.DIRS[6][d1][1];

      var shadow0 = shadows[ix0 + ',' + iy0] || 0;
      var shadow1 = shadows[ix1 + ',' + iy1] || 0;
      var occlusion = shadow0 * (1-diff) + shadow1 * diff;
      
      var visibility = 1-Math.min(occlusion + r/R, 1);
      callback(cx, cy, r, visibility);
      nextShadows[cx + ',' + cy] = occlusion + 1-this._lightPasses(cx, cy);
    }
    shadows = nextShadows;
    nextShadows = {};
  }
};

ROT.Display.prototype.draw = function(x, y, ch, fg, bg, blur) {
	if (!fg) { fg = this._options.fg; }
	if (!bg) { bg = this._options.bg; }
  if (!blur) blur = 0;
	this._data[x+","+y] = [x, y, ch, fg, bg, blur];
	
	if (this._dirty === true) { return; } /* will already redraw everything */
	if (!this._dirty) { this._dirty = {}; } /* first! */
	this._dirty[x+","+y] = true;    
};

ROT.Display.Hex.prototype.draw = function(data, clearBefore) {
	var x = data[0];
	var y = data[1];
	var ch = data[2];
	var fg = data[3];
	var bg = data[4];
  var blur = data[5];

	var cx = (x+1) * this._spacingX;
	var cy = y * this._spacingY + this._hexSize;

  if (blur > 0) {
    var fgn = ROT.Color.fromString(fg),
        bgn = ROT.Color.fromString(bg);

    fg = ROT.Color.toHex(ROT.Color.interpolate(fgn, bgn, 0.8 * blur));
    bg = ROT.Color.toHex(ROT.Color.interpolate(bgn, fgn, 0.2 * blur));
  }

	if (clearBefore) { 
		this._context.fillStyle = bg;
		this._fill(cx, cy);
	}
	
	if (!ch) { return; }

	this._context.fillStyle = fg;

  if (blur > 0) {
    this._context.shadowColor = fg;
    this._context.shadowBlur = 20 * blur;
  }
   
	this._context.fillText(ch, cx, cy);
  this._context.shadowColor = null; 
  this._context.shadowBlur = null;
};
