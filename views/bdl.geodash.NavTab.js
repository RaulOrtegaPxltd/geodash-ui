// model will trigger loading, ready, and error events
bdl.geodash.NavTab = Backbone.View.extend({
	tagName: "div",
	className: "gd-layer-tab",
	
	initialize: function(){
		_.bindAll(this,"render","changeName","on");
		this.model.bind("change:name",this.changeName);
		this.model.bind("change:on",this.on);
		this.parentEl = this.options.p;
		this.tabContentRendered = false;
		this.currentPage = 1;
	},
	
	events: {
		"click h3" : "select",
		"mouseover .gd-row": "hover",
		"mouseout .gd-row": "hover",
		"click .gd-row": "selectRow",
		"focus input.gd-search": "focusSearch",
		"keyup input.gd-search": "search"
	},
	
	changeName: function(){
		this.$("h3 a").text(this.model.get('name'));
	},
	
	search: function(){
		var value = this.$("input.gd-search").val();;
		var self = this;
		if(self.currentSearchResult){
			self.currentSearchResult.hide();
		}

		//make nav visible and hide search-res if value field is empty
		if(value == "" || value == null){
			self.renderPage(1);
			return false;
		}

		function _search(value){
			var rows = self.model.get('rows');			
			// hide paging when searhing
			self.$(".gd-layer-pg,.gd-paging").hide();
			// look for cached results
			var searchClass = 'gd-layer-search-' + value.replace(/\s/g,"-");
			var cache = self.$('.gd-tab-content .' + searchClass);
			if(cache.length>0){
				cache.show();
				self.currentSearchResult = cache;
				return true;
			}

			var matches = self.model.search(value);
			//create search results node/cache
			if(matches.length == 0){ return;}
			var p = '<div class="gd-search-res ' +searchClass + '" >';
			// create search results
			for(var m=0;m<matches.length;m++){
				if(m==25){break;}
				p += '<div class="gd-row" data-row="'+matches[m]+'"><div class="gd-row-icon">' + self.model.view.getIconThumb(matches[m]) + '</div>' +
						'<div class="gd-row-content">'+ self._getRowContent(matches[m]) +'</div></div>';
			}
			self.$('.gd-tab-content').append(p + '</div>');
			self.currentSearchResult = self.$('.gd-tab-content .' + searchClass);
		}
		// Clear previous timeout
	    if(self.searchTimer != -1) {
	        clearTimeout(self.searchTimer);
	    }

	    // Set new timeout
	    self.searchTimer = setTimeout(function(){
	            _search(value);
	        },(650));
	},
	
	focusSearch: function(){
		var v = this.$("input.gd-search").val();
		if(v.indexOf("type to search",0) >= 0){
			this.$("input.gd-search").val("");
		}
	},	
	
	hover: function(e){
		this.$(e.currentTarget).toggleClass("ui-state-hover");
	},
	
	selectRow: function(e){
		if(this.model.isOn()){
			this.$(this.selectedRow).removeClass("ui-state-active");
			this.selectedRow = e.currentTarget;
			var row = this.$(this.selectedRow).addClass("ui-state-active").data('row');
			this.model.view.showInfoBox(row,true);
		}else{
			this.model.view.map.gd.log({type:"info",message: "Layer must be on to select row."});
		}
	},
	
	refresh: function(e){
		this.setLoading();
		this.$(".gd-layer-pg,.gd-search-res,.gd-layer-error").remove();
		this.$(".gd-paging").hide();
		var self = this;
		window.setTimeout(function(){
			self.model.view.refresh({forceLoad: true, setMapWindow: false});},125);
	},
	
	refreshHover: function(e){
		this.$(e.currentTarget).toggleClass("gd-refresh-hover");
	},
	
	select: function(){
		// layers collection will deselect all 
		// other selected layers
		this.model.set({"selected": true});
		if(this.model.isPopulated()) { this.renderPage(1); }
	},
	
	render: function(create){
		create = create === undefined ? true : false;
		if(create){			
			this.renderTab();
			this.renderButtons();
		}
		// commented out till sortable is figured out
		// this.$("h3").unbind('click');
		// 		var stop = false;
		// 		var preventDef = function(event){
		// 			if(stop){
		// 				event.stopImmediatePropagation();
		// 				event.preventDefault();
		// 				stop = false;
		// 			}
		// 		}
		//this.$("h3").click(preventDef);
		$(this.parentEl).accordion('destroy');
		$(this.parentEl).accordion({
					header: "> div > h3",
					fillSpace: true
		});
		// sortable has issues with open 
		// content.  need to close div during
		// sort event and reopen.	
			// .sortable({
			// 	axis: "y",
			// 	handle: "h3",
			// 	stop: function() {
			// 		stop = true;
			// 	}
			// 	});			
		
		return this;		
	},	
	
	setLoading: function(){
		this.$(".gd-refresh").button('disable');
		this.$(".gd-tab-state button").hide();
		this.$(".gd-tab-state span").first().attr("class", "gd-tab-loading").show();
	},
	
	setReady: function(){
		this.$(".gd-refresh").button('enable');
		this.$(".gd-tab-state span").first().hide();
		this.$(".gd-tab-state button").show();
		
		// setup the correct initial button state
		// in cases where data is fetched we have
		// to check the latest on/off state.
		if(this.model.isOn()  && !this.$(".gd-tab-state, button").hasClass("gd-tab-btn-on")){
			this.$(".gd-tab-state, button").addClass("gd-tab-btn-on");
			this.$(".gd-tab-state button").removeClass("ui-state-hover");
		}
		
		if(this.model.isSelected() && this.model.isPopulated() && this.model.view.map.isReady()){
			this.renderPage(1);
		}
	},
	
	setError: function(e){
		this.$(".gd-tab-state button,.gd-layer-pg").hide();
		this.$(".gd-tab-state span").first().attr("class", "gd-tab-error").show();
		this.$(".gd-tab-content").append('<div class="gd-layer-error">' + e.message +'</div>');
		var st = this.model.get('state');
		
		if( st != "failed"){ this.model.set({state:"failed"}); }
		
		this.model.view.map.gd.log({
			message: this.model.get('name') + ": " + e.message,
			type: "error" });
	},
	
	toggleLayer: function(o){
		var opts = o || {};
		if(this.model.isOn()){
			this.model.set({on: false},opts);			
		}else{	
			this.model.set({on: true},opts);
		}
		
	},
	
	on: function(){
		if(this.model.isOn()){
			this.$(".gd-tab-state, button").toggleClass("gd-tab-btn-on");		
		}else{			
			this.$(".gd-tab-state, button").toggleClass("gd-tab-btn-on");
		}
		this.$(".gd-tab-state button").removeClass("ui-state-hover");
	},
	
	renderTab: function(){
		var layer = this.model;
		var tmplt = {
			id: layer.get('id'),
			name: layer.get('name'),
			slot: layer.get('slot'),
			className: "",
      edit: gd.options.permissions.edit
		}
		if(layer.isOn()){tmplt.className = "gd-tab-btn-on";}
		$(this.parentEl).append(this.el);
		$(this.el).html(bdl.geodash.TF.accdTab(tmplt));
	},
	
	remove: function(){
		$(this.el).remove();
		this.render(false);
	},
	
	renderButtons: function(){
		var self = this;
		// toggle layer button
		this.$(".gd-tab-state button").button()
		.bind("click", function(e){
			e.stopPropagation();
			self.toggleLayer();
		});
		// refresh button
		this.$(".gd-refresh").button({text:false,icons:{primary:"gd-refresh-icon"}})
			.bind("click",function(e){
				self.refresh();
			}).addClass("gd-refresh")
		//paging buttons
		this.$(".gd-paging .gd-pg-next").button().bind("click",function(){
			self.next();
		});
		this.$(".gd-paging .gd-pg-prev").button().bind("click",function(){
			self.prev();
		});
		this.$(".gd-paging .gd-pg-first").button().bind("click",function(){
			self.first();
		});
		this.$(".gd-paging .gd-pg-last").button().bind("click",function(){
			self.last();
		});
	},
	
	/************** Content Paging Mechanics *****************/
	getTotalPages: function(){
		if(this.totalPages == undefined){
			this.totalPages = Math.ceil(this.model.get('rows').length/25);
		}
		return this.totalPages;
	},
	
	isLastPage: function(){
		return this.currentPage == this.getTotalPages();
	},
	
	getPageRange: function(pageNum){
		var tp = this.getTotalPages();
		if(pageNum > tp){
			return null;
		}
		var lastRow = this.model.get('rows').length -1;
		var startRow = 25*pageNum - 25;
		var endRow = 25*pageNum - 1;
		if(endRow > lastRow){endRow = lastRow};
		return {start: startRow, end: endRow};
	},
	
	renderPage: function(page){
		if(this.getTotalPages() > 1){
			this.$(".gd-paging").show();
		}
		this.$(".gd-pg-label").text(page + "/" + this.getTotalPages());
		var pageid = 'gd-layer-pg-' + this.model.id + '-';
		this.$("div.gd-tab-content #" + pageid + this.currentPage).hide();
		var pg = this.$("div.gd-tab-content #" + pageid + page);
		
		this.currentPage = page;
		if(pg.length >0){
			pg.show();
		}else{
			var range = this.getPageRange(page);
			var p = '<div class="gd-layer-pg" id="' + pageid + page + '">';
			for(var i=range.start;i<=range.end;i++){
				p += '<div class="gd-row" data-row="'+i+'"><div class="gd-row-icon">'+ this.model.view.getIconThumb(i)+'</div>' +
					'<div class="gd-row-content">'+this._getRowContent(i) +'</div></div>';
			}
			p += '</div>';
			this.$("div.gd-tab-content").append(p);
		}
	},
	
	next: function(){
		if(this.isLastPage()){return false;}
		this.renderPage(this.currentPage +1);
	},
	
	prev: function(){
		if(this.currentPage ==1){return false;}
		this.renderPage(this.currentPage -1);
	},
	
	first: function(){
		if(this.currentPage ==1){return false;}
		this.renderPage(1);
	},
	
	last: function(){
		if(this.isLastPage()){return false;}
		this.renderPage(this.getTotalPages());
	},
	
	_getRowContent: function(row){
		var r = this.model.get('rows')[row];
		var c = this.model.get('columns');
		var g = this.model.get('keys');
		var content = "";
		if(this.model.hasTitle()){
			content += '<div class="gd-row-title">' + this.model.getTitle(row) + '</div>';
		}
		content += '<div class="gd-row-subtitle">';
		var subtitle = '';
		var i = 0;
		_.each(r,function(val,col){
			if(g.geo != i && g.title != i && c[i].type == "attribute"){ subtitle += val + ', ' ; }
			i++;
		});
		content += subtitle.substring(0,subtitle.length-2) + '</div>';
		return content;
	}
});
