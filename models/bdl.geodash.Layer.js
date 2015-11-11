/**
*	Class:  bdl.geodash.Layer
*	Parent: Backbone.Model
*	
*	@attributes -
*		keys: {} - Identfies model fields in the column array
*		columns: [{name: "some_name", prop0: "prop0_val"}] 
*		geom: [{
*			color: #ff9900,
*			icon: "dynamic-pin",
*			point: [lat,lng] }]		
*/

bdl.geodash.Layer = Backbone.Model.extend({
	defaults: {
		"on": false,
		"selected": false,
		"showInfoWindow": true,
		"columns": [],
		"rows": [],
		"name": "New Layer",
		"staticColor": "#ff9900",
		"keys":{
			"title":0,
			"geo":0,
			"colorMetric":0
		},
		"geom":[],
		// editor params
		"source": "current",
		"reportID": "",
		"colorType": "threshold",
		"infoWindow": "default",
    "infoWindowWidth": "320",
    "infoWindowHeight": "240",
    "infoWindowDocumentURL": "",
    "minMarkerWidth": "10",
    "maxMarkerWidth": "250",
    "gdGridId": ""
	},
	//overriding parent to be integer friendly
	isNew: function(){
		return (this.id === undefined || this.id === "");
	},
	
	isOn: function(){
		return this.get('on');
	},
	
	isSelected: function(){
		return this.get('selected');
	},
	
	getRow: function(rowID){
		var geo = this.get('keys').geo;
		var rows = this.get('rows');
		var columns = this.get('columns');
		if(rows.length == 0 || columns.length == 0){
			throw("No data provided.");
		}
		
		var row = rows[rowID];
		var res = {};
		_(columns).each(function(col,position){
			if(position != geo){				
				res[col.name] = row[position];
			}
		});
		return res;
	},

  /*
   * used for passing prompt answers to reports inside info windows
   */
  getPromptAnsSuff: function(rowID){
    var _self = this;
    var row = this.get('rows')[rowID];
    var rowElementIds = this.get('rowsOfElementIds')[rowID];
    var qs = "&elementsPromptAnswers=";
    var cols = this.get('columns');

    _.each(cols, function(c, i) {
      if(c.type == 'attribute') {
        qs = qs + encodeURIComponent(c.attID) + ";" + encodeURIComponent(rowElementIds[i]) + ",";
      }
    });

    return qs;
  },
	
	hasTitle: function(){
		if(typeof this.get('keys').title == 'undefined'){
			return false;
		}else{
			return true;
		}
	},
	
	getTitle: function(rowID){
		if(this.hasTitle()){
			return this.get('rows')[rowID][this.get('keys').title];
		}else{
			return "";
		}
	},
	
	url: function(){
		return this.get('url');		
	},
	
	isPopulated: function(){
		var r = this.get('rows').length;
		var c = this.get('columns').length;
		if(r > 0 && c > 0){
			return true;
		}else{
			return false;
		}		
	},
	
	getColor: function(rowID){
		var geom = this.get('geom')[rowID];
		var color = this.get('staticColor');
		if(this.get('colorType') == "threshold" && geom.color){
			color = geom.color;
		}
		return color;
	},
	
	getSizePercent: function(rowID) {
    var self = this;
		var geom = self.get('geom')[rowID];
    var max = _.max($.map(self.get('geom'), function(i) {
      return self.parseNum(i.size)}));

    return max == 0 ? 0 :self.parseNum(geom.size) / max;
	},

  parseNum: function(n) {
    return parseFloat(String(n).replace(/,/g, ''));
  },

	search: function(value){
		var rows = this.get('rows');
		var temp = value;
		var obj = /^(\s*)([\W\w]*)(\b\s*$)/;
		if (obj.test(temp)) { temp = temp.replace(obj, '$2'); }
		var obj = / +/g;
		temp = temp.replace(obj, " ");
		if (temp == " ") { temp = ""; }
		var words = temp.split(' ');

		var matches = [];

		for(var i=0;i<rows.length;i++){
			var matchCount = 0;
			var atts = rows[i];
			for(var a=0;a<atts.length;a++){
				for(var w=0;w<words.length;w++){
					if((atts[a] + "").toLowerCase().indexOf((words[w]+"").toLowerCase())>-1){
						matchCount++;
					}
				}
			}
			//create array of matched result
			if(matchCount >= words.length){
				matches.push(i);
			}
		}
		return matches;
	}	
	
});

/**** CLASS METHODS ****/
bdl.geodash.Layer.getInstance = function(type){
	var layer;
	switch(type){
		case "markerLayer":
			layer = new bdl.geodash.MarkerLayer();
			break;
		case "areaLayer":
			layer = new bdl.geodash.AreaLayer();
			break;
		case "kmlLayer":
			layer = new bdl.geodash.KmlLayer();
			break;
		case "vectorLayer":
			layer = new bdl.geodash.VectorLayer();
			break;
		case "heatmapLayer":
			layer = new bdl.geodash.HeatmapLayer();
			break;
		case "hurricaneLayer":
			layer = new bdl.geodash.HurricaneLayer();
			break;
		case "dssLayer:earthquake":
			layer = new bdl.geodash.EarthquakeLayer();
			break;
		case "massMarkerLayer":
			layer = new bdl.geodash.MassMarkerLayer();
			break;
		default:
			layer = new bdl.geodash.MarkerLayer();
	}
	return layer;
}

