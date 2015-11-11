bdl.geodash.ContextMenu = Backbone.View.extend({
	tagName: "UL",
	className: "contextMenu shadow",
	
	initialize: function(){
		this.map = this.options.map;
		_.bindAll(this,"show","hide");
		this.render();
	},
	
	render: function(){
		$(this.map.el).append(this.el);
		$(this.el).append(this.tmplt(this.map.base.toJSON()));
		$(this.el).mouseleave(this.hideMenu);
		
		this.map.selector.bind("dragstart",this.hide);
		this.map.selector.bind("deactivate",this.hide);
		google.maps.event.addListener(this.map.selector.box,"mousedown",this.show);	
		var self = this;
		$(this.el).find("a").mouseover( function(){
			$(self.el).find("li.hover").removeClass("hover");
			$(this).parent().addClass("hover");
		}).mouseout(function(){
			$(self.el).find("li.hover").removeClass("hover");
		}).click(function(e){
			self.hide();
			self.triggerContextAction($(this).attr("href").substr(1));
		}) ;
		// Disable text selection
		if( $.browser.mozilla ) {
			$(this.el).each( function() { $(this).css({ 'MozUserSelect' : 'none' }); });
		} else if( $.browser.msie ) {
			$(this.el).each( function() { $(this).bind('selectstart.disableTextSelect', function() { return false; }); });
		} else {
			$(this.el).each(function() { $(this).bind('mousedown.disableTextSelect', function() { return false; }); });
		}
		// Disable browser context menu (requires both selectors to work in IE/Safari + FF/Chrome)
		$(this.el).bind('contextmenu', function() { return false; });
	},	
	
	triggerContextAction: function(action){
		switch(action){
			case "zoomIn":
				this.map.fitBounds();
				break;
			case "zoomOut":
				this.map.zoomOut();
				break;
			case "select":
				this.map.selectByBounds();
				break;
		};
		var self=this;
		window.setTimeout(function(){
			self.map.selector.box.setMap(null);
		},500);
	},
	
	show: function(e){
		//check if a box was created
		if(this.map.selector.noBoxDrawn()){ return; }
		
		var me = $(this.el);
		var mapDiv = $(this.map.apiMap.getDiv());
		var pixel = this.map.fo.getProjection().fromLatLngToContainerPixel(e.latLng),
			x = pixel.x, y = pixel.y;
		
		if ( x > mapDiv.width() - me.width() )
				x -= me.width();

		if ( y > mapDiv.height() - me.height() )
				y -= me.height();
		me.css({top:y,left:x});
		$(this.el).fadeIn(100);	
	},
	
	hide: function(e){
		$(this.el).fadeOut(75);	
	},
	
	tmplt: _.template(	'<li><a href="#zoomIn" >Zoom In</a></li>'+
					  	'<li><a href="#zoomOut" >Zoom Out</a></li>' +
						'<li class="separator <% if(!isDoc){print("hidden");} %>"><a href="#select" >Make Selections</a></li>')
});