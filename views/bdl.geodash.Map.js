bdl.geodash.Map = Backbone.View.extend({
	initialize: function(){
    this.googleLoadStarted  = false;
		this.base = this.model;
		this.gd = this.options.gd;
		_.bindAll(this,'render','load','addLayer');
		this.base.bind('change',this.render);
		this.gd.layers.bind('add', this.addLayer);
		this.base.view = this;
		this.load();
		this.bind('api-loaded',this.render);
    this.letMapquestLoadStarted  = false;
    this.uniqueId = null;
    this.has_been_idle = false;
    this.setUniqueId();
	},

  setUniqueId: function() {
    this.uniqueId = "gdmap_";
    var r = /uniqueId=(\w+)/;
    m = r.exec(window.location.href);
    if(m.length > 1) {
      this.uniqueId =  this.uniqueId + m[1];
    }
  },
	
	load: function(){
    var resizeVisible = function() {
      // only run if we are in ie8 and wrapped in a #geodash div
      if( $.browser.msie && 
         ($.browser.version.substring(0,1) == "8" ||
         $.browser.version.substring(0,1) == "9") &&
         $('#geodash').length > 0 ) {
        if( $('#geodash').is(':visible') ) {
          this.gd.resize();
        } else {
          setTimeout(function() {
            resizeVisible.call();
          }, 500);
        }
      }
    }

		if(this.base.is('google')){
      if(this.googleLoadStarted == false){
          this.googleLoadStarted = true;
          var self = this;
          var success = function(){
            setTimeout(function(){
              if(bdl.geodash.map_loaded == true) {
                self.trigger("api-loaded");
                resizeVisible.call();
              } else {
                self.load()
              }
            },90);	
          }
          var src = this.base.getAPISrc() + "&callback=bdl.geodash.cb";
          $.getScript(src,success);
        }else{
          resizeVisible.call();
          this.trigger("api-loaded");
        }
      } else if(this.base.is('leaflet-mapquest')) {
        if(typeof(L) == 'undefined'){
          leafletMapquest = true;
          var self = this;
          var success = function(){
            $.getScript(self.base.getAPIHeatmapSrc());
            setTimeout(function(){
              bdl.geodash.cb();
              if(bdl.geodash.map_loaded == true) {
                self.trigger("api-loaded");
                resizeVisible.call();
              } else {
                self.load()
              }
            },90);	
          }
          $.getScript(this.base.getAPISrc() + "",success);
        }else{
          resizeVisible.call();
          this.trigger("api-loaded");
        }
      }
	},
	addLayer: function(layer){
		var opts = {
			model: layer, map: this
		};
		var lv;
    var ua = $.browser;
    var ie7 = ua.msie && ua.version.slice(0,1) == '7';
    var ie8 = ua.msie && ua.version.slice(0,1) == '8';

    lv = {render: function(){}};  // empty function in case we don't find a good layer
		if(layer.type == "markerLayer"){
			lv = new bdl.geodash.MarkerView(opts);
		}else if(layer.type == "areaLayer"){
			layer.setDefaultApiKey(this.gd.base.get('gdAPIKey'));
			lv = new bdl.geodash.AreaView(opts);
		}else if(layer.type == "kmlLayer"){
			lv = new bdl.geodash.KmlView(opts);
		}else if(layer.type == "placesLayer"){
      lv = new bdl.geodash.PlacesView(opts);
		}else if(layer.type == "directionsLayer"){
      lv = new bdl.geodash.DirectionsView(opts);
		}else if(layer.type == "vectorLayer"){
      lv = new bdl.geodash.VectorView(opts);
		}else if(layer.type == "hurricaneLayer" ) {
      lv = new bdl.geodash.HurricaneView(opts);
		}else if(layer.type == "massMarkerLayer" ) {
      lv = new bdl.geodash.MassMarkerView(opts);
		}else if(layer.type == "heatmapLayer" ) {
      if((this.base.is('google') && !ie7) ||
         (this.base.is('leaflet-mapquest') && !ie7 && !ie8)) {
				lv = new bdl.geodash.HeatmapView(opts);
      }
		}else if(layer.type.indexOf('dssLayer:') == 0 ) {
      var dssType = layer.type.split(':')[1];
      if(dssType == 'earthquake') {
        lv = new bdl.geodash.EarthquakeView(opts);
      }
    }

		this.bind('render',lv.render);

	},
	
  removeMarker: function(marker) {
    if(this.base.is('google')) {
      marker.setMap(null);
    } else if(this.base.is('leaflet-mapquest')) {
      this.apiMap.removeLayer(marker);
      marker = null;
    }
  },

  removePoly: function(poly) {
    if(this.base.is('google')) {
      poly.setMap(null);
    } else if(this.base.is('leaflet-mapquest')) {
      this.apiMap.removeLayer(poly);
    }
  },

	render: function(){
    if(bdl.geodash.map_loaded) {
      var self = this;

      var panZoomChanged = function() {
        var v = self.getRetainPanZoom();
        if(typeof(v) != 'undefined') {
          $.cookie(self.uniqueId, self.getPanZoomStr());
        }
      }

      if(this.base.is('google')){
        if(!this.isReady()){
          this.apiMap = new google.maps.Map(this.el,this.base.getMapOptions());
          this.apiMap.mapTypes.set('light', this.base.getLightStyle());
          this.apiMap.mapTypes.set('dark', this.base.getDarkStyle());

          google.maps.event.addListener(this.apiMap, 'zoom_changed', panZoomChanged);
          google.maps.event.addListener(this.apiMap, 'center_changed', panZoomChanged);

        } else {
          this.apiMap.setOptions(this.base.getMapOptions());
        }

        google.maps.event.addListenerOnce(this.apiMap, 'idle', function(){
          // do something only the first time the map is loaded
          self.has_been_idle = true;
        });

      } else if(this.base.is('leaflet-mapquest')) {
        // this.apiMap.setOptions(this.base.getMapOptions());
        var map = new L.Map(this.el, {attributionControl: false});
        map.addControl(new L.Control.Attribution('<a target="_blank" href="http://geodash.co/maps_attribution">About this map</a>'));

        var url;
				if(this.base.get('isSSL')){
          url = 'https://otile1-s.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png';
        } else {
          url = 'http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png';
        }

        // add mapquest view if not building type
        var mq_open = new L.TileLayer(url, {
            attribution: '',
            maxZoom: 18
        });
        if(!this.base.get('isBuilding')){
          map.addLayer(mq_open);
        }

        // center map
        var centre = new L.LatLng(0,0); // geographical point (longitude and latitude)
        map.setView(centre, 2);

        map.on('zoomend', panZoomChanged);
        map.on('moveend', panZoomChanged);

        this.apiMap = map;
      }

      if(this.base.is('google')){
        this.selector = new bdl.geodash.Selector({map: this});
        this.lasso = new bdl.geodash.Lasso({map: this});
        this.cx = new bdl.geodash.ContextMenu({map:this});
        // for getting the right projection
        var fakeOverlay = function(map){
          this.setMap(map);
        }

        fakeOverlay.prototype = new google.maps.OverlayView();
        fakeOverlay.prototype.draw = function(){};
        this.fo = new fakeOverlay(this.apiMap);
      } else if(this.base.is('leaflet-mapquest')) {
        this.lasso = new bdl.geodash.Lasso({map: this});
        this.selector = new bdl.geodash.Selector({map: this});
      }

      this.trigger('render');
    } else {
      var self = this;
      window.setTimeout(function() {
        self.render();
      }, 1000);

    }
		return this;
	},
	
	isReady: function(){
		if(typeof(this.apiMap) != 'undefined'){
      // got a map defined

      if(this.base.is('google')
         && google.maps
         && google.maps.LatLng) {
           // google API has loaded
           return true;
      } else if(this.base.is('leaflet-mapquest')) {
        return true;
      }
		}

    return false;
	},
	
	getApiLatLng: function(ll){
		if(this.base.is('google')){
			return new google.maps.LatLng(ll[0],ll[1]);
		} else if(this.base.is('leaflet-mapquest')) {
      return new L.LatLng(ll[0], ll[1]);
    }
	},

  getApiMarkerLatLng: function(marker) {
    if(this.base.is('google')) {
      return marker.getPosition();
    } else if (this.base.is('leaflet-mapquest')) {
      return marker.getLatLng();
    }
  },

  getCenter: function() {
    if(this.base.is('google')) {
      var c = this.apiMap.getCenter();
      return [c.lat(), c.lng()];
    } else if (this.base.is('leaflet-mapquest')) {
      var c = this.apiMap.getCenter();
      return [c.lat, c.lng];
    }
  },
	
	getBounds: function(){
		if(this.base.is('google')){
			return new google.maps.LatLngBounds();
		} else if(this.base.is('leaflet-mapquest')){
			return new L.LatLngBounds();
    }
	},
	
	fitBounds: function(){
		this.apiMap.fitBounds(this.selector.box.getBounds());
	},
	
	zoomOut: function(){
		this.apiMap.setZoom(this.apiMap.getZoom() - 1);
	},

  getPanZoomStr: function() {
    var c = this.getCenter();
    var z = this.apiMap.getZoom();
    if(c.length != 2) {
      return null;
    } else {
      return [String(c[0]), String(c[1]), String(z)].join('_');
    }
  },

  getRetainPanZoom: function(){
    var v = $.cookie(this.gd.map.uniqueId);

    if(typeof(v) == 'undefined' || v == 'null') {
      return undefined;
    }

    var s = v.split('_');
    return {lat: s[0], lng: s[1], zoom: s[2]};
  },

  panZoomToRetain: function() {
    var v = this.getRetainPanZoom();

    if(typeof(v) == 'undefined') {
      return false;
    }

    var ll = this.getApiLatLng([v.lat, v.lng]);

    if (this.base.is('google')) {
      this.apiMap.panTo(ll);
      this.apiMap.setZoom(parseInt(v.zoom));
    } else if (this.base.is('leaflet-mapquest')) {
      this.apiMap.setView(ll, parseInt(v.zoom));
    }

    return true;

  },
	
	selectByBounds: function(){
    if(this.selector.active) {
      var sel = this.gd.layers.selectByBounds(this.selector.box.getBounds());
      bdl.geodash.MSTR.makeSelections(sel,this.gd);
    } else if (this.lasso.active) {
      var sel = this.gd.layers.selectByPolygon(this.lasso.polygon);
      bdl.geodash.MSTR.makeSelections(sel,this.gd);
    }
	}
	
});
