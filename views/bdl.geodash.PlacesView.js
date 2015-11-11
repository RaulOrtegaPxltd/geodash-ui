bdl.geodash.PlacesView = Backbone.View.extend({
	tagName: "div",
	className: "gd-layer-tab gd-places-search",
	events:{
		"click h3" : "select",
		"mouseover .gd-row": "hover",
		"mouseout .gd-row": "hover",
		"click .gd-row": "selectRow"
	},
	initialize: function(){
		this.gd = this.options.map.gd;
		this.map = this.options.map;
		this._setMapWindow = true;  // only set mapWindow on first render or refresh
		this.model.view = this;
		_.bindAll(this,'render','toggleLayer','renderDetails');
		this.markers = [];
		this._initInfoBox();
		this.render();
	},
	
	render: function(){
		var tmplt = {
			id: this.model.get('id'),
			name: this.model.get("name"),
			slot: this.model.get('slot'),
			className: "",
      edit: gd.options.permissions.edit
		}
		if(this.model.isOn()){tmplt.className = "gd-tab-btn-on";}
		this.gd.$("#gd-accordion").append(this.el);
		$(this.el).html(bdl.geodash.TF.accdTab(tmplt));
		this.$("button.gd-refresh").remove();
		// render accordion
		this.gd.$("#gd-accordion").accordion('destroy');
		this.gd.$("#gd-accordion").accordion({
			header: "> div > h3",
			fillSpace: true
		});
		this.gd.$("#gd-accordion").accordion("activate",this.model.get('slot'));
		this.model.set({selected:true});
		
		// toggle layer button
		var self = this;
		this.$(".gd-tab-state button").button()
		.bind("click", function(e){
			e.stopPropagation();
			self.toggleLayer();
		});
		this.$(".gd-tab-state span").first().hide();
		this.$(".gd-tab-state button").show();
		
		this.renderSearch();
	},
	
	renderSearch: function(){
		// this.autocomplete = new google.maps.places.Autocomplete(this.$("input.gd-search").get(0));
		// this.autocomplete.bindTo('bounds',this.map.apiMap);
		var self = this;
		// google.maps.event.addListener(this.autocomplete, 'place_changed', function(){
		// 	self.model.set({place: self.autocomplete.getPlace() });
		// });
		
		this.$("input.gd-search").mousedown(function(e){
			var v = self.$("input.gd-search").val();
			if(v.indexOf("type to search",0) >= 0){
				self.$("input.gd-search").val("");
			}
		});
		this.$("input.gd-search").bind("keydown",function(e){			
			var v = self.$("input.gd-search").val();
			self.$("h3 a").text(v);
			var code = (e.keyCode ? e.keyCode : e.which);
			if(code == 13){
				if(!self.model.isOn()){ self.toggleLayer(); }
				self.model.search(v);
			}
		});
	},
	
	remove: function(){
		this.clearLayer();
		$(this.el).remove();
		this.gd.$("#gd-accordion").accordion('destroy');
		this.gd.$("#gd-accordion").accordion({
			header: "> div > h3",
			fillSpace: true
		});
	},
	
	select: function(){
		this.model.set({"selected": true});
	},
	
	hover: function(e){
		this.$(e.currentTarget).toggleClass("ui-state-hover");
	},
	
	selectRow: function(e){
		if(this.model.isOn()){
			this.$(this.selectedRow).removeClass("ui-state-active");
			this.selectedRow = e.currentTarget;
			var row = this.$(this.selectedRow).addClass("ui-state-active").data('row');
			this.model.view.showInfoBox(row);
		}else{
			this.model.view.map.gd.log({type:"info",message: "Layer must be on to select row."});
		}
	},
	
	toggleLayer: function(){
		if(this.model.isOn()){
			this.model.set({on:false},{silent:true});
			this.$(".gd-tab-state, button").toggleClass("gd-tab-btn-on");
			this.clearLayer();				
		}else{
			this.model.set({on:true},{silent:true});			
			this.$(".gd-tab-state, button").toggleClass("gd-tab-btn-on");
			this.renderSearchResults();	
		}
		this.$(".gd-tab-state button").removeClass("ui-state-hover");
	},
	
	clearLayer: function(){
		this.$('.gd-tab-content .gd-search-res').remove();
		var l = this.markers.length;
		
		for(var i=0;i<l;i++){
			this.markers[i].setMap(null);
		}			
		
		if(this.ib != undefined){this.ib.close();}			
		this.markers =[];
	},
	
	renderSearchResults: function(){
		var pls = this.model.get('places');
		if(pls.length == 0){ return;}
		var self = this;
		this.clearLayer();
		var p = '<div class="gd-search-res" >';
		// create search results
		for(var m=0;m<pls.length;m++){
			p += '<div class="gd-row" data-row="'+m+'"><div class="gd-row-icon"><img src="' + this.model.getIcon(m) + '" style="width:20px;height:20px;"/></div>' +
					'<div class="gd-row-content"><div class="gd-row-title">'+ this.model.getName(m) +'</div></div></div>';
			
			var icon = {};
			icon.icon = new google.maps.MarkerImage(this.model.getIcon(m),
						new google.maps.Size(20, 20),
			            new google.maps.Point(0, 0),
			            new google.maps.Point(10,20),
			            new google.maps.Size(20, 20));
			
			icon.position = this.model.getPosition(m);
			var marker =  new google.maps.Marker(icon);
			marker.row = m;
			google.maps.event.addListener(marker, "click", function (e) {
				self.showInfoBox(this.row);
			});
			this.markers.push(marker);
			marker.setMap(this.map.apiMap);
			this.model.getDetails(m,this.renderDetails);
		}
		this.$('.gd-tab-content').append(p + '</div>');
	},
	
	renderDetails: function(place,row){
		var one_indexed = row +1;
		if(place.formatted_address){
			this.$("div.gd-row:nth-child("+ one_indexed +")")
			.find("div.gd-row-content")
			.append('<div class="gd-row-subtitle">'+place.formatted_address+'</div>');
		}
	},
	
	showInfoBox: function(row){
		var n = this.model.getName(row);
		var content = {title: n, row: {},className: "title-only"};
		if(this.model.get('places')[row].formatted_address){
			content.row = {"":this.model.get('places')[row].formatted_address};
			content.className="";
		}
		this.ib.setIBOptions({boxStyle: { width: (n.length * 11) +5 + "px" }} );
		this.ib.setContent(bdl.geodash.TF.iBox(content));
		this.ib.open(this.map.apiMap,this.markers[row]);
	},
	
	_initInfoBox: function(){
		this.ib = new bdl.geodash.InfoBox({
			closeBoxURL: ""
		});
		// this is here because in we cant do prototype
		// inheritance until google maps api is loaded.
		_.extend(this.ib,new google.maps.OverlayView());
	}
});
