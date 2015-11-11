bdl.geodash.EarthquakeLayer = bdl.geodash.Layer.extend({
	initialize: function(){
		this.type = "dssLayer:earthquake";
    this.data = null;
    this.loaded = false;
    this.loading = false;

		this.attributes = _.extend({
				// type: "dssLayer",
				state: "not_ready",
        dss_product_item_id: null,
        dss_product_item_name: "",
        dss_product_type: "earthquake",
        settings: {
          start_date: null,
          end_date: null
        },
        min_zoom: 1,
        max_zoom: 20
			},this.attributes);
	},
	
	validate: function(){
		
	},
	
  update: function() {
    var self = this;
    self.loaded = false;
    self.loading = true;

    var startDate = self.get('settings').start_date;
    var endDate = self.get('settings').end_date;
    var minMag = self.get('settings').min_mag;
    var maxMag = self.get('settings').max_mag;
    var minDepth = self.get('settings').min_depth;
    var maxDepth = self.get('settings').max_depth;

    self.runGetData(startDate, endDate, minMag, maxMag, minDepth, maxDepth).then(function(data) {
      self.updateData(data);
      self.loaded = true;
      self.loading = false;
    });
  },

  updateData: function(data) {
    var self = this;
    self.data = [];

    _.each(data, function(item) {
      item.dss_product_item.data = jQuery.parseJSON(item.dss_product_item.data);
      self.data.push(item.dss_product_item);
    });
  },

  propsForParams: function(minMag, maxMag, minDepth, maxDepth) {
    var props = [];
    if($.isNumeric(minMag) || $.isNumeric(maxMag)) {
      var prop = {name: 'mag', type: 'float'};
      if($.isNumeric(minMag)) {
        prop['from'] = minMag;
      }
      if($.isNumeric(maxMag)) {
        prop['to'] = maxMag;
      }
      props.push(prop)
    }
    if($.isNumeric(minDepth) || $.isNumeric(maxDepth)) {
      var prop = {name: 'depth', type: 'float'};
      if($.isNumeric(minDepth)) {
        prop['from'] = minDepth;
      }
      if($.isNumeric(maxDepth)) {
        prop['to'] = maxDepth;
      }
      props.push(prop)
    }
    return props;
  },

	getTileUrl: function(x,y,z){
    var self = this;

    var startDate = self.get('settings').start_date;
    var endDate = self.get('settings').end_date;
    var minMag = self.get('settings').min_mag;
    var maxMag = self.get('settings').max_mag;
    var minDepth = self.get('settings').min_depth;
    var maxDepth = self.get('settings').max_depth;

    var props = this.propsForParams(minMag, maxMag, minDepth, maxDepth);
    var propsStr = $.param({props: props, start_at_from: startDate, 
                           start_at_to: endDate});
		var url = bdl.geodash.protocol + "//" + bdl.geodash.server + 
      "/api/tile/earthquake?api_key=" + gd.options.gdAPIKey +
      "&x=" + x + "&y=" + y + "&z=" + z +
      "&" + propsStr;
    return url;
	},

  runGetCount: function(startDate, endDate, minMag, maxMag, minDepth, maxDepth) {
    var props = this.propsForParams(minMag, maxMag, minDepth, maxDepth);

    var params = {
      type: 'GET',
      dataType: 'jsonp',
      url: bdl.geodash.protocol + '//' + bdl.geodash.server + '/api/api/get_dss_items_count',
      data: {
        api_key: gd.options.gdAPIKey,
        product_name: 'Earthquakes',
        start_at_from: startDate,
        start_at_to: endDate,
        props: props
      },
      error: function(e) {
        // console.log('got error', e);
      }
    };

    return $.ajax(params);
  },

  runGetData: function(startDate, endDate, minMag, maxMag, minDepth, maxDepth) {
    var props = this.propsForParams(minMag, maxMag, minDepth, maxDepth);

    var params = {
      type: 'GET',
      dataType: 'jsonp',
      url: bdl.geodash.protocol + '//' + bdl.geodash.server + '/api/api/get_dss_items',
      data: {
        api_key: gd.options.gdAPIKey,
        product_name: 'Earthquakes',
        start_at_from: startDate,
        start_at_to: endDate,
        props: props,
        data: 'true'
      },
      error: function(e) {
        // console.log('got error');
        // console.log('got error', e);
      }
    };

    return $.ajax(params);
  }
});
