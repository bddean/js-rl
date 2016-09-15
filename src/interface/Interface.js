// TODO Interface depends on Actor for ActionRefusedException -- can we change
//      that?
// TODO Split into many components. View & Controller?

var Interface = inherit.component(inherit.Root, {
	_display: null,
	_menuDisplay: null,
	_promptDisplay: null,
	_messageBuffer: null,
	// _statusBarStats: ['hp', ],
	// _statusBarEls: {},

	_camera: [0,0],
	_subject: null,
	_subjectAttrs: [],
	_subjectDecide: null,
	_selection: null,
	_memory: {},
	_specialHandler: null,
	_resolvePromise: null,
	_keys: {},
	_keygenerators: {},

	__static__commands: [],

	// TODO maybe an approach like this is better than current one
	//   - customizable
	//   - key collisions less likely
	//   - allows automatic extensions for weird commands (though not persistence)
	_keymap: { /*scratch*/
		'w': 'step', 'e': 'step', 'a': 'step',
		's': 'step', 'd': 'step', 'f': 'step',

		'q': 'wait',

		',': 'take', 
		'.': 'drop'
	}
});

Interface.defStatic('defCommand', function(spec) {
  if (!spec['name'       ]) throw new Error('No name given in action spec');
  if (!spec['description']) throw new Error('No description given in action spec');
  if (!spec['command'   ])  throw new Error('No command given in action spec');

	if (this.commands.some(function(c) {
		return c.name == spec.name;
	})) 
		return;

	this.commands.push(spec);
});


////////// Display Methods //////////
Interface.defProto('initDisplay', function() {
	this._display = new ROT.Display({
	  width: 100,
	  height: 40,
	  fontSize: 14,
	  layout: 'hex'
	});

  var opts = this._display.getOptions();

  this._menuDisplay = new ROT.Display({
    width: 30,
    height: opts.height - 1,
    fg: 'black',
    bg: 'grey',
    fontSize: opts.fontSize
  });

  this._promptDisplay = new ROT.Display({
    width: 88,
    height: 1,
    fontSize: opts.fontSize,
    fg: 'black',
    bg: 'grey'
  });

	this._statusDisplay = new ROT.Display({
		width: 12,
		height: 20, // TODO dynamically resize
		fontSize: 12,
		fg: 'black',
		bg: 'grey'
	});
	
	this._messageBuffer = document.getElementById('message-buffer');

  var container = this._display.getContainer();
  container.className = 'game';

  var menuContainer = this._menuDisplay.getContainer();
  menuContainer.className   = 'overlay hidden menu';

	var statusContainer = this._statusDisplay.getContainer();
	statusContainer.className = 'overlay visible status';

  var promptContainer = this._promptDisplay.getContainer();
  promptContainer.className = 'overlay hidden';

  document.getElementById('game-container').appendChild(container);
  document.getElementById('game-container').appendChild(menuContainer);
  document.getElementById('game-container').appendChild(statusContainer);

  document.getElementById('echo-container').appendChild(promptContainer);

  var that = this;
  container.addEventListener('mouseleave', function() {
    that._selection = null;
    that.drawVision();
  });

  container.addEventListener('mousemove', function(e) {
    that._selection = that._eventToPosition(e);
    that.drawVision();
  });

  container.addEventListener('click', function(e) {
    that.handleClick(e);
  });
});

// TODO generic way to represent character stats. Need to support:
//   - Introspection -- by decide function or interface
//   - Also may be able to see other's stats
//   - Inheritable
//   - Adding and subtracting (bounded by max/min)
//   - Stackable (named? timed?) buffs
//   - Listing -- i.e. registered, not just attrs with special values
Interface.defProto('dispStatus', function() {
	this._statusDisplay.clear();
	var row = 0;
	var that = this;
	var attrnames = this._subject.getAttributes();
	console.log('attrnames', attrnames);
	
	var value, disp, abbrev;
	if (this._statusDisplay.getOptions().height != attrnames.length)
		this._statusDisplay.setOptions({height: attrnames.length});
	attrnames.forEach(function(attr) {
		console.log('draw' ,attr, that._subject[attr]);
		var abbrev = attr.substring(0, 3);
		var value = that._subject[attr];
		var disp = (value.value == value.baseValue) ? 
					value.value+'' : value.value + '/' + value.baseValue;

		that._statusDisplay.drawText(
			1, row, abbrev + ' ' + disp);
		row++;
	});
});

