var Attribute = inherit.component(inherit.Root, {
	value: 10,
	baseValue: 10,
	minValue: 0,
	maxValue: 10,
	growthRate: 0
});

Attribute.defProto('clone', function() { // TODO generalize
	return new Attribute({
		value: this.value,
		baseValue: this.baseValue,
		minValue: this.minValue,
		maxValue: this.maxValue,
		growthRate: this.growthRate
	});
});


/**
 * Physical things positioned in the world, including terrain
 */
var Entity = inherit.component(inherit.Root, {
	shape: ' ',
	fg: '#fff',
	bg: '#000',
	plane: 0, // Vertical position within a level. Position terrain beneath
	          // animals, for example (TODO revisit)
  location: undefined,
  solidity: 1, // som.FLUID
	opacity: 0,

  lookslike: [],
	significance: 0, // Priority for display
	
	__static__som: {
		INSUBSTANTIAL: 0, // Passes through anything. E.g., ghosts
		FLUID: 1, // Like gases, water, or small things that can slip through cracks
		SOLID: 2, // Large objects that obstruct other large objects, like rocks and
    // trees
		IMPERMEABLE: 3 // Obstructs 'fluid' things. Like walls
	}
}, function() {
	// TODO del?
	if (this.pos) this.setPos(this.pos[0], this.pos[1]);

  if (!this.lookslike instanceof Array) 
    this.lookslike = [0.3, this.lookslike];

	var that = this;
});

/**
 * Get list of character attributes for this entity
 */
Entity.defProto('getAttributes', function() {
	var result = [];
	for (var k in this)
		if (Attribute.covers(this[k]))
			result.push(k);
	return result.sort();
});

Entity.defProto('getPos', function() {
	return this.location && this.location.getPos();
});

Entity.defProto('setLocation', function(newLoc) {
	if (this.location) this.location.remove(this);
	this.location = newLoc;
	newLoc.add(this);
	return this;
});

Entity.defProto('setPos', function(x, y) {
	var newCell = World.getMap(x,y);
	if (!newCell) return this;
	this.setLocation(newCell);
	return this;
});

Entity.defProto('delete', function() {
	this.location.remove(this);
});

Entity.defProto('collides', function(other) {
  if (other.plane != this.plane) return false;
  if (other.solidity == Entity.som.INSUBSTANTIAL || this.solidity == Entity.som.INSUBSTANTIAL)
    return false;

  if (other.solidity == Entity.som.IMPERMEABLE || this.solidity == Entity.som.IMPERMEABLE)
    return true;

  return other.solidity == Entity.som.SOLID && this.solidity == Entity.som.SOLID;
});

Entity.defProto('getImage', function(visibility) {
  if (visibility <= 0) return null;
  if (visibility <= this.lookslike[1])
    return this.lookslike[0].getImage();
  return this;
});

Entity.defProto('step', function(diff) {
	var newPos = u.addvec(diff, this.getPos());
  var newCell = World.getMap(newPos);
  if (! newCell.hasRoomFor(this)) return false;

	this.setPos(newPos);
  return true;	
});
