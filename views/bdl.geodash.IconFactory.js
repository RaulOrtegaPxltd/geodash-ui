bdl.geodash.IconFactory = {};

// Leaflet additions at top, IconFactory defined below

bdl.geodash.IconFactory.leafletCreateMarkerIcon = function (opts) {
  var GdDynamicDiskIcon = L.Icon.extend({
    createIcon: function() {
      var icn = this._createIcon('icon');
      L.DomUtil.addClass(icn, 'dynamic-disk');
      return icn;
    }
  });
  var GdIcon = L.Icon.extend({});


  var width = opts.width || 21;
  var height = opts.height || 34;
  var primaryColor = opts.primaryColor || "#ff0000";
  var strokeColor = opts.strokeColor || "#000000";
  var cornerColor = opts.cornerColor || "#ffffff";
  var size = opts.size || 0;


  // dynamic-pin
  // http://chart.apis.google.com/chart?cht=mm&chs=32x32&chco=ffffff,ff9900,000000&ext=.png

  // dynamic-disk
  // http://chart.apis.google.com/chart?cht=it&chs=25x25&chco=ff9900,000000ff,ffffff01&chl=&chx=000000,0&chf=bg,s,00000000&ext=.png

  // academy
  // https://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=academy|ff9900

  var iconAnchor = "";

  if(opts.type == "dynamic-pin") {
    var iconUrl = gd.base.getProtocol() + "//chart.googleapis.com/chart?cht=mm&chs=21x34&chco=ffffff," +
      opts.primaryColor.replace("#","") +
      ",000000&ext=.png";
    iconAnchor = new L.Point(width/2, height);

  } else if(opts.type == "dynamic-disk") {
    if(opts.useDefaultSize) {
      width = 25;
    } else {
      var dia = opts.maxMarkerWidth - opts.minMarkerWidth;
      width = opts.minMarkerWidth + Math.ceil(dia * opts.sizePercent);
    }

    height = width;
    iconAnchor = new L.Point(width/2, height/2);
    // var iconUrl = gd.base.getProtocol() + "//chart.googleapis.com/chart?cht=itf&chs=" + width +
    // "&chco=" + opts.primaryColor.replace("#","") + "&chf=bg,s,00000000";

    var iconUrl = bdl.geodash.protocol + '//' + bdl.geodash.server + '/api/charts/circle';
    iconUrl = iconUrl + '?strokeWeight=0&strokeOpacity=0&fillOpacity=0.8';
    iconUrl = iconUrl + '&fillColor=' + encodeURIComponent(opts.primaryColor);
    iconUrl = iconUrl + '&radius=' + width / 2;

  } else {
    var base = gd.base.getProtocol() + "//chart.googleapis.com/chart?chst=d_map_pin_icon";
    var iconUrl = base + "&chld=" + bdl.geodash.IconFactory.ICONS[opts.type] + "|" + 
    opts.primaryColor.replace("#","");
    iconAnchor = new L.Point(width/2, height);
  }

  var iconUrl = iconUrl;
  var iconSize = new L.Point(width, height);
  var shadowSize = new L.Point(40, 37);
  var type = opts.type;

  var thumb = iconUrl;
  var shadowUrl = null; // "http://chart.apis.google.com/chart?chst=d_map_pin_shadow";
  var shape = {type: 'poly'};

  var creatOpts =  {
                  iconAnchor: iconAnchor,
                  iconUrl: iconUrl,
                  iconSize: iconSize,
                  shadowSize: shadowSize,
                  type: type,
                  thumb: thumb,
                  shadowUrl: shadowUrl,
                  shape: shape
  };

  var icon = opts.type == "dynamic-disk" ? new GdDynamicDiskIcon(creatOpts) : new GdIcon(creatOpts);
  return icon;
}

// end of Leaflet additions

