bdl.geodash.Base = Backbone.Model.extend({
	defaults: {
		api: 'google',
		// apiVersion: 3.5, //fixed to work with latest marker cluster
		apiVersion: 3.14, // circle path works
		isSSL: false,
		lockMap: false,
		mapType: bdl.geodash.MAP_TYPES.normal,
		zoom: 2,
		center: [],
		isDoc: false,
		showEditor: true
	},
	
	is: function(api){
		if(this.get('api') == api){
			return true;
		}else{
			return false;
		}
	},

  getLightStyle: function() {
    var styles = [
      {
        "stylers": [
          { "saturation": -100 }
        ]
      },{
        "featureType": "water",
        "stylers": [
          { "lightness": 100 }
        ]
      }
    ];

    return styledMap = new google.maps.StyledMapType(styles,
      {name: "Light"});
  },

  getDarkStyle: function() {
    var styles = [
      {
        "stylers": [
          { "saturation": -100 },
          { "lightness": -60 }
        ]
      }
    ];

    return styledMap = new google.maps.StyledMapType(styles,
      {name: "Dark"});
  },
	
	getMapOptions: function(){
		var api = this.get('api');
		var opts = {
			zoom: this.get('zoom'),
			center: this.getCenter(),
			maxZoom: 19,
			minZoom:1		
		}
		if(api == 'google'){

      opts.mapTypeControlOptions = {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP,
                      google.maps.MapTypeId.TERRAIN,
                      google.maps.MapTypeId.SATELLITE,
                      google.maps.MapTypeId.HYBRID,
                      'light', 'dark']
      }

      // opts.mapTypeControlOptions.style = google.maps.MapTypeControlStyle.DROPDOWN_MENU;


			opts.mapTypeId = this.getMapType();
		}
		return opts;
	},
	
	getCenter: function(){
		var api = this.get('api');
		var c = this.get('center');
		if(c.length == 0){
			c = [61.3850,-152.2683];
		}
		var ll;
		if(api == 'google'){
			ll = new google.maps.LatLng(c[0],c[1]);
		}
		return ll;
	},
	
	getMapType: function(){
		var api = this.get('api');
		var m;
		if(api == 'google'){
			switch(this.get('mapType')){
				case 0:
					m = google.maps.MapTypeId.ROADMAP;
					break;
				case 1:
					m = google.maps.MapTypeId.HYBRID;
					break;
				case 2:
					m = google.maps.MapTypeId.TERRAIN;
					break;
			}
		}
		return m;		
	},
	
	getApiSourceParams: function(){
		return "client="+this.get('clientID') + "&sensor=false&libraries=geometry";
	},

  getAPIHeatmapSrc: function() {
    return bdl.geodash.js_path + "/lib-heatmap/heatmap-leaflet.js";
  },
	
  getProtocol: function() {
    // protocol based on setting in styleCalog.xml
    return gd.base.get('isSSL') ? 'https:' : 'http:';
  },

	getAPISrc: function(){
		var api = this.get('api');
		var src;
		switch(api){
			case 'google':
				if(this.get('isSSL')){
					src = "https://maps.google.com/maps/api/js?&v="+
						this.get('apiVersion')+"&libraries=geometry,places,visualization&sensor=false" +
						"&client=" + this.get('clientID');
				}else{
					src = "http://maps.google.com/maps/api/js?&v="+
						this.get('apiVersion')+"&libraries=geometry,places,visualization&sensor=false" +
						"&client=" + this.get('clientID');
				}
				break;
			case 'leaflet-mapquest':
        // src = "http://localhost:4567/leaflet/leaflet.js";
        // leaflet version 0.4.5 has issues with IE... latest fixes them
        if(jQuery.browser.msie && jQuery.browser.version < 9) {
          src = bdl.geodash.js_path + "/leaflet/leaflet-latest.js";
        } else {
          src = bdl.geodash.js_path + "/leaflet/leaflet.js";
        }
        break;
			default:
				return {};
		}
		return src;
	}
});
