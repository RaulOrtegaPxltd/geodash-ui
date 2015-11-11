require 'sinatra'
set :root, File.dirname(__FILE__)
set :public_folder, '.'

post '/tests/areaLayerFetch.js' do
  File.read('tests/areaLayerFetch.js')
end

post '/tests/markerLayerFetch1.js' do
  File.read('tests/markerLayerFetch1.js')
end

post '/tests/mapViewTest.html' do
  File.read('tests/mapViewTest.html')
end

get '/plugins/GeoDash2/javascript/geodash-ui/leaflet/leaflet.js' do
  File.read('leaflet/leaflet.js')
end

#get '/' do #  set :public_folder, '/' #  set :public_folder, '/' #end