/**
 * @name bdl.geodash.IconFactory
 * @version 1.1
 * @author Ajo Abraham
 * @copyright (c) 2011 BigDataLabs, Inc.
 * 
 * @fileoverview This gives you static functions for creating dynamically
 *     sized and colored marker icons using the Charts API marker output.
 */

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
 */

/**
 * @name MarkerIconOptions
 * @class This class represents optional arguments to {@link createMarkerIcon}, 
 *     {@link createFlatIcon}, or {@link createLabeledMarkerIcon}. Each of the
 *     functions use a subset of these arguments. See the function descriptions
 *     for the list of supported options.
 * @property {Number} [width=32] Specifies, in pixels, the width of the icon.
 *     The width may include some blank space on the side, depending on the
 *     height of the icon, as the icon will scale its shape proportionately.
 * @property {Number} [height=32] Specifies, in pixels, the height of the icon.
 * @property {String} [primaryColor="#ff0000"] Specifies, as a hexadecimal
 *     string, the color used for the majority of the icon body.
 * @property {String} [cornerColor="#ffffff"] Specifies, as a hexadecimal
 *     string, the color used for the top corner of the icon. If you'd like the
 *     icon to have a consistent color, make the this the same as the
 *     {@link primaryColor}.
 * @property {String} [strokeColor="#000000"] Specifies, as a hexadecimal
 *     string, the color used for the outside line (stroke) of the icon.
 * @property {String} [shadowColor="#000000"] Specifies, as a hexadecimal
 *     string, the color used for the shadow of the icon. 
 * @property {String} [label=""] Specifies a character or string to display
 *     inside the body of the icon. Generally, one or two characters looks best.
 * @property {String} [labelColor="#000000"] Specifies, as a hexadecimal 
 *     string, the color used for the label text.
 * @property {Number} [labelSize=0] Specifies, in pixels, the size of the label
 *     text. If set to 0, the text auto-sizes to fit the icon body.
 * @property {String} [shape="circle"] Specifies shape of the icon. Current
 *     options are "circle" for a circle or "roundrect" for a rounded rectangle.
 * @property {Boolean} [addStar = false] Specifies whether to add a star to the
 *     edge of the icon.
 * @property {String} [starPrimaryColor="#FFFF00"] Specifies, as a hexadecimal
 *     string, the color used for the star body.
 * @property {String} [starStrokeColor="#0000FF"] Specifies, as a hexadecimal
 *     string, the color used for the outside line (stroke) of the star.
 */

/**
 * This namespace contains functions that you can use to easily create
 *     dynamically sized, colored, and labeled icons.
 * @namespace
 */
if(bdl.geodash.IconFactory == "undefined") {
  bdl.geodash.IconFactory = {};
}

/**
 * Creates an icon based on the specified options in the 
 *   {@link MarkerIconOptions} argument.
 *   Supported options are: width, height, primaryColor, 
 *   strokeColor, and cornerColor.
 * @param {MarkerIconOptions} [opts]
 * @return {GIcon}
 */
