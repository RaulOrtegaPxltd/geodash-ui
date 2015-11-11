bdl.geodash.HeatmapLayer = bdl.geodash.Layer.extend({
	initialize: function(){
		this.type = "heatmapLayer";
		this.attributes = _.extend({
				type: "heatmapLayer",
				state: "not_ready",
				weightMetric: -1,
				radius: 30}
			,this.attributes);
	},
	
  setWeights: function() {
    // set attributes for weights of heatmap points
    var weightMetric = this.get('weightMetric');

    // clear min and max weights
    this.minWeight = null;
    this.maxWeight = null;

    if(weightMetric != -1) {
      var rows = this.get('rows');
      var allWeights = _.map(rows, function(row) { return row[weightMetric]; });
      this.maxWeight = _.max(allWeights);
      this.minWeight = _.min(allWeights);
    }

  },

  getWeight: function(rowID) {
    var weightMetric = this.get('weightMetric');
    if(weightMetric != -1) {
      var maxWeight = 8;

      var range = this.maxWeight - this.minWeight;
      var rowValue = this.get('rows')[rowID][weightMetric];

      var fromMin = rowValue - this.minWeight;

      if(fromMin == 0) {
        return 1;
      } else {
        return 1 + (maxWeight - 1) * (fromMin / range);
      }
    } else {
      return 1;
    }

  },

	getLatLng: function(rowID){
		var geom = this.get('geom')[rowID];
		var lat = geom.point[0];
		var lng = geom.point[1];
		if(lat == undefined || lng == undefined){
			throw {message: "No lat lng provided for record."};
		}else{			
			return [lat,lng];
		}
	},
	
	validate: function(){
		
	}
	
});
