var Attribute = inherit.component(inherit.Root, {
	value: 10,
	baseValue: 10,
	minValue: 0,
	maxValue: 10,
	growthRate: 0
});

Attribute.defProto('clone', function() { // TODO this should happen automatically
	return new Attribute({
		value: this.value,
		baseValue: this.baseValue,
		minValue: this.minValue,
		maxValue: this.maxValue,
		growthRate: this.growthRate
	});
});
