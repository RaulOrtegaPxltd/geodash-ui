/**
*   Class: bdl.geodash.GD
*	Parent: Backbone.View
*	
*	This is the main GeoDash application class.  This is the main
*	component that needs to be instantiated.  Most major api 
*	interactions should occur on instance of this class.
*	
*	@geodashOptions - {}:
*	* el: Dom Node - The dom element of the container element where 
*			the app should be rendered.
*	  width: int - Pixel width to set the map and its container too
*/

bdl.geodash.GD = Backbone.View.extend({
	initialize: function(){

		this.layers = new bdl.geodash.Layers();
		this.layers.gd = this;

		if(this.options.isBuilding){
      this.options.api = "leaflet-mapquest";
    }

		this.base = new bdl.geodash.Base(this.options);
		this.id = $(this.el).attr("id");
		this.render();
	},
	
	events: {
		"click .gd-frame .gd-nav .gd-map-ft button": "control"
	},
	
	render: function(){
		//setup app structure
		$(this.el).html(bdl.geodash.TF.frame({container: this.id}));
		this._setSize();
		this.resize();
		//init views
		var mapEL = this.$(".gd-map")[0];
		this.map = new bdl.geodash.Map({el:mapEL, 
			gd: this, model: this.base});
		var self = this;
		// create nav controls	
		this.$(".gd-frame .gd-nav .gd-map-ft button:first").button({icons:{primary:"ui-icon-plus"}})
		.next().button({icons:{primary:"ui-icon-wrench"}})
		.next().button({icons:{primary:"ui-icon-close"}});
		this.tools = new bdl.geodash.Tools({gd: this});
		if(this.base.get('permissions')['edit']){
			$(".gd-nav div.gd-ft-buttons").show();
		}
		//TODO: Remove this line as bones are not used any longer
		//bdl.geodash.MSTR.init(this.base.get('boneID'));
		return this;								
	},
	
	control: function(e){
		//ie overrides value when button has inner text
		var val = $(e.currentTarget).find("span.ui-button-text").text().toLowerCase();
		switch(val){
			case "add":
				this.newLayer();
				break;
			case "edit":
				this.editLayer(e.currentTarget)
				break;
			case "delete":
				this.deleteLayer(e.currentTarget)
				break;
		}	
	},
	
	resize: function(){
		var ht = $(this.el).height();
		this.$(".gd-frame").height(ht);
		// not necessary always 100%? this.$(".gd-frame").width($(this.el).width());
		this.$(".gd-map,.gd-accordion-parent,.gd-editor").height(ht-30-26);
		this.$("#gd-accordion").accordion("resize");
    if(this.base.is('google')) {
      try{google.maps.event.trigger(this.map.apiMap, 'resize');}catch(e){}
    } else if(this.base.is('leaflet-mapquest')) {
      try{this.map.apiMap.invalidateSize();} catch(e){}
    }
	},
	/**
	*  msg - Object
	*	type - property - indicates msg icon
	*	message - property - message to display
	*/
	
	log: function(msg){
		this.$(".gd-map-ft .gd-log").html(bdl.geodash.TF.log(msg));
		if(msg.type != "error"){
			this.$(".gd-log").show().delay(5000).fadeOut('slow');
		}else{			
			this.$(".gd-log").show();
		}
	},
	
	newLayer: function(){
		this._initEditor();
		this.editor.newLayer();
	},
	
	editLayer: function(layer){
		if(_.isElement(layer)){
			layer = this.layers.getSelected()[0];
		}
		this._initEditor();
		this.editor.edit(layer);
	},
	
	deleteLayer: function(layer){
		if(_.isElement(layer)){
			layer = this.layers.getSelected()[0];
		}
		if(layer === undefined){ return; }
		if(confirm("Are you sure want to delete this layer:  " + layer.get('name'))){
			this.layers.remove(layer);
			layer.view.remove();
			if(this.layers.length >0){
				this.layers.at(0).view.tab.select();
			}else{
				this.newLayer();
			}
			if(layer.get('type') != "placesLayer"){
				bdl.geodash.MSTR.deleteModel({model: layer});
			}			
		}
	},
	
	_initEditor: function(){
		if(this.editor == undefined){
			var editor = this.$(".gd-editor")[0];
			this.editor = new bdl.geodash.Editor({
				el: editor,
				gd: this
			});
		}
	},
	
	_setSize: function(){
		var w = this.base.get("width");
		var h = this.base.get("height");
		if(w){ $(this.el).width(w);}
		if(h){ $(this.el).height(h);}
	}
});

//*************** CLASS METHODS and PROPERTIES *****************//

