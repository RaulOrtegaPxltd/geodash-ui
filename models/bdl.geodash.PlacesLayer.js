bdl.geodash.PlacesLayer = bdl.geodash.Layer.extend({
	initialize: function(){
		this.type = "placesLayer";
		this.set({
				name: "Search Map",
				on: true,
				type: "placesLayer"});
	},
	
	search: function(v){
		var request = {
			name: v,
			bounds: this.view.map.apiMap.getBounds()
		}
		var svc =this.getService();
		var self =this;
		svc.search(request,function(results,status){
			if(status == google.maps.places.PlacesServiceStatus.OK){
				self.set({places: results})
				self.view.renderSearchResults();
			}else{
				self.trigger("no_results");
			}
		});
	},
	
	getService: function(){
		if(this.service){ return this.service; }
		this.service = new google.maps.places.PlacesService(this.view.map.apiMap);
		return this.service;
	},
	
	getIcon: function(row){
		return this.get("places")[row].icon;
	},
	
	getName: function(row){
		return this.get("places")[row].name;
	},
	
	getPosition: function(row){
		return this.get("places")[row].geometry.location;
	},
	
	getDetails: function(row,callBack){
		var self = this;
		this.getService().getDetails(this.get('places')[row],function(place,status){
			if (status == google.maps.places.PlacesServiceStatus.OK){
				self.get('places')[row] = place;
				callBack(place,row);
			}
		});
	}
});