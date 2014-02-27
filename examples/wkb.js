goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('ol.RendererHint');
goog.require('ol.View2D');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.parser.WKB');
goog.require('ol.proj');
goog.require('ol.source.MapQuestOSM');
goog.require('ol.source.Vector');

// WKB data as array of bytes. Can be Base64 encoded.
var WKB =
    'AQYAAAACAAAAAQMAAAABAAAAHgAAAP7UeOmmoGVAZan1fqN1RMCyDkdX6adlQAGnd/F' +
    '+qkTAVWr2QKu+ZUDTFWwjnnZEwEZ9kjvsx2VAER5tHLGsRMAAcOzZ88dlQEXURJ+P4k' +
    'TArTWU2gu8ZUCp+Sr52B1FwFrwoq8gp2VASvCGNCp8RcAlrfiGwpZlQLxYGCKnr0XAg' +
    'V8jSZCiZUBxHk5gOu1FwDSCjevfiWVA9SudD8/uRcBO0ZFcfm5lQE7U0twKH0bA5ueG' +
    'puxlZUAujspN1HJGwFLRWPu7U2VAaLEUyVf0RsCZZU8CmzplQAHeAgmKLUfATg6fdKI' +
    'qZUB5Bg39E1JHwIUi3c8pDWVAzCiWW1pPR8B5r1qZcPhkQNsy4CwlJUfA2SPUDKnVZE' +
    'DPaoE9JhxHwIyeW+hK0GRAXhH8byXtRsD8Ny9OfOFkQIxkj1AzjkbAhNcubbgJZUAjS' +
    '+ZY3g9GwOaw+45hHmVA2/y/6sj3RcDnGJC9XjVlQCtPIOwUx0XAhiAHJcxQZUB81jVa' +
    'DoRFwNBhvrwAZGVAVHJO7KFBRcBZwtoYO3JlQC8VG/M64kTAeA360lt+ZUDTwI9q2MF' +
    'EwDkpzHscg2VAk8mpnWF6RMCr56T3jZllQL+7lSU6P0TA/tR46aagZUBlqfV+o3VEwA' +
    'EDAAAAAQAAACQAAABy++WTldNlQKQYINEEFELA7unqjsXqZUBa1Ce5w5pCwMalKm1x6' +
    '2VA+6wyU1pDQsAbZf1m4vllQE6zQLtDZkLAYXE486v+ZUC/ZOPBFsdCwBCv6xdsGGZA' +
    'PkD35czwQsDpgY/BCi5mQDasqSwK+0LAQGzp0VRAZkCcM6K0N8pCwKZetwiMUGZAvcK' +
    'C+wHZQsBRhqqYykhmQIJXy52ZSkPAcEIhAg4/ZkCSdTi6SpVDwAiwyK+fJmZAVkW4ya' +
    'iSQ8CQuwhTFB5mQLzqAfOQuUPAFxHF5A0hZkAMrOP4ofBDwGLAkqtYHGZAtCCU93EIR' +
    'MD8Gd6sQRBmQPktOllqTUTAMSWS6GUAZkCAETRmEqVEwG3GaYiq52VAn8n+eRrYRMDY' +
    'Lm04LOJlQNRDNLqDtkTAhzJUxdTUZUC7KeW1EqREwNWytb5I52VAq5LIPsg6RMB/iA0' +
    'WztxlQKmgoupX9EPAvmvQl166ZUAqOLwgIsFDwPQz9bpFu2VAnMO12sOSQ8Cd9SnHZN' +
    'JlQJ/J/nkaZkPApG38icrXZUCZSGk2jwNDwDF4mPZN1mVAUkfH1ciwQsCFsBpLWMllQ' +
    'D85ChAFW0LAYmngRzXKZUDWjuIcdURCwBdhinLpumVA393KEp0PQsCILNLEu6FlQDEI' +
    'rBxankHA9mIoJ1qUZUDXijbHuUNBwFr2JLA5oGVAZcbbSq85QcA1C7Q7pLFlQEVlw5r' +
    'KgEHAJLTlXIrKZUACnN7F+6FBwHL75ZOV02VApBgg0QQUQsA=';
// Convert Base64 encoded string to array of bytes:
// (Not necessary as parser automatically decodes if Base64 detected).
function decodeBase64(sB64) {
  var data = [];
  var decoded = window.atob(sB64);
  for (var i = 0; i < decoded.length; ++i) {
    data.push(decoded.charCodeAt(i));
  }
  return new Uint8Array(data);
}
WKB = decodeBase64(WKB);


var raster = new ol.layer.Tile({
  source: new ol.source.MapQuestOSM()
});

var parser = new ol.parser.WKB();
var transform = ol.proj.getTransform('EPSG:4326', 'EPSG:3857');
var geom = parser.read(WKB);
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
    center: [19532104.019976033, -5007504.823700756],
    zoom: 5
  })
});