bdl.geodash.IconFactory.createMarkerIcon = function (opts) {
  var width = opts.width || 32;
  var height = opts.height || 32;
  var primaryColor = opts.primaryColor || "#ff0000";
  var strokeColor = opts.strokeColor || "#000000";
  var cornerColor = opts.cornerColor || "#ffffff";

  var baseUrl = gd.base.getProtocol() + "//chart.googleapis.com/chart?cht=mm";
  var iconUrl = baseUrl + "&chs=" + width + "x" + height + 
      "&chco=" + cornerColor.replace("#", "") + "," + 
      primaryColor.replace("#", "") + "," + 
      strokeColor.replace("#", "") + "&ext=.png";
  var icon = {type: "dynamic-pin"};
  icon.thumb = iconUrl;
  icon.icon = new google.maps.MarkerImage(iconUrl);
  icon.shadow = new google.maps.MarkerImage(gd.base.getProtocol() + "//chart.googleapis.com/chart?chst=d_map_pin_shadow",
		  			null,null,new google.maps.Point(12,37));
  icon.shape ={type: 'poly'};
  icon.shape.coord = [
                   width / 2, height,
                   (7 / 16) * width, (5 / 8) * height,
                   (5 / 16) * width, (7 / 16) * height,
                   (7 / 32) * width, (5 / 16) * height,
                   (5 / 16) * width, (1 / 8) * height,
                   (1 / 2) * width, 0,
                   (11 / 16) * width, (1 / 8) * height,
                   (25 / 32) * width, (5 / 16) * height,
                   (11 / 16) * width, (7 / 16) * height,
                   (9 / 16) * width, (5 / 8) * height
                 ];
  
  for (var i = 0; i < icon.shape.coord.length; i++) {
	  icon.shape.coord[i] = parseInt(icon.shape.coord[i]);
  }

  return icon;
};
bdl.geodash.IconFactory.ICONS = {
	"dynamic-pin": "default",
	"dynamic-disk": "default",
	"academy": "academy",
	"activities": "activities",
	"airport": "airport",
	"amusement": "amusement",
	"aquarium": "aquarium",
	"art-gallery": "art-gallery",
	"atm": "atm",
	"baby": "baby",
	"dollar": "bank-dollar",
	"euro": "bank-euro",
	"pound": "bank-pound",
	"yen": "bank-yen",
	"bar": "bar",
	"barber": "barber",
	"beach": "beach",
	"drink": "beer",
	"bicycle": "bicycle",
	"books": "books",
	"bowling": "bowling",
	"bus": "bus",
	"cafe": "cafe",
	"camping": "camping",
	"car": "car-dealer",
	"car-rental": "car-rental",
	"car-repair": "car-repair",
	"casino": "casino",
	"caution": "caution",
	"cemetery": "cemetery-grave",
	"cinema": "cinema",
	"civic-building": "civic-building",
	"computer": "computer",
	"corporate": "corporate",
	"legal": "legal",
	"fire": "fire",
	"flag": "flag",
	"floral": "floral",
	"helicopter": "helicopter",
	"home": "home",
	"info": "info",
	"locomotive": "locomotive",
	"medical": "medical",
	"mobile": "mobile",
	"motorcycle": "motorcycle",
	"music": "music",
	"parking": "parking",
	"gas-station": "petrol",
	"phone": "phone",
	"picnic": "picnic",
	"postal": "postal",
	"repair": "repair",
	"restaurant": "restaurant",
	"sail": "sail",
	"school": "school",
	"ship": "ship",
	"shopping-bag":"shoppingbag",
	"shopping-cart": "shoppingcart",
	"ski":"ski",
	"fast-food":"snack",
	"snow": "snow",
	"sport":"sport",
	"star":"star",
	"swim":"swim",
	"taxi":"taxi",
	"train": "train",
	"truck":"truck",
	"female": "wc-female",
	"male": "wc-male",
	"couple": "wc",
	"wheelchair": "wheelchair"
};
bdl.geodash.IconFactory.STANDARD_COORDS = [
	10,34,9,21,6,14,4,10,6,4,10,0,14,4,16,10,14,14,11,21];

bdl.geodash.IconFactory.createIcon = function(opts){
	if(opts.type == "dynamic-pin"){
		return bdl.geodash.IconFactory.createMarkerIcon(opts);
	}else if(opts.type == "dynamic-disk"){
		return bdl.geodash.IconFactory.createGDFlatIcon(opts);
	}
	var base = gd.base.getProtocol() + "//chart.googleapis.com/chart?chst=d_map_pin_icon";
	var iconUrl = base + "&chld=" + bdl.geodash.IconFactory.ICONS[opts.type] + "|" + 
	opts.primaryColor.replace("#","");
	
	var shadow = gd.base.getProtocol() + "//chart.googleapis.com/chart?chst=d_map_pin_shadow";
	var icon = {
		type: opts.type,
		thumb: iconUrl,
	  	icon: new google.maps.MarkerImage(iconUrl,new google.maps.Size(21,34)),
	  	shadow: new google.maps.MarkerImage(shadow,
			  			null,null,new google.maps.Point(12,37)),
	  	shape: {
			type: 'poly',
			coord: bdl.geodash.IconFactory.STANDARD_COORDS
		}
	}
	return icon;
}

