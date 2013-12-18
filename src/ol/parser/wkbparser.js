goog.provide('ol.parser.WKB');

goog.require('goog.array');
goog.require('ol.Feature');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.parser.Parser');
goog.require('ol.parser.StringFeatureParser');



/**
 * @constructor
 * @extends {ol.parser.Parser}
 * @implements {ol.parser.StringFeatureParser}
 * @todo stability experimental
 */
ol.parser.WKB = function() {
};
goog.inherits(ol.parser.WKB, ol.parser.Parser);
goog.addSingletonGetter(ol.parser.WKB);


/**
 * Points to current index in WKB byte array.
 * @type {int}
 * @private
 */
ol.parser.WKB.prototype.index_ = 0;


/**
 * Sets the byte order to read byte stream (0-Big Endian, 1-Little Endian).
 * @type {int}
 * @private
 */
ol.parser.WKB.prototype.byteOrder_ = 0;


/**
 * @param {byte[]} str WKB point.
 * @return {ol.geom.Point} Parsed point.
 * @private
 */
ol.parser.WKB.prototype.parsePoint_ = function(str) {
  var coords = [];
  coords[0] = this.readBytesToDouble_(str);
  coords[1] = this.readBytesToDouble_(str);
  return new ol.geom.Point(goog.array.map(coords, parseFloat));
};


/**
 * @param {byte[]} str WKB linestring.
 * @return {ol.geom.LineString} Parsed linestring.
 * @private
 */
ol.parser.WKB.prototype.parseLineString_ = function(str) {
  var numPoints = this.readBytesToUInt32_(str);
  var coordinates = [];
  for (var i = 0; i < numPoints; ++i) {
    coordinates.push(this.parsePoint_.apply(this, [str]).getCoordinates());
  }
  return new ol.geom.LineString(coordinates);
};


/**
 * @param {byte[]} str WKB multipoint.
 * @return {ol.geom.MultiPoint} Parsed multipoint.
 * @private
 */
ol.parser.WKB.prototype.parseMultiPoint_ = function(str) {
  var numPoints = this.readBytesToUInt32_(str);
  var parts = [];
  for (var i = 0; i < numPoints; ++i) {
    parts.push(this.parse_.apply(this, [str]));
  }
  return ol.geom.MultiPoint.fromParts(parts);
};


/**
 * @param {byte[]} str WKB multilinestring.
 * @return {ol.geom.MultiLineString} Parsed multilinestring.
 * @private
 */
ol.parser.WKB.prototype.parseMultiLineString_ = function(str) {
  var numLines = this.readBytesToUInt32_(str);
  var parts = [];
  for (var i = 0; i < numLines; ++i) {
    parts.push(this.parse_.apply(this, [str]));
  }
  return ol.geom.MultiLineString.fromParts(parts);
};


/**
 * @param {byte[]} str WKB polygon.
 * @return {ol.geom.Polygon} Parsed polygon.
 * @private
 */
ol.parser.WKB.prototype.parsePolygon_ = function(str) {
  var numRings = this.readBytesToUInt32_(str);
  var coordinates = [];
  for (var i = 0; i < numRings; ++i) {
    coordinates.push(this.parseLineString_.apply(this, [str]).getCoordinates());
  }
  return new ol.geom.Polygon(coordinates);
};


/**
 * @param {byte[]} str WKB multipolygon.
 * @return {ol.geom.MultiPolygon} Parsed multipolygon.
 * @private
 */
ol.parser.WKB.prototype.parseMultiPolygon_ = function(str) {
  var numPolygons = this.readBytesToUInt32_(str);
  var parts = [];
  for (var i = 0; i < numPolygons; ++i) {
    parts.push(this.parse_.apply(this, [str]));
  }
  return ol.geom.MultiPolygon.fromParts(parts);
};


/**
 * @param {byte[]} str WKB geometrycollection.
 * @return {ol.geom.GeometryCollection} Parsed geometrycollection.
 * @private
 */
ol.parser.WKB.prototype.parseGeometryCollection_ = function(str) {
  var numComponents = this.readBytesToUInt32_(str);
  var components = [];
  for (var i = 0; i < numComponents; ++i) {
    components.push(this.parse_.apply(this, [str]));
  }
  return new ol.geom.GeometryCollection(components);
};


/**
 * Parse WKB binary data.
 * @param {byte[]} str WKB data.
 * @return {ol.geom.Geometry|ol.geom.GeometryCollection|undefined}
 *     The geometry created.
 * @private
 */
