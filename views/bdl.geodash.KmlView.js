// State events: error, loading, ready
bdl.geodash.KmlView = Backbone.View.extend({
	initialize: function(){
		this.map = this.options.map;
		this._setMapWindow = true;  // only set mapWindow on first render or refresh
		//this._initModel();
		this.model.view = this;
		_.bindAll(this,'render','toggleLayer');
		this.parentEl = $(this.map.el).parents("table.gd-frame").find("#gd-accordion")[0];
		this.tab = new bdl.geodash.NavTab({model: this.model,p: this.parentEl});
		this.model.bind("change:on", this.toggleLayer);	
		this.tab.render();
		this.tab.$(".gd-tab-content .gd-tab-tools").hide();
    if(this.map.gd.base.is('google')) {
      this.render(); //bug fix
    }
	},
	
	render: function(){
		var self = this;
    if(!self.map.gd.base.is('google')) {
      self.tab.setError({message: "KML Layers not currently supported in OSM Maps"});
      return;
    }
		try{
			this.tab.setLoading();
			this.clearLayer();
			if(this.model.isOn() && this.map.isReady()){						
				this.mapLayer = new google.maps.KmlLayer(this.model.get('url'));
				var self = this;
				this.layerLoadEvent = google.maps.event.addListener(self.mapLayer, "metadata_changed", function() {
				    self.tab.setReady();
					self.tab.$(".gd-tab-content .gd-kml-metadata").remove();
					self.tab.$(".gd-tab-content").append('<div class="gd-kml-metadata"><ul><li>Name: '+ 
						self.mapLayer.getMetadata().name+' </li><li>Author: <a href="'+self.mapLayer.getMetadata().author.uri +'">'+ 
						self.mapLayer.getMetadata().author.name+'</a> </li><li>Description: '+ 
					    self.mapLayer.getMetadata().description+' </li></ul></div>');
				});
				this.mapLayer.setMap(this.map.apiMap);
				// remove clickable on selector draw
				var self = this;
				this.map.selector.bind("activate",function(){
					if(self.mapLayer){ self.mapLayer.set("clickable",false); }
				});
				// enable clickable on selector deactivate
				this.map.selector.bind("deactivate",function(){
					if(self.mapLayer){ self.mapLayer.set("clickable",true); }
				});
			}else{
				this.tab.setReady();
			}			
		}catch(e){
			this.tab.setError(e);
		}		
	},
	
	refresh: function(){
		this.render();
	},
	
	toggleLayer: function(){
		if(this.model.isOn() && this.map.isReady()){
			this.render();
		}else{
			this.clearLayer();
		}		
	},
	
	clearLayer: function(){
		if(this.mapLayer != undefined ){
			try{
				this.mapLayer.setMap(null);
				google.maps.event.removeListener(this.layerLoadEvent);
			}catch(e){
				// weir error from google on setmap null				
			}			
		}
		this.mapLayer = undefined;		
	},
	
	remove: function(){
		this.clearLayer();
		this.tab.remove();
	}	

});
