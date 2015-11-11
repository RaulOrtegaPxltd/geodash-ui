bdl.geodash.DirectionsView = Backbone.View.extend({
	tagName: "div",
	className: "gd-layer-tab gd-directions",
	events:{
		"click h3" : "select"
	},
	initialize: function(){
		this.gd = this.options.map.gd;
		this.map = this.options.map;
		this.model.view = this;
		_.bindAll(this,'render','toggleLayer');
		this.render();
	},
	
	render: function(){
		var tmplt = {
			id: this.model.get('id'),
			name: this.model.get("name"),
			slot: this.model.get('slot'),
			className: ""
		}
		if(this.model.isOn()){tmplt.className = "gd-tab-btn-on";}
		this.gd.$("#gd-accordion").append(this.el);
		$(this.el).html(this.tmplt(tmplt));
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
		
		this.display = new google.maps.DirectionsRenderer({
			map: this.map.apiMap,
			panel: this.$(".directions-panel").get(0),
			draggable: true
		});
		
		this.renderInputs();
	},
	
	renderInputs: function(){
		var self = this;
		
		this.$("input.gd-search").mousedown(function(e){
			var v = self.$(e.currentTarget).val();
			if(v.indexOf("origin...",0) >= 0 || v.indexOf("destination...",0) >= 0){
				self.$(e.currentTarget).val("");
			}
		});
		this.$("input.gd-search").bind("keydown",function(e){			
			var code = (e.keyCode ? e.keyCode : e.which);
			if(code == 13){
				self.renderDirections();
			}
		});
		this.$("input[name=directions-go]").click(function(e){
			self.renderDirections();
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
	
	toggleLayer: function(){
		if(this.model.isOn()){
			this.model.set({on:false},{silent:true});
			this.$(".gd-tab-state, button").toggleClass("gd-tab-btn-on");
			this.clearLayer();				
		}else{
			this.model.set({on:true},{silent:true});			
			this.$(".gd-tab-state, button").toggleClass("gd-tab-btn-on");
			this.renderDirections();	
		}
		this.$(".gd-tab-state button").removeClass("ui-state-hover");
	},
	
	clearLayer: function(){
		this.display.setMap(null);
	},
	
	renderDirections: function(){
		var self = this;
		self.display.setMap(self.map.apiMap);
		self.$(".gd-tab-content .gd-layer-error").remove();
		var o = self.$("input.gd-search[name=origin]").val();
		var d = self.$("input.gd-search[name=destination]").val();
		var m = self.$(this.el).parent().find("[name=mode]").val();
		var u = self.$(this.el).parent().find("[name=units]").val();
		if(!self.model.isOn()){ self.toggleLayer(); }
		self.model.getDirections(o,d,m,u,self.display);
	},
	
	tmplt: _.template(
		'<h3 id="gd-layer-tab-<%= id %>" data-slot="<%= slot %>">'+
			'<a href="#"><%= name %></a>'+
			'<div class="gd-tab-state <%= className %>"><span> </span><button class="gd-tab-btn gd-tab-btn-off <%= className %>" type="button"></button></div>'+
		'</h3><div class="gd-tab-content"><div class="gd-tab-tools">'+
				'<input name="origin" class="gd-search" type="text" value="origin..."/> ' +
				'<input name="destination" class="gd-search" type="text" value="destination..."/> ' +
			'<select name="mode"><option selected=true value="DRIVING">Driving</option><option value="WALKING">Walk</option><option value="BICYCLING">Bicycling</option></select>' +
			'<select name="units"><option selected=true value="1">Imperial</option><option value="0">Metric</option></select>'+
			'<input type="button" value="go" name="directions-go"/>'+
			'</div><div class="directions-panel"> </div></div>'
		)
	
});