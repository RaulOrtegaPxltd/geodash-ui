bdl.geodash.Selector = Backbone.View.extend({
	initialize: function(){
		this.map = this.options.map;
    this.api = this.map.base.get('api');
		this.mouseDown = false;
		this.active = false;
		this.listeners = [];
		_.bindAll(this,"onMouseDown","onMouseUp","onMouseMove");
		this.render();
	},
	
	render: function(){
    if(this.api == 'google') {
      this.box = new google.maps.Rectangle({
							fillColor: "#cccccc",
							strokeColor:"#ff9900",
							fillOpacity:"0.45",zIndex: 10 });
    } else if(this.api == 'leaflet-mapquest') {
      this.box = new L.Rectangle([[0,0],[0,0]], {
							fillColor: "#cccccc",
							strokeColor:"#ff9900",
							fillOpacity:"0.45",zIndex: 10 });
    }
	},
	
	activate: function(){
		this.active = true;
		this.trigger("activate");
		var self = this;

    if(this.api == 'google') {
      this.map.apiMap.set("draggable",false);
      this.listeners.push(google.maps.event.addDomListener(this.map.apiMap,
        "mousedown",self.onMouseDown));
      this.listeners.push(google.maps.event.addDomListener(this.map.apiMap.getDiv(),
        "mouseup",self.onMouseUp));
      this.listeners.push(google.maps.event.addListener(this.map.apiMap,
        "mousemove",self.onMouseMove));
      this.listeners.push(google.maps.event.addListener(this.box,
        "mousemove",self.onMouseMove));
    } else if(this.api == 'leaflet-mapquest') {
      this.map.apiMap.dragging.disable()
      this.map.apiMap.addLayer(this.box);
      this.map.apiMap.addEventListener('mousedown', self.onMouseDown);
      this.map.apiMap.addEventListener('mouseup', self.onMouseUp);
      this.map.apiMap.addEventListener('mousemove', self.onMouseMove);
    }
	},
	
	deactivate: function(){
		this.active=false;
    this.trigger("deactivate");		
    if(this.api == 'google') {
      this.map.apiMap.set("draggable",true);
      this.box.setMap(null);
      for(var i=0;i<this.listeners.length;i++){
        google.maps.event.removeListener(this.listeners[i]);
      }
      this.listeners = [];
    } else if(this.api == 'leaflet-mapquest') {
      gd.map.apiMap.dragging.enable()
      this.map.apiMap.removeEventListener('mousedown');
      this.map.apiMap.removeEventListener('mouseup');
      this.map.apiMap.removeEventListener('mousemove');
      this.map.apiMap.removeLayer(this.box);
    }
	},
	
	toggle: function(){
		if(this.active){
			this.deactivate();
		}else{
			this.activate();
		}
	},
	
	onMouseDown: function(e){
		this.trigger("dragstart");
		this.mouseDown = true;

    if(this.api == 'google') {
      this.start_pt = e.latLng;	
      this.box.setMap(null);
      this.box.setBounds(new google.maps.LatLngBounds(e.latLng,e.latLng));
      this.box.setMap(this.map.apiMap);
    } else if(this.api == 'leaflet-mapquest') {
      this.start_pt = e.latlng;	
      this.map.apiMap.removeLayer(this.box);
      this.box.setBounds(new L.LatLngBounds(e.latlng,e.latlng));
      this.map.apiMap.addLayer(this.box);
    }
	},
	
	onMouseUp: function(e){
		this.trigger("dragend");
		this.mouseDown = false;
    if(this.api == 'leaflet-mapquest') {
      this.map.selectByBounds();
    }
	},
	
	onMouseMove: function(e){
    var current_pt = null;

		if(this.mouseDown){
      if(this.api == 'google') {
        var current_pt = this.getMouseBounds(e.latLng)
        this.box.setBounds(current_pt);
      } else if(this.api == 'leaflet-mapquest') {
        this.box.setBounds(new L.LatLngBounds(this.start_pt, e.latlng));
      }
		}
	},
	
	noBoxDrawn: function(){
		if(!this.active){ return false; }
		var ne = this.box.getBounds().getNorthEast();
		var sw = this.box.getBounds().getSouthWest();
		if(ne.lat() == sw.lat() && 
				ne.lng() == sw.lng()){
					return true;
				}else{
					return false;
				}
	},
	
	getMouseBounds: function(current_pt){
    if(this.api == 'google') {
      var sw,ne;
      var start_pt = this.start_pt;
      // 0 c
      // s 0
      if(current_pt.lat() > start_pt.lat() && current_pt.lng() > start_pt.lng()){
        sw = start_pt;
        ne = current_pt;
      // c 0
      // 0 s
      }else if(current_pt.lat() > start_pt.lat() && current_pt.lng() < start_pt.lng()){
        sw = new google.maps.LatLng(start_pt.lat(),current_pt.lng());
        ne = new google.maps.LatLng(current_pt.lat(),start_pt.lng());
      // 0 s
      // c 0	
      }else if(current_pt.lat() < start_pt.lat() && current_pt.lng() < start_pt.lng()){
        sw = current_pt;
        ne = start_pt;
      // s 0
      // 0 c
      }else if(current_pt.lat() < start_pt.lat() && current_pt.lng() > start_pt.lng()){
        sw = new google.maps.LatLng(current_pt.lat(),start_pt.lng());
        ne = new google.maps.LatLng(start_pt.lat(),current_pt.lng());
      }
      return new google.maps.LatLngBounds(sw,ne);

    } else if(this.api == 'leaflet-mapquest') {
      var sw,ne;
      var start_pt = this.start_pt;
      // 0 c
      // s 0
      if(current_pt.lat > start_pt.lat && current_pt.lng > start_pt.lng){
        sw = start_pt;
        ne = current_pt;
      // c 0
      // 0 s
      }else if(current_pt.lat > start_pt.lat && current_pt.lng < start_pt.lng){
        sw = new L.Point(start_pt.lat,current_pt.lng);
        ne = new L.Point(current_pt.lat,start_pt.lng);
      // 0 s
      // c 0	
      }else if(current_pt.lat < start_pt.lat && current_pt.lng < start_pt.lng){
        sw = current_pt;
        ne = start_pt;
      // s 0
      // 0 c
      }else if(current_pt.lat < start_pt.lat && current_pt.lng > start_pt.lng){
        sw = new L.Point(current_pt.lat,start_pt.lng);
        ne = new L.Point(start_pt.lat,current_pt.lng);
      }

      if(sw && ne) {
        return new L.LatLngBounds(sw,ne);
      } else {
        return null;
      }
    }
	}
	
});