ol.parser.WKB.prototype.parse_ = function(str) {
  this.byteOrder_ = this.readBytesToUInt8_(str);
  var type = this.readBytesToUInt32_(str);
  switch (type) {
    case 0001:
      geometry = this.parsePoint_(str);
      break;
    case 0004:
      geometry = this.parseMultiPoint_(str);
      break;
    case 0002:
      geometry = this.parseLineString_(str);
      break;
    case 0005:
      geometry = this.parseMultiLineString_(str);
      break;
    case 0003:
      geometry = this.parsePolygon_(str);
      break;
    case 0006:
      geometry = this.parseMultiPolygon_(str);
      break;
    case 0007:
      geometry = this.parseGeometryCollection_(str);
      break;
    default:
      throw new Error('Bad geometry type: ' + type + ' @' + this.index_);
  }
  return geometry;
};


/**
 * Parse a WKB string.
 * @param {byte[]} str WKB byte array.
 * @return {ol.geom.Geometry|undefined} Parsed geometry.
 */
ol.parser.WKB.prototype.readWKB = function(str) {
  this.index_ = 0;
  return this.parse_(str);
};


/**
 * Parse a Base64 WKB string.
 * @param {string} str Base64 encoded WKB string.
 * @return {ol.geom.Geometry|undefined} Parsed geometry.
 */
ol.parser.WKB.prototype.read = function(str) {
  var wkb = this.decodeBase64_(str);
  return this.readWKB(wkb);
};


/**
 * Parse a Base64 encoded WKB string.
 * @param {string} str Base64 encoded WKB string.
 * @return {ol.geom.Geometry|undefined} Parsed geometry.
 */
ol.parser.WKB.read = function(str) {
  return ol.parser.WKB.getInstance().read(str);
};



// ----------Auxiliary Functions---------- \\


/**
 * Read single byte in stream at current index.
 * @param {byte[]} str byte array.
 * @return {UInt8} Unsigned 8-bit Integer.
 * @private
 */
ol.parser.WKB.prototype.readBytesToUInt8_ = function(str) {
  if (this.index_ > str.length - 1) {
    throw new Error(this.index_ + ' Index out of range.');
  }
  var result = str[this.index_];
  this.index_ += 1;
  return result;
};


/**
 * Read 4 bytes in stream at current index.
 * @param {byte[]} str byte array.
 * @return {UInt32} Unsigned 32-bit Integer.
 * @private
 */
ol.parser.WKB.prototype.readBytesToUInt32_ = function(str) {
  if (this.index_ > str.length - 4) {
    throw new Error(this.index_ + ' Index out of range.');
  }
  var data = [];
  for (var i = 0; i < 4; ++i) {
    data[this.byteOrder_ ? 3 - i : i] = str[i + this.index_];
  }
  var result = ((data[0] << 24) + (data[1] << 16) +
              (data[2] << 8) + (data[3] << 0));
  this.index_ += 4;
  return result;
};


/**
 * Read 8 bytes in stream at current index.
 * @param {byte[]} str byte array.
 * @return {Double} Double precision float.
 * @private
 */
ol.parser.WKB.prototype.readBytesToDouble_ = function(str) {
  if (this.index_ > str.length - 8) {
    throw new Error(this.index_ + ' Index out of range.');
  }
  var data = [];
  for (var i = 0; i < 8; ++i) {
    data[this.byteOrder_ ? 7 - i : i] = str[i + this.index_];
  }
  var sign = (data[0] & 1 << 7) >> 7;
  var exponent = (((data[0] & 127) << 4) | (data[1] & (15 << 4)) >> 4);
  if (exponent == 0) return 0;
  if (exponent == 0x7ff) {
    return (sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }
  var mul = Math.pow(2, exponent - 1023 - 52);
  var mantissa = data[7] +
                     data[6] * Math.pow(2, 8 * 1) +
                     data[5] * Math.pow(2, 8 * 2) +
                     data[4] * Math.pow(2, 8 * 3) +
                     data[3] * Math.pow(2, 8 * 4) +
                     data[2] * Math.pow(2, 8 * 5) +
                     (data[1] & 15) * Math.pow(2, 8 * 6) + Math.pow(2, 52);
  var result = Math.pow(-1, sign) * mantissa * mul;
  this.index_ += 8;
  return result;
};


/**
 * Decode Base64 input to byte array.
 * @param {string} str Base64 encoded data.
 * @return {byte[]} Decoded data.
 * @private
 */
ol.parser.WKB.prototype.decodeBase64_ = function(str) {
  str = atob(str);
  var bytes = [];
  for (var i = 0; i < str.length; ++i)
  {
    bytes.push(str.charCodeAt(i));
  }
  return bytes;
};