Interface.defProto('getCellInfoDisplayHTML', function(title, x, y, image) {
  return u.tag('div', u.tag('b', title), u.tag('i', x, ', ', y)) +
    u.tag('b', image.map(function(e) {
      return u.tag('div', 
								 '<div class="entityrep" style="' 
								 , 'background-color:' + e.bg  + ';'
								 , 'color:' + e.fg + '">' 
								 , ((e.shape == ' ') ? '&nbsp;' : e.shape)
								 , '</div>'
								 , '&nbsp;' + u.tag('span', e.name));
    }).join(' '));
});

Interface.defProto('drawVision', function() {
	this.dispStatus();
	this._display.clear();
  for (var pos in this._memory) {
    var vec = pos.split(',').map(Number);
    this.drawCell(vec[0], vec[1], this._memory[pos].map(function(e) {
      return {shape: e.shape, significance: e.significance,
              fg: [70,70,70], bg: [10,10,10]};
    }), 1, 1);
  }

	var that = this;
  this._subject.computeFOV(function(x, y, image, r, vis, light) {
    x = x % World.width;
    y = y % World.height;
    if (!vis) return;
    that.drawCell(x, y, image, vis, light);

		var spos = that._subject.getPos();
		if (spos && x == spos[0] && y == spos[1]) {
			document.getElementById('player-location-info').innerHTML = 
												that.getCellInfoDisplayHTML('Standing at', x, y, image);
		};

    if (that._selection &&
        x == that._selection[0] && 
        y == that._selection[1]) {
      document.getElementById('selection-info').innerHTML =
        that.getCellInfoDisplayHTML('Looking at', x, y, image);
    }
  });
  if (this._selection)
    this._display.draw(this._selection[0] - this._camera[0], 
                       this._selection[1] - this._camera[1],
                       'X', 'yellow', 'transparent');
  else document.getElementById('selection-info').innerHTML = '';
});

////////// Menus and Prompts //////////
Interface.defProto('_showprompt', function(msg) {
  this._promptDisplay.clear();
  this._promptDisplay.getContainer().className = "overlay visible";
  this._promptDisplay.drawText(0, 0, msg);
});

Interface.defProto('promptChar', function(msg) {
  if(msg) this._showprompt(msg); // TODO require?
  var resolve;
  var promise = new Promise(function(r) {
    resolve = r;
  });
  this._specialHandler = function(e) {
    var c = String.fromCharCode(e.which);
    resolve(c);
    this._specialHandler = null;
  };
  return promise;
});

Interface.defProto('getDir', function() {
  var c = String.fromCharCode(this._lastEvent.which);
  var dirKeys = {
    'w' : ROT.DIRS[6][0],
    'e' : ROT.DIRS[6][1],
    'f' : ROT.DIRS[6][2],
    'd' : ROT.DIRS[6][3],
    's' : ROT.DIRS[6][4],
    'a' : ROT.DIRS[6][5]
  };
  if (dirKeys[c]) return dirKeys[c];
  
  // If not bound to a direction key, prompt for the direction
  var that = this;
  return this.promptChar('Direction: ').then(function(c) {
    that.hidePrompt();
    return dirKeys[c] || Promise.reject(new ActionRefusedException(
			'Valid direction keys are "weasdf"'));
  });
});

Interface.defProto('_emphText', function(text) {
	var opts = this._menuDisplay.getOptions();
	return "%c{" + opts.bg + "}%b{" + opts.fg + "}" 
		+ text 
		+ "%c{" + opts.fg + "}%b{" + opts.bg + "}";
});


