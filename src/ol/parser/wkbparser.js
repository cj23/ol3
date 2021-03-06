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
 * @type {number} Integer
 * @private
 */
ol.parser.WKB.prototype.index_ = 0;


/**
 * Sets the byte order to read byte stream (0-Big Endian, 1-Little Endian).
 * @type {number} Integer
 * @private
 */
ol.parser.WKB.prototype.byteOrder_ = 0;


/**
 * @param {Uint8Array|Array.<number>} str WKB point.
 * @return {ol.geom.Point} Parsed point.
 * @private
 */
ol.parser.WKB.prototype.parsePoint_ = function(str) {
  var coords = [];
  coords[0] = this.readBytesToDouble_(str);
  coords[1] = this.readBytesToDouble_(str);
  return new ol.geom.Point(coords);
};


/**
 * @param {Uint8Array|Array.<number>} str WKB linestring.
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
 * @param {Uint8Array|Array.<number>} str WKB multipoint.
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
 * @param {Uint8Array|Array.<number>} str WKB multilinestring.
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
 * @param {Uint8Array|Array.<number>} str WKB polygon.
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
 * @param {Uint8Array|Array.<number>} str WKB multipolygon.
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
 * @param {Uint8Array|Array.<number>} str WKB geometrycollection.
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
 * @param {Uint8Array|Array.<number>} str WKB data.
 * @return {ol.geom.Geometry|ol.geom.GeometryCollection|undefined}
 *     The geometry created.
 * @private
 */
ol.parser.WKB.prototype.parse_ = function(str) {
  this.byteOrder_ = this.readBytesToUInt8_(str);
  var type = this.readBytesToUInt32_(str);
  var geometry;
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
 * @param {ol.geom.Point} geom Point geometry.
 * @return {Uint8Array|Array.<number>} Coordinates part of Point as WKB.
 * @private
 */
ol.parser.WKB.prototype.encodePoint_ = function(geom) {
  var coordinates = geom.getCoordinates();
  var array = [];
  array.push(this.writeBytesFromDouble_(coordinates[0]));
  array.push(this.writeBytesFromDouble_(coordinates[1]));
  return array;
};


/**
 * @param {ol.geom.MultiPoint} geom MultiPoint geometry.
 * @return {Uint8Array|Array.<number>} Coordinates part of MultiPoint as WKB.
 * @private
 */
ol.parser.WKB.prototype.encodeMultiPoint_ = function(geom) {
  var components = geom.getComponents();
  var array = [];
  array.push(this.writeBytesFromUInt32_(components.length));
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push(this.encode_.apply(this, [components[i]]));//Point
  }
  return array;
};


/**
 * @param {ol.geom.GeometryCollection} geom GeometryCollection geometry.
 * @return {Uint8Array|Array.<number>} Coordinates part of GeometryCollection as WKB.
 * @private
 */
ol.parser.WKB.prototype.encodeGeometryCollection_ = function(geom) {
  var components = geom.getComponents();
  var array = [];
  array.push(this.writeBytesFromUInt32_(components.length));
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push(this.encode_.apply(this, [components[i]]));
  }
  return array;
};


/**
 * @param {ol.geom.LineString} geom LineString geometry.
 * @return {Uint8Array|Array.<number>} Coordinates part of LineString as WKB.
 * @private
 */
ol.parser.WKB.prototype.encodeLineString_ = function(geom) {
  var coordinates = geom.getCoordinates();
  var array = [];
  array.push(this.writeBytesFromUInt32_(coordinates.length));
  for (var i = 0, ii = coordinates.length; i < ii; ++i) {
    array.push(this.writeBytesFromDouble_(coordinates[i][0]));
    array.push(this.writeBytesFromDouble_(coordinates[i][1]));
  }
  return array;
};


/**
 * @param {ol.geom.MultiLineString} geom MultiLineString geometry.
 * @return {Uint8Array|Array.<number>} Coordinates part of MultiLineString as WKB.
 * @private
 */
