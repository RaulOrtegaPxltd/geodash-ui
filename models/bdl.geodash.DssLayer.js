bdl.geodash.DssLayer = bdl.geodash.Layer.extend({
  constructor: function(attributes) {
    if(attributes.dss_product_type == 'earthquake') {
      return new  bdl.geodash.EarthquakeLayer(attributes);
    }
  }
});
