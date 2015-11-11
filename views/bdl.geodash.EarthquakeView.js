// State events: error, loading, ready
bdl.geodash.EarthquakeView = Backbone.View.extend({
	initialize: function(){
		this.map = this.options.map;
    this.circles = [];
    this.infoWindow = null;
		this._setMapWindow = true;  // only set mapWindow on first render or refresh
		//this._initModel();
		this.model.view = this;
		_.bindAll(this,'render','toggleLayer');
		this.parentEl = $(this.map.el).parents("table.gd-frame").find("#gd-accordion")[0];
		this.tab = new bdl.geodash.NavTab({model: this.model,p: this.parentEl});
		this.model.bind("change:state", this.render);
		this.model.bind("change:on", this.toggleLayer);	
		this.tab.render();
		this.tab.$(".gd-tab-content .gd-tab-tools").hide();
    if(this.map.gd.base.is('google')) {
      this.render(); //bug fix
    }
	},

	render: function(){
    var self = this;

		if(!this.map.isReady() && this.map.has_been_idle){
      window.setTimeout(function() {
        self.render();
      }, 500);

      return false;
    }

		try{
      this.tab.setLoading();
      this.clearLayer();

      if(this.model.isOn()){						
        self.renderLayer();
        self.tab.setReady();
      }else{
        this.tab.setReady();
      }

		} catch(e) {
      // console.log('EarthquakeLayer render error', e);
			this.tab.setError(e);
		}
	},
	
	refresh: function(options){
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
			self.clearLayer();
      self.renderLayer();
      self.tab.setReady();
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
	},

  renderLayer: function() {
    var self = this;

    if(!self.model.loaded) {
      // load new data if not currently loading
      if(!self.model.loading) {
        self.model.update();
      }

      // run again so layer is drawn once loaded
      window.setTimeout(function() {
        self.renderLayer();
      }, 300);
    } else if(!self.map.has_been_idle) {
      window.setTimeout(function() {
        self.renderLayer();
      }, 300);
    } else {
      if(this.model.isOn()){						
        // self.drawEarthquakes();
        self.addEarthquakesLayer();
      }

    }

  },

  addEarthquakesLayer: function() {
    var self = this;

    var layerOpts = {
      getTileUrl: function(coord,zoom){
        coord = bdl.geodash.Geocoder.getNormalizedCoord(coord, zoom);
        return self.model.getTileUrl(coord.x,coord.y,zoom);
      },
      tileSize: new google.maps.Size(256,256),
      isPng: true,
      name: "Earthquake Map",
      opacity: 0.5,
      maxZoom: this.model.get("max_zoom"),
      minZoom: this.model.get("min_zoom")
    }
    this.mapLayer = new google.maps.ImageMapType(layerOpts);
    this.map.apiMap.overlayMapTypes.push(this.mapLayer);
    this.map.gd.log({type:"info",message: "Loading earthquake tiles..."});

    var handleClick = function(e) {
      if(e.latLng) {
        self.handleClick(e.latLng.lat(), e.latLng.lng());
        // console.log('handleClick', 'highlight', self.highlight);
        // self.model.highlite(e.latLng.lat(),e.latLng.lng(),self.highlite);
      }
    }

    this.mapClickListener = google.maps.event.addListener(this.map.apiMap, "click", handleClick);

  },

  showInfoWindow: function(item) {
    var self = this;
    // clear previous infowindow
    self.clearInfoWindow();

    // set up vars needed for contents of infowindow
    var lng = item.data.geometry.coordinates[0];
    var lat = item.data.geometry.coordinates[1];
    var depth = parseFloat(item.data.geometry.coordinates[2]);
    var mag = parseFloat(item.data.properties.mag);
    var properties = item.data.properties;
    var split = item.start_at.split('T');
    var date = split[0];
    var time = split[1];
    var latlng = new google.maps.LatLng(lat, lng);

    var circleCS = "<div>";
    circleCS = circleCS + "<div><strong></strong>" + properties.place  + "</div>";
    circleCS = circleCS + "<table class='dss-earthquake'>";
    circleCS = circleCS + "<tr><td><strong>Date</strong></td><td>" + date + "</td></tr>";
    circleCS = circleCS + "<tr><td><strong>Time: </strong></td><td>" + time + "</td></tr>";
    circleCS = circleCS + "<tr><td><strong>Magnitude: </strong></td><td>" + mag + "</td></tr>";
    circleCS = circleCS + "<tr><td><strong>Depth: </strong></td><td>" + depth + "</td></tr>";
    circleCS = circleCS + "</table>";
    circleCS = circleCS + "<div><a href='" + properties.url + "' target='_blank'>more info</a></div>";

    self.infoWindow = new google.maps.InfoWindow({
      content: circleCS
    });

    self.infoWindow.setPosition(latlng);
    self.infoWindow.open(self.map.apiMap);
  },

  handleClick: function(lat, lng) {
    var self = this;
    var items = self.model.data;

    // calculate distance and radius for all earthquakes
    _.each(items, function(item) {
      var itemLng = item.data.geometry.coordinates[0];
      var itemLat = item.data.geometry.coordinates[1];
      var mag = parseFloat(item.data.properties.mag);
      item.pixelDist = bdl.geodash.pixelDistance(lat, lng, itemLat, itemLng, gd.map.apiMap.getZoom());
      item.circleRadius = self.circleRadius(mag);
    });

    // filter out ones that are further away than circle radius
    items = _.filter(items, function(item) {
      return (item.circleRadius >= item.pixelDist);
    });

    // get the closest one
    var closest = null;
    if(items.length > 0) {
      closest = items[0];
      $.each(items, function(item) {
        if(item.pixelDist < closest.pixelDist) {
          closest = item;
        }
      });
    }

    if(closest) {
      self.showInfoWindow(closest);
    }
  },

  removeEarthquakesLayer: function() {
    var self = this;
    if(self.mapLayer) {
      var index = self.map.apiMap.overlayMapTypes.indexOf(self.mapLayer);
      self.map.apiMap.overlayMapTypes.removeAt(index);
      delete self.mapLayer;
      google.maps.event.removeListener(self.mapClickListener);
    }
  },

  circleRadius: function(mag) {
    return 10 + ((mag / 10.0) * 25);
  },

  drawEarthquakes: function() {
    var self = this;
    // draw shapes
    if(self.model.data === null) {
      return;
    }

    var items = self.model.data;
    _.each(items, function(item) {
      var lng = item.data.geometry.coordinates[0];
      var lat = item.data.geometry.coordinates[1];
      var depth = parseFloat(item.data.geometry.coordinates[2]);
      var mag = parseFloat(item.data.properties.mag);
      /*
        cdi: null
        code: "10773405"
        detail: "http://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/ak10773405.geojson"
        dmin: 0.14642539
        felt: null
        gap: 284.4
        ids: ",ak10773405,"
        mag: 0.2
        magType: "Ml"
        mmi: null
        net: "ak"
        nst: 3
        place: "53km S of Cantwell, Alaska"
        rms: 0.17
        sig: 1
        sources: ",ak,"
        status: "REVIEWED"
        time: 1375451157000
        tsunami: null
        type: "earthquake"
        types: ",cap,general-link,geoserve,nearby-cities,origin,tectonic-summary,"
        tz: -480
        updated: 1375472200948
        url: "http://earthq
      */
      var latlng = new google.maps.LatLng(lat, lng);

      var circleOpts = {
        strokeColor: '#888888',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: self.depthColor(depth),
        fillOpacity: 0.3,
        radius: self.circleRadius(mag)
      };

      var iconUrl = bdl.geodash.protocol + '//' + bdl.geodash.server + '/api/charts/circle?';
      var iconUrl = iconUrl + jQuery.param(circleOpts);
      var iconAnchor = new google.maps.Point(circleOpts.radius, circleOpts.radius);

      var image = {
        url: iconUrl,
        anchor: iconAnchor
      }

      var circle = new google.maps.Marker({
        position: latlng,
        icon: image
      });

      circle.setMap(self.map.apiMap);
      self.circles.push(circle);

      // infowindow for point
      google.maps.event.addListener(circle, 'click', function() {
        self.clearInfoWindow();

        var properties = item.data.properties;
        var split = item.start_at.split('T');
        var date = split[0];
        var time = split[1];
        var circleCS = "<div>";

        circleCS = circleCS + "<div><strong></strong>" + properties.place  + "</div>";
        circleCS = circleCS + "<table class='dss-earthquake'>";
        circleCS = circleCS + "<tr><td><strong>Date</strong></td><td>" + date + "</td></tr>";
        circleCS = circleCS + "<tr><td><strong>Time: </strong></td><td>" + time + "</td></tr>";
        circleCS = circleCS + "<tr><td><strong>Magnitude: </strong></td><td>" + mag + "</td></tr>";
        circleCS = circleCS + "<tr><td><strong>Depth: </strong></td><td>" + depth + "</td></tr>";
        circleCS = circleCS + "</table>";
        circleCS = circleCS + "<div><a href='" + properties.url + "' target='_blank'>more info</a></div>";

        self.infoWindow = new google.maps.InfoWindow({
          content: circleCS
        });

        self.infoWindow.setPosition(latlng);
        self.infoWindow.open(self.map.apiMap);
      });

      // propogate mousedown event to map. not propagating prevents lasso tool from working
      google.maps.event.addListener(circle, 'mousedown', function(e) {
        google.maps.event.trigger(self.map.apiMap, 'mousedown', e);
      });

    });
  },

	_getBoxWidth: function(r){
		var lengths = _.map(r, function(val,col){
			return ("" + val + " " + col).length;
		});
		var len = _.max(lengths) * 11;
		if(len <= 200){
			return len + 6;
		}else{
			return 206;
		}
	},

	toggleLayer: function(){
		if(this.model.isOn() && this.map.isReady()){
			this.render();
		}else{
			this.clearLayer();
		}		
	},
	
  clearInfoWindow: function() {
    if(this.infoWindow !== null && this.infoWindow !== undefined) {
      this.infoWindow.close();
      delete this.infoWindow;
    }
  },

	clearLayer: function(){
    var self = this;
    self.removeEarthquakesLayer();
    self.clearInfoWindow();
	},

	clearLayerCircles: function(){
    var self = this;
    if (this.map.base.is('google')) {
      // close infoWindow
      self.clearInfoWindow();

      // remove all circles
      for(i=0; i<this.circles.length; i++) {
        this.circles[i].setMap(null);
        delete this.circles[i];
      }
      this.circles = [];
    } else if (this.map.base.is('leaflet-mapquest')) {
    }
	},

  depthColor: function(depth) {
    if(depth > 500.0) {
      return '#ff0000';
    } else if (depth > 300.0) {
      return '#cb00ff';
    } else if (depth > 150.0) {
      return '#0000ff';
    } else if (depth > 70.0) {
      return '#00ff00';
    } else if (depth > 35.0) {
      return '#ffff00';
    } else {
      return '#fa9600';
    }
  },

	remove: function(){
		this.clearLayer();
		this.tab.remove();
  }


});
