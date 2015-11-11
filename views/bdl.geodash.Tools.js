bdl.geodash.Tools = Backbone.View.extend({
	events: {
		"click .gd-frame .gd-map-hd button": "control"
	},
	
	initialize: function(){
		this.gd = this.options.gd;
		this.el = $(".gd-map-hd").get(0);
		_.bindAll(this,"control");
		this.render();
	},
	
	render: function(){
    var api = this.gd.base.get('api');
		var map = this.gd.map.apiMap;

    this.gd.$(".gd-map-hd").append(this.leftButtons + this.rightButtons);
    if(this.options.gd.options.permissions.showLayerNavigator) {
    } else {
      this.gd.$('button#toggleNav').hide();
    }
		this.$(".gd-tools-left button:first").button({text:false,icons:{primary:"ui-icon-triangle-2-e-w"}});
		this.$(".gd-tools-left button#refreshLayers").button({text:false,icons:{primary:"ui-icon-refresh"}});
    //.next().button({text:false,icons:{primary:"ui-icon-gear"}});
		this.$(".gd-tools-right button:first").button({text:false,icons:{primary:"ui-icon-wrench"}});
    this.setRetainPanZoomIcon();
		
		$(".gd-frame .gd-map-hd button").bind("click",this.control);

    if(api == 'google') {

    } else if(api == 'leaflet-mapquest') {
      // this.gd.$('.gd-tools-right').hide();
    }
	},
	
	toggleSelector: function(event){
		var sel = this.gd.map.selector;
		var lasso = this.gd.map.lasso;
    lasso.deactivate();
		sel.toggle();
		$("button.gd-tools-selector",this.mapControl).toggleClass("gd-active");	
		$("button.gd-tools-lasso",this.mapControl).removeClass("gd-active");	
	},
	
	toggleLasso: function(){
		var lasso = this.gd.map.lasso;
		var sel = this.gd.map.selector;
     sel.deactivate();
		lasso.toggle();
		$("button.gd-tools-lasso",this.mapControl).toggleClass("gd-active");	
		$("button.gd-tools-selector",this.mapControl).removeClass("gd-active");	
	},

	toggleRetainPanZoom: function(){
    var v = this.gd.map.getRetainPanZoom();

    if(typeof(v) == 'undefined') {
      $.cookie(this.gd.map.uniqueId, this.gd.map.getPanZoomStr());
    } else {
      $.cookie(this.gd.map.uniqueId, null);
    }

    this.setRetainPanZoomIcon();
	},

  setRetainPanZoomIcon: function(){
    if(this.gd.map) {
      var v = this.gd.map.getRetainPanZoom();
    } else {
      var v = null;
    }

    if(typeof(v) != 'undefined') {
      this.$(".gd-tools-left button#retainPanZoom").button({text:false,icons:{primary:"ui-icon-locked"}});
    } else {
      this.$(".gd-tools-left button#retainPanZoom").button({text:false,icons:{primary:"ui-icon-unlocked"}});
    }
  },

	toggleTrafficLayer: function(){
		$("button.gd-tools-traffic",this.mapControl).toggleClass("gd-active");	
		if(this.trafficLayer == undefined){
			this.trafficLayer = new google.maps.TrafficLayer();
			this.trafficLayer.setMap(this.gd.map.apiMap);
		}else{
			this.trafficLayer.setMap(null);
			this.trafficLayer = undefined;
		}		
	},
	
	editBase: function(){
		alert("base edited");
	},
	
	toggleNav: function(){
		if($.browser.msie && this.gd.$(".gd-nav,.gd-main-nav-ctr").css("display") == "none"){
			this.gd.$(".gd-nav,.gd-main-nav-ctr").show();
			return;
		}
		var gd = this.gd;
		this.gd.$(".gd-nav,.gd-main-nav-ctr").animate({
			height: 'toggle',
			width: 'toggle'},300,function(){
				gd.resize();
			});
	},
	
	renderMapTools: function(){
		var map = this.gd.map.apiMap;
    this.gd.$(".gd-map-hd").append(this.leftButtons + this.rightButtons);
    if(this.options.gd.options.permissions.showLayerNavigator) {
    } else {
      this.gd.$('button#toggleNav').hide();
    }
		this.$(".gd-tools-left button:first").button({text:false,icons:{primary:"ui-icon-triangle-2-e-w"}});
		//.next().button({text:false,icons:{primary:"ui-icon-gear"}});
		this.$(".gd-tools-right button:first").button({text:false,icons:{primary:"ui-icon-wrench"}});
		
		$(".gd-frame .gd-map-hd button").bind("click",this.control);
	},
	
	control: function(e){
		//ie overrides value when button has inner text
		// these buttons dont have innerText
		var val = $(e.currentTarget).val();
		switch(val){
			case "editBase":
				this.editBase();
				break;
			case "toggleNav":
				this.toggleNav();
				break;
			case "toggleMapTools":
				this.toggleMapTools();
				break;
			case "traffic":
				this.toggleTrafficLayer();
				break;
			case "places":
			    this.gd.layers.add(new bdl.geodash.PlacesLayer());
				break;
			case "selector":
		    	this.toggleSelector();
				break;
			case "lasso":
		    	this.toggleLasso();
				break;
			case "directions":
			    this.gd.layers.add(new bdl.geodash.DirectionsLayer());
				break;	
			case "refreshLayers":
        _.each(gd.layers.models, function(layer){
          layer.view.tab.refresh();
        });
				break;	
      case "retainPanZoom":
        this.toggleRetainPanZoom();
        break;
		}
	},
	
	toggleTrafficLayer: function(){
		$("button.gd-tools-traffic",this.mapControl).toggleClass("gd-active");	
		if(this.trafficLayer == undefined){
			this.trafficLayer = new google.maps.TrafficLayer();
			this.trafficLayer.setMap(this.gd.map.apiMap);
		}else{
			this.trafficLayer.setMap(null);
			this.trafficLayer = undefined;
		}		
	},
	
	editBase: function(){
		alert("base edited");
	},
	
	toggleNav: function(){
		if($.browser.msie && this.gd.$(".gd-nav,.gd-main-nav-ctr").css("display") == "none"){
			this.gd.$(".gd-nav,.gd-main-nav-ctr").show();
			return;
		}
		var gd = this.gd;
		this.gd.$(".gd-nav,.gd-main-nav-ctr").animate({
			height: 'toggle',
			width: 'toggle'},300,function(){
				gd.resize();
			});
	},
	
	toggleMapTools: function(){

		if(this.mapControl == undefined){
			this.renderMapTools();
      if(!this.options.gd.options.permissions.showLayerNavigator) {
        // hide any buttons that should be shown
        this.gd.$('button[value=directions]').hide()
        this.gd.$('button[value=places]').hide()
      }

      if(this.gd.base.get('api') == 'leaflet-mapquest') {
        // hide features not supported in leaflet
        this.gd.$('button[value=directions]').hide()
        this.gd.$('button[value=places]').hide()
        this.gd.$('button[value=traffic]').hide()
      }
		} else {
      if(this.gd.base.get('api') == "google") {
        this.gd.map.apiMap.controls[google.maps.ControlPosition.RIGHT_TOP].pop();
        $(this.mapControl).remove();
        this.mapControl = undefined;
      } else if(this.gd.base.get('api') == 'leaflet-mapquest') {
        this.gd.map.apiMap.removeControl(this.leafletMapCtrl);
        $(this.mapControl).remove();
        this.mapControl = undefined;
      }
		}
	},
	
	renderMapTools: function(){
		var map = this.gd.map.apiMap;
    this.mapControl = this.make("div",{'class': "gd-tools ui-corner-all"});
    $(this.mapControl).append(this.tmpltMapTools);
    this.mapControl.index = 1;
    var self= this;

    if(this.gd.base.get('api') == "google") {
      map.controls[google.maps.ControlPosition.RIGHT_TOP].push(this.mapControl);
    } else if(this.gd.base.get('api') == 'leaflet-mapquest') {
      var GdCtrl = L.Control.extend(
        {
          options: {position: 'topright'},
          onAdd: function(map) {return self.mapControl;}
        }
      );
      this.leafletMapCtrl = new GdCtrl();

      map.addControl(this.leafletMapCtrl);
    }

    $("button",this.mapControl).button({text:false,icons:{primary:"ui-icon"}}).bind("click",function(e){
      self.control(e);
    });
	},
	//<button value="editBase" id="editBase"/>
	leftButtons: '<div class="gd-tools-left"><button value="toggleNav" id="toggleNav" title="Toggle the Layer Navigator."/><button value="refreshLayers" id="refreshLayers" title="Refresh all layers."/><button value="retainPanZoom" id="retainPanZoom" title="Retain Pan and Zoom"/></div>',
	rightButtons: '<div class="gd-tools-right"><button value="toggleMapTools" id="toggleMapTools" title="Toggle the Map Tools toolbar."/></div>',
	tmpltMapTools: '<button value="selector" class="gd-tools-selector" /><button value="lasso" class="gd-tools-lasso" /><button value="directions" class="gd-tools-direction" /><button value="places" class="gd-tools-places"/><button value="traffic" class="gd-tools-traffic"/>'
});
