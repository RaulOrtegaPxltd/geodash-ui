// fix for IE7 trying to log to console
if (!window.console) console = {log: function() {}};

(function($,undefined){
  $.fn.serializeObject = function(){
    var obj = {};

    $.each( this.serializeArray(), function(i,o){
      var n = o.name,
        v = o.value;
        if(v=="true"){ v = true; }
		if(v=="false"){ v = false; }
        obj[n] = obj[n] === undefined ? v
          : $.isArray( obj[n] ) ? obj[n].concat( v )
          : [ obj[n], v ];
    });

    return obj;
  };
})(jQuery);

if(!bdl){
	var bdl = {};
	bdl.geodash = {};
}

bdl.geodash.map_loaded = false;
bdl.geodash.map_google_has_been_idle = false;

bdl.geodash.protocol = $(location).attr('protocol');

bdl.geodash.server = "geodash.co";
// bdl.geodash.server = "192.168.5.40:3080";

bdl.geodash.js_path = "../plugins/GeoDash2/javascript/geodash-ui";

/* call back function to be called once maps api loads */
bdl.geodash.cb = function(){
  bdl.geodash.map_loaded = true;
	if(typeof(console) != 'undefined'){
		console.log("script loaded");
	}
};

bdl.geodash.log = function(msg){
	if(typeof(console) != 'undefined'){
		console.log(msg);
	}
};

bdl.geodash.breakWord = function(msg){
	var idx = msg.toLowerCase().indexOf('object id');
	var re = new RegExp("[A-Z0-9]{32,}");
	var m = re.exec(msg);
	if(m == null){ return msg; }
	for (var i = 0; i < m.length; i++) {
	      var res = m[i].slice(0,8) + "&shy;" + m[i].slice(8,16) + "&shy;" + m[i].slice(16,24)+ "&shy;" + m[i].slice(24,32);
	      msg = msg.replace(m[i],res);
	}
	return msg;
};

bdl.geodash.MAP_TYPES = {
	normal:{
		id: 0,
		apis: ['google']
	},
	sattelite:{
		id: 1,
		apis: ['google']
	},
	terrain: {
		id: 2,
		apis: ['google']
	}
};

/**
*   TemplateFactory
*/

bdl.geodash.TF = {
	frame: _.template( '<table class="gd-frame" cellspacing="0" cellpadding="0"><tr>'+
						 '<td id="<%= container %>-nav" class="gd-nav">' +
							'<div class="shadow ui-corner-all gd-main-nav-ctr">' +
							'<div class="gd-nav-hd ui-corner-top"> </div>' + 
							'<div class="gd-accordion-parent"><div id="gd-accordion"></div></div>' +
							'<div class="gd-map-ft ui-corner-bottom"><div class="gd-ft-buttons"><button value="add">Add</button><button value="edit">Edit</button><button value="delete">Delete</button></div> </div> </div></td>' +
						 '<td id="<%= container %>-map-section" class="gd-map-section">' +
						 '<div class="shadow ui-corner-all gd-main-map-ctr">' +
						 '<div class="gd-map-hd ui-corner-top"> </div>' + 
             '<div class="gd-editor"> </div>' +
						 '<div id="<%= container %>-map" class="gd-map"> </div>' + 
						 '<div class="gd-map-ft ui-corner-bottom"><div class="gd-log"> </div></div></div></td></table>'),
	
	iBox: _.template(
		'<table cellpadding="0" cellspacing="0" class="<%= className %>"><tr><td class="gd-overlay-bg gd-overlay-tleft">' +
			'<div class="gd-ib">' +
			'<div class="gd-ib-hd"><span class="gd-ib-title"><%= title %></span><span class="gd-ib-close" >&nbsp;x</span></div> ' +
			'<div class="gd-ib-bd"><table>' +
				'<% _.each(row,function(val,column){ %> ' +	
				'<tr><td class="gd-ib-col"><%= column %>:</td><td> <%= val %></td></tr> <% }); %></table></div>' +
			'<div class="gd-ib-ft"> </div>' +
		    '<td class="gd-overlay-bg gd-overlay-tright"> </td></tr>' +
			'<tr><td class="gd-overlay-bg gd-overlay-bleft"> </td>' +
				'<td class="gd-overlay-bg gd-overlay-bright"> </td></tr>' +
		'</div></table>'),
	
	iBoxDocument: _.template(
		'<table border="0" cellpadding="0" cellspacing="0" class="<%= className %>"><tr><td class="gd-overlay-bg gd-overlay-tleft">' +
			'<div class="gd-ib">' +
			'<div class="gd-ib-hd"><span class="gd-ib-close" >&nbsp;x</span></div> ' +
			'<div class="gd-ib-bd" style="height:<%= height %>px"><table><tr><td>' +
      '<iframe src="<%= loc %>" width="<%= width %>" height="<%= height %>">loading..</iframe>' +
				'</td></tr></table></div>' +
			'<div class="gd-ib-ft"> </div>' +
		    '<td class="gd-overlay-bg gd-overlay-tright"> </td></tr>' +
			'<tr><td class="gd-overlay-bg gd-overlay-bleft"> </td>' +
				'<td class="gd-overlay-bg gd-overlay-bright"> </td></tr>' +
    ''),

	accdTab: _.template(
		'<h3 id="gd-layer-tab-<%= id %>" data-slot="<%= slot %>">'+
			'<a href="#"><%= name %></a>'+
      '<% if(edit) { %> '+
			'<div class="gd-tab-state <%= className %>"><span> </span><button class="gd-tab-btn gd-tab-btn-off <%= className %>" type="button"></button></div>'+
      '<% } %>'+

		'</h3><div class="gd-tab-content">'+
				'<div class="gd-tab-tools"><button class="gd-refresh" title="Refresh this map layer."> </button><input name="gd-search" class="gd-search" type="text" value="type to search"/> </div>' +
				'<div class="gd-paging"><span class="gd-pg-first"><<</span><span class="gd-pg-prev"><</span><label class="gd-pg-label"> </label><span class="gd-pg-next">></span><span class="gd-pg-last">>></span></div></div>'),
	
	log: _.template('<span class="gd-<%= type %>"></span> <span class="gd-log-msg"><%= message %></span>')
};


