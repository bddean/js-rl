/**
 * Define simple natural objects
 */ 

var Plant = inherit.component(Entity, {
	name: 'plant',
  plane: 1,
  shape: '?',
  fg: '#3f2a14',
  bg: 'forestgreen',
  opacity: 0
});

var Grass = inherit.component(Plant, {
	name: 'grass',
	shape: '.', // ♒
	fg: 'rgb(40,50,30)',
  // fg: 'darkgreen',
	bg: 'darkgreen',
  plane: 1
});

var LongGrass = inherit.component(Plant, {
	name: 'long grass',
	shape: ';', // ♒ ⚶
	fg: 'rgb(20,25,15)',
	bg: 'darkgreen',
  plane: 1
});

var Tree = inherit.component(Plant, {
	name: 'tree',
	shape: 'T', // τ ♣ Ψ
  plane: 3,
  solidity: Entity.som.SOLID,
  opacity: 0.3,
  lookslike: [new Plant(), 0.3]
});

var Bush = inherit.component(Plant, {
	name: 'bush',
  shape: '#',
	plane: 3,
  opacity: 0.15,
  solidity: Entity.som.INSUBSTANTIAL,
  lookslike: [new Plant(), 0.4]
});

var Water = inherit.component(Entity, {
  shape: '~',
  fg: 'rgb(30,30,50)',
  bg: 'blue',
  plane: 1,
  solidity: Entity.som.INSUBSTANTIAL
});


var Rock = inherit.component(Entity, {
	name: 'rock',
  shape: '^',
  bg: 'grey',
  fg: 'darkslategrey',
  opacity: 1,
  plane: 3,
  solidity: Entity.som.SOLID
});

var Firefly = inherit.component([Animal, Light], {
	name: "firefly",
	shape: 'F',
	fg: 'yellow',
	opacity: 0.2, // not inherited from animal???
	speed: 0.5,
	brightness: 7,
	lookslike: [new Light(), 0.6]
});