ol.parser.WKB.prototype.encodeMultiLineString_ = function(geom) {
  var components = geom.getComponents();
  var array = [];
  array.push(this.writeBytesFromUInt32_(components.length));
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push(this.encode_.apply(this, [components[i]]));//LineString
  }
  return array;
};


/**
 * @param {ol.geom.Polygon} geom Polygon geometry.
 * @return {Uint8Array|Array.<number>} Coordinates part of Polygon as WKB.
 * @private
 */
ol.parser.WKB.prototype.encodePolygon_ = function(geom) {
  var rings = geom.getRings();
  var array = [];
  array.push(this.writeBytesFromUInt32_(rings.length));
  for (var i = 0, ii = rings.length; i < ii; ++i) {
    array.push(this.encodeLineString_.apply(this, [rings[i]]));
  }
  return array;
};


/**
 * @param {ol.geom.MultiPolygon} geom MultiPolygon geometry.
 * @return {Uint8Array|Array.<number>} Coordinates part of MultiPolygon as WKB.
 * @private
 */
ol.parser.WKB.prototype.encodeMultiPolygon_ = function(geom) {
  var components = geom.getComponents();
  var array = [];
  array.push(this.writeBytesFromUInt32_(components.length));
  for (var i = 0, ii = components.length; i < ii; ++i) {
    array.push(this.encode_.apply(this, [components[i]]));//Polygon
  }
  return array;
};


/**
 * Encode a geometry as WKB.
 * @param {ol.geom.Geometry} geom The geometry to encode.
 * @return {Uint8Array|Array.<number>} WKB byte array for the geometry.
 * @private
 */
ol.parser.WKB.prototype.encode_ = function(geom) {
  var result = [this.byteOrder_];
  if (geom instanceof ol.geom.Point) {
    result.push([this.writeBytesFromUInt32_(1),
          this.encodePoint_(geom)]);
  } else if (geom instanceof ol.geom.MultiPoint) {
    result.push([this.writeBytesFromUInt32_(4),
          this.encodeMultiPoint_(geom)]);
  } else if (geom instanceof ol.geom.LineString) {
    result.push([this.writeBytesFromUInt32_(2),
          this.encodeLineString_(geom)]);
  } else if (geom instanceof ol.geom.MultiLineString) {
    result.push([this.writeBytesFromUInt32_(5),
          this.encodeMultiLineString_(geom)]);
  } else if (geom instanceof ol.geom.Polygon) {
    result.push([this.writeBytesFromUInt32_(3),
          this.encodePolygon_(geom)]);
  } else if (geom instanceof ol.geom.MultiPolygon) {
    result.push([this.writeBytesFromUInt32_(6),
          this.encodeMultiPolygon_(geom)]);
  } else if (geom instanceof ol.geom.GeometryCollection) {
    result.push([this.writeBytesFromUInt32_(7),
          this.encodeGeometryCollection_(geom)]);
  } else {
    throw new Error('Bad geometry type.');
  }
  return result;
};


/**
 * Parse WKB data. If it is a string (Base64) it will be decoded.
 * @param {string|Uint8Array|Array.<number>} str WKB data (String or Byte Array).
 * @return {ol.geom.Geometry|undefined} Parsed geometry.
 */
ol.parser.WKB.prototype.read = function(str) {
  if (typeof str === 'string') {
    str = this.decodeBase64_(str);
  }
  this.index_ = 0;
  //str = new Uint8Array(str);
  return this.parse_(str);
};


/**
 * Write out a geometry as a WKB byte array.
 * @param {ol.geom.Geometry} geom The geometry to encode.
 * @param {number} byteOrder The byte order to encode in.
 * @return {Uint8Array|Array.<number>} WKB for the geometry.
 */
ol.parser.WKB.prototype.write = function(geom, byteOrder) {
  this.byteOrder_ = (byteOrder == 0) ? 0 : 1;
  return this.encode_(geom);
};


/**
 * Parse a WKB document provided as a string.
 * @param {string} str WKB document Base64 Encoded.
 * @return {ol.parser.ReadFeaturesResult} Features and metadata.
 */
