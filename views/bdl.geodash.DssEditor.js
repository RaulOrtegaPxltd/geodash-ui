/**
* options -
*	model - A Marker Layer object
*/

bdl.geodash.KmlEditor = Backbone.View.extend({
	tagName: "div",
	className: "gd-editor-content",
	
	initialize: function(){
		this.p = this.options.p;
		this.render();
	},
	
	// events: {
	// 	"click .gd-iconType": "iconPicker"
	// },
	
	
	render: function(){
		var m = this.model.toJSON();
		m.id = this.model.id ? this.model.id : null;
		m.type = this.model.type;
		$(this.el).html(this.template(m));
		$(this.p.el).append(this.el);

    // fix for ie7 - radio buttons appear outside of scrolling area
    $('.gd-editor-content').css('position', 'relative');

		this.$(".gd-radio").buttonset();
	},
	
	save: function(){
		var self =this;
		var res = this.$("form#layer-editor").serializeArray();
		// sets all form attributes on the model in silent mode.
		_.each(res,function(i){
			var val = i.value, k = i.name,a={};
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
		this.model.validate();
		return this.model;
	},
	
	template: _.template(
		'<form id="layer-editor">'+
		'<input type="hidden" name="type" value="<%= type %>" />'+ 
		'<div class="gd-editor-title">KML Layer Editor</div> '+
		 '<div class="gd-editor-notice ui-state-error ui-corner-all"><span class="ui-icon ui-icon-alert"></span><span class="gd-notice"></span></div>'+
			'<div class="gd-editor-section"> '+
			'<div class="gd-section-label">Options</div>'+
			'<div class="gd-section-options">'+
			'	<label for="name">Layer Name:</label>'+
			'	<input type="text" id="name" name="name" value="<%= name %>" /><br /><br />'+
			'	<div class="gd-editor-item-desc">'+
			'		Enter the URL of a KML resource.  For more on Google support of KML read <a href="http://code.google.com/apis/kml/documentation/mapsSupport.html">this</a>.'+
			'	</div><br />'+
			'	<textarea id="url" name="url" rows="4" cols="40" > <%= url %> </textarea>'+
			'</div>'+
			'</div>'+
			'<div class="gd-editor-section"> '+
			'<div class="gd-section-label">Advanced</div>'+
			'<div class="gd-section-options">'+
			'	<div class="gd-ga">	'+
			'		<div class="gd-u first">'+
			'			<label>Active: </label>'+
			'		</div>'+
			'		<div class="gd-u gd-radio">	'+
			'			<input value=true id="active-y" name="on" type="radio" <% if(on){ print("checked"); } %>/><label for="active-y">Yes</label> '+
			'			<input value=false id="active-n" name="on" type="radio" <% if(!on){ print("checked"); } %> /><label for="active-n">No</label> '+
			'		</div>'+
			'	</div>'+
      '</div>'+
		'</div></form>'
	)
});
