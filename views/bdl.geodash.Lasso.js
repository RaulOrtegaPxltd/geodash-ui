bdl.geodash.Lasso = Backbone.View.extend({
	initialize : function() {
		this.map = this.options.map;
		this.api = this.map.base.get('api');
		googleBoundsHack(this);
		leafletContains(this);
		this.mouseDown = false;
		this.active = false;
		this.listeners = [];
		this.points = [];
		_.bindAll(this, "onMouseDown", "onMouseUp", "onMouseMove");
		this.render();
	},

	render : function() {
		if (this.api == 'google') {
			this.polyline = new google.maps.Polyline({
				fillColor : "#cccccc",
				strokeColor : "#ff9900",
				fillOpacity : "0.45"
			});
			this.polygon = new google.maps.Polygon({
				fillColor : "#cccccc",
				strokeColor : "#ff9900",
				fillOpacity : "0.45"
			});

		} else if (this.api == 'leaflet-mapquest') {
			this.polyline = new L.polyline({
				fillColor : "#cccccc",
				strokeColor : "#ff9900",
				fillOpacity : "0.45",
				zIndex : 10
			});
			this.polygon = new L.Polygon({
				fillColor : "#cccccc",
				strokeColor : "#ff9900",
				fillOpacity : "0.45",
				zIndex : 10
			});
		}

	},

	activate : function() {
		this.active = true;
		this.trigger("activate");

		if (this.api == "google") {
			this.map.apiMap.set("draggable", false);
			this.polyline.setMap(this.map.apiMap);
			this.listeners.push(google.maps.event.addDomListener(this.map.apiMap, "mousedown", this.onMouseDown));
			this.listeners.push(google.maps.event.addDomListener(this.map.apiMap.getDiv(), "mouseup", this.onMouseUp));
			this.listeners.push(google.maps.event.addListener(this.map.apiMap, "mousemove", this.onMouseMove));
			this.listeners.push(google.maps.event.addListener(this.polyline, "mousemove", this.onMouseMove));
//			this.map.apiMap.getDiv().addEventListener("mousemove", this.onMouseMove);
		} else if (this.api == 'leaflet-mapquest') {
			this.map.apiMap.dragging.disable()
			this.map.apiMap.addLayer(this.polyline);
			this.map.apiMap.addEventListener('mousedown', this.onMouseDown);
			this.map.apiMap.addEventListener('mouseup', this.onMouseUp);
			this.map.apiMap.addEventListener('mousemove', this.onMouseMove);
		}
	},

	deactivate : function() {
		this.active = false;
		if (this.api == "google") {
			this.map.apiMap.set("draggable", true);
			this.polyline.setMap(null);
			for (var i = 0; i < this.listeners.length; i++) {
				google.maps.event.removeListener(this.listeners[i]);
			}
			this.listeners = [];
//			this.map.apiMap.getDiv().removeEventListener("mousemove");
		} else if (this.api == "leaflet-mapquest") {
			gd.map.apiMap.dragging.enable()
			this.map.apiMap.removeLayer(this.polyline);
			this.map.apiMap.removeEventListener('mousedown');
			this.map.apiMap.removeEventListener('mouseup');
			this.map.apiMap.removeEventListener('mousemove');
		}

		this.clearMap();
		this.trigger("deactivate");
	},

	toggle : function() {
		if (this.active) {
			this.deactivate();
		} else {
			this.activate();
		}
	},

	onMouseDown : function(e) {
		this.trigger("dragstart");
		this.clearMap();
		this.mouseDown = true;
		if (this.api == 'google') {
			// this.points = [e.latLng];
			this.points = [];
			this.points.push(e.latLng);
		} else if (this.api == 'leaflet-mapquest') {
			this.points = [ e.latlng ];
		}
	},

	onMouseUp : function(e) {
		this.trigger("dragend");
		this.mouseDown = false;
		if (this.api == 'google') {
			this.polygon.setMap(this.map.apiMap);
			this.polygon.setPath(this.points);
		} else if (this.api == 'leaflet-mapquest') {
			this.map.apiMap.addLayer(this.polygon);
			this.polygon.setLatLngs(this.points);
		}
		this.map.selectByBounds();
	},

	onMouseMove : function(e) {
		if (this.mouseDown) {
			if (this.api == 'google') {
				this.points.push(e.latLng);
				this.polyline.setPath(this.points);
			} else if (this.api == 'leaflet-mapquest') {
				this.points.push(e.latlng);
				this.polyline.setLatLngs(this.points);
			}
		}
	},

//	onMouseMove : function(e) {
//		if (this.mouseDown) {
//			if (this.api == 'google') {
//				var rect = this.map.apiMap.getDiv().getBoundingClientRect()
//				var posx = e.offsetX - this.map.apiMap.getDiv().clientLeft;// -180;
//				var posy = e.offsetY - this.map.apiMap.getDiv().clientTop;// -6;
//				console.log(posx + "," + posy);
//				var latLng = this.getLatLngByOffset(this.map.apiMap, posx, posy);
//				this.points.push(latLng);
//				this.polyline.setPath(this.points);
//			} else if (this.api == 'leaflet-mapquest') {
//				this.points.push(e.latlng);
//				this.polyline.setLatLngs(this.points);
//			}
//		}
//	},

	clearMap : function() {
		if (this.api == "google") {
			this.polyline.setPath([]);
			this.polygon.setPath([]);
		} else if (this.api == "leaflet-mapquest") {
			this.polyline.setLatLngs([]);
			this.polygon.setLatLngs([]);
		}
	},

	getLatLngByOffset : function(map, offsetX, offsetY) {
		var currentBounds = map.getBounds();
		var topLeftLatLng = new google.maps.LatLng(currentBounds.getNorthEast().lat(), currentBounds.getSouthWest().lng());
		var point = map.getProjection().fromLatLngToPoint(topLeftLatLng);
		point.x += offsetX / (1 << map.getZoom());
		point.y += offsetY / (1 << map.getZoom());
		return map.getProjection().fromPointToLatLng(point);
	}

});

