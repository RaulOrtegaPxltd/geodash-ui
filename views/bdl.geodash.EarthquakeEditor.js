/**
* options -
*	model -
*/

bdl.geodash.EarthquakeEditor = Backbone.View.extend({
	tagName: "div",
	className: "gd-editor-content",
	
	initialize: function(){
    var self = this;
		this.p = this.options.p;

    self.template = self.loadingTemplate();
    self.render();
    self.updateUi();
	},

  events: {
    // "click .gd-dss-product-item": "selectClicked"
  },

	render: function(){
    var self = this;

		var m = this.model.toJSON();
		m.id = this.model.id ? this.model.id : null;
		m.type = this.model.type;

		$(this.el).html(this.template(m));
		$(this.p.el).append(this.el);

    // fix for ie7 - radio buttons appear outside of scrolling area
    $('.gd-editor-content').css('position', 'relative');

		this.$(".gd-radio").buttonset();

    this.$('.date').datepicker({ dateFormat: 'yy-mm-dd' });
    // not able to disable highlight atm, might be an option or something on datepicker
    // $('.date.ui-state-highlight').removeClass('ui-state-highlight');

		this.$(".search_param").on("change",function(){
      self.search();
    });

    // fix for ie7 - radio buttons appear outside of scrolling area
    $('.gd-editor-content').css('position', 'relative');

    window.setTimeout(function() {self.search();}, 500);
	},

  updateUi: function() {
    var self = this;


    var templateGet = $.get(bdl.geodash.js_path + '/templates/earthquake.template.html');

    var hurricanesGet = self.hurricanesGet();

    $.when(templateGet, hurricanesGet).done(function(templateRes, hurricanesRes){
      var template = _.template(templateRes[0]);
      var products = hurricanesRes[0];

      var pnames = _.map(products, function(product) {
        var product = product['dss_product'];
        return product.name;
      });

      // console.log('pnames', pnames, _.contains(pnames, "Hurricanes"));

      if(_.contains(pnames, "Earthquakes")) {
        self.template = template;
      } else {
        self.template = self.defaultTemplate();
      }

      // re-render to display proper template
      self.render();
    });
  },

  hurricanesGet: function() {
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
      if(k.indexOf('settings.') == 0) {
        //DSS Settings
        var sk = k.substr(9);
        self.model.attributes.settings[sk] = val;
      } else {
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
      }
		});
		this.model.validate();
		this.model.update();
		return this.model;
	},

  search: function() {
    var self = this;
    var startDate = self.$('input#start_date').val();
    var endDate = self.$('input#end_date').val();
    var minMag = self.$('input#min_mag').val();
    var maxMag = self.$('input#max_mag').val();
    var minDepth = self.$('input#min_depth').val();
    var maxDepth = self.$('input#max_depth').val();

    noeEls = self.$('#number_of_events');

    if(noeEls.length > 0) {
      noeEls[0].innerHTML = "Loading...";
      this.model.runGetCount(startDate, endDate, minMag, maxMag, minDepth, maxDepth).then(function(d) {
        var h = "" + d.count;
        if(d.count > 1000) {
          h = h + " <br/> (only first 1000 are rendered)";
        }
        self.$('#number_of_events')[0].innerHTML = h;
      });
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
