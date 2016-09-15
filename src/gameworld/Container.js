/**
 * Container of entities -- e.g. map cell, napsack 
 */

var Container = inherit.component(inherit.Root, {
	_members: []
});

Container.defProto('add', function(item) {
	if (this.hasRoomFor(item))
		this._members.push(item);
});

Container.defProto('remove', function(member) {
 	this._members.splice(this._members.indexOf(member), 1);
});

Container.defProto('getMembers', function() {
	return this._members;
});

Container.defProto('hasRoomFor', function(item) {
	return true;
});

/**
 * A container for a single thing -- e.g. a scabbard or a hand
 *
 * TODO
 */
var Slot = inherit.component(Container);

