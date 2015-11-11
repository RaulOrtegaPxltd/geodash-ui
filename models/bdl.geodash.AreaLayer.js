bdl.geodash.AreaLayer = bdl.geodash.Layer.extend({
	initialize: function(){
		this.type = "areaLayer";
		this.attributes = _.extend({
				type: "areaLayer",
				state: "not_ready",
				strokeColor: "#ffffff",
				highliteColor: "#ff9900",
				staticColor: "#ff9900",
				geocoder: "google"
			},this.attributes);
	},
	
	validate: function(){
		
	},	
	
	getTileUrl: function(x,y,z){
		var url = bdl.geodash.protocol + "//" + bdl.geodash.server + "/api/tile?api_key=" + this.get('apiKey') +
				"&layer_key="+ this.get("layerKey") +
				"&x=" + x + "&y=" + y + "&z=" + z +
				"&opts[default_shape_color]=transparent"+
				"&opts[stroke_color]="+this.get('strokeColor').replace("#","");
		return url;
	},
	
	getShape: function(row){
		var g = this.get('keys').geo;
		if(g === undefined || g == -1){
			return;
		}
		return this.get('rows')[row][g];
	},
		
	getCenterLatLng: function(){
		var c = this.get('center');
		return [c.lat,c.lng];
	},	
	
	setDefaultApiKey: function(key){
		if(this.get('apiKey') == undefined){
			this.set({apiKey: key},{silent: true});
		}
	},
		
	pollState: function(){
		// Clear previous timeout
    if(this.pollTimer && this.pollTimer != -1) {
      clearTimeout(this.pollTimer);
    }
    // console.log('AreaLayer.pollState layerKey:', this.get('layerKey'));
		var url = bdl.geodash.protocol + "//" + bdl.geodash.server + "/api/service/poll_layers?api_key=" + 
			this.get('apiKey') +"&layers="+ this.get('layerKey');
		var self = this;
		if(self.view && self.view.map){ self.view.map.gd.log({type:"info",message: self.get('name') + ": polling layer state..."}); }
		$.ajax({
			url: url,
			jsonp: "callBack",
			dataType: "jsonp",
			cache: false,
			success: function(data){
				if(data.status == "OK"){
					var layer = data.response[self.get('layerKey')];
          if(typeof(layer) != "undefined") {
            if(layer.state == "not_ready" || layer.state == "processing"){
              self.pollTimer = window.setTimeout(function(){
                if(self.view){ self.view.tab.setLoading();}
                self.pollState();
              },650);
            }else if(layer.state == "failed"){
              // backbone bug? cant set errors simultaneously
              var e = [layer.error_message];
              self.set({errors: e});
              self.set({state: "failed"});
            }else{
              if(self.get('name') != undefined){delete layer.name;}
              self.set({"center": layer.center});
              self.set(layer);
            }
          }
				}else{
					self.set({state: "failed"},{status: data.status,message: data.response.message});
				}	
			},
			error: function(response) { 
				self.set({state: "failed"},{error: response});
			}
		});
	},
	
	highlite: function(lat,lng,s){
		var url = bdl.geodash.protocol + "//" + bdl.geodash.server + "/api/tile/highlite3?api_key=" + 
				 	this.get('apiKey') +"&layer_key="+ this.get('layerKey') + 
					"&latitude="+ lat + "&longitude="+ lng;
		this.lastClick = [lat,lng];
		this.view.tab.setLoading();
		$.ajax({
			url: url,
			jsonp: "callBack",
			dataType: "jsonp",
			success: s
		});			
	}	
	
});
