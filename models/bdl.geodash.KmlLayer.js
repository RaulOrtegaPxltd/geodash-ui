bdl.geodash.KmlLayer = bdl.geodash.Layer.extend({
	initialize: function(){
		this.type = "kmlLayer";
		this.attributes = _.extend({
				type: "vectorLayer",
				state: "not_ready",
				url: ""
			},this.attributes);
	},
	
	validate: function(){
		
	}
	
});