/**
* bdl.geodash.Geocoder
*/
bdl.geodash.Geocoder = {
	geocode: function(opts){
		if(opts.service == "google"){
			var g = bdl.geodash.Geocoder.getGoogleGeocoder();
			g.geocode(
				{'address': opts.address},
				 function(results,status) {
					 if (status != google.maps.GeocoderStatus.OK) {
						opts.error();
						bdl.geodash.log("Geocoding Error", "Could not find " + opts.address);
				     }else{
						var latlng = [results[0].geometry.location.lat(),results[0].geometry.location.lng()];
				    	opts.success.call(null,latlng);
				     }
				 });
		}else{
			var query = opts.address;
			if(opts.country != undefined){
				query += " " + opts.country;
			}
			
			if(opts.level != undefined){
				query += " " + opts.level;
			}
			
			var url = bdl.geodash.protocol + "//" + bdl.geodash.server + "/api/service/geo_coder?api_key=" + 
						opts.apiKey +"&q="+query;
			$.ajax({
				url: url,
				jsonp: "callBack",
				dataType: "jsonp",
				success: function(results){
					if(results.status == "OK"){
						var latlng = [results.response.lat,results.response.lng];
						opts.success.call(null,latlng);				
					}else{
						opts.error();
						bdl.geodash.log("Geocoding Error", "Could not find " +query);
					}
				}
			});			
		}
	},
	
	getGoogleGeocoder: function(){
    if(typeof(google.maps) == 'undefined'){;
      bdl.geodash.log("Google Geocoder can be used only with Google API");
      return null;
    }

		if(bdl.geodash.Geocoder.google == undefined){
			bdl.geodash.Geocoder.google = new google.maps.Geocoder();
		}
		return bdl.geodash.Geocoder.google;
	},

  // Normalizes the coords that tiles repeat across the x axis (horizontally)
  // like the standard Google map tiles.
  getNormalizedCoord: function (coord, zoom) {
    var y = coord.y;
    var x = coord.x;

    // tile range in one direction range is dependent on zoom level
    // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
    var tileRange = 1 << zoom;

    // don't repeat across y-axis (vertically)
    if (y < 0 || y >= tileRange) {
      // return null;
      y = 0;
    }

    // repeat across x-axis
    if (x < 0 || x >= tileRange) {
      x = (x % tileRange + tileRange) % tileRange;
    }

    return {
      x: x,
      y: y
    };
  }
};	


/* Fix for < IE9 not having forEach, used in heatmap code */
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun == "function"){
      // throw new TypeError();
      var thisp = arguments[1];
      for (var i = 0; i < len; i++)
      {
        if (i in this)
          fun.call(thisp, this[i], i, this);
      }
    }
  };
}

/***
 * distance between two points calculation
 * adapted from: http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
 */
bdl.geodash.distHaversine = function(lat1, lng1, lat2, lng2) {
  var rad = function(x) {return x*Math.PI/180;}

  var R = 6371; // earth's mean radius in km
  var dLat  = rad(lat2 - lat1);
  var dLong = rad(lng2 - lng1);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;

  return d;
};


/***
 * pixel distance between two points
 */
bdl.geodash.pixelDistance = function(lat1, lng1, lat2, lng2, z) {
  var scale = 1 << z;
  var projection = gd.map.apiMap.getProjection();
  var p1 = projection.fromLatLngToPoint(new google.maps.LatLng(lat1, lng1));
  var p2 = projection.fromLatLngToPoint(new google.maps.LatLng(lat2, lng2));

  var dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  var dist = dist * scale;
  return dist;

};


