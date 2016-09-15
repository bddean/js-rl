var Light = inherit.component(Entity, {
	name: 'light',
	shape: '?',
	fg: 'yellow',
	brightness: 5,
	_shining: 0,
	_dirty: true,
	_uninitialized: true
});

Light.defProto('shine', function() {
	if (this._shining === undefined// Not fully initialized
			|| (!this._dirty)) return; 
	var that = this;
	var fov = new ROT.FOV.GradientShadowcasting(function(x, y) {
		return 1 - World.getMap(x,y).getOpacity(that.plane);
	}, {topology: 6});

	this._shining++;
	fov.compute(this.getPos()[0], this.getPos()[1], this.brightness,
							function(x, y, r, intensity) {
								x %= World.width;
								y %= World.height;
								World.getMap(x,y).illuminate(that, that._shining, intensity);
							});

	this._dirty = false;
});

Light.defProto('recast', function() {
	this._dirty = true;
});

Light.defProto('adjust', function(newBrightness) {
	this.brightness = newBrightness;
	this._shining++;
});

Light.defProto('validate', function(shining) {
	return shining == this._shining;
});

Light.defProto('setLocation', function(newloc) {
	this.$super(newloc);
	if (this._uninitialized) {
		this.shine();
		this._uninitialized = false; // FIXME
	} else this.recast();
	return this;
});
