window.onload = function() {
	console.log('initialize...');
	var starttime = new Date();
	World.engine = new ROT.Engine(World.scheduler);

	n = new Interface();
  h = new Human({name: 'You'}).schedule();
	n.attach(h);
	
	// f = new Firefly().schedule();
	var map = new ROT.Map.Cellular(World.width, World.height, {
		topology: 6,
		born: [4, 5, 6],
		survive: [3, 4, 5, 6]
	});
	map.randomize(0.35);
  map.create();
	map.create(function(x, y, value) {
    var ran = ROT.RNG.getUniform();
		if (value == 1 && ran > 0.4) new Tree().setPos(x,y);
		else if (value == 1)         new Bush().setPos(x,y);
    else if (ran > 0.97) new Tree().setPos(x,y);
    else {
      if (ROT.RNG.getUniform() > 0.90) new LongGrass().setPos(x,y);
      else new Grass().setPos(x,y);

      if (ROT.RNG.getUniform() > 0.999) {
				h.setPos(x,y);
			}
			if (ROT.RNG.getUniform() > 0.995)
				new Firefly().schedule().setPos(x,y);

			if (ROT.RNG.getUniform() > 0.95) {
				new Stick().setPos(x,y);
				new Stone().setPos(x,y);
				new Banana().setPos(x,y);
			}
    }
	});
  map.randomize(0.25);
  map.create(function(x,y,value) {
    if(value == 1) {
      World.getMap(x,y).clear();
      new Water().setPos(x,y);
    }
  });

  n.initDisplay();
	World.engine.start();
	console.log('init time: ', new Date() - starttime);
};
