/**
* options -
*	model -
*/

bdl.geodash.HurricaneEditor = Backbone.View.extend({
	tagName: "div",
	className: "gd-editor-content",

	initialize: function(){
    var self = this;
		this.p = this.options.p;
		// this.preview_images = {};
    self.template = self.loadingTemplate();
    self.render();
    self.updateUi();
	},

	render: function(){
    var self = this;

		var m = this.model.toJSON();
		m.id = this.model.id ? this.model.id : null;
		m.type = this.model.type;
    m.years = _.range(new Date().getFullYear(), 1901, -1)

    m.hurricane_name = "";

		$(this.el).html(this.template(m));
		$(this.p.el).append(this.el);

    // fix for ie7 - radio buttons appear outside of scrolling area
    $('.gd-editor-content').css('position', 'relative');

		this.$(".gd-radio").buttonset();

		this.$(".gd-search-hurricanes").button().bind("click",function(){
      self.search();
    });

    this.bindEvents();

	},

  bindEvents: function() {
    var self = this;
    this.$('.gd-dss-product-item').change(function(e) {
      self.selectChanged();
    });
  },

  updateUi: function() {
    var self = this;

    var templateGet = $.get(bdl.geodash.js_path + '/templates/hurricane.template.html', function(data) {
      // self.template = _.template(data);
    });
    var subscriptionsGet = self.subscriptionsGet();

    $.when(templateGet, subscriptionsGet).done(function(templateRes, hurricanesRes){
      var template = _.template(templateRes[0]);
      var products = hurricanesRes[0];

      var pnames = _.map(products, function(product) {
        var product = product['dss_product'];
        return product.name;
      });

      // console.log('pnames', pnames, _.contains(pnames, "Hurricanes"));

      if(_.contains(pnames, "Hurricanes")) {
        self.template = template;
      } else {
        self.template = self.defaultTemplate();
      }

      // re-render to display proper template
      self.render();
    });
  },

  subscriptionsGet: function() {
    var self = this;

    var params = {
      type: 'GET',
      dataType: 'jsonp',
      url: bdl.geodash.protocol + '//' + bdl.geodash.server + '/api/api/get_dss_product_subscriptions',
      data: {
        api_key: gd.options.gdAPIKey
      }
    };

    return $.ajax(params);
  },
	
	save: function(){
		var self = this;
		var res = this.$("form#layer-editor").serializeArray();
		// sets all form attributes on the model in silent mode.
		_.each(res,function(i){
			var val = i.value, k = i.name,a={};
      // console.log(k, val);
			if(val === "true"){val = true;}
			if(val === "false"){val = false;}
			if(k.toLowerCase().indexOf("keys")>-1){
				try{ 
					val = _.isNumber( parseInt(val) ) ? parseInt(val) : val ;
					k = self.model.get('keys')[k.split(".")[1]] = val;
				}catch(e){}
			}else{
				a[k] = val;
				self.model.set(a);
			}
		});
		self.model.validate();
		self.model.update();
		return this.model;
	},

  search: function() {
    var self = this;
    var year = self.$('select#year').val();
    var month = self.$('select#month').val();
    var name = self.$('input#hurricane_name').val();
    var fromIntensity = self.$('select#from_intensity').val();
    var toIntensity = self.$('select#to_intensity').val();

    var props = [];
    if($.isNumeric(fromIntensity) || $.isNumeric(toIntensity)) {
      var prop = {name: 'max_intensity', type: 'integer'};
      if($.isNumeric(fromIntensity)) {
        prop['from'] = fromIntensity;
      }
      if($.isNumeric(toIntensity)) {
        prop['to'] = toIntensity;
      }
      props.push(prop);
    }

    var params = {
      type: 'GET',
      dataType: 'jsonp',
      url: bdl.geodash.protocol + '//' + bdl.geodash.server + '/api/api/get_dss_items',
      data: {
        product_name: 'Hurricanes',
        name: name,
        year: year,
        month: month,
        props: props
      },
      success: function(d) {
        self.updateHurricanes(d);
      },
      error: function(e) {
        // console.log('got error', e);
      }
    };

    self.$('.gd-search-hurricanes .ui-button-text')[0].innerHTML = "Searching...";
    $.ajax(params).then(function() {
      self.$('.gd-search-hurricanes .ui-button-text')[0].innerHTML = "Search";
    });
  },

  updateHurricanes: function(hurricanes) {
    var self = this;

    var select = $('#dss_product_item_id_select');
    select.empty();
    self.preview_images = {};

    for(i=0; i<hurricanes.length; i++) {
      var item = hurricanes[i]['dss_product_item'];
      var id = item.id;
      var title = item.start_at.substring(0,10) + ' - ' + item.name;

      self.preview_images[id] = item.preview_image;

      select.append('<option value="' + id +'">' + title + '</option>');
    }
  },

  selectChanged: function(e) {
    this.setItemFromSelect();
  },

  setItemFromSelect: function() {
    var id = this.$('.gd-dss-product-item').val();
    var name = this.$('.gd-dss-product-item option[value="' + id + '"]').text();
    if(id.length > 0) {
      $('input#dss_product_item_id').val(id);
      $('input#dss_product_item_name').val(name);
    }
    this.loadPreview(id);
  },

  loadPreview: function(id) {
    if(id in this.preview_images) {
      var imgUrl = bdl.geodash.protocol + '//' + bdl.geodash.server + '/images/dss/hurricanes/' + this.preview_images[id];
      this.$('div#preview').html('<img class="hurricane_preview" src="' + imgUrl + '"/>');
    } else {
      this.$('div#preview').html('');
    }
  },

  loadingTemplate: function() {
    var t = "<div style='width: 100%; text-align: center; margin-top:80px'>";
    var t = t + "<p>";
    var t = t + "Loading...</p>";
    var t = t + "</div>";
    return _.template(t);
  },

  defaultTemplate: function() {
    var t = "<div style='width: 100%; text-align: center; margin-top:80px'>";
    var t = t + "<p>Please contact your Account Rep or send an email to support@pxlabs.ca <br/> to subscribe to ";
    var t = t + "Data Subscription Services.</p>";
    var t = t + "</div>";
    return _.template(t);
  }

});
