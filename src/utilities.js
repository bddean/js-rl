/**
 * Miscellaneous simple helper functions
 */

var utilities = {};
var u = utilities;
(function() {
	utilities.addvec = function() {
		var sum = [];
		for (var i = 0; i < arguments[0].length; i++) 
			sum[i] = 0;
		for (var a = 0; a < arguments.length; a++)
			for (i = 0; i < sum.length; i++)
				sum[i] += arguments[a][i];
		return sum;
	};

	utilities.clamp = function(x, r0, r1) {
		if (x < r0) return r0;
		if (x > r1) return r1;
		return x;
	};

	utilities.tag = function(name, var_args) {
		var selfClosing = {
			'area' : true, 'base' : true,
			'br' : true, 'col' : true,
			'command' : true, 'embed' : true,
			'hr' : true, 'img' : true,
			'input' : true, 'keygen' : true,
			'link' : true, 'meta' : true,
			'param' : true, 'source' : true,
			'track' : true, 'wbr' : true
		};

		if (selfClosing[name]) return '<' + name + ' />';
    
		var result = ['<' + name + '>'];
		for (var i = 1; i < arguments.length; i++) {
			result.push(arguments[i] + ' ');
		}
		result.push('</' + name + '>');
		return result.join('');
	};
	
	utilities.wrap = function(x) {
		return x instanceof Array ? x : [x];
	};
	
	utilities.capitalize = function(s) {
		return s.charAt(0).toUpperCase() + s.slice(1);
	};
	
	utilities.identity = function(x) { return x; };
})();
