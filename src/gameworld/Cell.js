/**
 * Cell -- basic component of the game map. Each physical entity in the game
 *   world is always in a single cell at any give time
 */
var Cell = inherit.component(Container, {
  pos: null,
	_lightSources: [] // List of objects of form {intensity, key}
	//    - intensity: intensity of light
	//    - key: identify light source at a time. If light source changes, is
	//      interrupted, or is blocked, it should change
});

Cell.defProto('getPos', function() {
	return this.pos;
});

Cell.defProto('clear', function() {
  for (var i = 0; i < this._members.length; i++)
    this._members[i].delete();
  this._members = [];
});

// TODO assumes sorted entities
Cell.defProto('getEntitiesImage', function(visibility) {
  visibility = visibility || 1;
  var result = [];
  var image;
	for (var i = this._members.length-1; i >= 0; i--) {
    image = this._members[i].getImage(visibility);
    if (image) result.push(image);
    visibility -= this._members[i].opacity;
		if (visibility <= 0) break;
  }

  return result;
});

Cell.defProto('getVisibleEntities', function(visibility) {
  visibility = visibility || 1;
	var i;
	for (i = this._members.length-1; i >= 0; i--)
		if (!this._members[i].opacity == 1) 
			break;

  var entities = this._members.slice(i);
  
	return this._members.slice(i);
});

// TODO should probably depend on plane of observer
Cell.defProto('getOpacity', function(plane) {
  if (this._members.length === 0) return 0;
	return Math.max.apply(null, this._members.map(function(e) {
		return (e.plane == plane) ? e.opacity : 0;
	}));
});

Cell.defProto('hasRoomFor', function(entity) {
  var arr = [];
  return ! this._members.some(function(e) {
    return e.collides(entity);
  });
});

Cell.defProto('illuminate', function(source, key, intensity) {
	this._lightSources.push({source: source, key: key, intensity: intensity});
});

Cell.defProto('getLighting', function() {
	intensity = 0.3; // TODO abstract this
	// TODO lambda should be in 'utilities' or something
	this._lightSources.forEach(inherit.lambda('x.source.shine()'));
	this._lightSources = this._lightSources.filter(function(e, i) {
		if (e.source && e.source.validate(e.key)) {
			intensity += (e.intensity || 0);
			return true;
		}
		return false;
	});
	return Math.min(1, intensity);
});

Cell.defProto('refreshLighting', function() {
	this._lightSources.forEach(function(x) { x.source.recast(); });
	// var oldSources = this._lightSources;
	// this._lightSources = [];

	// oldSources.forEach(function(e, i) {
	// 	if (e.source && e.source.validate(e.key))
	// 		e.source.recast();
	// });
});

// TODO maintain entities as a sorted list
Cell.defProto('add', function(entity) {
  this._members.push(entity);
	if (entity.opacity > 0) this.refreshLighting();
});

Cell.defProto('remove', function(entity) {
 	this._members.splice(this._members.indexOf(entity), 1);
	if (entity.opacity > 0) this.refreshLighting();
});
