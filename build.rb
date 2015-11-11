#!/usr/bin/ruby
require 'fileutils'
fu = FileUtils

#Exit if not in a production build mode
path = Dir.pwd
unless path.match("GeoDash.*-prod")
	puts "Exiting..."
	puts "Must be a production build."
	exit 0
end

geodash_commit_tag = `git --git-dir=../../../.git describe --always --tag --long`.strip
geodash_ui_commit_tag = `git describe --always --tag --long`.strip

File.open('views/bdl.geodash.version.js', 'w') do |f|
  f.write "if(typeof(bdl) == 'undefined') { bdl = {} };"
  f.write "if(typeof(bdl.geodash) == 'undefined') { bdl.geodash = {} };"
  f.write "bdl.geodash.versions = {geodash: '#{geodash_commit_tag}', geodash_ui: '#{geodash_ui_commit_tag}'}"
end

copyright = <<EOS
/*!
 *
 * Copyright (c) 2013 Project X Labs Inc.  All Rights Reserved.
 * 
 * This is a product of Project X Labs, Inc. Usage of this product is 
 * governed by the Master License Agreement entered into during purchase of this product.
 * If you do not have a Master License Agreement then you are not authorized to use this
 * product.
 * Check the provided documentation for more information.
 * 
 */
EOS

js_files = [
	"lib/jquery-1.7.1.min.js",
	"lib/underscore-min.js",
	"lib/json2.js",
	"lib/backbone-min.js",
	"lib/jquery-ui-1.8.17.min.js",
	"views/bdl.geodash.version.js",
	"views/bdl.geodash.js",
	"models/bdl.geodash.Base.js",
	"models/bdl.geodash.Layer.js",
	"models/bdl.geodash.MarkerLayer.js",
	"models/bdl.geodash.MassMarkerLayer.js",
	"models/bdl.geodash.DssLayer.js",
	"models/bdl.geodash.HurricaneLayer.js",
	"models/bdl.geodash.EarthquakeLayer.js",
	"models/bdl.geodash.AreaLayer.js",
	"models/bdl.geodash.KmlLayer.js",	
	"models/bdl.geodash.VectorLayer.js",	
	"models/bdl.geodash.HeatmapLayer.js",	
	"models/bdl.geodash.Layers.js",
	"views/bdl.geodash.Map.js",
	"views/bdl.geodash.IconFactory.js",
	"views/bdl.geodash.InfoBox.js",
	"models/bdl.geodash.PlacesLayer.js",
	"models/bdl.geodash.DirectionsLayer.js",
	"views/bdl.geodash.DirectionsView.js",
	"views/bdl.geodash.PlacesView.js",
	"views/bdl.geodash.MarkerView.js",
	"views/bdl.geodash.MassMarkerView.js",
	"views/bdl.geodash.HurricaneView.js",
	"views/bdl.geodash.EarthquakeView.js",
	"views/bdl.geodash.AreaView.js",
	"views/bdl.geodash.KmlView.js",
	"views/bdl.geodash.VectorView.js",
	"views/bdl.geodash.HeatmapView.js",
	"views/bdl.geodash.NavTab.js",
	"views/bdl.geodash.Tools.js",
	"views/bdl.geodash.GD.js",
	"views/bdl.geodash.Editor.js",
	"views/bdl.geodash.MarkerEditor.js",
	"views/bdl.geodash.MassMarkerEditor.js",
	"views/bdl.geodash.HurricaneEditor.js",
	"views/bdl.geodash.DssEditor.js",
	"views/bdl.geodash.EarthquakeEditor.js",
	"views/bdl.geodash.KmlEditor.js",
	"views/bdl.geodash.VectorEditor.js",
	"views/bdl.geodash.HeatmapEditor.js",
	"views/bdl.geodash.AreaEditor.js",
	"views/bdl.geodash.MSTR.js",
	"lib/colorpicker.js",
	"lib/heatmap.js",
	"lib/jquery.cookie.js",
	"lib/geodash_selector.js",
	"views/bdl.geodash.Selector.js",
	"views/bdl.geodash.Lasso.js",
	"views/bdl.geodash.ContextMenu.js"
]

css_files = [
 	"css/jquery-ui-1.8.17.css",	
	"css/gd-core.css",
	"css/colorpicker.css"
]

puts "generating javascript files"
File.delete("geodash.js") if File.exists? "geodash.js"

out = File.open("geodash.temp.js","w")
out.write "/*! GeoDash2 commit tag:   #{geodash_commit_tag} */"
out.write "/*! goedash-ui commit tag: #{geodash_ui_commit_tag} */"
out.write copyright
js_files.each{|f|
  File.open(f,"r") do |j|
    out.write j.read
    out.write ";"
  end
}
out.close
system("juicer merge -i -s -f geodash.temp.js -o geodash.js")
if $? != 0
	puts "!!!!!!!!!!!! Error running juicer !!!!!!!!!!!!!!!"
	exit 127
end

File.delete("geodash.temp.js")
puts "cleaning up javascript directories..."
fu.rm_rf(["views","lib","models","tests",".git"])

puts "generating css files"
File.delete("css/gd.css") if File.exists? "css/gd.css"
out = File.open("css/gd.temp.css","w")
out.write copyright
css_files.each{|f|
  File.open(f,"r") do |c|
    out.write c.read
  end
  File.delete(f)
}
out.close
# system("juicer merge -f css/gd.temp.css -o css/gd.css") # removed because ie7 doesn't like the minified CSS
system("cp css/gd.temp.css css/gd.css")
File.delete("css/gd.temp.css")
