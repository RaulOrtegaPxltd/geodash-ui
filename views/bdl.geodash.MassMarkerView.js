function MilliMapType(model, tileSize) {
	this.tileSize = tileSize;
	this.model = model;
}

MilliMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
	var self = this;

	var div = ownerDocument.createElement('div');
	div.style.width = this.tileSize.width + 'px';
	div.style.height = this.tileSize.height + 'px';
	div.style.borderWidth = '0px';
	div.style.margin = '0';

	var a = bdl.geodash.MSTR;

	var js = _.clone(self.model.toJSON());
	delete js["rows"];
	if (self.model.get('type') != "kmlLayer") {
		delete js["url"];
	}
	delete js["geom"];

	var layer = JSON.stringify(js).replace(/#/, '');

	var taskInfo = {
		taskId : "geodash3GetTile",
		sessionState : mstrApp.sessionState,
		layer : layer,
		x : coord.x,
		y : coord.y,
		z : zoom
	};

	var opts = {
		success : function(data) {
			var img = ownerDocument.createElement('img');
			img.style.width = '256px';
			img.style.height = '256px';
			img.src = data.image;
			div.appendChild(img);
		}
	};

	if (opts.model.get('source') == 'external') {
		taskInfo.objectID = opts.model.get('reportID');
	} else {
		taskInfo.messageID = mstrApp.getMsgID();
	}
	if (opts.model.get('source') == 'current') {
		taskInfo.gridKey = gd.base.get('parent').k;
	}
	if (opts.model.get('source') == 'gdGrid') {
		taskInfo.gridKey = opts.model.get('gdGridKey');
	}
	
	mstrmojo.xhr.request("POST", mstrConfig.taskURL, opts, taskInfo);
	return div;
};

