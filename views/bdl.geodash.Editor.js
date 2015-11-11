bdl.geodash.Editor= Backbone.View.extend({
	initialize: function(){
		this.gd = this.options.gd;
		this.render = this.newLayer;
	},

	newLayer: function(){
		var self = this;
		$(this.el).html(
      self.defaultTemplate()
		);
		this.open();
		this.$(".gd-layer-types button").button().bind("click",function(e){
      self.buttonClickEvent(e);
		});
		this.renderCancel();
    if(!this.gd.base.is('google')) {
      $('.gd-kml-layer-btn').hide();
    }

    // fix for ie7 - radio buttons appear outside of scrolling area
    $('.gd-editor-content').css('position', 'relative');
	},
	
  buttonClickEvent: function(e) {
    var self = this;
    var type = $(e.currentTarget).attr('value');
    if(type == 'dssLayer') {
      // show DSS options
      $(self.el).html(
        self.dssTemplate()
      );

      // fix for ie7 - radio buttons appear outside of scrolling area
      $('.gd-editor-content').css('position', 'relative');

      // initialize buttons
      self.$(".gd-layer-types button").button().bind("click",function(e){
        self.buttonClickEvent(e);
      });
    } else {
      // open editor
      self.edit(bdl.geodash.Layer.getInstance(type));
    }
  },

	edit: function(layer){
		if(layer.isNew()){ layer.set({columns: this.gd.base.get('sourceColumns')}); }
		this.$(".gd-editor-content").remove();
		this.open();
		var opts = { model: layer,p:this };

		if(layer.type == "markerLayer"){
			this.editor = new bdl.geodash.MarkerEditor(opts);
		}else if(layer.type == "areaLayer"){
			this.editor = new bdl.geodash.AreaEditor(opts);
		}else if(layer.type == "kmlLayer"){
			this.editor = new bdl.geodash.KmlEditor(opts);
		}else if(layer.type == "vectorLayer"){
			this.editor = new bdl.geodash.VectorEditor(opts);
		}else if(layer.type == "heatmapLayer"){
			this.editor = new bdl.geodash.HeatmapEditor(opts);
		}else if(layer.type == "hurricaneLayer"){
			this.editor = new bdl.geodash.HurricaneEditor(opts);
		}else if(layer.type == "dssLayer:earthquake"){
			this.editor = new bdl.geodash.EarthquakeEditor(opts);
		}else if(layer.type == "massMarkerLayer"){
			this.editor = new bdl.geodash.MassMarkerEditor(opts);
		}

		this.gd.$(".gd-map-section .gd-main-map-ctr .gd-map-ft .gd-ft-buttons").remove();
		this.renderCancel();
		this.renderApply();
	},

	open: function(){
		var p = this.$(this.el).parent();
		p.find(".gd-map").slideUp();
		p.find(".gd-editor").slideDown();
    $('.gd-editor').css('overflow', 'auto'); // fix for IE8, it was setting overflow to hidden in dashboards
	},
	
	close: function(){
		var p = this.$(this.el).parent();
		p.find(".gd-editor").slideUp();
		p.find(".gd-map").slideDown();
		
		if(this.editor && this.editor.iconDialog) { $(this.editor.iconDialog).dialog("destroy").remove(); }
		this.$(".gd-editor").children().remove();
		this.gd.$(".gd-map-section .gd-main-map-ctr .gd-map-ft .gd-ft-buttons").remove();
		$(".colorpicker").remove();
		var self = this;
		p.find(".gd-map").slideDown(500,function(){ self.gd.resize(); });
	},

  initHelpButtons: function() {
    // initialize help buttons to open help dialog
    // dialog with class of '.gd-dialog.{clicked element 'gd-help-dialog' attribute}'
    // will be opened
    $('.gd-help-button').button(
      {text: false, icons:{primary: 'ui-icon-help'}}
    ).bind("click", function(e) {
      e.preventDefault();
      var helpDialogClass = $(this).attr('gd-help-dialog');
      $('.gd-dialog.' + helpDialogClass).dialog(
        {modal: true, title: "Help"}
      );
    });
  },

	buttonState: function(state){
		this.gd.$(".gd-map-section .gd-main-map-ctr .gd-map-ft .gd-ft-buttons button").button(state);
	},

	save: function(){
		this.buttonState("disable");
		this.notice({message: "Saving...",type:"info"});
		var self = this;
		var model = self.editor.save();
    // console.log('saving...', model);
		var handleSuccess = function(data){
			self.buttonState("enable");
			if(data && data.state == "failed"){
				return self.notice({type:"alert",message: data.errors[0] });
			}
			if(data.layer.state != "failed"){
				// setup model with new model data.=
				if(model.isNew()){
					model.set(data.layer);
					self.gd.layers.add(model);
				//	model.view.render();
				}else{
					self.notice(); // close msg
					model.set(data.layer, {silent: true} );
					model.view.tab.refresh();
				}
				self.close();
			}else{
        // console.log('saving errorc...');
				self.notice({type:"alert",message: data.layer.errors[0] });
			}
		};
		var handleError = function(data){
			self.buttonState("enable");
			var msg = bdl.geodash.breakWord(data.getResponseHeader("X-MSTR-TaskFailureMsg"));
			self.notice({type:"alert",message: msg });
		};
		var action = bdl.geodash.MSTR.saveModel({
			model: model,
			success: handleSuccess,
			error: handleError
		});
	},
	
	loadColumns: function(model){
		var self = this;
		self.buttonState("disable");
		self.notice({message:"Getting report columns...",type:"info"});
		
		bdl.geodash.MSTR.loadModelColumns({
			model: model,
			success: function(data){
				self.notice();
				self.buttonState("enable");
				if(data.state == "ready"){					
					model.set({columns: data.columns},{silent:true});
					self.editor.render();
				}else{
					self.notice({type:"alert",message: data.errors});
				}
			},
			error: function(data){
				self.buttonState("enable");
				var msg = bdl.geodash.breakWord(data.getResponseHeader("X-MSTR-TaskFailureMsg"));
				self.notice({type:"alert",message: msg });
			}
		});	
	},
	
	loadGridColumns: function(model){
		var self = this;
		self.buttonState("disable");
		self.notice({message:"Getting report columns...",type:"info"});
    // console.log('Editor.loadGridColumns', model);
		
		bdl.geodash.MSTR.loadModelColumns({
			model: model,
			success: function(data){
				self.notice();
				self.buttonState("enable");
				if(data.state == "ready"){					
					model.set({columns: data.columns},{silent:true});
					self.editor.render();
				}else{
					self.notice({type:"alert",message: data.errors});
				}
			},
			error: function(data){
				self.buttonState("enable");
				var msg = bdl.geodash.breakWord(data.getResponseHeader("X-MSTR-TaskFailureMsg"));
				self.notice({type:"alert",message: msg });
			}
		});	
	},

	notice: function(msg){
		if(msg == undefined){
			this.$(".gd-editor-notice").fadeOut();
			return;
		}
		this.gd.$(".gd-editor").scrollTop(0);
		if(_.isArray(msg.message)){
			msg.message = msg.message[0];
		}
		this.$(".gd-editor-notice").removeClass("ui-state-error ui-state-highlite")
		.addClass(function(){
			if(msg.type == "info"){ return "ui-state-highlight"; }
			return "ui-state-error";
		}).fadeIn().find("span.ui-icon").removeClass("ui-icon-alert ui-icon-info")
		.addClass("ui-icon-"+msg.type).next()
		.text(msg.message);
	},

	renderCancel: function(){
		this.gd.$(".gd-map-section .gd-main-map-ctr .gd-map-ft .gd-ft-buttons").remove();
		var self = this;
		this.gd.$(".gd-map-section .gd-main-map-ctr .gd-map-ft")
		.append('<div class="gd-ft-buttons"><button value="cancel">Cancel</button></div>')
		.find(".gd-ft-buttons button").button({icons:{primary:"ui-icon-cancel"}})
		.bind("click",function(e){
					self.close();
		});	
	},

	renderApply: function(){
		var self=this;
		this.gd.$(".gd-map-section .gd-main-map-ctr .gd-ft-buttons")
		.prepend('<button value="apply">Apply</button>')
		.find("button:first").button({icons:{primary:"ui-icon-check"}})
		.bind("click",function(e){
					self.save();
		});
	},

  defaultTemplate: function() {
    var t = '<div class="gd-editor-content">'+ 
      '<div class="gd-editor-title">Choose a Layer Type:</div>' +
      '<div class="gd-layer-types">' +
      '<button value="markerLayer" class="gd-marker-layer-btn">'+
      '<div class="gd-layer-type-icon"></div>' +
      '<div class="gd-layer-type-details">' +
      '<div class="gd-layer-type-title">Marker Layer</div>' +
      '<div class="gd-layer-type-desc">Each record is represented by a unique interactive icon.' +
      '</div></div></button>' +
      '<div><button value="areaLayer" class="gd-area-layer-btn"><div class="gd-layer-type-icon"></div><div class="gd-layer-type-details"><div class="gd-layer-type-title">Area Layer</div><div class="gd-layer-type-desc">Each record is represented by a unique shape. i.e. (US States, Counties, Zip etc.)</div></div></button></div>'+ 
      '<button value="kmlLayer" class="gd-kml-layer-btn"><div class="gd-layer-type-icon"></div><div class="gd-layer-type-details">'+
      '<div class="gd-layer-type-title">KML Layer</div><div class="gd-layer-type-desc">Allows the overlay of KML files from any webservice using a simple URL.(Public Only)</div></div></button>'+
      '<button value="vectorLayer" class="gd-vector-layer-btn"><div class="gd-layer-type-icon"></div><div class="gd-layer-type-details"><div class="gd-layer-type-title">Vector Layer</div><div class="gd-layer-type-desc">Self customizable vector layer.</div></div></button>'+ 
      '<button value="heatmapLayer" class="gd-heatmap-layer-btn"><div class="gd-layer-type-icon"></div><div class="gd-layer-type-details"><div class="gd-layer-type-title">Heatmap Layer</div><div class="gd-layer-type-desc">Heatmap based on points.</div></div></button>'+ 
      '<button value="dssLayer" class="gd-dss-layer-btn"><div class="gd-layer-type-icon"></div><div class="gd-layer-type-details"><div class="gd-layer-type-title">DSS Layer</div><div class="gd-layer-type-desc">Data Subscription Service Layer.</div></div></button>'+ 
      '<button value="massMarkerLayer" class="gd-mass-marker-layer-btn"><div class="gd-layer-type-icon"></div><div class="gd-layer-type-details"><div class="gd-layer-type-title">Mass Marker Layer</div><div class="gd-layer-type-desc">Displays a marker for each record. Recommended for large numbers of records.</div></div></button>'+ 
      '<p class="versions">GeoDash Ver: ' + bdl.geodash.versions.geodash +
      '<br/>GeoDash Ver: ' + bdl.geodash.versions.geodash_ui + '</p>' +
      '</div>' +
    '</div>';

    return t;
  },

  dssTemplate: function() {
    var t = '<div class="gd-editor-content">'+ 
      '<div class="gd-editor-title">Choose a DSS Layer Type:</div>' +
        '<div class="gd-layer-types">' +
        '<button value="hurricaneLayer" class="gd-hurricane-layer-btn">'+
        '<div class="gd-layer-type-icon"></div><div class="gd-layer-type-details"><div class="gd-layer-type-title">Hurricane Layer</div><div class="gd-layer-type-desc">Hurricanes and their associated wind speeds and wind swaths.</div></div></button>' +

        '<button value="dssLayer:earthquake" class="gd-earthquake-layer-btn">'+
        '<div class="gd-layer-type-icon"></div><div class="gd-layer-type-details"><div class="gd-layer-type-title">Earthquake Layer</div><div class="gd-layer-type-desc">Earthquakes locations and their associated magnatudes.</div></div></button>' +
      '</div>' +
    '</div>';

    return t;
  }
});
