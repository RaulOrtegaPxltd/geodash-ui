// State events: error, loading, ready
bdl.geodash.VectorView = Backbone.View.extend({
	initialize : function() {
		this.map = this.options.map;
		this.polys = [];
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
			this._initInfoBox();

			if (this.model.isOn()) {
				this.load(function() {
					self.renderLayer();
					self.setMapWindow();
					self.tab.setReady();
				});
			} else {
				this.tab.setReady();
			}

			if (this.map.base.is('google')) {

			} else if (this.map.base.is('leaflet-mapquest')) {

			}
		} catch (e) {
			// console.log('VectorView render error', e);
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
			this.clearLayer();
			this.load(function() {
				self.renderLayer();
				self.setMapWindow();
				self.tab.setReady();
			}, true);
		} else {
			this.render();
		}
	},

	showInfoBox : function(row, isNav) {
		if (this.model.get('infoWindow') == "document") {
			var r = this.model.getRow(row);
			var w = this.model.get('infoWindowWidth');
			var h = this.model.get('infoWindowHeight');
			var t = "custom title"; // this.model.getTitle(row);
			var l = this.model.get('infoWindowDocumentURL');
			l = l + this.model.getPromptAnsSuff(row);

			var content = {
				title : t,
				row : r,
				className : "",
				width : w,
				height : h,
				loc : l
			};
			this.ib.setIBOptions({
				boxStyle : {
					width : w + 25 + "px"
				}
			})
			this.ib.setContent(bdl.geodash.TF.iBoxDocument(content));

		} else if (this.model.get('infoWindow') == "default") {
			var r = this.model.getRow(row);
			var w = this._getBoxWidth(r);
			var t = this.model.getTitle(row);

			if (t.length * 11 >= w) {
				var lastChr = w / 11;

				// truncate 4 characters
				lastChr = lastChr - 4;

				// default to one character if padding brings it down to less than one
				if (lastChr < 1) {
					lastChr = 1
				}

				t = '<span title="' + t + '">' + t.substring(0, lastChr - 1) + '...</span>';
			}

			var content = {
				title : t,
				row : r,
				className : ""
			};
			this.ib.setIBOptions({
				boxStyle : {
					width : w + "px"
				}
			})
			this.ib.setContent(bdl.geodash.TF.iBox(content));
		} else {
			// don't show the infoWindow
		}
		if (this.model.get('infoWindow') != "none") {
			if (isNav) {
				// only have to clear any poly when clicking from nav
				// since the previous click may have been on the map
				// directly.
				if (this.map.base.is('google')) {
					this.removeHighlights();
					this._geocodedIBox(row);
				} else if (this.map.base.is('leaflet-mapquest')) {
					this.removeHighlights();
					this._geocodedIBox(row);
				}
			} else {
				this.ib.open(this.map.apiMap, this.map.getApiLatLng(this.model.lastClick));
			}
		}
		this.makeSelection(row);
	},

	highlite : function(row) {
		var self = this;
		var shapeName = self.model.getShape(row);
		var features = self.model.featuresNamed(shapeName);

		if (this.map.base.is('google')) {
			this.tab.setReady();

			self.removeHighlights();

			self.currentHighlites = [];
			_.each(features, function(feature) {
				var coordinates = feature.geometry.coordinates[0];
				var geometry = $.parseJSON(coordinates);
				var polyCoords = self.getPolyCoords(geometry);

				var highlite = new google.maps.Polygon({
					paths : polyCoords,
					strokeColor : "#00f",
					strokeOpacity : 0.8,
					strokeWeight : 1,
					fillColor : '#' + self.model.get('highliteColor'),
					fillOpacity : 0.8,
					zIndex : 2
				});

				highlite.setMap(self.map.apiMap)

				self.currentHighlites.push(highlite);
			});

		} else if (this.map.base.is('leaflet-mapquest')) {
			this.tab.setReady();

			// remove current highlite
			self.removeHighlights();

			// draw new Polygons for highlight
			self.currentHighlites = [];
			_.each(features, function(feature) {
				var coordinates = feature.geometry.coordinates[0];
				var geometry = $.parseJSON(coordinates);
				var polyCoords = self.getPolyCoords(geometry);

				var polyOptions = {
					fillColor : "#" + self.model.get('highliteColor'),
					color : "#00f",
					weight : 1,
					strokeOpacity : 0.8,
					fillOpacity : 0.8
				};

				highlite = new L.Polygon(polyCoords, polyOptions)
				self.map.apiMap.addLayer(highlite);
				self.currentHighlites.push(highlite);
			});
		}

		window.setTimeout(function() {
			if (_.isNumber(row)) {
				self.showInfoBox(row, false);
			}
		}, 150);
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
				strokeColor : "#ddd",
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
		self.polys = [];
		var rows = self.model.get('rows');
		var geom = self.model.get('geom');
		var features = self.model.allFeatures();

		_.each(features, function(feature) {
			var name = feature.properties.name;
			var coordinates = feature.geometry.coordinates[0];
			var geometry = $.parseJSON(coordinates);

			var polyCoords = self.getPolyCoords(geometry);

			for (row = 0; row < rows.length; row++) {
				var shapeName = self.model.getShape(row);
				if (shapeName == name) {
					var color = geom[row].color;

					var poly = self.createPolygon({
						polyCoords : polyCoords,
						color : color
					});

					var row_i = parseInt(row); // for some reason it's not an int at this point

					if (self.map.base.is('google')) {
						var handleClick = function(e) {
							self.model.lastClick = [ e.latLng.lat(), e.latLng.lng() ];
							self.highlite(row_i);
						}

						google.maps.event.addListener(poly, 'click', handleClick);
						poly.setMap(self.map.apiMap);
					} else if (self.map.base.is('leaflet-mapquest')) {
						var handleClick = function(e) {
							self.model.lastClick = [ e.latlng.lat, e.latlng.lng ];
							self.highlite(row_i);
						}
						poly.on('click', handleClick);
						self.map.apiMap.addLayer(poly);
					}

					self.polys.push(poly);
				}
			}
		});

	},

	load : function(callback, isRefresh) {
		var isRefresh = isRefresh === undefined ? false : true; // default to false
		var state = this.model.get('state');
		this.map.gd.log({
			message : "Loading layer:  " + this.model.get('name'),
			type : "info"
		});

		if (!this.model.isPopulated() || isRefresh) {
			if (this.tab) {
				this.tab.setLoading();
			}// this.tab.setLoading();
			var self = this;
			var opts = {
				model : self.model,
				success : function(resp) {
					self.tab.setReady();
					self.model.set(resp);
					if (self.model.get('state') != "failed") {
						self.model.loadVectors();
					} else {
						self.tab.setError({
							message : self.model.get('errors')[0]
						});
					}
				},
				error : function(response) {
					var msg;
					if (response.getResponseHeader) {
						var msg = bdl.geodash.breakWord(response.getResponseHeader("X-MSTR-TaskFailureMsg"));
					} else {
						msg = "Error fetching layer.  Status: " + response.status + "; Status Text: " + response.statusText;
					}
					self.tab.setError({
						message : msg
					});
				}
			};

			// Get model data
			if (this.model.get('url')) {
				// set data from URL, used for testing
				$.post(this.model.get('url'), null, function(resp) {
					opts.success(resp);
				}, 'json')
			} else {
				bdl.geodash.MSTR.loadModel(opts);
			}
		} else if (state == "not_ready" || state == "processing") {
			this.tab.setLoading();
			this.model.loadVectors();
		} else if (this.model.get('state') == "ready" && this.map.isReady()) {
			callback();
		} else {
			this.tab.setError({
				message : this.model.get('errors')[0]
			});
		}
	},

	_initInfoBox : function() {
		var self = this;
		if (this.map.base.is('google')) {
			this.ib = new bdl.geodash.InfoBox({
				closeBoxURL : ""
			});
			self.ib.onClose = function() {
				self.removeHighlights();
			}
			// this is here because in we cant do prototype
			// inheritance until google maps api is loaded.
			_.extend(this.ib, new google.maps.OverlayView());
		} else if (this.map.base.is('leaflet-mapquest')) {
			this.ib = new bdl.geodash.GenericInfoBox({});
			self.ib.onClose = function() {
				self.removeHighlights();
			}
		}
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

	centerForName : function(name) {
		var self = this;
		var features = self.model.featuresNamed(name);
		var bounds = null;

		if (features.length > 0) {
			if (this.map.base.is('google')) {
				bounds = new google.maps.LatLngBounds();

				_.each(features, function(feature) {
					var coordinates = feature.geometry.coordinates[0];
					var geometry = $.parseJSON(coordinates);

					for (g in geometry) {
						var gll = new google.maps.LatLng(geometry[g][0], geometry[g][1]);
						bounds.extend(gll);
					}
				});

			} else if (this.map.base.is('leaflet-mapquest')) {
				bounds = new L.LatLngBounds();
				_.each(features, function(feature) {
					var coordinates = feature.geometry.coordinates[0];
					var geometry = $.parseJSON(coordinates);

					for (g in geometry) {
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

	_geocodedIBox : function(row) {
		var self = this;
		var loc = self.model.getShape(row);
		var center = self.centerForName(loc);
		if (center != null) {
			self.ib.open(self.map.apiMap, center);
		}
	},

	toggleLayer : function() {
		if (this.model.isOn() && this.map.isReady()) {
			this.render();
		} else {
			this.clearLayer();
		}
	},

	removeHighlights : function() {
		var self = this;
		_.each(this.currentHighlites, function(highlite) {
			if (self.map.base.is('google')) {
				highlite.setMap(null);
				// delete this.currentHighlite;
			} else if (self.map.base.is('leaflet-mapquest')) {
				self.map.apiMap.removeLayer(highlite);
			}
		});

		delete this.currentHighlites;
	},

	clearLayer : function() {
		var self = this;
		try {

			if (this.map.base.is('google')) {
				// remove highlight
				self.removeHighlights();

				// remove all polys
				for (i = 0; i < this.polys.length; i++) {
					this.polys[i].setMap(null);
					delete this.polys[i];
				}
				this.polys = [];

			} else if (this.map.base.is('leaflet-mapquest')) {
				// remove hilight
				self.removeHighlights();

				// remove all polys
				for (i = 0; i < this.polys.length; i++) {
					self.map.apiMap.removeLayer(self.polys[i]);
					delete self.polys[i];
				}
				this.polys = [];
			}

			// close infobox
			if (this.ib != undefined) {
				this.ib.close();
			}

		} catch (e) {
			// console.log('VectorView clearLayer error', e);
			// weird error from google on setmap null
		}
	},

	getIconThumb : function(rowID) {
		var color = this.model.getColor(rowID);
		if (color.indexOf("#") != 0) {
			color = '#' + color;
		}
		return '<div class="area-view-thumb" style="background-color:' + color + ';"/>';
	},

	remove : function() {
		this.clearLayer();
		this.tab.remove();
	}

});