// State events: error, loading, ready
bdl.geodash.MassMarkerView = Backbone.View.extend({
	initialize : function() {
		this.map = this.options.map;
		this._setMapWindow = true;
		this._initModel();
		this.model.view = this;
		_.bindAll(this, 'render', 'toggleLayer');
		this.parentEl = $(this.map.el).parents("table.gd-frame").find("#gd-accordion")[0];
		this.tab = new bdl.geodash.NavTab({
			model : this.model,
			p : this.parentEl
		});
		this.markers = [];
		this.circles = [];
		this.tab.render();
		this.tab.setLoading();
		this.model.bind("change:on", this.toggleLayer);
	},

	addMarker : function(icon, row) {
		var marker;
		if (this.map.base.is('google')) {
			marker = new google.maps.Marker(icon);
			marker.row = row;
			var self = this;
			google.maps.event.addListener(marker, "click", function(e) {
				self.showInfoBox(this.row);
			});
			if (this.model.get('cluster') === false) {
				marker.setMap(this.map.apiMap);
			}
		} else if (this.map.base.is('leaflet-mapquest')) {
			marker = new L.Marker(icon.position, {
				icon : icon
			});
			marker.row = row;
			var self = this;
			marker.on('click', function(e) {
				self.showInfoBox(this.row);
			});

			marker.row = row;
			this.map.apiMap.addLayer(marker);

		}
		this.markers.push(marker);
		this.bounds.extend(this.map.getApiMarkerLatLng(marker));
	},

	makeSelection : function(row) {
		if (!this.map.gd.base.get('isDoc')) {
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
//			var allBones = $.map(window.top.microstrategy.bones, function(b) {
//				if (b.isGridBone)
//					return b;
//			});
//			var bone = $.map(allBones, function(b) {
//				if (b.id == gdGridId) {
//					return b;
//				}
//			})[0];
//			var selector = $(bone.gridSpan).find("div.selector")[0].innerText;

			bdl.geodash.MSTR.makeSelections([ this.model.getTitle(row) ], this.map.gd, gdGridId, selector);

		} else {
			this.map.gd.log({
				type : "info",
				message : "Cannot select external layers..."
			});
		}
	},

	showInfoBox : function(row) {
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
					width : w + 25 + "px",
					height : h + "px"
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
			});
			this.ib.setContent(bdl.geodash.TF.iBox(content));
		} else {
			// don't show the infowindow
		}

		if (this.model.get('infoWindow') != "none") {
			this.ib.open(this.map.apiMap, this.markers[row]);
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
		// this.map.apiMap.panTo(this.bounds.getCenter());
		var self = this;
	},

	render : function() {
		try {
			this.bounds = this.map.getBounds();
			this.tab.setLoading();
			this.clearMarkers();
			this._initInfoBox();
			if (this.model.isOn() && this.model.get('state') == "ready") {
				this.renderMarkers();
				this.setMapWindow();
			}
			// Hack is here until we properly create a state machine
			// The render is called by map api loaded event and it
			// is also called once data is fetched. The state
			// has to be correctly set incase either happens out of order.
			if (this.model.get('state') == "failed") {
				this.tab.setError({
					message : ""
				});
			} else if (this.model.get('state') == "processing") {
				this.tab.setLoading();
			} else if (this.model.get('state') == "ready") {
				this.tab.setReady();
			}
		} catch (e) {
			// console.log(e, e.message);
			this.tab.setError(e);
		}
	},

	refresh : function(options) {
		opts = $.extend({
			steMapWindow : false,
			forceLoad : false
		}, options);

		this._setMapWindow = opts['setMapWindow'];

		if (opts['forceLoad'] || !this.model.isPopulated()) {
			this.clearMarkers();
			this.loadModel(true);
		} else {
			this.render();
		}
	},

	toggleLayer : function() {
		if (this.model.isOn()) {
			this.render();
		} else {
			this.clearMarkers();
		}
	},

	clearMarkers : function() {
		var self = this;

		if (this.ib != undefined) {
			this.ib.close();
		}
		if (typeof self.milliOverlay !== "undefined" && self.milliOverlay != null) {
			self.map.apiMap.overlayMapTypes.removeAt(0);
			self.milliOverlay = null;
		}
		this.markers = [];
	},

	remove : function() {
		this.clearMarkers();
		this.tab.remove();
		delete this.markers;
		delete this;
	},

	renderMilliOverlay : function() {
		var self = this;

		self.map.apiMap;
		self.milliOverlay = new MilliMapType(self.model, new google.maps.Size(256, 256));
		// self.map.apiMap.overlayMapTypes.push(layer);
		self.map.apiMap.overlayMapTypes.insertAt(0, self.milliOverlay);
	},

	renderMarkers : function() {
		var self = this;
		self.renderMilliOverlay();
		this.tab.setLoading();
		if (this.map.base.is('google')) {
			// clear map first?
			var rows = this.model.get('rows');
			var circles = this.model.get('circles');
			// var f = bdl.geodash.IconFactory;
			for (var i = 0; i < rows.length; i++) {
				var icon = this.model.getIcon(i);
				var latlng = this.map.getApiLatLng(this.model.getLatLng(i))
				icon.position = latlng;
				this.addMarker(icon, i);

				_.each(circles, function(circle) {
					var color = '#' + circle.color;
					var size = (circle.units == 'miles' ? circle.size * 1.60934 : circle.size) / 2;
					var c = self._drawCircle(latlng.lat(), latlng.lng(), size, color, 1, 0.8, color, 0.3);
					self.circles.push(c);
					c.setMap(self.map.apiMap);
				});

			}
			;

			if (this.model.get('cluster')) {
				this.cluster = new MarkerClusterer(this.map.apiMap, this.markers);
			}

		} else if (this.map.base.is('leaflet-mapquest')) {
			var rows = this.model.get('rows');
			var circles = this.model.get('circles');
			// var f = bdl.geodash.IconFactory;
			for (var i = 0; i < rows.length; i++) {
				var icon = this.model.getIcon(i);
				icon.position = this.map.getApiLatLng(this.model.getLatLng(i));
				var latlng = this.map.getApiLatLng(this.model.getLatLng(i))
				this.addMarker(icon, i);

				_.each(circles, function(circle) {
					var color = '#' + circle.color;
					var size = (circle.units == 'miles' ? circle.size * 1.60934 : circle.size) / 2;
					var c = self._drawCircle(latlng.lat, latlng.lng, size, color, 1, 0.8, color, 0.3);
					self.circles.push(c);
					self.map.apiMap.addLayer(c);
				});
			}
			// TODO: cluster
			/*
			 * if(this.model.get('cluster')){ this.cluster = new MarkerClusterer(this.map.apiMap,this.markers); }
			 */
		}

		this.tab.setReady();
	},

	getIconThumb : function(rowID) {
		var icon = this.model.getIcon(rowID, true);
		if (this.map.base.is('google')) {
			return '<img src="' + icon.thumb + '"/>';
		} else if (this.map.base.is('leaflet-mapquest')) {
			return '<img src="' + icon.options.thumb + '"/>';
		}
	},

	loadModel : function(isRefresh) {
		var isRefresh = isRefresh === undefined ? false : isRefresh; // default to false
		var self = this;
		if (self.tab) {
			self.tab.setLoading();
		}
		;
		this.map.gd.log({
			message : "Loading layer:  " + this.model.get('name'),
			type : "info"
		});
		var opts = {
			model : this.model,
			success : function(resp) {
				self.model.set(resp);

				if (self.model.get('state') == "ready") {
					var rows = self.model.get('rows');
					if (self.map.isReady()) {
						self.render();
					}

					self.tab.setReady();
				} else {
					self.tab.setError({
						message : "Error loading layer: " + resp.status + "; Error:  " + resp.errors[0]
					});
				}
			},
			error : function(response) {
				self.model.set({
					state : "failed"
				});
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
		bdl.geodash.MSTR.loadModel(opts);
	},

	_initInfoBox : function() {
		if (this.map.base.is('google')) {
			this.ib = new bdl.geodash.InfoBox({
				closeBoxURL : ""
			});
			// this is here because in we cant do prototype
			// inheritance until google maps api is loaded.
			_.extend(this.ib, new google.maps.OverlayView());
		} else if (this.map.base.is('leaflet-mapquest')) {
			this.ib = new bdl.geodash.GenericInfoBox({});
		}

	},

	_initModel : function() {
		if (!this.model.isPopulated()) {
			this.loadModel(false);
		} else {
			this.model.set({
				state : "ready"
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

	_drawCircle : function(lat, lng, radiusKm, strokeColor, strokeWidth, strokeOpacity, fillColor, fillOpacity) {
		/*
		 * radius should be in km NOTE: circle is actually being drawn with diamater of input size
		 */

		var earth_radius = 6371.0;
		var Cpoints = [];
		var radius = 360 / earth_radius * radiusKm;
		var nrOfPoints = 45;

		for (var i = 0; i < nrOfPoints; i++) {
			var R = 6371;
			var d = radiusKm;

			var brng = (i * 1.0 / nrOfPoints) * 2 * Math.PI;

			var lat1 = lat * Math.PI / 180;
			var lon1 = lng * Math.PI / 180;

			var clat = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
			var clng = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(clat));

			clat = clat * 180 / Math.PI;
			clng = clng * 180 / Math.PI;

			if (this.map.base.is('google')) {
				var P = new google.maps.LatLng(clat, clng);
				Cpoints.push(P);
			} else if (this.map.base.is('leaflet-mapquest')) {
				var P = new L.LatLng(clat, clng);
				Cpoints.push(P);
			}

		}

		if (this.map.base.is('google')) {
			return new google.maps.Polygon({
				paths : Cpoints,
				strokeColor : strokeColor,
				strokeOpacity : strokeOpacity,
				strokeWeight : strokeWidth,
				fillColor : fillColor,
				fillOpacity : fillOpacity,
				zIndex : 1
			});
		} else if (this.map.base.is('leaflet-mapquest')) {

			var polyOptions = {
				strokeColor : strokeColor,
				strokeOpacity : strokeOpacity,
				strokeWeight : strokeWidth,
				fillColor : fillColor,
				fillOpacity : fillOpacity,
				weight : 1
			};

			return new L.Polygon(Cpoints, polyOptions);
		}
	}

})