Interface.defStatic('_KeyGenerator', inherit.component(inherit.Root, {
		count: 0,
		__static__keyorder: 'asdfjklghqweruiopxcvnmtygbnASDFJKLGHQWERUIOPXCVNMTYGBN',
		__static__prefix: ';',
		__proto__getNext: function() {
			var len = this.constructor.keyorder.length;
 			var numrepeats = Math.floor(this.count / len);
			var index = this.count % len;
			this.count ++;

			return new Array(numrepeats + 1).join(this.constructor.prefix) + 
				this.constructor.keyorder[index];
		}
}));

/**
 * @items list of objects {name: String, value: ?, [, category: {string}]}
 */
Interface.defProto('_showList', function(prompt, items, options) {
	var keystype = options.keystype;
	var prefill = options.prefill || {};

	items = items.map(function(it) {
		return (typeof it == 'string') ? {name: it, value: it} : it;
	});

	var keygen, keys;
	if (keystype) {
		keygen = this._keygenerators[keystype] = 
			this._keygenerators[keystype] ||
			new this.constructor._KeyGenerator();

		keys = this._keys[keystype] = this._keys[keystype] || {};
	} else {
		keygen = new this.constructor._KeyGenerator();
		keys = {};
	}

	// Sort into categories
	var that = this;
	var categories = {};
	items.forEach(function(it) {
		var cat = it.category || 'Default';
		if (!categories[cat]) categories[cat] = [];
		var result;
		if (categories[cat].some(function(e) { return e.name == it.name && (result = e); })) {
			result.values.push(it.values);
		} else {
			categories[cat].push({name:  it.name, 
														values: [it.value]});
		}
	});
	var sortedCategories = Object.keys(categories).sort();
	lines = [];
	
	// Display, looking up / generating keys for each
	var menu = {};
	sortedCategories.forEach(function(cat) {
		if (sortedCategories.length > 1) lines.push(that._emphText(cat));
		categories[cat].forEach(function(item) {
			var id = cat + '/' + item.name;
			var key = keys[id] = keys[id] || keygen.getNext();


			menu[key] = item.values;
			lines.push(key + (prefill[key] ? ' + ' : ' - ')
								 + (item.values.length == 1 ? '' : item.values.length + 'x ')
								 + item.name);
		});
	});
	this.showMenu(prompt, lines);
	return menu;
});

// TODO? abbreviated select-one menu, like nethack
Interface.defProto('selectOne', function(prompt, items, opt_keystype) {
	var menu = this._showList(prompt, items, {keystype: opt_keystype});

	var resolve, cancel;
	var promise = new Promise(function(r, c) {
		resolve = r;
		cancel = c;
	}).catch((function(err) {
		if (err instanceof ActionRefusedException) {
			if (err.message) this.echo(err.message);
		} else throw err;
	}).bind(this));
	// TODO should pass char not event
	this._specialHandler = function(e) {
		var c = String.fromCharCode(e.which);
		if (menu[c]) {
			resolve(menu[c][0]);
			this.hideMenu();
			this._specialHandler = null;
		} else if (c == 'z') {
			cancel(new ActionRefusedException());
			this.hideMenu();
			this._specialHandler = null;
		}
	};
	return promise;
});

Interface.defProto('selectMultiple', function(prompt, items, opt_keystype) {
	var selection = {};
	
	var options = {
		keystype: opt_keystype,
		prefill: selection
	};

	var resolve, cancel;
	var promise = new Promise(function(r, c) {
		resolve = r;
		cancel = c;
	}).catch((function(err) {
		if (err instanceof ActionRefusedException) {
			if (err.message) this.echo(err.message);
		} else throw err;
	}).bind(this));

	var menu = this._showList(prompt, items, options);
	this._specialHandler = function(e) {
		var c = String.fromCharCode(e.which);
		if (menu[c]) { // Toggle selection
			selection[c] = !selection[c];
			this._showList(prompt, items, options);
		} else if (c == ',') { // (Un)select all
			var unselect = Object.keys(menu).every(function(m) {
				return selection[m];
			});

			Object.keys(menu).forEach(function(m) {
				selection[m] = !unselect;
			});
			this._showList(prompt, items, options);
		} else if (e.code == 'Enter') { // Confirm
			console.log('selection', selection);
			var result = [];
			for (var s in selection) if (selection[s]) {
				result = result.concat(menu[s]);
			}
			resolve(result);
			this.hideMenu();
			this._specialHandler = null;
		} else if (c == 'z') { // Cancel
			cancel(new ActionRefusedException());
			this.hideMenu();
			this._specialHandler = null;			
		}
	};

	return promise;
});

