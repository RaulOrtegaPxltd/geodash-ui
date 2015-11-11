bdl.geodash.VectorLayer = bdl.geodash.Layer.extend({
	initialize: function(){
		this.type = "vectorLayer";
		this.attributes = _.extend({
				type: "vectorLayer",
				state: "not_ready",
				strokeColor: "#ffffff",
				highliteColor: "#ff9900",
				staticColor: "#ff9900",
        ids: "",
        collections: []
			},this.attributes);
	},
	
	loadVectors: function(){
		// Clear previous timeout
    // console.log('VectorLayer.loadVectors layerKey:', this.get('layerKey'));

		var url = bdl.geodash.protocol + "//" + bdl.geodash.server + "/api/api/get_collections?ids=";
    url = url + encodeURIComponent(this.get('ids'));
    url = url + "&key=";
    url = url + this.get('layerKey');
		var self = this;
		if(self.view && self.view.map){
      self.view.map.gd.log({type:"info",
                           message: self.get('name') + ": loading collections..."});
    }

		$.ajax({
			url: url,
			jsonp: "callBack",
			dataType: "jsonp",
			cache: false,
			success: function(data){
				if(data.status == "OK"){
          self.collections = data.collections;
          self.set({state: 'ready'});
				}else{
					self.set({state: "failed"},{status: data.status,message: data.response.message});
				}	
			},
			error: function(response) { 
				self.set({state: "failed"},{error: response});
			}
		});
	},

	getShape: function(row){
		var g = this.get('keys').geo;
		if(g === undefined || g == -1){
			return;
		}
		return this.get('rows')[row][g];
	},

  featuresNamed: function(name) {
    /* get feature with provided name */
    var self = this;
    var f = _.filter(self.allFeatures(), function(f) { return f.properties.name == name });
    return f;
  },

  allFeatures: function() {
    /* get all the features from all of the collections in one array */
    var self = this;
    var f = _.uniq(
      _.flatten(
        _.map(
          self.collections, function(c){
            return c.features
          })));
    return f;
  },

	validate: function(){
		
	}
	
});
