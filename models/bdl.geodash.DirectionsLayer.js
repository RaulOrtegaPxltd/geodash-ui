bdl.geodash.DirectionsLayer = bdl.geodash.Layer.extend({
	initialize: function(){
		this.type = "directionsLayer";
		this.set({
				name: "Directions",
				on: true,
				type: "directionsLayer"});
	},
	
	getDirections: function(start,end,mode,unit,display){
		var svc = this.getService();
		var request ={
			origin: start,
			destination: end,
			travelMode: mode,
			unitSystem: unit
		}
		var self =this;
		svc.route(request, function(response, status) {
	        if (status == google.maps.DirectionsStatus.OK) {
	          display.setDirections(response);
	        }else if(self.view){
			  self.view.$(".gd-tab-content").append('<div class="gd-layer-error">' + status +'</div>');
			}
      	});
	},
	
	getService: function(){
		if(this.service){
			return this.service;
		}
		this.service = new google.maps.DirectionsService();
		return this.service;
	}
});