/**
 * options - model - A Mass Marker Layer object
 */

bdl.geodash.MassMarkerEditor = Backbone.View.extend({
	tagName : "div",
	className : "gd-editor-content",

	initialize : function() {
		this.p = this.options.p;
		this.render();
	},

	// events: {
	// "click .gd-iconType": "iconPicker"
	// },

	render : function() {
		var m = this.model.toJSON();
		this.gdGridBones = $.map(mstrmojo.all, function(b) {
			if (b.gridInfo){
				if(b.defn.vis && b.defn.vis.vn == "GdGridMojoVisualizationStyle"){
					return b.defn;
				}
			}
		});
		m.gdGridBones = this.gdGridBones;
		m.id = this.model.id ? this.model.id : null;
		m.type = this.model.type;
		$(this.el).html(this.template(m));
		this.$('textarea#infoWindowDocumentURL').val(m.infoWindowDocumentURL); // fix for template method escaping &s in URL
		$(this.p.el).append(this.el);
		this.$(".gd-radio").buttonset();

		// fix for ie7 - radio buttons appear outside of scrolling area
		$('.gd-editor-content').css('position', 'relative');

		function showHideButtons() {
			var text = $("input[name=source]:checked").val();
			if (text == "current") {
				self.$(".external-report").slideUp();
				self.$(".gdgrid-report").slideUp();
			} else if (text == "external") {
				self.$(".gdgrid-report").slideUp();
				self.$(".external-report").slideDown();
			} else if (text == "gdgrid") {
				self.$(".external-report").slideUp();
				self.$(".gdgrid-report").slideDown();
			}
		}
		;

		// setup source buttons
		var self = this;
		this.$("input[name=source]").button().bind("click", function(e) {
			var text = $(this).val();
			showHideButtons();
		});
		this.$("input[name=infoWindow]").button().bind("click", function(e) {
			var text = $(this).val();
			if (text == "document") {
				self.$(".customInfoWindowOptionals").slideDown();
			} else {
				self.$(".customInfoWindowOptionals").slideUp();
			}
		});

		this.$(".gd-load-columns").button().bind("click", function() {
			self.loadColumns();
		});

		this.$(".gd-grid-load-columns").button().bind("click", function() {
			self.loadGridColumns();
		});

		this.$("#addcircle").button().bind("click", function() {
			self.addCircle();
		});

		this.addExistingCircles();
		// colorType selection
		this.renderColorPicker();
		this.p.initHelpButtons();
		this.setVisibilityOfcolorOptions();
	},

	addExistingCircles : function() {
		var self = this;
		_.each(self.model.attributes.circles.slice().reverse(), function(circle) {
			self.addCircle(circle);
		});

	},

	addCircle : function(opts) {
		var defaults = {
			color : '66dd66',
			size : 2,
			units : 'miles'
		};
		var opts = $.extend({}, defaults, opts);

		var c = this.$('.blankCircle>div').clone();
		c.find('div.deleteCircle').button().bind("click", function() {
			c.remove();
		});
		$(c).find('input.circleSize').val(opts['size']);
		$(c).find('input.circleColor').val(opts['color']);
		$(c).find('select.circleUnits').val(opts['units']);
		$(c).find('div.color').ColorPicker({
			onCreate : function(el) {
				var startVal = $(el).closest('div.circle').find("input.circleColor").val();
				$(this.el).ColorPickerSetColor(startVal);
				$(el).css('backgroundColor', '#' + startVal);
			},
			onShow : function(colpkr) {
				$(colpkr).zIndex(2000);
				$(colpkr).fadeIn(500);
				return false;
			},
			onHide : function(colpkr) {
				$(colpkr).fadeOut(500);
				return false;
			},
			onChange : function(hsb, hex, rgb) {
				var el = this.data("colorpicker").el;
				var topE = $(el).closest('div.circle');
				topE.find('input.circleColor').val(hex);
				$(el).css('backgroundColor', '#' + hex);
			}
		});
		// $(c).find('input.circleUnits').val(opts['size']);
		this.$('.circles').append(c)
		return false;
	},

	setVisibilityOfcolorOptions : function() {
		var self = this;
		var type = self.$("input[name=iconType]").val();
		if (type == "dynamic-disk") {
			this.$('#size-options').slideDown();
		} else {
			// this.$('#size-options').slideUp();
		}
	},

	renderColorPicker : function() {
		this.$("input[name=colorType]").button().bind("click", function(e) {
			var text = $(this).val();
			if (text != "threshold") {
				self.$(".gd-staticColor").slideDown();
			} else {
				self.$(".gd-staticColor").slideUp();
			}
		});
		$('#staticColorPicker').ColorPicker({
			color : '#0000ff',
			onCreate : function(el) {
				var startVal = "#" + $(el).next("input").val();
				$(this.el).ColorPickerSetColor(startVal);
				$(el).find("div").css('backgroundColor', startVal);
			},
			onShow : function(colpkr) {
				$(colpkr).zIndex(2000);
				$(colpkr).fadeIn(500);
				return false;
			},
			onHide : function(colpkr) {
				$(colpkr).fadeOut(500);
				return false;
			},
			onChange : function(hsb, hex, rgb) {
				var button = this.data("colorpicker").el;
				$(button).find('div').css('backgroundColor', '#' + hex);
				$(button).next('input').val('#' + hex);
			}
		});
	},

	loadColumns : function() {
		this.$(".external-report").parents("div.gd-editor-section").siblings("div.gd-editor-section").slideUp();

		this.model.set({
			reportID : this.$("input[name=reportID]").val(),
			source : "external"
		}, {
			silent : true
		});
		this.p.loadColumns(this.model);

	},

	loadGridColumns : function() {
		var selectedGridId = $.trim($("form#layer-editor select[name='gdGridId']").val());
		var gdGrid = $.map(this.gdGridBones, function(b) {
			if (b.id == selectedGridId) {
				return b;
			}
		})[0];
		var datasetID = $(gdGrid.gridSpan).find("div.datasetID")[0].innerText;

		this.$(".external-report").parents("div.gd-editor-section").siblings("div.gd-editor-section").slideUp();

		this.model.set({
			reportID : datasetID,
			name : this.$("input[name=name]").val(),
			source : "gdgrid",
			gdGridId : selectedGridId
		}, {
			silent : true
		});
		this.p.loadGridColumns(this.model);
	},

	save : function() {
		var self = this;
		var res = this.$("form#layer-editor").serializeArray();
		// sets all form attributes on the model in silent mode.
		circlesVals = [];
		_.each(res, function(i) {
			var val = i.value, k = i.name, a = {};
			if (val === "true") {
				val = true;
			}
			if (val === "false") {
				val = false;
			}
			if (k.toLowerCase().indexOf("keys") > -1) {
				try {
					val = _.isNumber(parseInt(val)) ? parseInt(val) : val;
					k = self.model.get('keys')[k.split(".")[1]] = val;
				} catch (e) {
				}
			} else if (k.toLowerCase().indexOf("circle") > -1) {
				// ignore
			} else {
				a[k] = val;
				self.model.set(a, {
					silent : true
				});
				// console.log(k, val, a);
			}
		});

		var circles = [];
		_.each(this.$("div.circles div.circle"), function(cDiv) {
			circles.push({
				color : $(cDiv).find('input.circleColor').val(),
				units : $(cDiv).find('select.circleUnits').val(),
				size : $(cDiv).find('input.circleSize').val()
			});
		});
		self.model.attributes['circles'] = circles;

		this.model.validate();
		return self.model;
	},

	iconTemplate : _.template('<div class="gd-u"><button class="gd-iconTypePreview" value="<%= type %>" >' + '<img src="<%= thumb %>" />' + '</button><div><%= type %></div></div>'),

	template : _.template('<form id="layer-editor">' + '<input type="hidden" name="type" value="<%= type %>" />' + '<div class="gd-icon-picker"> </div>' + '<div class="gd-editor-title">Mass Marker Layer Editor</div> ' + '<div class="gd-editor-notice ui-state-error ui-corner-all"><span class="ui-icon ui-icon-alert"></span><span class="gd-notice"></span></div>' + '<div class="gd-editor-section"> ' + '<div class="gd-section-label">Source</div>' + '<div class="gd-section-options">'
			+ '	<label for="name">Layer Name:</label>' + '	<input type="text" id="name" name="name" value="<%= name %>" /><br /><br />' + '	<div class="gd-editor-item-desc">' + '		External reports must be in the same project and cached.' + '	</div><br />' + '	<div class="gd-radio"> ' + '		<input value="current" id="source-current" name="source" type="radio" <% if(source == "current"){ print("checked"); } %>/><label for="source-current">This Report</label> '
			+ '		<input value="external" id="source-external" name="source" type="radio" <% if(source == "external"){ print("checked"); } %> /><label for="source-external">External Report</label> ' + '		<input value="gdgrid" id="source-gdgrid" name="source" type="radio" <% if(source == "gdgrid"){ print("checked"); } %> /><label for="source-gdgrid">GD Grid</label> ' + '	</div>' +

			'	<div class="gd-ge gdgrid-report" style="<% if(source != "gdgrid"){ print("display:none;"); } %>">' + '		<div class="gd-u first">' + '			<label for="reportID">Grid ID:</label><br />' + '			<select id="gdgrid" name="gdGridId">' + '				<% _.each(gdGridBones,function(val,idx){ %>' + '					<option value="<%= val.id %>" <% if(val.id == gdGridId ){ print("SELECTED"); } %> ><%= val.dSetName %> (<%= val.id %>)</option>' + '				<% }); %> ' + '			</select>' + '		</div>'
			+ '		<div class="gd-u"><div class="gd-grid-load-columns" value="load">Load Columns</div></div>' + '	</div>' +

			'	<div class="gd-ge external-report" style="<% if(source != "external"){ print("display:none;"); } %>">' + '		<div class="gd-u first">' + '			<label for="reportID">Report ID:</label><br />' + '			<input type="text" id="reportID" name="reportID" value="<%= reportID %>"/> ' + '		</div>' + '		<div class="gd-u"><div class="gd-load-columns" value="load">Load Columns</div></div>' + '	</div>' + '</div>' + '</div>' + '		<div class="gd-editor-section"> '
			+ '<div class="gd-section-label">Location</div>' + '<div class="gd-section-options">' + '	<div class="gd-editor-item-desc">' + '		Choose the field containing a lat,lng pair or the address. ' + '	</div>' + '	<div class="gd-ga">' + '		<div class="gd-u first">' + '			<label for="keys.geo">Geocode: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<select id="geo" name="keys.geo">' + '				<% _.each(columns,function(val,idx){ %>'
			+ '					<option value="<%= idx %>" <% if(idx== Math.abs(keys.geo) ){ print("SELECTED"); } %> ><%= val.name %></option>' + '				<% }); %> ' + '			</select>' + '		</div>' + '	</div>' + '	<div class="gd-ga">	' + '		<div class="gd-u first">' + '			<label for="keys.title">Title: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<select id="title" name="keys.title">' + '				<% _.each(columns,function(val,idx){ %>'
			+ '					<option value="<%= idx %>" <% if(idx==keys.title){ print("SELECTED"); } %> ><%= val.name %></option>' + '				<% }); %> ' + '			</select>' + '		</div>' + '	</div>	' + '</div>' + '</div>' + '		<div class="gd-editor-section"> ' + '<div class="gd-section-label">Marker</div>' + '<div class="gd-section-options">' + '	<div class="gd-editor-item-desc">' + '		Click the icon shown below to choose a different marker.' + '	</div>' +
			/*
			 * ' <div class="gd-ga">'+ ' <div class="gd-u first">'+ ' <input type="hidden" value="<%= iconType %>" id="iconType" name="iconType"/>'+ ' <label for="iconType">Icon Type: </label>'+ ' </div>'+ '<div class="gd-u gd-icon-option"> '+ ' <div class="gd-iconType" value="dynamic-pin">'+ ' <img src="<%= thumb %>" />'+ ' </div> '+ ' <div>dynamic-pin</div>'+ ' </div>'+ ' </div>'+
			 */
			'	<div class="gd-editor-item-desc">' + '		Static color applies the same color to all records while threshold colors applies a unique color based on the underlying grid cell.' + '	</div>' + '	<div class="gd-ga">	' + '		<div class="gd-u first">' + '			<label for="colorType">Color: </label>' + '		</div>' + '		<div class="gd-u gd-radio">	'
			+ '			<input value="static" id="colorType-static" name="colorType" type="radio" <% if(colorType == "static"){ print("checked"); } %> /><label for="colorType-static">Static</label> ' + '			<input value="threshold" id="colorType-thresh" name="colorType" type="radio" <% if(colorType == "threshold"){ print("checked"); } %>/><label for="colorType-thresh">Thresholds</label> ' + '		</div>' + '	</div>'
			+ '	<div class="gd-ga gd-staticColor" style="<% if(colorType == "threshold"){ print("display:none;"); } %>" >' + '		<div class="gd-u first">' + '			<label for="staticColor">Static Color: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<div class="colorSelector" id="staticColorPicker"><div style="background-color: <%= staticColor %>"></div></div>' + '			<input type="hidden" value="<%= staticColor %>" id="staticColor" name="staticColor" />' + '		</div>' + '	</div>' +

			'	<div class="gd-ga gd-thresh-metric">	' + '		<div class="gd-u first">' + '			<label for="keys.colorMetric">Color Metric: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<select id="colorMetric" name="keys.colorMetric">' + '				<% _.each(columns,function(val,idx){ %>' + '					<option value="<%= idx %>" <% if(idx==keys.colorMetric){ print("SELECTED"); } %> ><%= val.name %></option>' + '				<% }); %> ' + '			</select>' + '		</div>' + '	</div>	' +

			' <div id="size-options">' + '	<div class="gd-ga gd-thresh-metric">	' + '		<div class="gd-u first">' + '			<label for="keys.sizeMetric">Size Metric: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<select id="sizeMetric" name="keys.sizeMetric">' + '				<% _.each(columns,function(val,idx){ %>' + '					<option value="<%= idx %>" <% if(idx==keys.sizeMetric){ print("SELECTED"); } %> ><%= val.name %></option>' + '				<% }); %> ' + '			</select>' + '		</div>' + '	</div>	'
			+ '	<div class="gd-ga minMarkerWidth">	' + '		<div class="gd-u first">' + '			<label for="minMarkerWidth">Min Width (min: 1): </label>' + '		</div>' + '		<div class="gd-u">' + '			<input type="text" id="minMarkerWidth" name="minMarkerWidth" value="<%= minMarkerWidth %>"/> ' + '		</div>' + '	</div>	' + '	<div class="gd-ga maxMarkerWidth">	' + '		<div class="gd-u first">' + '			<label for="maxMarkerWidth">Max Width (max: 255): </label>' + '		</div>' + '		<div class="gd-u">'
			+ '			<input type="text" id="maxMarkerWidth" name="maxMarkerWidth" value="<%= maxMarkerWidth %>"/> ' + '		</div>' + '	</div>	' + ' </div> ' + '</div>' + '</div>' +

			'<div class="gd-editor-section"> ' + '<div class="gd-section-label">Info Window</div>' + '<div class="gd-section-options">' + '	<div class="gd-editor-item-desc">' + '		Choose what to display in the info window that appears when a marker is clicked on.' + '	</div><br/>' + '	<div class="gd-radio"> ' + '		<input value="default" id="infoWindow-default" name="infoWindow" type="radio" <% if(infoWindow == "default"){ print("checked"); } %>/><label for="infoWindow-default">Default</label> '
			+ '		<input value="document" id="infoWindow-document" name="infoWindow" type="radio" <% if(infoWindow == "document"){ print("checked"); } %> /><label for="infoWindow-document">Document URL</label> ' + '		<input value="none" id="infoWindow-none" name="infoWindow" type="radio" <% if(infoWindow == "none"){ print("checked"); } %> /><label for="infoWindow-none">None</label> ' + '		<button class="gd-help-button" gd-help-dialog="infoWindow" title="Help">Help</button>' + '	</div>'
			+ '	<div class="customInfoWindowOptionals" style="<% if(infoWindow != "document"){ print("display:none;"); } %>" >' + '	<div class="gd-ge infoWindowDocumentURL" >' + '		<div class="gd-u first">' + '			<label for="infoWindowDocumentURL">Document URL:</label>' + '			<button class="gd-help-button" gd-help-dialog="documentUrl" title="Help">Help</button><br />' + '	    <textarea id="infoWindowDocumentURL" name="infoWindowDocumentURL" rows="4" cols="40" ></textarea>' + '		</div>'
			+ '	</div>' + '	<div class="gd-ge infoWindowWidth" >' + '		<div class="gd-u first">' + '			<label for="infoWindowWidth">Width:</label><br />' + '			<input type="text" id="infoWindowWidth" name="infoWindowWidth" value="<%= infoWindowWidth %>"/> ' + '		</div>' + '	</div>' + '	<div class="gd-ge infoWindowHeight" >' + '		<div class="gd-u first">' + '			<label for="infoWindowHeight">Height:</label><br />'
			+ '			<input type="text" id="infoWindowHeight" name="infoWindowHeight" value="<%= infoWindowHeight %>"/> ' + '		</div>' + '	</div>' + ' </div>' + '</div>' + '</div>' +

			' </div>' + '</div>' +

			'		<div class="gd-editor-section"> ' + '<div class="gd-section-label">Advanced</div>' + '<div class="gd-section-options">' + '	<div class="gd-ga">	' + '		<div class="gd-u first">' + '			<label>Active: </label>' + '		</div>' + '		<div class="gd-u gd-radio">	' + '			<input value=true id="active-y" name="on" type="radio" <% if(on){ print("checked"); } %>/><label for="active-y">Yes</label> '
			+ '			<input value=false id="active-n" name="on" type="radio" <% if(!on){ print("checked"); } %> /><label for="active-n">No</label> ' + '		</div>' + '	</div>' + '</div>' + '</div></form>' + '<div class="gd-dialog infoWindow"><dl>' + '<dt>Default</dt><dd>Attributes and their values will be displayed.</dd>' + '<dt>Document URL:</dt><dd>Allows you to specify a custom URL to load in the window.</dd>' + '</dl></div>' + '<div class="gd-dialog documentUrl">'
			+ '<p><strong>URL</strong><br/>Paste in a URL to a dashboard, or a URL to an external site.</p>' + '<p><strong>Attributes</strong><br/>Currently selected attributes will be appended to the URL using the <code>elementsPromptAnswers</code> parameter.</p>' + '<p><strong>Hiding Sections</strong><br/>Append the following to the URL to hide the sections around a dashboard <code>&hiddenSections=header,path,dockTop,dockLeft,footer</code></p>' + '</div>')
});