ol.parser.WKB.prototype.readFeaturesFromString = function(str) {
  var geom = this.read(str);
  var obj = /** @type {ol.parser.ReadFeaturesResult} */
      ({});
  if (goog.isDef(geom)) {
    var feature = new ol.Feature();
    feature.setGeometry(geom);
    obj.features = [feature];
  }
  return obj;
};


/**
 * Parse WKB data. If it is a string (Base64) it will be decoded.
 * @param {string|Uint8Array|Array.<number>} str WKB data (String or Byte Array).
 * @return {ol.geom.Geometry|undefined} Parsed geometry.
 */
ol.parser.WKB.read = function(str) {
  return ol.parser.WKB.getInstance().read(str);
};


/**
 * Write out a geometry as a WKB byte array.
 * @param {ol.geom.Geometry} geom The geometry to encode.
 * @param {number} byteOrder The byte order to encode in.
 * @return {Uint8Array|Array.<number>} WKB for the geometry.
 */
ol.parser.WKB.write = function(geom, byteOrder) {
  return ol.parser.WKB.getInstance().write(geom, byteOrder);
};



// ----------Auxiliary Functions---------- \\


/**
 * Read single byte in stream at current index.
 * @param {Uint8Array|Array.<number>} str Byte array.
 * @return {number} Unsigned 8-bit Integer.
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
 * @param {Uint8Array|Array.<number>} str Byte array.
 * @return {number} Unsigned 32-bit Integer.
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
 * @param {Uint8Array|Array.<number>} str Byte array.
 * @return {number} Double precision float.
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
  if (exponent == 0x7FF) {
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
 * @return {Uint8Array} Decoded data.
 * @private
 */
ol.parser.WKB.prototype.decodeBase64_ = function(str) {
  var data = [];
  str = window.atob(str);
  for (var i = 0; i < str.length; ++i) {
    data.push(str.charCodeAt(i));
  }
  return new Uint8Array(data);
};


/**
 * Write UInt32 to byte array.
 * @param {number} number Unsigned 32-bit Integer.
 * @return {Uint8Array|Array.<number>} Byte array.
 * @private
 */
ol.parser.WKB.prototype.writeBytesFromUInt32_ = function(number) {
  var data = [];
  data[0] = number >> 24;
  number -= data[0] * 256 * 3;
  data[1] = number >> 16;
  number -= data[1] * 256 * 2;
  data[2] = number >> 8;
  number -= data[2] * 256 * 1;
  data[3] = number >> 0;
  number -= data[3] * 256 * 0;
  var bytes = [];
  if (this.byteOrder_) {
    for (var i = 0; i < 4; ++i) {
      bytes[3 - i] = data[i];
    }
  }
  else {
    bytes = data;
  }
  return bytes;
};


/**
 * Write Double to byte array.
 * @param {number} number Double precision float.
 * @return {Uint8Array|Array.<number>} Byte Array.
 * @private
 */
ol.parser.WKB.prototype.writeBytesFromDouble_ = function(number) {
  var data = [];
  var sign = (number < 0) ? 1 : 0;
  number = Math.abs(number);
  data[0] = sign & 0xFF;
  var exponent = (Math.log(number) / Math.log(2)) >> 0;
  var mantissa = Math.floor((number / Math.pow(2, exponent)) * Math.pow(2, 52));
  exponent += 1023;
  data[7] = ((mantissa >> 0) & 0xFF);
  data[6] = ((mantissa >> 8) & 0xFF);
  data[5] = ((mantissa >> 16) & 0xFF);
  data[4] = ((mantissa >> 24) & 0xFF);
  mantissa /= Math.pow(2, 32);
  data[3] = ((mantissa >> 0) & 0xFF);
  data[2] = ((mantissa >> 8) & 0xFF);
  data[1] = (((exponent & 0xF) << 4) | (mantissa >> 16) - 16);
  data[0] = (sign << 7) + (exponent >> 4);
  /*TODO: Encode NaN, +/- INF etc. */
  var bytes = [];
  if (this.byteOrder_ !== 0) {
    for (var i = 0; i < 8; ++i) {
      bytes[7 - i] = data[i];
    }
  }
  else {
    bytes = data;
  }
  return bytes;
};
