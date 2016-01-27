// State events: error, loading, ready
bdl.geodash.HeatmapView = Backbone.View.extend({
	initialize: function(){
		this.map = this.options.map;
    this.polys = [];
    this.heatmapLayer = null;
		this._initModel();

		this._setMapWindow = true;  // only set mapWindow on first render or refresh
		this.model.view = this;
		_.bindAll(this,'render','toggleLayer');
		this.parentEl = $(this.map.el).parents("table.gd-frame").find("#gd-accordion")[0];
		this.tab = new bdl.geodash.NavTab({model: this.model,p: this.parentEl});

		this.model.bind("change:on", this.toggleLayer);	
		this.tab.render();

		this.tab.setLoading();
	},

	render: function(){
		try{			
			this.bounds = this.map.getBounds();
			this.tab.setLoading();
			this.clearLayer();

			if(this.model.isOn() && this.model.get('state') == "ready"){
				this.renderLayer();
				this.setMapWindow();
			}

			if(this.model.get('state') == "failed") { 
				this.tab.setError({message: "Model has failed state."});
			}else if(this.model.get('state') == "processing"){
				this.tab.setLoading();
			}else if(this.model.get('state') == "ready"){
				this.tab.setReady();
			}
		}catch(e){
      // console.log(e, e.message);
			this.tab.setError(e);
		}
	},

	makeSelection: function(row){
		debugger;
		if(!this.map.gd.base.get('isDoc') || row == undefined){
			return false;
		}
		if(this.model.get('source') == "current"){
			bdl.geodash.MSTR.makeSelections([this.model.getTitle(row)],this.map.gd);
			this.map.gd.log({type:"info",message: "Selecting "+this.model.getTitle(row)+"..."});
		}else if(this.model.get('source') == "gdgrid") {
      var gdGridId = this.model.get('gdGridId');
      // TODO: MSTR BONES TO MOJO
//      var allBones = $.map(window.top.microstrategy.bones, function(b) {
//        if(b.isGridBone) return b;
//      });
//      var bone = $.map(allBones, function(b) {if(b.id == gdGridId) {return b;}})[0];
//      var selector = $(bone.gridSpan).find("div.selector")[0].innerText;
      
      var selector = null;

			bdl.geodash.MSTR.makeSelections([this.model.getTitle(row)], this.map.gd, gdGridId, selector);
		}else{
			this.map.gd.log({type:"info",message: "Cannot select external layers..."});
		}		
	},

	refresh: function(options){
    opts = $.extend({
      steMapWindow: false,
      forceLoad: false
      }, options);

		this._setMapWindow = opts['setMapWindow'];

		if(opts['forceLoad'] || !this.model.isPopulated()){
			this.clearLayer();
			this.loadModel(true);
		}else{
			this.render();
		}
	},

	refreshO: function(options){
    opts = $.extend({
      steMapWindow: false, 
      forceLoad: false
      }, options);

		this._setMapWindow = opts['setMapWindow'];

    opts = $.extend({
      steMapWindow: false, 
      forceLoad: false
      }, options);

		this._setMapWindow = opts['setMapWindow'];

		var self = this;
		if(opts['forceLoad'] || !this.model.isPopulated()){
			this.clearLayer();
			this.load(function(){					
				self.renderLayer();
				self.setMapWindow();
				self.tab.setReady();
			}, true);
		}else{
			this.render();
		}		
	},


	setMapWindow: function(){
    if(this.map.panZoomToRetain()) {
      return;
    }

    var self = this;
		if(!this._setMapWindow){ return; }
		this._setMapWindow = false;
		// var ll = this.map.getApiLatLng(this.getCenterLatLng());;
    // var bounds = self.getPolysBounds();
    // calling panTo() twice caused clipping issue in Google Maps
		// this.map.apiMap.panTo(ll);
		if(self.polys.length > 0){
      window.setTimeout(function(){
        if (self.map.base.is('google')) {
          self.map.apiMap.fitBounds(bounds);
          // self.map.apiMap.setZoom(self.model.get('default_zoom'));
        } else if (self.map.base.is('leaflet-mapquest')) {
          self.map.apiMap.fitBounds(bounds);
        }
      },500);
    }
	},

  renderLayer: function() {
    var self = this;
    self.clearLayer();

    self.model.setWeights();

    var rows = self.model.get('rows');

    if (self.map.base.is('google')) {
      var heatmapData = [];
      // create an array of all the points and weights
      for(var i=0;i<rows.length;i++){
        var position = self.model.getLatLng(i);
        heatmapData.push({
          location: new google.maps.LatLng(position[0], position[1]),
          weight: self.model.getWeight(i)
        });
      };

      // create the heatmap layer
      self.heatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        options: {radius: parseInt(self.model.get('radius'))}
      });

      // add heatmap layer to map
      self.heatmapLayer.setMap(self.map.apiMap);
    } else if (self.map.base.is('leaflet-mapquest')) {
      // create an array of all the points and weights
      var heatmapData = {
            max: 8,
            data: []
        };
      for(var i=0;i<rows.length;i++){
        var position = self.model.getLatLng(i);
        heatmapData.data.push({
          lat: position[0], lon:position[1], value: self.model.getWeight(i)
        });
      };

      // create the heatmap layer
      self.heatmapLayer = new L.TileLayer.HeatMap({
                    radius: parseInt(self.model.get('radius')),
                    opacity: 0.8,
                    gradient: {
                        0.45: "rgb(0,0,255)",
                        0.55: "rgb(0,255,255)",
                        0.65: "rgb(0,255,0)",
                        0.95: "yellow",
                        1.0: "rgb(255,0,0)"
                    }
                });
       self.heatmapLayer.addData(heatmapData.data);

      // add heatmap layer to map
      self.map.apiMap.addLayer(self.heatmapLayer);
    }

  },

	loadModel: function(isRefresh){
		var isRefresh = isRefresh === undefined ? false: true; // default to false
		var self = this;
		if( self.tab ){ self.tab.setLoading(); };
		this.map.gd.log({
			message: "Loading layer:  " + this.model.get('name'),
			type: "info" });
		var opts = {
			model: this.model,
			success: function(resp){
				self.model.set(resp);
				
				if(self.model.get('state') == "ready"){ 
          var rows = self.model.get('rows');
          if(rows.length == 0) {
            self.tab.setError({message: "No data to display."});
          } else {
            if(self.map.isReady()){
              self.render();
            }
            if(isRefresh){ self.tab.renderPage(1); }
          }

          self.tab.setReady();
				}else{
					self.tab.setError({message: "Error loading layer: " + 
						resp.status + "; Error:  " + resp.errors[0] });
				}
			},
			error: function(response) {
				self.model.set({state: "failed"});
				var msg;
				if(response.getResponseHeader){
					var msg = bdl.geodash.breakWord(response.getResponseHeader("X-MSTR-TaskFailureMsg"));
				}else{
					msg = "Error fetching layer.  Status: " + response.status + "; Status Text: " + response.statusText;
				}
				self.tab.setError({message: msg});
			}
		};
		bdl.geodash.MSTR.loadModel(opts);
	},

	loadModelO: function(isRefresh){
		var isRefresh = isRefresh === undefined ? false: true; // default to false
		var state = this.model.get('state');

		this.map.gd.log({
			message: "Loading layer:  " + this.model.get('name'),
			type: "info" });

    if(!this.model.isPopulated() || isRefresh){
			if(this.tab){ this.tab.setLoading(); }// this.tab.setLoading();
			var self = this;
			var opts = {
				model: self.model,
				success: function(resp){
					self.tab.setReady();
					self.model.set(resp);

          var rows = self.model.get('rows');

          if(rows.length == 0) {
            self.tab.setError({message: "No data to display."});
          } else {
            self.render();
          }
				},
				error: function(response) { 
					var msg;
					if(response.getResponseHeader){
						var msg = bdl.geodash.breakWord(response.getResponseHeader("X-MSTR-TaskFailureMsg"));
					} else {
						msg = "Error fetching layer.  Status: " + response.status + "; Status Text: " + response.statusText;
					}
					self.tab.setError({message: msg}); 
				}
			};

      // Get model data
      if (this.model.get('url')) {
        // set data from URL, used for testing
			  $.post(this.model.get('url'),null,function(resp){ opts.success(resp); },'json')
      } else {
        bdl.geodash.MSTR.loadModel(opts);
      }
		}else if(state == "not_ready" || state == "processing"){
			this.tab.setLoading();
			// this.model.loadModel();
		}else if(state == "ready"
					&& this.map.isReady()){
			callback();
		}else{
			this.tab.setError({message: this.model.get('errors')[0]}); 
		}
	},


  centerForName: function(name) {
    var self = this;
    var features = self.model.featuresNamed(name);
    var bounds = null;

    if(features.length > 0) {
      if (this.map.base.is('google')) {
        bounds = new google.maps.LatLngBounds();

        _.each(features, function(feature) {
          var coordinates = feature.geometry.coordinates[0];
          var geometry = $.parseJSON(coordinates);

          for(g in geometry) {
            var gll = new google.maps.LatLng(geometry[g][0], geometry[g][1]);
            bounds.extend(gll);
          }
        });

      } else if (this.map.base.is('leaflet-mapquest')) {
        bounds = new L.LatLngBounds();
        _.each(features, function(feature) {
          var coordinates = feature.geometry.coordinates[0];
          var geometry = $.parseJSON(coordinates);

          for(g in geometry) {
            var gll = new L.LatLng(geometry[g][0], geometry[g][1]);
            bounds.extend(gll);
          }
        });
      }

      var center = bounds.getCenter();
      return center;

    } else {
      return null;
    }

  },

	_initModel: function(){
		if(!this.model.isPopulated()){
			this.loadModel(false);
		}else{
			this.model.set({state: "ready"});
		}		
	},

  showInfoBox: function() {
    return false;
  },

	toggleLayer: function(){
		if(this.model.isOn() && this.map.isReady()){
			this.render();
		}else{
			this.clearLayer();
		}		
	},
	
	clearLayer: function(){
    var self = this;
    try{
      if (this.map.base.is('google')) {
        // remove heatmap
        if(this.heatmapLayer){
          this.heatmapLayer.setMap(null);
          delete this.heatmapLayer;
        }

      } else if (this.map.base.is('leaflet-mapquest')) {
        if(this.heatmapLayer) {
          this.map.apiMap.removeLayer(this.heatmapLayer);
          delete this.heatmapLayer;
        }
      }

    }catch(e){
      // weird error from google on setmap null
    }			
	},
	
	getIconThumb: function(rowID){
		var color = '#eee';
		if(color.indexOf("#") != 0){ color = '#' + color;}
		return '<div class="area-view-thumb" style="background-color:' + color + ';"/>';
	},

	remove: function(){
		this.clearLayer();
		this.tab.remove();
  }

});
