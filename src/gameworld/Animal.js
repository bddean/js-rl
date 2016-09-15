var Animal = inherit.component([Actor, Destructible], {
  opacity: 0.2,
  plane: 3,
  solidity: Entity.som.SOLID,
	_directionIdx: inherit.component.eval('Math.floor(Math.random() * 6)'),
	satiety: new Attribute({
		baseValue: 0,
		growthRate: 0.01
	})
});

Animal.defProto('decide', function() {
	if (Math.random() > 0.7) {
		this._directionIdx += (Math.random() > 0.5) ? 1 : -1;
		this._directionIdx = (this._directionIdx + 6) % 6;
	}
	
	return ['step', ROT.DIRS[6][this._directionIdx]];
});

Animal.defineAction({
  name: 'step',
  description: 'Move one cell',
  category: 'movement',
  key: ['w', 'e', 'a', 's', 'd', 'f',
				'm'],
  duration: 0.5,
  command: [Interface.prototype.getDir,
            function(dir) {
              if (!this.step(dir)) {
								throw new ActionRefusedException("There's something in the way.");
							}
            }]
});
