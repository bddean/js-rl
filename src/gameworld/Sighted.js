var Sighted = inherit.component(Entity, {
	_fovRadius: 4
});

Sighted.defProto('computeFOV', function(callback) {
  var that = this;
  var fov = new ROT.FOV.GradientShadowcasting(function(x, y) {
		var cell = World.getMap(x,y);
		return (1 - cell.getOpacity(that.plane));
	}, {topology: 6});

  fov.compute(this.getPos()[0], this.getPos()[1], this._fovRadius,
              function(x, y, r, visibility) {
                x %= World.width;
                y %= World.height;
								var cell = World.getMap(x,y);
								var visWithLight = Math.max(0, visibility + cell.getLighting() - 1);
                callback(x, y, cell.getEntitiesImage(visibility),
                         r, visWithLight, cell.getLighting());
              });

});
