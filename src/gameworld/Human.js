var Human = inherit.component([Animal, Sighted], {
	name: 'human',
	shape: '@',
  bg: 'black',
  significance: 9999,
	speed: 1.0,
	inventory: new Container(),

	_fovRadius: 15
});

Human.defineAction({
  name: 'wait',
  description: 'Do nothing',
  category: 'movement',
  key: 'q',
  duration: 0.5,
  command: function() {}
});

Human.defineAction({
	name: 'take',
	description: 'Pick up things at the current location',
	category: 'item management',
	key: ',',
	duration: 0.25,
	params: function() {
		console.log('getting params...');
		var options = this._subject.location.getMembers().filter(function(e) {
			return e.isinstance(Portable); // TODO make mixins work
		});

		console.log('options', options);
		if (options.length == 0) 
			throw new ActionRefusedException("There's nothing portable here.");

		if (options.length == 1) 
			return options;

		return this.selectMultipleEntities('Pick up what?', options);
	},
	command: function(entities) {
		var that = this;
		entities.forEach(function(e) {
			e.setLocation(that.inventory);
			if (that.interface) that.interface.echo('Picked up ' + e.name);
		});
	}
});

// TODO probably parse function separate out command params into keyword params
// object optionally
Human.defineAction( {
	name: 'drop',
	description: 'Drop an item in inventory on the ground',
	key: '.',
	category: 'item management',
	duration: 0.15,
	params: function() {
		if (this._subject.inventory.getMembers().length == 0) 
			throw new ActionRefusedException('You have nothing to drop.');
		return this.selectOneEntity('Drop what?', this._subject.inventory.getMembers(), 
																'inventory');
	},
	command: function(item) {
		item.setLocation(this.location);
	}
});
