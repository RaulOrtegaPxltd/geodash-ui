bdl.geodash.HurricaneLayer = bdl.geodash.Layer.extend({
	initialize: function(){
		this.type = "hurricaneLayer";
    this.data = null;
    this.loaded = false;
    this.loading = false;

		this.attributes = _.extend({
				type: "hurricaneLayer",
				state: "not_ready",
        dss_product_item_id: null,
        dss_product_item_name: ""
			},this.attributes);
	},
	
	validate: function(){
		
	},
	
  update: function() {
    var self = this;
    self.loaded = false;
    self.loading = true;
    var params = {
      type: 'GET',
      dataType: 'jsonp',
      url: bdl.geodash.protocol + '//' + bdl.geodash.server + '/api/api/get_dss_item',
      data: {
        id: self.get('dss_product_item_id'),
        api_key: gd.options.gdAPIKey
      },
      success: function(d) {
        self.updateData(d['dss_product_item']);
        self.loaded = true;
        self.loading = false;
      },
      error: function(e) {
        self.loaded = true;
        self.loading = false;
      }
    };

    $.ajax(params);
  },

  updateData: function(data) {
    this.data = data;
  }
});
