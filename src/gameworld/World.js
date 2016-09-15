// Examples of rain animation in rl here http://capsulegd.tumblr.com/post/119495059014/the-project-so-far

// next step: cleaning up actions
// image makes me think position and renderable should be different components
// 
// TODO
//  - Map generation
//    - segmented chunks of the world which either freeze, are abstracted, or
//      update when you visit them
//      - travel can involve random encounters -- wilderness, robbery, etc
//      - chunks can still be fairly large, have connections w/many others
//    - sparse data for big world
//      - deschedule entities that are far away, maybe abstract them somehow
//    - generating buildings, villages, caves etc
//  - recommendation system for actions. interface does less overlapping work
//  - specificity. Remembered, and probably seen, images of trees should be T
//    all the time after you get close enough to tell what they are. Maybe
//    everytime you draw something -- merge the image, where specific versions
//    of vague things do the same thing
//  - fix private variables
//  - inspector

/////////////// Game map and cells ///////////////
// TODO I noticed a random empty space once. make sure those don't happen


var World = {
  scheduler: new ROT.Scheduler.Action(),
  map: {}, // Coordinate string -> cells
	engine: null,
  width: 200,
  height: 200,
	// TODO simplify
	getMap: function(x_or_pos, opt_y) {
		var pos;
		switch(typeof x_or_pos) {
		case 'string': pos = x_or_pos;                 break;
		case 'object': pos = x_or_pos.join();          break;
		case 'number': pos = [x_or_pos, opt_y].join(); break;
		}

    var pos_vec = pos.split(',').map(Number);
    pos_vec[0] = (pos_vec[0] + World.width) % World.width;
    pos_vec[1] = (pos_vec[1] + World.height) % World.height;
    pos = pos_vec.join(',');
    
		if (!this.map[pos]) this.map[pos] = new Cell({pos: pos.split(',').map(Number)});
		return this.map[pos];
	},

	init: function() {
		console.log('initialize...');
		var starttime = new Date();
		this.engine = new ROT.Engine(World.scheduler);

		n = new Interface();
    h = new Human({name: 'You'}).schedule();
		n.attach(h);
		
		// f = new Firefly().schedule();
		var opts = n._display.getOptions();
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
		this.engine.start();
		console.log('init time: ', new Date() - starttime);
	}
};
