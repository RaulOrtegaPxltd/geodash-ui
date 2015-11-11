/**
 * options - model - A Marker Layer object
 */

bdl.geodash.AreaEditor = Backbone.View.extend({
	tagName : "div",
	className : "gd-editor-content",

	initialize : function() {
		this.p = this.options.p;
		this.render();
	},

	render : function() {
		var m = this.model.toJSON();
		// TODO: MSTR BONES TO MOJO
		this.gdGridBones = $.map(window.top.microstrategy.bones, function(b) {
			if (b.selectedVisualization == "GeodashGridStyle")
				return b;
		});
		m.gdGridBones = this.gdGridBones;
		m.id = this.model.id ? this.model.id : null;
		m.type = this.model.type;
		$(this.el).html(this.template(m));
		this.$('textarea#infoWindowDocumentURL').val(m.infoWindowDocumentURL); // fix for template method escaping &s in URL
		$(this.p.el).append(this.el);
		this.$(".gd-radio").buttonset();

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

		// colorType selection
		this.renderColorPicker();

		// fix for ie7 - radio buttons appear outside of scrolling area
		$('.gd-editor-content').css('position', 'relative');

		this.p.initHelpButtons();
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
		$('#staticColorPicker,#highliteColorPicker,#strokeColorPicker').ColorPicker({
			color : '#0000ff',
			onCreate : function(el) {
				var startVal = $(el).next("input").val();
				$(this.el).ColorPickerSetColor(startVal);
				$(el).find("div").css('backgroundColor', startVal);
			},
			onShow : function(colpkr) {
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
			name : this.$("input[name=name]").val(),
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

		// console.log('loadGridColumns serialized form', selectedGridId, gdGrid, datasetID);
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
			} else {
				a[k] = val;
				var silent = true;
				if (k == 'on') {
					silent = false
				}
				self.model.set(a, {
					silent : silent
				});
			}
		});
		this.model.validate();
		return this.model;
	},

	template : _.template('<form id="layer-editor">' + '<input type="hidden" name="type" value="<%= type %>" />' + '<div class="gd-icon-picker"> </div>' + '<div class="gd-editor-title">Area Layer Editor</div> ' + '<div class="gd-editor-notice ui-state-error ui-corner-all"><span class="ui-icon ui-icon-alert"></span><span class="gd-notice"></span></div>' + '<div class="gd-editor-section"> ' + '<div class="gd-section-label">Source</div>' + '<div class="gd-section-options">'
			+ '	<label for="name">Layer Name:</label>' + '	<input type="text" id="name" name="name" value="<%= name %>" /><br /><br />' + '	<div class="gd-editor-item-desc">' + '		External reports must be in the same project and cached.' + '	</div><br />' + '	<div class="gd-radio"> ' + '		<input value="current" id="source-current" name="source" type="radio" <% if(source == "current"){ print("checked"); } %>/><label for="source-current">This Report</label> '
			+ '		<input value="external" id="source-external" name="source" type="radio" <% if(source == "external"){ print("checked"); } %> /><label for="source-external">External</label> ' + '		<input value="gdgrid" id="source-gdgrid" name="source" type="radio" <% if(source == "gdgrid"){ print("checked"); } %> /><label for="source-gdgrid">GD Grid</label> ' + '	</div>' +

			'	<div class="gd-ge gdgrid-report" style="<% if(source != "gdgrid"){ print("display:none;"); } %>">' + '		<div class="gd-u first">' + '			<label for="reportID">Grid ID:</label><br />' + '			<select id="gdgrid" name="gdGridId">' + '				<% _.each(gdGridBones,function(val,idx){ %>' + '					<option value="<%= val.id %>" <% if(val.id == gdGridId ){ print("SELECTED"); } %> ><%= val.dSetName %> (<%= val.id %>)</option>' + '				<% }); %> ' + '			</select>' + '		</div>'
			+ '		<div class="gd-u"><div class="gd-grid-load-columns" value="load">Load Columns</div></div>' + '	</div>' +

			'	<div class="gd-ge external-report" style="<% if(source != "external"){ print("display:none;"); } %>">' + '		<div class="gd-u first">' + '			<label for="reportID">Report ID:</label><br />' + '			<input type="text" id="reportID" name="reportID" value="<%= reportID %>"/> ' + '		</div>' + '		<div class="gd-u"><div class="gd-load-columns" value="load">Load Columns</div></div>' + '	</div>' + '</div>' + '</div>' + '		<div class="gd-editor-section"> '
			+ '<div class="gd-section-label">Location</div>' + '<div class="gd-section-options">' + '	<div class="gd-editor-item-desc">' + '		Choose the field containing the name of an area. This could be the name of a state, county, zip code, or custom territories. ' + '	</div>' + '	<div class="gd-ga">' + '		<div class="gd-u first">' + '			<label for="keys.geo">Geocode: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<select id="geo" name="keys.geo">'
			+ '				<% _.each(columns,function(val,idx){ %>' + '					<option value="<%= idx %>" <% if(idx== Math.abs(keys.geo) ){ print("SELECTED"); } %> ><%= val.name %></option>' + '				<% }); %> ' + '			</select>' + '		</div>' + '	</div>' + '	<div class="gd-ga">	' + '		<div class="gd-u first">' + '			<label for="keys.title">Title: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<select id="title" name="keys.title">' + '				<% _.each(columns,function(val,idx){ %>'
			+ '					<option value="<%= idx %>" <% if(idx==keys.title){ print("SELECTED"); } %> ><%= val.name %></option>' + '				<% }); %> ' + '			</select>' + '		</div>' + '	</div>	' + '</div>' + '</div>' + '		<div class="gd-editor-section"> ' + '<div class="gd-section-label">Shape Options</div>' + '<div class="gd-section-options">' + '	<div class="gd-editor-item-desc">' + '		When using threholds color type, Geodash will use the cell color of the selected field.' + '	</div>'
			+ '	<div class="gd-ga gd-thresh-metric">	' + '		<div class="gd-u first">' + '			<label for="keys.colorMetric">Metric: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<select id="colorMetric" name="keys.colorMetric">' + '				<% _.each(columns,function(val,idx){ %>' + '					<option value="<%= idx %>" <% if(idx==keys.colorMetric){ print("SELECTED"); } %> ><%= val.name %></option>' + '				<% }); %> ' + '			</select>' + '		</div>' + '	</div>	'
			+ '	<div class="gd-editor-item-desc">' + '		Static color applies the same color to all records while threshold colors applies a unique color based on the underlying grid cell.' + '	</div>' + '	<div class="gd-ga">	' + '		<div class="gd-u first">' + '			<label for="colorType">Color: </label>' + '		</div>' + '		<div class="gd-u gd-radio">	'
			+ '			<input value="static" id="colorType-static" name="colorType" type="radio" <% if(colorType == "static"){ print("checked"); } %> /><label for="colorType-static">Static</label> ' + '			<input value="threshold" id="colorType-thresh" name="colorType" type="radio" <% if(colorType == "threshold"){ print("checked"); } %>/><label for="colorType-thresh">Thresholds</label> ' + '		</div>' + '	</div>'
			+ '	<div class="gd-g gd-staticColor" style="<% if(colorType == "threshold"){ print("display:none;"); } %>" >' + '		<div class="gd-u first">' + '			<label for="staticColor">Static Color: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<div class="colorSelector" id="staticColorPicker"><div style="background-color: <%= staticColor %>"></div></div>' + '			<input type="hidden" value="<%= staticColor %>" id="staticColor" name="staticColor" />' + '		</div>' + '	</div>'
			+ '	<div class="gd-g">' + '		<div class="gd-u first">' + '			<label for="strokeColor">Shape Stroke Color: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<div class="colorSelector" id="strokeColorPicker"><div style="background-color: <%= strokeColor %>"></div></div>' + '			<input type="hidden" value="<%= strokeColor %>" id="strokeColor" name="strokeColor" />' + '		</div>' + '	</div>' + '	<div class="gd-g">' + '		<div class="gd-u first">'
			+ '			<label for="highliteColor">Shape Highlite Color: </label>' + '		</div>' + '		<div class="gd-u">	' + '			<div class="colorSelector" id="highliteColorPicker"><div style="background-color: <%= highliteColor %>"></div></div>' + '			<input type="hidden" value="<%= highliteColor %>" id="highliteColor" name="highliteColor" />' + '		</div>' + '	</div>' + '</div>' + '</div>' + '<div class="gd-editor-section"> ' + '<div class="gd-section-label">Info Window</div>'
			+ '<div class="gd-section-options">' + '	<div class="gd-editor-item-desc">' + '		Choose what to display in the info window that appears when an area is clicked on.' + '	</div><br/>' + '	<div class="gd-radio"> ' + '		<input value="default" id="infoWindow-default" name="infoWindow" type="radio" <% if(infoWindow == "default"){ print("checked"); } %>/><label for="infoWindow-default">Default</label> '
			+ '		<input value="document" id="infoWindow-document" name="infoWindow" type="radio" <% if(infoWindow == "document"){ print("checked"); } %> /><label for="infoWindow-document">Document URL</label> ' + '		<input value="none" id="infoWindow-none" name="infoWindow" type="radio" <% if(infoWindow == "none"){ print("checked"); } %> /><label for="infoWindow-none">None</label> ' + '		<button class="gd-help-button" gd-help-dialog="infoWindow" title="Help">Help</button>' + '	</div>' +

			'	<div class="customInfoWindowOptionals" style="<% if(infoWindow != "document"){ print("display:none;"); } %>" >' + '	<div class="gd-ge infoWindowDocumentURL" >' + '		<div class="gd-u first">' + '			<label for="infoWindowDocumentURL">Document URL:</label>' + '			<button class="gd-help-button" gd-help-dialog="documentUrl" title="Help">Help</button><br />' + '	    <textarea id="infoWindowDocumentURL" name="infoWindowDocumentURL" rows="4" cols="40" ></textarea>' + '		</div>'
			+ '	</div>' + '	<div class="gd-ge infoWindowWidth" >' + '		<div class="gd-u first">' + '			<label for="infoWindowWidth">Width:</label><br />' + '			<input type="text" id="infoWindowWidth" name="infoWindowWidth" value="<%= infoWindowWidth %>"/> ' + '		</div>' + '	</div>' + '	<div class="gd-ge infoWindowHeight" >' + '		<div class="gd-u first">' + '			<label for="infoWindowHeight">Height:</label><br />'
			+ '			<input type="text" id="infoWindowHeight" name="infoWindowHeight" value="<%= infoWindowHeight %>"/> ' + '		</div>' + '	</div>' + ' </div>' + '</div>' + '</div>' + '		<div class="gd-editor-section"> ' + '<div class="gd-section-label">Advanced</div>' + '<div class="gd-section-options">' + '	<div class="gd-ga">	' + '		<div class="gd-u first">' + '			<label>Active: </label>' + '		</div>' + '		<div class="gd-u gd-radio">	'
			+ '			<input value=true id="active-y" name="on" type="radio" <% if(on){ print("checked"); } %>/><label for="active-y">Yes</label> ' + '			<input value=false id="active-n" name="on" type="radio" <% if(!on){ print("checked"); } %> /><label for="active-n">No</label> ' + '		</div>' + '	</div>' + '</div>' + '</div></form>' + '<div class="gd-dialog infoWindow"><dl>' + '<dt>Default</dt><dd>Attributes and their values will be displayed.</dd>'
			+ '<dt>Document URL:</dt><dd>Allows you to specify a custom URL to load in the window.</dd>' + '</dl></div>' + '<div class="gd-dialog documentUrl">' + '<p><strong>URL</strong><br/>Paste in a URL to a dashboard, or a URL to an external site.</p>' + '<p><strong>Attributes</strong><br/>Currently selected attributes will be appended to the URL using the <code>elementsPromptAnswers</code> parameter.</p>'
			+ '<p><strong>Hiding Sections</strong><br/>Append the following to the URL to hide the sections around a dashboard <code>&hiddenSections=header,path,dockTop,dockLeft,footer</code></p>' + '</div>')
});