Interface.defProto('_entitiesList', function(entities) {
	var items = entities.map(function(e) {
		var rep = '%c{' + e.bg + '}%b{' + e.fg + '}' 
					+ e.shape + '%c{}%b{} ' + e.name;
		return {name: rep, value: e};
	});
	return items;
});

Interface.defProto('selectOneEntity', function(prompt, entities, opt_keystype) {
	return this.selectOne(prompt, this._entitiesList(entities), opt_keystype);
});

Interface.defProto('selectMultipleEntities', function(prompt, entities, opt_keystype) {
	return this.selectMultiple(prompt, this._entitiesList(entities), opt_keystype);
});

Interface.defProto('echo', function(msg) {
	var msgEl = document.createElement('div');
	msgEl.className = 'echo-message';
	msgEl.textContent = msg;
	this._messageBuffer.insertBefore(msgEl, this._messageBuffer.firstChild);
	this._messageBuffer.scrollTop = 0;
});

Interface.defProto('hidePrompt', function() {
  this._promptDisplay.clear();
  this._promptDisplay.getContainer().className = "overlay hidden";
});

Interface.defProto('hideMenu', function() {
  // this._menuDisplay.getContainer().style.display = "none";
  this._menuDisplay.getContainer().className = "overlay hidden menu";
});

Interface.defProto('showMenu', function(caption, items) {
  this._menuDisplay.clear();
  this._menuDisplay.getContainer().className = "overlay visible menu";
  var opts = this._menuDisplay.getOptions();
  this._menuDisplay.drawText((opts.width - caption.length) / 2, 0,
														 this._emphText(caption));
	var that = this;
  items.forEach(function(e, i) {
    that._menuDisplay.drawText(2, i + 1, e);
  });
});


// TODO real functionality
////////// Game Interaction //////////
Interface.defProto('_eventToPosition', function(e) {
  return u.addvec(this._display.eventToPosition(e), this._camera, 
							 // Sometimes requires this offset, sometimes doesn't -- TODO figure
							 // it out
							 [0, 0]);
});

Interface.defProto('handleClick', function(e) {
  var coords = this._display.eventToPosition(e);
  coords = [coords[0] + this._camera[0], coords[1] + this._camera[1]];
  console.log(World.getMap(coords).pos);
});

Interface.defProto('attach', function(entity) {
	this._subject = entity;
	this._subjectDecide = entity.decide;
  this._subject.interface = this;

	var narrator = this;
	entity.decide = function() {
		return narrator.decide();
	};

	this._subjectAttrs = this._subject.getAttributes();
});

Interface.defProto('detach', function() {
	this._subject.decide = this._subjectDecide;
	this._subject = null;
	this._subjectDecide = null;
  this._subject.interface = null;
});

Interface.defProto('centerCamera', function() {
	var dispOpts = this._display.getOptions();
	var diff = [-dispOpts.width / 2,
							-dispOpts.height / 2];
	this._camera = u.addvec(this._subject.getPos(), diff);
});

Interface.defProto('drawCell', function(x, y, image, visibility, lighting) {
	lighting = lighting || 1.0;
  x = (x + World.width) % World.width;
  y = (y + World.height) % World.height;

  this._memory[x + ',' + y] = image;

	var pos = x + ',' + y;
	var relativeX = (x - this._camera[0] + World.width) % World.width;
	var relativeY = (y - this._camera[1] + World.height) % World.height;
	var entity = image[0];
	var sig = entity && entity.significance || -Infinity;
	image.forEach(function(e) { 
		if (e.significance > sig) {
			entity = e;
			sig = e.significance;
    }
  });
	entity = entity || { shape: ' ', fg: 'grey', bg: 'grey' };
  var fg = (typeof entity.fg == 'string') ? ROT.Color.fromString(entity.fg) : entity.fg;
  var bg = (typeof entity.bg == 'string') ? ROT.Color.fromString(entity.bg) : entity.bg;

	var shadow = (1 - lighting) / 2;//Math.min(1, Math.pow(lighting, 2));
  var fadeout = ROT.Color.fromString('black');
  fg = ROT.Color.interpolate(fg, fadeout, shadow);
  bg = ROT.Color.interpolate(bg, fadeout, shadow);

  // TODO this stuff should maybe be only on display side
  this._display.draw(relativeX, relativeY,
										 entity.shape, 
                     ROT.Color.toHex(fg), ROT.Color.toHex(bg), 
                     visibility >= 0.95 ? 0 : (1-visibility) * 0.65);
});

