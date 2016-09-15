// TODO Order shouldn't matter (so initialize everything only after everything loads)
// TODO Require explicit override for conflicts -- except child always
//      overrides ancestor
// TODO Think of a clever name
// TODO Implement method hooks
// TODO interfaces / abstract props
// TODO single fn
// TODO dynamic defproto
// TODO generic clone

/**
 * Multiple inheritance. Mixin-flavored.
 */
var inherit = {};

(function() {
	var lambda = function(opt_vars, expr) {
		var vars;
		if (arguments.length == 1) { 
			expr = opt_vars;
			vars = 'x,y,z,a,b,c';
		} else vars = opt_vars;
		var args = vars.split(',');

		// Can't use function constructor -- expression needs to compile when lambda
		// is called for closures to work
		return function() {
			var ctx = {};
 			for (var i = 0; i < arguments.length; i++) {
				ctx[args[i]] = arguments[i];
			}
			
			with(ctx) { 
				try {
					return eval(expr); 
				} catch(e) {
					throw e;
				}
			}
		};
	};
	
	var UNIMPLEMENTED = /*an arbitrary unique value*/
			function() {throw new Error('Function not implemented');};

	var LazyValue = function(str_or_fn) {
		this.value = str_or_fn;
	};
	LazyValue.prototype.get = function(that) {
		if (typeof this.value == 'string')
			return eval(this.value);
		return this.value.apply(that);
	};


	clone = function(o) {
		if (o instanceof LazyValue) return o.get();
		else if (o instanceof Array) 
			return o.slice(0);
		else if (typeof o == 'object' && o && typeof o.clone == 'function') return o.clone();
		else if (typeof o == 'object' && o !== null && o != UNIMPLEMENTED) {
			var clone = Object.create(Object.getPrototypeOf(o));
			for (var k in o) { 
				if (o.hasOwnProperty(k)) {
					clone[k] = o[k];
				}
			}
			return clone;
		}
		else
			return o;
	};


	// todo: separate single-function mixins from real parents, add them to proto
	var component = function(parents, attrs, init) {
		if (!(parents instanceof Array)) parents = [parents];
		
		if (!(parents.every(u.identity)))
			throw new Error('Parent undefined');
		
		parents.sort(lambda('(y.depth || 0) - (x.depth || 0)'));
		attrs = attrs || {};

		var Constructor = function(spec) {
			var k;

			for (k in Constructor.instanceProperties)
				if (Constructor.instanceProperties.hasOwnProperty(k))
					this[k] = clone(Constructor.instanceProperties[k]);

			for (k in spec)
				if (spec.hasOwnProperty(k))
					this[k] = spec[k];

			if (Constructor.init) Constructor.init.call(this, spec); 
			var that = this;
			parents.forEach(function(x) {if (x.init) x.init.call(that); });
			this.constructor = Constructor;
		};
		Constructor.init = init;


		Constructor.propertyDepths = {
			instanceProperties: {},
			prototype: {},
			staticProperties: {}
		};

		Constructor.instanceProperties = {};
		Constructor.prototype = {};
		Constructor.staticProperties = Constructor; // Just for consistency / convenience
		
		parents.sort(lambda('(y.depth || 0) - (x.depth || 0)'));
		Constructor.parents = parents;
		Constructor.depth = 1 + Math.max.apply(null, parents.map(lambda('x.depth || 0')));

		['instanceProperties', 'prototype', 'staticProperties'].forEach(function(placement) {
			parents.forEach(function(parent) {
				for (k in parent[placement]) // if (parent[placement].hasOwnProperty(k)) TODO??
				{
					if (['instanceProperties', 'prototype', 'staticProperties', 
							 'propertyDepths', 'parents', 'depth'].indexOf(k) > -1) 
						continue;
					if (!Constructor[placement].hasOwnProperty(k) ||
							parent.propertyDepths && parent.propertyDepths[placement][k] > 
							(Constructor.propertyDepths[placement][k] || -1)) {
			
						var value = clone(parent[placement][k]); // TODO clone, consol
						Constructor[placement][k] = parent[placement][k];

						Constructor.propertyDepths[placement][k] = 
							(parent.propertyDepths && parent.propertyDepths[placement])
							? (parent.propertyDepths[placement][k] || 1) : 1;
						
					}
				}
			});
		});

		for (var k in attrs) if (attrs.hasOwnProperty(k)) {
			var value = clone(attrs[k]);

			// Directives
			var match;
			if ((match=k.match(/__(.*?)__(.*)/))) {
				directive = match[1]; // i.e. __static__, __inst__, or __proto__
				// TODO ^assert w/error
				k = match[2];
			} else {
				directive = (typeof value == 'function') ? 'proto' : 'inst';
			}
			
			// Put attribute in right place
			var placement = ({inst     : 'instanceProperties',
												proto    : 'prototype',
  											'static' : 'staticProperties'})[directive];

			Constructor.propertyDepths[placement][k] = 
				Constructor.propertyDepths[placement][k] || 0;
			Constructor.propertyDepths[placement][k] += 1;

			if (typeof Constructor[placement][k] == 'function' &&
					typeof value == 'function')
				value.overrides = Constructor[placement][k];
			Constructor[placement][k] = value;
		}

		// TODO // delete Constructor.static; 
		return Constructor;
	};
	component.eval = function(str_or_fn) {
		return new LazyValue(str_or_fn);
	};

	// TODO prefix everything with '$'?
	var Root = component(Object, {
		__static__defProto: function(name, fn) {
			// TODO propagate downward to children so this works dynamically
			if (this.prototype.hasOwnProperty(name)) {
				this.propertyDepths.prototype[name]++;
				if (typeof fn == 'function')
					fn.overrides = this.prototype[name];
			}
			this.prototype[name] = fn;
		},

		__static__defStatic: function(name, fn) {
			if (this.hasOwnProperty(name)) {
				this.propertyDepths.static[name]++;
				if (typeof fn == 'function')
					fn.overrides = this[name];
			}
			this[name] = fn;
		},

		__static__inherits: function(elder) {
			return this.parents.some(function(p) {
				if (p == elder) return true;
				if (!p.inherits) return false;
				return (p.inherits(elder));
			});
		},

		__static__covers: function(possibleChild) {
			return possibleChild && possibleChild.isinstance && possibleChild.isinstance(this);
		},

		__static__$super: function() { this.$super.caller.overrides.apply(this, arguments); },
          		$super: function() { this.$super.caller.overrides.apply(this, arguments); },

		isinstance: function(elder) {
			return this.constructor === elder || this.constructor.inherits(elder);
		}
	});
 	var _ancestorsDepthFirst = function(o) {
		if (!o.parents || !o.parents.length) return [];
		return o.parents.reduce(function(a,b) {
			return _ancestorsDepthFirst(a).concat(_ancestorsDepthFirst(b));});
	};

	var _ancestorsBreadthFirst = function(o, result) {
		result = result || [];
		if (!o.parents || !o.parents.length) return [o];
		
		var stack = [o];
		while(stack.length) {
			var child = stack.shift();
			result.push(child);
			if (child.parents && child.parents.length) {
				stack = stack.concat(child.parents);
			}
		}

		return result;
	};

	// TODO del
	function AbstractProperty(pred) {
		this.predicate = pred;
	};

	var abstract = {
		type: function(name) {
			return new AbstractProperty(function(val) {
				return typeof val == name;
			});
		},
		signature: function(params) {
			params = params || '';
			var sig = params.split(',').length;
			return new AbstractProperty(function(value) {
				return (typeof value == 'function' &&
								sig == /\(\s*([^)]*?)\s*\)/.exec(value.toString())[1].split(',').length);
			});
		}
	};

	inherit = {
		component: component,
		UNIMPLEMENTED: UNIMPLEMENTED,
		lambda: lambda,
		Root: Root
	};
})();

inherit.test = function() {
	var i = inherit;

	var C1 = i.component(Object, {
		a: 1,
		b: 2,
		__static__sa: 3,
		meth1: function() {console.log('meth1 in C1');}
	});
	var c1 = new C1();
	console.log('c1', c1);

	var C2 = i.component(Object, {
		c: 3,
		d: 4,
		meth2: function() {console.log('meth2 in C2');}
	});
	var c2 = new C2();
	
	console.log('c2', c2);

	var C12a = i.component([C1, C2], {
		a: 11, c:33,
		meth1: function() {console.log('C12 a meth1');}
	});
	
	var c12a = new C12a();
	console.log('c12a', c12a);
	c12a.meth1();
	
	var C12b = i.component([C1, C2], {
		meth1: function() {console.log('C12 b meth1');}
	});

	var c12b = new C12b();
	console.log('c12b', c12b);

	var C12aa = i.component(C12a, {
		meth1: function() {console.log('C12 aa meth1');}
	});

	var c12aa = new C12aa();
	console.log('c12aa', c12aa);

	var C1x = i.component([C12b, C12aa]);
	var c1x = new C1x();
	console.log('c1x', c1x);
	c1x.meth1();
};
