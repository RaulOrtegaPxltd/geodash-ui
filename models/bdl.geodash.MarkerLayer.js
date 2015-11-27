bdl.geodash.MarkerLayer = bdl.geodash.Layer.extend({
	initialize : function() {
		this.type = "markerLayer";
		this.attributes = _.extend({
			type : "markerLayer",
			cluster : false,
			state : "not_ready",
			iconType : "dynamic-pin",
			circles : []
		}, this.attributes);
	},

	validate : function() {

	},

	getLatLng : function(rowID) {
		var geom = this.get('geom')[rowID];
		var lat = geom.point[0];
		var lng = geom.point[1];
		if (lat == undefined || lng == undefined) {
			throw {
				message : "No lat lng provided for record."
			};
		} else {
			return [ lat, lng ];
		}
	},

	getIconType : function(rowID) {
		var geom = this.get('geom')[rowID];
		var it = this.get('iconType');
		if (geom.icon) {
			return geom.icon;
		} else if (it) {
			return it;
		} else {
			return "dynamic-pin";
		}
	},

	getIcon : function(rowID, useDefaultSize) {
		// default useDefaultSize to false
		useDefaultSize = typeof useDefaultSize !== 'undefined' ? useDefaultSize : false;

		if (this.view.map.base.is('google')) {
			var icon = bdl.geodash.IconFactory.createIcon({
				primaryColor : this.getColor(rowID),
				type : this.getIconType(rowID),
				sizePercent : this.getSizePercent(rowID),
				useDefaultSize : useDefaultSize,
				minMarkerWidth : this.get('minMarkerWidth'),
				maxMarkerWidth : this.get('maxMarkerWidth')
			});
		} else if (this.view.map.base.is('leaflet-mapquest')) {
			var icon = bdl.geodash.IconFactory.leafletCreateMarkerIcon({
				primaryColor : this.getColor(rowID),
				type : this.getIconType(rowID),
				sizePercent : this.getSizePercent(rowID),
				useDefaultSize : useDefaultSize,
				minMarkerWidth : this.get('minMarkerWidth'),
				maxMarkerWidth : this.get('maxMarkerWidth')
			});
		}
		return icon;
	},

	selectByBounds : function(bounds) {
		var geom = this.get('geom');
		var selections = [];
		var self = this;
		_.each(geom, function(g, num) {
			if (self.view.map.base.is('google')) {
				var ll = new google.maps.LatLng(g.point[0], g.point[1]);
				if (bounds.contains(ll)) {
					selections.push(self.getTitle(num));
				}
			} else if (self.view.map.base.is('leaflet-mapquest')) {
				var ll = new L.LatLng(g.point[0], g.point[1]);
				if (bounds.contains(ll)) {
					selections.push(self.getTitle(num));
				}
			}
		});
		return selections;
	},

	selectByPolygon : function(polygon) {
		var geom = this.get('geom');
		var selections = [];
		var self = this;
		_.each(geom, function(g, num) {
			if (self.view.map.base.is('google')) {
				var ll = new google.maps.LatLng(g.point[0], g.point[1]);
				if (polygon.containsLatLng(ll)) {
					selections.push(self.getTitle(num));
				}
			} else if (self.view.map.base.is('leaflet-mapquest')) {
				var ll = new L.Point(g.point[0], g.point[1]);
				if (polygon.containsPoint(ll)) {
					selections.push(self.getTitle(num));
				}
			}
		});
		return selections;
	}
});