Interface.defProto('handleEvent', function(e) {
  this._lastEvent = e;
  if (this._specialHandler) {
		this._specialHandler(e);
    return;
  }

  // TODO use constants http://ondras.github.io/rot.js/manual/#keyboard
	var c = String.fromCharCode(e.which);

	var intcmd;
	// Interface-specific commands. Don't register these commands as actions since
	// they are private to the interface. A touch interface, for example, would
	// have a different set of interface commands and a different way to access
	// them.
	if ('1234567890'.indexOf(c) != -1) {
		if (c == '5') this.centerCamera();

		// Pan camera (TODO define a command)
		else if (c == '7') this._camera = u.addvec(this._camera, ROT.DIRS[6][0]);
		else if (c == '8') this._camera = u.addvec(this._camera, ROT.DIRS[6][0], ROT.DIRS[6][1]);
		else if (c == '9') this._camera = u.addvec(this._camera, ROT.DIRS[6][1]);
		else if (c == '6') this._camera = u.addvec(this._camera, ROT.DIRS[6][2]);
		else if (c == '3') this._camera = u.addvec(this._camera, ROT.DIRS[6][3]);
		else if (c == '2') this._camera = u.addvec(this._camera, ROT.DIRS[6][3], ROT.DIRS[6][4]);
		else if (c == '1') this._camera = u.addvec(this._camera, ROT.DIRS[6][4]);
		else if (c == '4') this._camera = u.addvec(this._camera, ROT.DIRS[6][5]);

		this.drawVision();
	} else if (this.constructor.commands.some(function(e) {
		return e.key == c && (intcmd = e);
	})) {
		try {
			intcmd.command.apply(this);
		} catch(e) {
			if (e instanceof ActionRefusedException) {
				if (e.message) this.echo(e.message);
			} else throw e;
		}
	} else {
		var action = this._subject.getActionsByKeybind()[c];
		if (action) {
      var that = this;
			action.interactive(this).then(
				function endTurn(argspec) {
					that.drawVision();
					window.removeEventListener('keypress', that);
					that.hidePrompt();
					this._resolvePromise([action.name].concat(argspec));
					this._resolvePromise = null;
				}, 
				function clean(err) {
					if (err && err.name == 'ActionRefusedException' && 
							err.message && err.message.length) {
						that.echo(err.message);
						return;
					}
					that.hidePrompt();

					if (err && err.name != 'ActionRefusedException') throw err;
			});
			return;
		}
	}
});

Interface.defProto('getSubject', function() {
  return this._subject;
});

Interface.defProto('decide', function() {
  // FIXME not sure the math works for height for hex
  var opts = this._display.getOptions();
  var cx = u.clamp(this._subject.getPos()[0] - this._camera[0], 0, opts.width);
  var cy = u.clamp(this._subject.getPos()[1] - this._camera[1], 0, opts.height);
  var that = this;
  var ltefov = function(n) {return n <= that._subject._fovRadius;};
  // TODO private
  if ([cx, opts.width - cx, cy, opts.height - cy].some(ltefov)) {
    this.centerCamera();
  }

  this.drawVision();
	window.addEventListener('keypress', this);
	return new Promise(function(r) {
		this._resolvePromise = r;
	});

});

////////// Interface Commands //////////
Interface.defCommand({
	name: 'inventory',
	description: 'List items the player is carrying',
	key: 'i',
	command: function() {
		return this.selectOneEntity('Inventory', this._subject.inventory.getMembers(), 
																'inventory');
	}
});
