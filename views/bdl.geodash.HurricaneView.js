// State events: error, loading, ready
bdl.geodash.HurricaneView = Backbone.View.extend({
	initialize : function() {
		this.map = this.options.map;
		this.polys = [];
		this.circles = [];
		this.infoWindow = null;
		this._setMapWindow = true; // only set mapWindow on first render or refresh
		// this._initModel();
		this.model.view = this;
		_.bindAll(this, 'render', 'toggleLayer');
		this.parentEl = $(this.map.el).parents("table.gd-frame").find("#gd-accordion")[0];
		this.tab = new bdl.geodash.NavTab({
			model : this.model,
			p : this.parentEl
		});
		this.model.bind("change:state", this.render);
		this.model.bind("change:on", this.toggleLayer);
		this.tab.render();
		this.tab.$(".gd-tab-content .gd-tab-tools").hide();
		if (this.map.gd.base.is('google')) {
			this.render(); // bug fix
		}
	},

	render : function() {
		var self = this;

		if (!this.map.isReady()) {
			window.setTimeout(function() {
				self.render();
			}, 500);

			return false;
		}

		var self = this;

		try {
			this.tab.setLoading();
			this.clearLayer();

			if (this.model.isOn()) {
				self.renderLayer();
				self.tab.setReady();
			} else {
				this.tab.setReady();
			}

		} catch (e) {
			// console.log('HurricaneLayer render error', e);
			this.tab.setError(e);
		}
	},

	makeSelection : function(row) {
		if (!this.map.gd.base.get('isDoc') || row == undefined) {
			return false;
		}
		if (this.model.get('source') == "current") {
			bdl.geodash.MSTR.makeSelections([ this.model.getTitle(row) ], this.map.gd);
			this.map.gd.log({
				type : "info",
				message : "Selecting " + this.model.getTitle(row) + "..."
			});
		} else if (this.model.get('source') == "gdgrid") {
			var gdGridId = this.model.get('gdGridId');
			// TODO: MSTR BONES TO MOJO
			var allBones = $.map(window.top.microstrategy.bones, function(b) {
				if (b.isGridBone)
					return b;
			});
			var bone = $.map(allBones, function(b) {
				if (b.id == gdGridId) {
					return b;
				}
			})[0];
			var selector = $(bone.gridSpan).find("div.selector")[0].innerText;

			bdl.geodash.MSTR.makeSelections([ this.model.getTitle(row) ], this.map.gd, gdGridId, selector);
		} else {
			this.map.gd.log({
				type : "info",
				message : "Cannot select external layers..."
			});
		}
	},

	refresh : function(options) {
		opts = $.extend({
			steMapWindow : false,
			forceLoad : false
		}, options);

		this._setMapWindow = opts['setMapWindow'];

		opts = $.extend({
			steMapWindow : false,
			forceLoad : false
		}, options);

		this._setMapWindow = opts['setMapWindow'];

		var self = this;
		if (opts['forceLoad'] || !this.model.isPopulated()) {
			self.clearLayer();
			self.renderLayer();
			self.tab.setReady();
		} else {
			this.render();
		}
	},

	setMapWindow : function() {
		if (this.map.panZoomToRetain()) {
			return;
		}

		var self = this;
		if (!this._setMapWindow) {
			return;
		}
		this._setMapWindow = false;
		// var ll = this.map.getApiLatLng(this.getCenterLatLng());;
		var bounds = self.getPolysBounds();
		// calling panTo() twice caused clipping issue in Google Maps
		// this.map.apiMap.panTo(ll);
		if (self.polys.length > 0) {
			window.setTimeout(function() {
				if (self.map.base.is('google')) {
					self.map.apiMap.fitBounds(bounds);
					// self.map.apiMap.setZoom(self.model.get('default_zoom'));
				} else if (self.map.base.is('leaflet-mapquest')) {
					self.map.apiMap.fitBounds(bounds);
				}
			}, 500);
		}
	},

	getPolysBounds : function() {
		var self = this;
		if (self.polys.length > 0) {
			if (self.map.base.is('google')) {
				var bounds = new google.maps.LatLngBounds();

				for (i = 0; i < self.polys.length; i++) {
					var arr = self.polys[i].getPath().getArray();
					_.each(arr, function(p) {
						bounds.extend(p);
					});
				}

				return bounds;

			} else if (self.map.base.is('leaflet-mapquest')) {
				if (self.polys.length > 0) {
					var bounds = new L.LatLngBounds();
					for (i = 0; i < self.polys.length; i++) {
						var arr = _.each(self.polys[i]._latlngs, function(latlng) {
							bounds.extend(latlng);
						});
					}
				}

				return bounds;
			}
		} else {
			return null;
		}
	},

	getPolyCoords : function(geometry) {
		var polyCoords = [];

		for (g in geometry) {
			if (!isNaN(parseFloat(geometry[g][0])) && !isNaN(parseFloat(geometry[g][1]))) {
				if (this.map.base.is('google')) {
					var point = new google.maps.LatLng(geometry[g][0], geometry[g][1]);
				} else if (this.map.base.is('leaflet-mapquest')) {
					var point = new L.LatLng(geometry[g][0], geometry[g][1]);
				}

				polyCoords.push(point);
			}
		}

		return polyCoords;
	},

	createPolygon : function(opts) {
		var poly;
		if (this.map.base.is('google')) {
			poly = new google.maps.Polygon({
				paths : opts.polyCoords,
				strokeColor : '#' + opts.color,
				strokeOpacity : 0.8,
				strokeWeight : 1,
				fillColor : '#' + opts.color,
				fillOpacity : 0.8,
				zIndex : 1
			});
		} else if (this.map.base.is('leaflet-mapquest')) {
			var polyOptions = {
				fillColor : '#' + opts.color,
				color : "#ddd",
				weight : 1,
				fillOpacity : 0.8
			};
			poly = new L.Polygon(opts.polyCoords, polyOptions);
		}

		return poly;
	},

	renderLayer : function() {
		var self = this;

		if (!self.model.loaded) {
			// load new data if not currently loading
			if (!self.model.loading) {
				self.model.update();
			}

			// run again so layer is drawn once loaded
			window.setTimeout(function() {
				self.renderLayer();
			}, 300);
		} else {
			if (this.model.isOn()) {
				self.drawPointsShapes();
			}
			;
		}

	},

	drawPointsShapes : function() {
		var self = this;
		// draw shapes
		if (self.model.data == null) {
			return;
		}

		var shapes = self.model.data['data']['shapes'];
		_.each(shapes, function(shape) {
			var polyCoords = self.getPolyCoords(shape.points);
			poly = self.createPolygon({
				polyCoords : polyCoords,
				color : self.radiiColors[shape['radii']],
				zIndex : 3
			});
			poly.setMap(self.map.apiMap);
			self.polys.push(poly);

			// propogate mousemove and mousedown events to map. not propagating prevents lasso tool from working
			google.maps.event.addListener(poly, 'mousemove', function(e) {
				google.maps.event.trigger(self.map.apiMap, 'mousemove', e);
			});
			google.maps.event.addListener(poly, 'mousedown', function(e) {
				google.maps.event.trigger(self.map.apiMap, 'mousedown', e);
			});

			// infowindow for shape
			google.maps.event.addListener(poly, 'click', function(e) {
				self.clearInfoWindow();

				var shapeCS = "<div>";
				shapeCS = shapeCS + "<div><strong>Intensity: </strong>" + shape['radii'] + " knots</div>";
				shapeCS = shapeCS + "</div>";

				self.infoWindow = new google.maps.InfoWindow({
					content : shapeCS
				});

				self.infoWindow.setPosition(e.latLng);
				self.infoWindow.open(self.map.apiMap);
			});
		});

		// draw points
		var points = self.model.data['data']['points'];
		_.each(points, function(point) {
			var latlng = new google.maps.LatLng(point['lat'], point['lng']);
			var circleOpts = {
				strokeColor : '#222222',
				strokeOpacity : 0.7,
				strokeWeight : 1,
				fillColor : self.intensityColor(parseInt(point['intensity'])),
				fillOpacity : 0.6,
				map : self.map.apiMap,
				center : latlng,
				radius : 50000,
				zIndex : 2
			};
			var circle = new google.maps.Circle(circleOpts);
			self.circles.push(circle);

			// infowindow for point
			google.maps.event.addListener(circle, 'click', function() {
				self.clearInfoWindow();

				var circleCS = "<div>";
				dsplit = point['date'].split('T');
				dateItems = dsplit[0];
				timeItems = dsplit[1];
				circleCS = circleCS + "<div><strong>Date: </strong>" + dsplit[0] + ' ' + dsplit[1] + "</div>";
				circleCS = circleCS + "<div><strong>Intensity: </strong>" + point['intensity'] + " knots</div>";
				circleCS = circleCS + "</div>";

				self.infoWindow = new google.maps.InfoWindow({
					content : circleCS
				});

				self.infoWindow.setPosition(latlng);
				self.infoWindow.open(self.map.apiMap);
			});
		});
	},

	getPolyCoords : function(geometry) {
		var polyCoords = [];

		for (g in geometry) {
			if (!isNaN(parseFloat(geometry[g][1])) && !isNaN(parseFloat(geometry[g][0]))) {
				if (this.map.base.is('google')) {
					var point = new google.maps.LatLng(geometry[g][1], geometry[g][0]);
				} else if (this.map.base.is('leaflet-mapquest')) {
					var point = new L.LatLng(geometry[g][1], geometry[g][0]);
				}

				polyCoords.push(point);
			}
		}

		return polyCoords;
	},

	_getBoxWidth : function(r) {
		var lengths = _.map(r, function(val, col) {
			return ("" + val + " " + col).length;
		})
		var len = _.max(lengths) * 11;
		if (len <= 200) {
			return len + 6;
		} else {
			return 206;
		}
	},

	toggleLayer : function() {
		if (this.model.isOn() && this.map.isReady()) {
			this.render();
		} else {
			this.clearLayer();
		}
	},

	clearInfoWindow : function() {
		if (this.infoWindow != null) {
			this.infoWindow.close();
			delete this.infoWindow;
		}
	},

	clearLayer : function() {
		var self = this;
		try {
			if (this.map.base.is('google')) {
				// close infoWindow
				self.clearInfoWindow();

				// remove all polys
				for (i = 0; i < this.polys.length; i++) {
					this.polys[i].setMap(null);
					delete this.polys[i];
				}
				this.polys = [];

				// remove all circles
				for (i = 0; i < this.circles.length; i++) {
					this.circles[i].setMap(null);
					delete this.circles[i];
				}
				this.circles = [];
			} else if (this.map.base.is('leaflet-mapquest')) {
			}

			// close infobox
			if (this.ib != undefined) {
				this.ib.close();
			}

		} catch (e) {
		}
	},

	radiiColors : {
		34 : '99CCFF',
		50 : '9999FF',
		64 : 'CC99FF'
	},

	intensityColor : function(intensity) {
		// http://en.wikipedia.org/wiki/Saffir%E2%80%93Simpson_hurricane_wind_scale
		if (intensity > 136) {
			// cat 5
			return '#ff6060';
		} else if (intensity > 112) {
			// cat 4
			return '#ff8f20';
		} else if (intensity > 95) {
			// cat 3
			return '#ffc140';
		} else if (intensity > 82) {
			// cat 2
			return '#ffe775';
		} else if (intensity > 63) {
			// cat 1
			return '#ffffcc';
		} else if (intensity > 34) {
			// tropical storm
			return '#00faf4';
		} else {
			// tropical depression
			return '#5ebaff';
		}
	},

	remove : function() {
		this.clearLayer();
		this.tab.remove();
	}

});
