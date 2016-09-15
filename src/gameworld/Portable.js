var Portable = inherit.component(Entity, {
	weight: 0 // unit??
});

var Stick = inherit.component(Portable, {
	name: 'stick',
	shape: '/',
	fg: 'darkbrown',
	bg: 'goldenrod'
});

var Stone = inherit.component(Portable, {
	name: 'stone',
	shape: '*',
	fg: 'white',
	bg: 'darkslategrey'
});

var Banana = inherit.component(Portable, {
	name: 'banana',
	shape: '(',
	bg: 'yellow',
	fg: 'black'
});