function leafletContains(self) {
	if (self.map.base.is('leaflet-mapquest')) {
		L.Polygon.prototype.containsPoint = function(point) {
			// ray-casting algorithm based on
			// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
			// https://github.com/substack/point-in-polygon/blob/master/index.js

			var vs = this.getLatLngs();
			var x = point.x, y = point.y;

			var inside = false;
			for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
				var xi = vs[i].lat, yi = vs[i].lng;
				var xj = vs[j].lat, yj = vs[j].lng;

				var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
				if (intersect)
					inside = !inside;
			}

			return inside;
		}
	}
};

function googleBoundsHack(self) {
	if (self.map.base.is('google') && !google.maps.Polygon.prototype.getBounds) {

		// Poygon getBounds extension - google-maps-extensions
		// http://code.google.com/p/google-maps-extensions/source/browse/google.maps.Polygon.getBounds.js
		if (!google.maps.Polygon.prototype.getBounds) {
			google.maps.Polygon.prototype.getBounds = function(latLng) {
				var bounds = new google.maps.LatLngBounds();
				var paths = this.getPaths();
				var path;

				for (var p = 0; p < paths.getLength(); p++) {
					path = paths.getAt(p);
					for (var i = 0; i < path.getLength(); i++) {
						bounds.extend(path.getAt(i));
					}
				}

				return bounds;
			}
		}

		// Polygon containsLatLng - method to determine if a latLng is within a polygon
		google.maps.Polygon.prototype.containsLatLng = function(latLng) {
			// Exclude points outside of bounds as there is no way they are in the poly
			var bounds = this.getBounds();

			if (bounds != null && !bounds.contains(latLng)) {
				return false;
			}

			// Raycast point in polygon method
			var inPoly = false;

			var numPaths = this.getPaths().getLength();
			for (var p = 0; p < numPaths; p++) {
				var path = this.getPaths().getAt(p);
				var numPoints = path.getLength();
				var j = numPoints - 1;

				for (var i = 0; i < numPoints; i++) {
					var vertex1 = path.getAt(i);
					var vertex2 = path.getAt(j);

					if (vertex1.lng() < latLng.lng() && vertex2.lng() >= latLng.lng() || vertex2.lng() < latLng.lng() && vertex1.lng() >= latLng.lng()) {
						if (vertex1.lat() + (latLng.lng() - vertex1.lng()) / (vertex2.lng() - vertex1.lng()) * (vertex2.lat() - vertex1.lat()) < latLng.lat()) {
							inPoly = !inPoly;
						}
					}

					j = i;
				}
			}

			return inPoly;
		}

	}
}