/**
 * Creates a flat icon based on the specified options in the 
 *     {@link MarkerIconOptions} argument.
 *     Supported options are: width, height, primaryColor,
 *     shadowColor, label, labelColor, labelSize, and shape..
 * @param {MarkerIconOptions} [opts]
 * @return {GIcon}
 */
bdl.geodash.IconFactory.createGDFlatIcon = function (opts) {
  var width = 25;

  if(opts.useDefaultSize) {
    width = 25;
  } else {
    var dia = opts.maxMarkerWidth - opts.minMarkerWidth;
    width = opts.minMarkerWidth + Math.ceil(dia * opts.sizePercent);
  }
  height = width;

  var primaryColor = opts.primaryColor || "#ff0000";

  var alpha = "80";

  var icon = {type: "dynamic-disk"};
  var center = new google.maps.Point(width/2,height/2);

  var iconUrl = bdl.geodash.protocol + '//' + bdl.geodash.server + '/api/charts/circle';
  iconUrl = iconUrl + '?strokeWeight=0&strokeOpacity=0&fillOpacity=0.8';
  iconUrl = iconUrl + '&fillColor=' + encodeURIComponent(opts.primaryColor);
  iconUrl = iconUrl + '&radius=' + width / 2;

  icon.icon = new google.maps.MarkerImage(iconUrl,null,null,center);
  icon.thumb = iconUrl;
  /*
  icon.thumb = baseUrl + "&chs=" + 25 + "x" + 25 + 
	  "&chco=" + primaryColor.replace("#", "") + "," + 
	  shadowColor.replace("#", "") + "ff,ffffff01" +
	  "&chl=" + label + "&chx=" + labelColor.replace("#", "") + 
	  "," + labelSize+ "&chf=bg,s,00000000&ext=.png";
   */

  icon.shape = {type:'circle'};
  icon.shape.coords = [width/2,height/2,width/2];

  return icon;
};

/**
 * Creates a flat icon based on the specified options in the 
 *     {@link MarkerIconOptions} argument.
 *     Supported options are: width, height, primaryColor,
 *     shadowColor, label, labelColor, labelSize, and shape..
 * @param {MarkerIconOptions} [opts]
 * @return {GIcon}
 */
bdl.geodash.IconFactory.createFlatIcon = function (opts) {
  var width = 25;

  if(opts.useDefaultSize) {
    width = 25;
  } else {
    var dia = opts.maxMarkerWidth - opts.minMarkerWidth;
    width = opts.minMarkerWidth + Math.ceil(dia * opts.sizePercent);
  }
  height = width;

  var primaryColor = opts.primaryColor || "#ff0000";
  var shadowColor = opts.shadowColor || "#000000";
  var label = bdl.geodash.IconFactory.escapeUserText_(opts.label) || "";
  var labelColor = opts.labelColor || "#000000";
  var labelSize = opts.labelSize || 0;
  var shape = opts.shape ||  "circle";
  var shapeCode = (shape === "circle") ? "itf" : "itr";

  var alpha = "80";

  var baseUrl = gd.base.getProtocol() + "//chart.apis.google.com/chart?cht=" + shapeCode;
  var iconUrl = baseUrl + "&chs=" + width + "x" + height + 
      "&chco=" + primaryColor.replace("#", "") + alpha + "," + 
      shadowColor.replace("#", "") + "ff,ffffff01" +
      "&chl=" + label + "&chx=" + labelColor.replace("#", "") + 
      "," + labelSize + "&chf=bg,s,00000000&ext=.png";
  var icon = {type: "dynamic-disk"};
  var center = new google.maps.Point(width/2,height/2);
  icon.icon = new google.maps.MarkerImage(iconUrl,null,null,center);
  icon.thumb = baseUrl + "&chs=" + 25 + "x" + 25 + 
	  "&chco=" + primaryColor.replace("#", "") + "," + 
	  shadowColor.replace("#", "") + "ff,ffffff01" +
	  "&chl=" + label + "&chx=" + labelColor.replace("#", "") + 
	  "," + labelSize+ "&chf=bg,s,00000000&ext=.png";
  
  icon.shape = {type:'circle'};
  icon.shape.coords = [width/2,height/2,width/2];

  return icon;
};


