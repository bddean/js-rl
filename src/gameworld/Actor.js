
/**
 * Interface for objects that go in the ROT.js scheduler. Define actions with
 * Actor#defineAction. Implementing class X must define X#decide to choose an
 * action.
 *
 */
var Actor = inherit.component(inherit.Root);

function ActionRefusedException(sMessage) {
    this.name = 'ActionRefusedException';
    this.message = sMessage;
    this.stack = (new Error()).stack;
}
ActionRefusedException.prototype = Object.create(Error.prototype);
ActionRefusedException.prototype.constructor = ActionRefusedException;

Actor.defProto('act', function() {
	World.engine.lock();
	var decision;
	if (this.interface) decision = this.interface.decide();
	else decision = this.decide();
	Promise.resolve(decision).then((function(actionParams){
		if (!actionParams) return;
		// TODO lock here instead of in interface?
		if (typeof actionParams[0] !='string' && typeof actionParams !='string') {
			throw new Error('Action must be of form [ACTIONNAME, PARAMS...]');
		}

		if (typeof actionParams == 'string') actionParams = [actionParams];
		var actionName = actionParams.shift();
		var action = this.getAction(actionName);
		if (!action) return;
		World.scheduler.setDuration(action.duration / (this.speed || 1));
		var command = utilities.wrap(action.command);
		try {
			command[command.length - 1].apply(this, actionParams);
		} catch(e) {
			if (!(e instanceof ActionRefusedException))
				throw e;
		} finally {
			World.engine.unlock(); // for async decides, especially via interface
		}
	}).bind(this));
});

Actor.defProto('decide', function() { return false;});

Actor.defProto('schedule', function() {
  initialDelay = Math.random() * (this.speed || 0);
  World.scheduler.add(this, true, initialDelay);
  return this;
});

Actor.defProto('unschedule', function() {
  World.scheduler.remove(this);
  return this;
});

Actor.defProto('delete', function() {
	this.$super();
	this.unschedule();
});

// Document
Actor.defStatic('defineAction', function(spec) {
  // TODO: ei promises polyfill
  // Maybe instead of "command", "event" or "result"
  if (!spec['name'       ]) throw new Error('No name given in action spec');
  if (!spec['description']) throw new Error('No description given in action spec');
  if (!spec['category'   ]) throw new Error('No category given in action spec');
  if (!spec['command'   ])  throw new Error('No command given in action spec');
  
	if (!(spec.key instanceof Array)) spec.key = [spec.key];

	var fnspec, argspec;
	if (typeof spec.command == 'function') {
		fnspec = spec.command;
		if (typeof spec.params == 'function') {
			argspec = [spec.params];
		} else {
			argspec = /\(\s*([^)]*?)\s*\)/.exec(fnspec.toString())[1].split(',')
				.filter(function(paramName) {
					return paramName.match(/[^\s]/);
				})
				.map(function(paramName) {
					paramName = paramName.trim();
					return spec.params[paramName];
				});
		}
	} else if (spec.command instanceof Array) {
		fnspec = spec.command[spec.command.length - 1];
		argspec = Array.prototype.slice.call(spec.command, 0, spec.command.length-1);
	}
	else throw new Error('command must be array or function ');
	
  var interactiveFn = function(interface) {
    var params = [];
    var promise = Promise.resolve();
    argspec.forEach(function(selector) {
      promise = promise.then(selector.bind(interface)).then(function(arg) {
        params.push(arg);
      });
    });
    // promise = promise.then(function() {
    //   fnspec.apply(interface.getSubject(), params);
    // });
    return promise.then(function() {
			return params;
		});
  };
  spec.interactive = interactiveFn;
	this.defProto(spec.name + 'Action', spec);
});

Actor.defProto('getActionsByKeybind', function() {
	if (this._actionsByKey) return this._actionsByKey;
	this._actionsByKey = {NONE: []};
	
	var that = this;
	for (var k in this) {if (k.endsWith('Action') && this[k].key) {
		this[k].key.forEach(function(x) {that._actionsByKey[x] = that[k];});
	}}
	return this._actionsByKey;
});

Actor.defProto('getAction', function(actionName) {
	return this[actionName + 'Action'];
});
