/**
*   Collection: bdl.geodash.Layers
*	Parent: Backbone.Collection
*/
bdl.geodash.Layers = Backbone.Collection.extend({
	model: bdl.geodash.Layer,
	
	initialize: function(){
		_.bindAll(this,"deselect","activate");
		this.bind("change:selected",this.deselect);
		this.bind("change:on",this.activate);
	},
	
	/*
		This overides the Backbone.Collection 
		native add method.  The overridden method
		will automatically set the slot number off
		a layer.  If you try to add a Layer to an existing
		slot, this method will automatically move the 
		Layer to the end of the collection.
		
		@models - bdl.geodash.Layer, a single Layer object 
				  or an array of Layers.
		@options - Same as parent method.
	*/
	add: function(models, options) {
		var that = this;
		if (_.isArray(models)) {
			// remove once we get layer sorting
			// and ordering down correctly.
			if(this.length == 0){
				models[0].set({selected: true});
			}
			_.each(models, function(model,idx) {
				if (!model.get('slot') || that.isOccupied(model.get('slot'))) {
					model.set({"slot": that.nextSlot() + idx});
				}
				if(model.get('type') == "areaLayer" && that.getActiveLayers("areaLayer").length > 0 && model.isOn()){
					model.set({on: false});
				}
			});
		} else if(!models.get('slot') || that.isOccupied(models.get('slot'))){
			models.set({"slot": that.nextSlot()});
			// remove once we get layer sorting
			// and ordering down correctly.
			if(this.length == 0){
				models.set({selected: true});
			}
			if(models.get('type') == "areaLayer" && that.getActiveLayers("areaLayer").length > 0 && models.isOn()){
				models.set({on: false});
			}
		}

		Backbone.Collection.prototype.add.call(this, models, options);
	},
	
	/*
		Simply returns the next open slot in the collection.
		
		return - boolean
	*/
	nextSlot: function() {
		if (!this.length) return 0;
		return this.length;
	},
	
	/*
		Moves a layer up and down the collections list.
		All siblings will be moved up one or down one 
		depending on the direction of the move.
		
		@layer - bdl.geodash.Layer - should already be
				in the collection.
		@slot - Integer - destinate slot number.
	*/
	move: function(layer,slot) {
		var oldSlot = layer.get('slot');
		var change = slot - oldSlot;
		var tmp;
		if (change < 0){
			this.each(function(model){
				var modelSlot = model.get('slot');
				if (slot <= modelSlot && modelSlot < oldSlot){
					model.set({"slot": modelSlot +1});
				}
			});
			this.at(oldSlot).set({"slot": slot});
		}else{
			this.each(function(model){
				var modelSlot = model.get('slot');
				if (oldSlot < modelSlot && modelSlot <= slot){
					model.set({"slot": modelSlot -1});
				}
			});
			this.at(oldSlot).set({"slot": slot});
		}
		this.sort();
	},
	
	/*
		Determines if the requested slot is already occupied.
		
		@slot - Integer
		return - boolean
	*/
	isOccupied: function(slot){
		var slots = this.map(function(layer){
			return layer.get('slot');
		});
		return _.include(slots,slot);
	},

	comparator: function(layer) {
		return layer.get('slot');
	},
	
	deselect: function(layer){
		var ss = this.getSelected();
		_.each(ss, function(sl){
			if(sl.get('slot') != layer.get('slot')){
				sl.set({"selected": false}, {silent: true});
			}
		});
	},
	
	getSelected: function(){
		var s = this.filter(function(l){
			return l.isSelected() == true;
		});
		return s;
	},
	
	// turn off all currently activated
	// area layers when turning on a new one
	activate: function(layer){
		if(layer.type != "areaLayer" || layer.isOn() === false){
			return;
		}
		if(layer.view){
			layer.view.map.gd.log({type: "info",message: "Only one area layer is active at a time."});		
		}
		var a = this.getActiveLayers("areaLayer");
		_.each(a,function(model){
			if(layer != model){
				model.set({on: false});
			}			
		});
	},
	
	getActiveLayers: function(type){
		var s = this.filter(function(l){
			return (l.isOn() == true && l.type == type);
		});
		return s;	
	},
	
	selectByBounds: function(bounds){
		this.gd.log({type:"info",message:"Selecting markers..."});
		var selections = [];
		this.forEach(function(l){
			if(l.get('type') == "markerLayer" && l.isOn() && l.get('source') == "current"){
				selections.push(l.selectByBounds(bounds));
			}
		});
		selections = _.flatten(selections);
		this.gd.log({type:"info",message: selections.length + " valid marker(s) selected..."});
		return selections;
	},

	selectByPolygon: function(polygon){
		this.gd.log({type:"info",message:"Selecting markers..."});
		var selections = [];
		this.forEach(function(l){
			if(l.get('type') == "markerLayer" && l.isOn() && l.get('source') == "current"){
				selections.push(l.selectByPolygon(polygon));
			}
		});
		selections = _.flatten(selections);
		this.gd.log({type:"info",message: selections.length + " valid marker(s) selected..."});
		return selections;
	}
});