/**
 * Creates a labeled marker icon based on the specified options in the 
 *     {@link MarkerIconOptions} argument.
 *     Supported options are: primaryColor, strokeColor, 
 *     starPrimaryColor, starStrokeColor, label, labelColor, and addStar.
 * @param {MarkerIconOptions} [opts]
 * @return {GIcon}
 */
bdl.geodash.IconFactory.createLabeledMarkerIcon = function (opts) {
  var primaryColor = opts.primaryColor || "#DA7187";
  var strokeColor = opts.strokeColor || "#000000";
  var starPrimaryColor = opts.starPrimaryColor || "#FFFF00";
  var starStrokeColor = opts.starStrokeColor || "#0000FF";
  var label = bdl.geodash.IconFactory.escapeUserText_(opts.label) || "";
  var labelColor = opts.labelColor || "#000000";
  var addStar = opts.addStar || false;
  
  var pinProgram = (addStar) ? "pin_star" : "pin";
  var baseUrl = gd.base.getProtocol() + "//chart.googleapis.com/chart?cht=d&chdp=mapsapi&chl=";
  var iconUrl = baseUrl + pinProgram + "'i\\" + "'[" + label + 
      "'-2'f\\"  + "hv'a\\]" + "h\\]o\\" + 
      primaryColor.replace("#", "")  + "'fC\\" + 
      labelColor.replace("#", "")  + "'tC\\" + 
      strokeColor.replace("#", "")  + "'eC\\";
  if (addStar) {
    iconUrl += starPrimaryColor.replace("#", "") + "'1C\\" + 
        starStrokeColor.replace("#", "") + "'0C\\";
  }
  iconUrl += "Lauto'f\\";
  var icon = {};
  icon.thumb = iconUrl;
  icon.icon = new google.maps.MarkerImage(iconUrl,new google.maps.Size(21,34));
  icon.shadow = new google.maps.MarkerImage(gd.base.getProtocol() + "//chart.googleapis.com/chart?chst=d_map_pin_shadow",
		  			null,null,new google.maps.Point(12,37));
  
  return icon;
};


/**
 * Utility function for doing special chart API escaping first,
 *  and then typical URL escaping. Must be applied to user-supplied text.
 * @private
 */
