// State events: error, loading, ready
bdl.geodash.AreaView = Backbone.View.extend({
	initialize : function() {
		this.map = this.options.map;
		this._setMapWindow = true; // only set mapWindow on first render or refresh
		// this._initModel();
		this.model.view = this;
		_.bindAll(this, 'render', 'toggleLayer', 'highlite', 'load');
		this.model.bind("change:state", this.render);
		this.parentEl = $(this.map.el).parents("table.gd-frame").find("#gd-accordion")[0];
		this.tab = new bdl.geodash.NavTab({
			model : this.model,
			p : this.parentEl
		});
		this.tab.render();
		this.model.bind("change:on", this.toggleLayer);
		this.render();
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

			if (t.length - 1 * 11 >= w) {
				var lastChr = w / 11;

				// truncate 4 characters
				lastChr = lastChr - 4;

				// default to one character if padding brings it down to less than one
				if (lastChr < 1) {
					lastChr = 1
				}

				t = '<span title="' + t + '">' + t.substring(0, lastChr) + '...</span>';
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
					if (this.currentHighlite) {
						this.currentHighlite.setMap(null);
					}
					this._geocodedIBox(row);
				} else if (this.map.base.is('leaflet-mapquest')) {
					if (this.currentHighlite) {
						this.map.apiMap.removeLayer(this.currentHighlite)
					}
					;
					this._geocodedIBox(row);
				}
			} else {
				this.ib.open(this.map.apiMap, this.map.getApiLatLng(this.model.lastClick));
			}
		}
		this.makeSelection(row);
	},

	setMapWindow : function() {
		if (this.map.panZoomToRetain()) {
			return;
		}

		if (!this._setMapWindow) {
			return;
		}
		this._setMapWindow = false;
		var ll = this.map.getApiLatLng(this.model.getCenterLatLng());
		;
		// calling panTo() twice caused clipping issue in Google Maps
		// this.map.apiMap.panTo(ll);
		var self = this;
		window.setTimeout(function() {
			if (self.map.base.is('google')) {
				self.map.apiMap.panTo(ll);
				self.map.apiMap.setZoom(self.model.get('default_zoom'));
			} else if (self.map.base.is('leaflet-mapquest')) {
				self.map.apiMap.setView(ll, self.model.get('default_zoom'));
			}
		}, 500);
	},

	render : function() {
		if (!this.map.isReady()) {
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
		} catch (e) {
			this.tab.setError(e);
		}
	},

	renderLayer : function() {
		var ak = this.model.get('apiKey');
		var lk = this.model.get('layerKey');
		var self = this;

		if (this.map.base.is('google')) {
			var areaOpts = {
				getTileUrl : function(coord, zoom) {
					coord = bdl.geodash.Geocoder.getNormalizedCoord(coord, zoom);
					return self.model.getTileUrl(coord.x, coord.y, zoom);
				},
				tileSize : new google.maps.Size(256, 256),
				isPng : true,
				name : "Area Map",
				opacity : 0.5,
				maxZoom : this.model.get("max_zoom"),
				minZoom : this.model.get("min_zoom")
			}
			this.mapLayer = new google.maps.ImageMapType(areaOpts);
			this.map.apiMap.overlayMapTypes.push(this.mapLayer);
			this.map.gd.log({
				type : "info",
				message : "Loading tiles..."
			});
			var self = this;

			var handleClick = function(e) {
				self.ib.close();
				self.map.gd.log({
					type : "info",
					message : "Getting info window for area."
				});
				if (e.latLng) {
					// console.log('handleClick', 'highlight', self.highlight);
					self.model.highlite(e.latLng.lat(), e.latLng.lng(), self.highlite);
				}
				// if(self.currentHighlite){ self.currentHighlite.setMap(null);}
			}
			this.mapClickListener = google.maps.event.addListener(this.map.apiMap, "click", handleClick);

			// bind layer clickability to selector state
			this.map.selector.bind("activate", function() {
				google.maps.event.removeListener(self.mapClickListener);
			});
			// enable clickable on selector deactivate
			this.map.selector.bind("deactivate", function() {
				this.mapClickListener = google.maps.event.addListener(this.map.apiMap, "click", handleClick);
			});

			setTimeout(function() {
				self.map.gd.resize();
			}, 500);

		} else if (this.map.base.is('leaflet-mapquest')) {

			var gd_url = self.model.getTileUrl('{x}', '{y}', '{z}');

			gdLeafletLayer = L.TileLayer.extend({
				_initContainer : function() {
					var tmp = new L.TileLayer();
					tmp._initContainer.apply(this);
					tmp = null;
					L.DomUtil.addClass(this._container, 'transparent-layer');
				}
			});

			var geodash_layer = new gdLeafletLayer(gd_url, {
				attribution : '',
				maxZoom : 22
			// this.model.get("max_zoom")
			});

			this.map.apiMap.addLayer(geodash_layer);

			var handleClick = function(e) {
				self.ib.close();
				self.map.gd.log({
					type : "info",
					message : "Getting info window for area."
				});
				if (e.latlng) {
					self.model.highlite(e.latlng.lat, e.latlng.lng, self.highlite);
				}
				// if(self.currentHighlite){ self.currentHighlite.setMap(null);}
			}

			this.mapClickListener = handleClick;
			this.map.apiMap.on('click', handleClick);
			this.mapLayer = geodash_layer;

		}
	},

	highlite : function(data) {
		if (this.map.base.is('google')) {
			this.tab.setReady();
			if (data.status != "OK" || data.response == undefined) {
				return;
			}
			var polys = [];
			var paths = data.response.path;
			for (var i = 0; i < paths.length; i++) {
				var pts, shp = [];
				if (paths[i].length < 4 && paths[i][0].length > 1) {
					pts = paths[i][0];
				} else {
					pts = paths[i];
				}

				var shp = [];
				for (var j = 0; j < pts.length; j++) {
					var sub_pts = pts[j];
					shp.push(new google.maps.LatLng(sub_pts[1], sub_pts[0]));
				}
				polys[i] = shp;
			}

			this.currentHighlite = new google.maps.Polygon({
				paths : polys,
				fillColor : "#0000FF",
				strokeColor : this.model.get("highliteColor"),
				strokeWeight : 4,
				fillOpacity : 0.3
			});
			this.currentHighlite.setMap(this.map.apiMap);
			var row = parseInt(data.response.row_id);
			var self = this;
			window.setTimeout(function() {
				if (_.isNumber(row)) {
					self.showInfoBox(row, false);
				}
			}, 150);
		} else if (this.map.base.is('leaflet-mapquest')) {
			var self = this;
			this.tab.setReady();

			if (data.response.path) {

				shps = $.map(data.response.path, function(path) {
					if (path.length < 2) {
						path = path[0];
					}
					pts = $.map(path, function(a) {
						// console.log('a', a);
						return [ new L.LatLng(a[1], a[0]) ];
					});
					return [ pts ];
				});

				polyOptions = {
					fillColor : "#00F",
					color : this.model.get("highliteColor"),
					weight : 4,
					fillOpacity : 0.3
				};

				var group = new L.LayerGroup();

				$.each(shps, function(shape) {
					var poly = new L.Polygon(shps[shape], polyOptions);
					group.addLayer(poly)
				});

				this.map.apiMap.addLayer(group);
				this.currentHighlite = group;

				var row = parseInt(data.response.row_id);
				window.setTimeout(function() {
					if (_.isNumber(row)) {
						self.showInfoBox(row, false);
					}
				}, 150);
			}
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

	toggleLayer : function() {
		if (this.model.isOn() && this.map.isReady()) {
			this.render();
		} else {
			this.clearLayer();
		}
	},

	clearLayer : function() {
		this._setMapWindow = true;
		if (this.mapLayer != undefined) {
			if (this.map.base.is('google')) {

				var mts = this.map.apiMap.overlayMapTypes;
				var index = mts.indexOf(this.mapLayer);
				mts.removeAt(index);
				google.maps.event.removeListener(this.mapClickListener);
				if (this.currentHighlite != undefined) {
					this.currentHighlite.setMap(null);
				}
				if (this.ib != undefined) {
					this.ib.close();
				}

			} else if (this.map.base.is('leaflet-mapquest')) {

				this.map.apiMap.removeLayer(this.mapLayer);

				this.map.apiMap.off('click', this.mapClickListener);

				if (this.currentHighlite != undefined) {
					this.map.apiMap.removeLayer(this.currentHighlite);
				}
				if (this.ib != undefined) {
					this.ib.close();
				}

			}
		}

		this.mapLayer = undefined;
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
	},

	_initInfoBox : function() {
		var self = this;
		if (this.map.base.is('google')) {
			this.ib = new bdl.geodash.InfoBox({
				closeBoxURL : ""
			});
			self.ib.onClose = function() {
				if (self.currentHighlite != undefined) {
					self.currentHighlite.setMap(null);
				}
			}
			// this is here because in we cant do prototype
			// inheritance until google maps api is loaded.
			_.extend(this.ib, new google.maps.OverlayView());
		} else if (this.map.base.is('leaflet-mapquest')) {
			this.ib = new bdl.geodash.GenericInfoBox({});
			self.ib.onClose = function() {
				if (self.currentHighlite != undefined) {
					self.map.apiMap.removeLayer(self.currentHighlite);
				}
			}
		}
	},

	load : function(callback, isRefresh) {
		// TODO: figure out why multiple calls are made on refresh, and one has wrong layerKey
		var isRefresh = isRefresh === undefined ? false : true; // default to false
		var state = this.model.get('state');
		this.map.gd.log({
			message : "Loading layer:  " + this.model.get('name'),
			type : "info"
		});
		if (this.model.get('rows').length == 0 && state != "not_ready") {
			this.tab.setError({
				message : "No data to display."
			});
		} else if (!this.model.isPopulated() || isRefresh) {
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
						// console.log('AreaView.load model:', self.model, ' layerKey', self.model.get('layerKey'));
						self.model.pollState();
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
			this.model.pollState();
		} else if (this.model.get('state') == "ready" && this.map.isReady()) {
			callback();
		} else {
			this.tab.setError({
				message : this.model.get('errors')[0]
			});
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

	_geocodedIBox : function(row) {
		var gc = this.model.get('geocoder');
		var loc = this.model.getShape(row);
		var self = this;
		bdl.geodash.Geocoder.geocode({
			country : this.model.get('country'),
			level : this.model.get('level'),
			apiKey : this.model.get('apiKey'),
			service : gc,
			address : loc,
			success : function(latlng) {
				self.ib.open(self.map.apiMap, self.map.getApiLatLng(latlng));
			},
			error : function() {
				self.ib.close();
			}
		});
	}
});
