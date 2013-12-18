goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.WKB');
goog.require('ol.proj');
goog.require('ol.source.OSM');
goog.require('ol.source.Vector');

var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var parser = new ol.parser.WKB();
var transform = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
var geom = parser.read(
    'AAAAAAMAAAABAAAABUAlYSAAAAAAwDkXwAAAAABAQUxIAAAAAMA0K8AAAAAAQENoSAAAAADAQdHgAAAAAEArASAAAAAAwEOT4AAAAABAJWEgAAAAAMA5F8AAAAAA');
geom.transform(transform);
var feature = new ol.Feature();
feature.setGeometry(geom);

var vector = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [feature]
  })
});

var map = new ol.Map({
  layers: [raster, vector],
  renderer: ol.RendererHint.CANVAS,
  target: 'map',
  view: new ol.View2D({
    center: [2952104.019976033, -3277504.823700756],
    zoom: 4
  })
});