bdl.geodash.IconFactory.escapeUserText_ = function (text) {
  if (text === undefined) {
    return null;
  }
  text = text.replace(/@/, "@@");
  text = text.replace(/\\/, "@\\");
  text = text.replace(/'/, "@'");
  text = text.replace(/\[/, "@[");
  text = text.replace(/\]/, "@]");
  return encodeURIComponent(text);
};

// marker clusterer
eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('(5(){7 d=32,f=33,g=34;5 j(a){8 5(b){3[a]=b}}5 k(a){8 5(){8 3[a]}}7 l;5 m(a,b,c){3.1f(m,13.12.22);3.b=a;3.a=[];3.m=[];3.$=[31,2X,2Y,35,3c];3.i=[];3.z=g;c=c||{};3.f=c.3b||37;3.V=c.1A||f;3.i=c.39||[];3.U=c.2V||3.O;3.T=c.2K||3.N;3.M=d;6(c.23!=25)3.M=c.23;3.p=g;6(c.21!=25)3.p=c.21;n(3);3.18(a);3.I=3.b.1t();7 e=3;13.12.1m.1x(3.b,"2M",5(){7 h=e.b.1P[e.b.1R()].1A,o=e.b.1t();6(!(o<0||o>h))6(e.I!=o){e.I=e.b.1t();e.k()}});13.12.1m.1x(3.b,"2U",5(){e.h()});b&&b.14&&3.B(b,g)}l=m.4;l.O="3E://13-12-3C-3B-3G.3M.3H/3I/3x/3l/3m/m";l.N="3k";l.1f=5(a,b){8 5(c){15(7 e 3g c.4)3.4[e]=c.4[e];8 3}.2D(a,[b])};l.1j=5(){6(!3.z){3.z=d;q(3)}};l.1k=5(){};5 n(a){6(!a.i.14)15(7 b=0,c;c=a.$[b];b++)a.i.16({1B:a.U+(b+1)+"."+a.T,1c:c,1l:c})}l.w=k("i");l.q=k("a");l.S=5(){8 3.a.14};l.H=5(){8 3.V||3.b.1P[3.b.1R()].1A};l.F=5(a,b){15(7 c=0,e=a.14,h=e;h!==0;){h=1y(h/10,10);c++}c=9.24(c,b);8{1e:e,1C:c}};l.Y=j("F");l.G=k("F");l.B=5(a,b){15(7 c=0,e;e=a[c];c++)t(3,e);b||3.h()};5 t(a,b){b.1g(g);b.18(f);b.r=g;b.2s&&13.12.1m.1x(b,"2t",5(){b.r=g;a.k();a.h()});a.a.16(b)}l.o=5(a,b){t(3,a);b||3.h()};5 u(a,b){7 c=-1;6(a.a.1n)c=a.a.1n(b);17 15(7 e=0,h;h=a.a[e];e++)6(h==b){c=e;27}6(c==-1)8 g;a.a.2z(c,1);b.1g(g);b.18(f);8 d}l.W=5(a,b){7 c=u(3,a);6(!b&&c){3.k();3.h();8 d}17 8 g};l.X=5(a,b){15(7 c=g,e=0,h;h=a[e];e++){h=u(3,h);c=c||h}6(!b&&c){3.k();3.h();8 d}};l.R=5(){8 3.m.14};l.1d=k("b");l.18=j("b");l.v=k("f");l.Z=j("f");l.u=5(a){7 b=3.1X(),c=1a 13.12.1F(a.1I().19(),a.1I().1i()),e=1a 13.12.1F(a.1J().19(),a.1J().1i());c=b.1v(c);c.x+=3.f;c.y-=3.f;e=b.1v(e);e.x-=3.f;e.y+=3.f;c=b.1Z(c);b=b.1Z(e);a.1f(c);a.1f(b);8 a};l.P=5(){3.k();3.a=[]};l.k=5(){15(7 a=0,b;b=3.m[a];a++)b.1p();15(a=0;b=3.a[a];a++){b.r=g;b.18(f);b.1g(g)}3.m=[]};l.h=5(){q(3)};5 q(a){6(a.z)15(7 b=a.u(1a 13.12.1z(a.b.1r().1J(),a.b.1r().1I())),c=0,e;e=a.a[c];c++)6(!e.r&&b.26(e.1b())){7 h=a;e=e;15(7 o=3h,r=f,x=0,p=2c 0;p=h.m[x];x++){7 i=p.1u();6(i){i=i;7 s=e.1b();6(!i||!s)i=0;17{7 y=(s.19()-i.19())*9.1q/1o,z=(s.1i()-i.1i())*9.1q/1o;i=9.1s(y/2)*9.1s(y/2)+9.2b(i.19()*9.1q/1o)*9.2b(s.19()*9.1q/1o)*9.1s(z/2)*9.1s(z/2);i=2h*2*9.2g(9.2a(i),9.2a(1-i))}6(i<o){o=i;r=p}}}6(r&&r.D.26(e.1b()))r.o(e);17{p=1a v(h);p.o(e);h.m.16(p)}}}5 v(a){3.j=a;3.b=a.1d();3.f=a.v();3.p=a.p;3.d=f;3.a=[];3.D=f;3.l=1a w(3,a.w(),a.v())}l=v.4;l.o=5(a){7 b;a:6(3.a.1n)b=3.a.1n(a)!=-1;17{b=0;15(7 c;c=3.a[b];b++)6(c==a){b=d;27 a}b=g}6(b)8 g;6(3.d){6(3.p){c=3.a.14+1;b=(3.d.19()*(c-1)+a.1b().19())/c;c=(3.d.1i()*(c-1)+a.1b().1i())/c;3.d=1a 13.12.1F(b,c);A(3)}}17{3.d=a.1b();A(3)}6(3.a.14==0){a.18(3.b);a.1g(d)}17 6(3.a.14==1){3.a[0].18(f);3.a[0].1g(g)}a.r=d;3.a.16(a);6(3.b.1t()>3.j.H())15(a=0;b=3.a[a];a++){b.18(3.b);b.1g(d)}17 6(3.a.14<2)B(3.l);17{b=3.j.G()(3.a,3.j.w().14);3.l.20(3.d);a=3.l;a.A=b;a.2i=b.1e;a.2e=b.1C;6(a.c)a.c.1Y=b.1e;b=9.2j(0,a.A.1C-1);b=9.24(a.i.14-1,b);b=a.i[b];a.L=b.1B;a.g=b.1c;a.n=b.1l;a.J=b.2d;a.e=b.2x;a.K=b.2k;a.C=b.2v;3.l.1W()}8 d};l.1r=5(){15(7 a=1a 13.12.1z(3.d,3.d),b=3.q(),c=0,e;e=b[c];c++)a.1f(e.1b());8 a};l.1p=5(){3.l.1p();3.a.14=0;2y 3.a};l.Q=5(){8 3.a.14};l.q=k("a");l.1u=k("d");5 A(a){a.D=a.j.u(1a 13.12.1z(a.d,a.d))}l.1d=k("b");5 w(a,b,c){a.j.1f(w,13.12.22);3.i=b;3.2B=c||0;3.t=a;3.d=f;3.b=a.1d();3.A=3.c=f;3.s=g;3.18(3.b)}l=w.4;l.1j=5(){3.c=1Q.2A("2u");6(3.s){3.c.1h.1M=C(3,D(3,3.d));3.c.1Y=3.A.1e}3.2n().2m.2l(3.c);7 a=3;13.12.1m.2o(3.c,"2p",5(){7 b=a.t.j;13.12.1m.2q(b,"2w",a.t);b.M&&a.b.2r(a.t.1r())})};5 D(a,b){7 c=a.1X().1v(b);c.x-=1y(a.n/2,10);c.y-=1y(a.g/2,10);8 c}l.1k=5(){6(3.s){7 a=D(3,3.d);3.c.1h.1D=a.y+"E";3.c.1h.1G=a.x+"E"}};5 B(a){6(a.c)a.c.1h.1N="2C";a.s=g}l.1W=5(){6(3.c){3.c.1h.1M=C(3,D(3,3.d));3.c.1h.1N=""}3.s=d};l.1p=5(){3.18(f)};l.1E=5(){6(3.c&&3.c.1O){B(3);3.c.1O.2f(3.c);3.c=f}};l.20=j("d");5 C(a,b){7 c=[];6(1Q.3r)c.16(\'3q:3p:3s.3t.3v(3u=3o,3n="\'+a.L+\'");\');17{c.16("1S-3i:1B("+a.L+");");c.16("1S-28:"+(a.C?a.C:"0 0")+";")}6(1H a.e==="3j"){1H a.e[0]==="1V"&&a.e[0]>0&&a.e[0]<a.g?c.16("1c:"+(a.g-a.e[0])+"E; 1U-1D:"+a.e[0]+"E;"):c.16("1c:"+a.g+"E; 1T-1c:"+a.g+"E;");1H a.e[1]==="1V"&&a.e[1]>0&&a.e[1]<a.n?c.16("1l:"+(a.n-a.e[1])+"E; 1U-1G:"+a.e[1]+"E;"):c.16("1l:"+a.n+"E; 1e-1K:1L;")}17 c.16("1c:"+a.g+"E; 1T-1c:"+a.g+"E; 1l:"+a.n+"E; 1e-1K:1L;");c.16("3w:3A; 1D:"+b.y+"E; 1G:"+b.x+"E; 3L:"+(a.J?a.J:"3F")+"; 28:3z; 1w-3y:"+(a.K?a.K:11)+"E; 1w-3D:3J,3K-3f; 1w-3e:2Q");8 c.2P("")}2O.2R=m;m.4.2S=m.4.o;m.4.2T=m.4.B;m.4.2N=m.4.P;m.4.2G=m.4.G;m.4.2F=m.4.v;m.4.2E=m.4.u;m.4.1d=m.4.1d;m.4.29=m.4.q;m.4.2H=m.4.H;m.4.2I=m.4.w;m.4.2L=m.4.R;m.4.2J=m.4.S;m.4.2W=m.4.h;m.4.38=m.4.W;m.4.3a=m.4.X;m.4.3d=m.4.k;m.4.36=m.4.Y;m.4.2Z=m.4.Z;m.4.1j=m.4.1j;m.4.1k=m.4.1k;v.4.1u=v.4.1u;v.4.30=v.4.Q;v.4.29=v.4.q;w.4.1j=w.4.1j;w.4.1k=w.4.1k;w.4.1E=w.4.1E})();',62,235,'|||this|prototype|function|if|var|return|Math|||||||||||||||||||||||||||||||px||||||||||||||||||||||||maps|google|length|for|push|else|setMap|lat|new|getPosition|height|getMap|text|extend|setVisible|style|lng|onAdd|draw|width|event|indexOf|180|remove|PI|getBounds|sin|getZoom|getCenter|fromLatLngToDivPixel|font|addListener|parseInt|LatLngBounds|maxZoom|url|index|top|onRemove|LatLng|left|typeof|getNorthEast|getSouthWest|align|center|cssText|display|parentNode|mapTypes|document|getMapTypeId|background|line|padding|number|show|getProjection|innerHTML|fromDivPixelToLatLng|setCenter|averageCenter|OverlayView|zoomOnClick|min|undefined|contains|break|position|getMarkers|sqrt|cos|void|textColor|aa|removeChild|atan2|6371|ca|max|textSize|appendChild|overlayImage|getPanes|addDomListener|click|trigger|fitBounds|draggable|dragend|DIV|backgroundPosition|clusterclick|anchor|delete|splice|createElement|ba|none|apply|getExtendedBounds|getGridSize|getCalculator|getMaxZoom|getStyles|getTotalMarkers|imageExtension|getTotalClusters|zoom_changed|clearMarkers|window|join|bold|MarkerClusterer|addMarker|addMarkers|idle|imagePath|redraw|56|66|setGridSize|getSize|53|true|null|false|78|setCalculator|60|removeMarker|styles|removeMarkers|gridSize|90|resetViewport|weight|serif|in|4E4|image|object|png|markerclusterer|images|src|scale|progid|filter|all|DXImageTransform|Microsoft|sizingMethod|AlphaImageLoader|cursor|trunk|size|absolute|pointer|library|utility|family|http|black|v3|com|svn|Arial|sans|color|googlecode'.split('|'),0,{}))
