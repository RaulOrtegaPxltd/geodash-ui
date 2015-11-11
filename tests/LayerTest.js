module("Layer Model Testing");
test('Default Layer',function(){
	var l = new bdl.geodash.Layer();
	ok(!l.isOn(), "Layer isnt on.");
	ok(!l.isSelected(), "Layer isnt active.");
	raises(function(){l.getRow(1);},/No data/,"Should throw no data error.");
});

test('Layer with columns and rows', function(){
	var l = new bdl.geodash.Layer({
		columns: ["col1","col2","col3"],
		rows: [["a","aa",1],["b","ab",2],["c","ac",3],["d","ad",4]],
		name: "Layer with data.",
		type: "Base Layer"
	});
	same(l.getRow(2),{col1:"c",col2:"ac",col3:3},
			"Row 2 should returnd same hash.");
	equal(l.getRow(2).col2,"ac", "Should match specific cell.");		
});
module("Layers Collection Testing");
var models = [];
models.push(new bdl.geodash.Layer({
	columns: ["col1","col2","col3"],
	rows: [["a","aa",1],["b","ab",2],["c","ac",3],["d","ad",4]],
	name: "Layer 0",
	type: "Base Layer"
}));
models.push(new bdl.geodash.Layer({
	name: "Layer 1",
	type: "Base Layer"
}));
models.push(new bdl.geodash.Layer({
	name: "Layer 2",
	type: "Base Layer"
}));
models.push(new bdl.geodash.Layer({
	name: "Layer 3",
	type: "Base Layer"
}));
models.push(new bdl.geodash.Layer({
	name: "Layer 4",
	type: "Base Layer"
}));
var lc = new bdl.geodash.Layers(models);

test('Simple layer collection',function(){
	equals(lc.nextSlot(),5,"nextSlot()");
	equals(lc.at(3).get('slot'),3,"Collection should be sorted by slot.");
	lc.add(new bdl.geodash.Layer({"slot":3, "name":"crap"}));
	equals(lc.at(3).get('name'),"Layer 3", "Cannot 'add' a model to existing slot.");
	ok(lc.isOccupied(2), "Slot should be occupied.");
});

test("Moving layers within the collection",function(){
	lc.move(lc.at(2),4);
	equals(lc.at(4).get('name'),"Layer 2", "Moved Layer down 2 to 4");
	equals(lc.at(3).get('name'),"Layer 4", "Layer at 3 should be Layer 4");
	lc.move(lc.at(3),0);
	equals(lc.at(0).get('name'),"Layer 4", "Moved Layer up 3 to 0");
	equals(lc.at(1).get('name'),"Layer 0", "Layer at 3 should be Layer 4");
	lc.move(lc.at(1),0);
	equals(lc.at(1).get('name'),"Layer 4", "Boundary Condition: Moved Layer up 1 to 0");	
	equals(lc.at(0).get('name'),"Layer 0", "Boundary Condition: Slot 0 should have Layer 0");
});