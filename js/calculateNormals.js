var calculateNormals;
(function() {
  /**
   * @author alteredq / http://alteredqualia.com/
   * @author mrdoob / http://mrdoob.com/
   * @author WestLangley / http://github.com/WestLangley
   * @author thezwap
   */

  var _lut = [];

  for ( var i = 0; i < 256; i ++ ) {

    _lut[ i ] = ( i < 16 ? '0' : '' ) + ( i ).toString( 16 );

  }

  var MathUtils = {

    DEG2RAD: Math.PI / 180,
    RAD2DEG: 180 / Math.PI,

    generateUUID: function () {

      // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

      var d0 = Math.random() * 0xffffffff | 0;
      var d1 = Math.random() * 0xffffffff | 0;
      var d2 = Math.random() * 0xffffffff | 0;
      var d3 = Math.random() * 0xffffffff | 0;
      var uuid = _lut[ d0 & 0xff ] + _lut[ d0 >> 8 & 0xff ] + _lut[ d0 >> 16 & 0xff ] + _lut[ d0 >> 24 & 0xff ] + '-' +
        _lut[ d1 & 0xff ] + _lut[ d1 >> 8 & 0xff ] + '-' + _lut[ d1 >> 16 & 0x0f | 0x40 ] + _lut[ d1 >> 24 & 0xff ] + '-' +
        _lut[ d2 & 0x3f | 0x80 ] + _lut[ d2 >> 8 & 0xff ] + '-' + _lut[ d2 >> 16 & 0xff ] + _lut[ d2 >> 24 & 0xff ] +
        _lut[ d3 & 0xff ] + _lut[ d3 >> 8 & 0xff ] + _lut[ d3 >> 16 & 0xff ] + _lut[ d3 >> 24 & 0xff ];

      // .toUpperCase() here flattens concatenated strings to save heap memory space.
      return uuid.toUpperCase();

    },

    clamp: function ( value, min, max ) {

      return Math.max( min, Math.min( max, value ) );

    },

    // compute euclidian modulo of m % n
    // https://en.wikipedia.org/wiki/Modulo_operation

    euclideanModulo: function ( n, m ) {

      return ( ( n % m ) + m ) % m;

    },

    // Linear mapping from range <a1, a2> to range <b1, b2>

    mapLinear: function ( x, a1, a2, b1, b2 ) {

      return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

    },

    // https://en.wikipedia.org/wiki/Linear_interpolation

    lerp: function ( x, y, t ) {

      return ( 1 - t ) * x + t * y;

    },

    // http://en.wikipedia.org/wiki/Smoothstep

    smoothstep: function ( x, min, max ) {

      if ( x <= min ) return 0;
      if ( x >= max ) return 1;

      x = ( x - min ) / ( max - min );

      return x * x * ( 3 - 2 * x );

    },

    smootherstep: function ( x, min, max ) {

      if ( x <= min ) return 0;
      if ( x >= max ) return 1;

      x = ( x - min ) / ( max - min );

      return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

    },

    // Random integer from <low, high> interval

    randInt: function ( low, high ) {

      return low + Math.floor( Math.random() * ( high - low + 1 ) );

    },

    // Random float from <low, high> interval

    randFloat: function ( low, high ) {

      return low + Math.random() * ( high - low );

    },

    // Random float from <-range/2, range/2> interval

    randFloatSpread: function ( range ) {

      return range * ( 0.5 - Math.random() );

    },

    degToRad: function ( degrees ) {

      return degrees * MathUtils.DEG2RAD;

    },

    radToDeg: function ( radians ) {

      return radians * MathUtils.RAD2DEG;

    },

    isPowerOfTwo: function ( value ) {

      return ( value & ( value - 1 ) ) === 0 && value !== 0;

    },

    ceilPowerOfTwo: function ( value ) {

      return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );

    },

    floorPowerOfTwo: function ( value ) {

      return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );

    },

    setQuaternionFromProperEuler: function ( q, a, b, c, order ) {

      // Intrinsic Proper Euler Angles - see https://en.wikipedia.org/wiki/Euler_angles

      // rotations are applied to the axes in the order specified by 'order'
      // rotation by angle 'a' is applied first, then by angle 'b', then by angle 'c'
      // angles are in radians

      var cos = Math.cos;
      var sin = Math.sin;

      var c2 = cos( b / 2 );
      var s2 = sin( b / 2 );

      var c13 = cos( ( a + c ) / 2 );
      var s13 = sin( ( a + c ) / 2 );

      var c1_3 = cos( ( a - c ) / 2 );
      var s1_3 = sin( ( a - c ) / 2 );

      var c3_1 = cos( ( c - a ) / 2 );
      var s3_1 = sin( ( c - a ) / 2 );

      switch ( order ) {

        case 'XYX':
          q.set( c2 * s13, s2 * c1_3, s2 * s1_3, c2 * c13 );
          break;

        case 'YZY':
          q.set( s2 * s1_3, c2 * s13, s2 * c1_3, c2 * c13 );
          break;

        case 'ZXZ':
          q.set( s2 * c1_3, s2 * s1_3, c2 * s13, c2 * c13 );
          break;

        case 'XZX':
          q.set( c2 * s13, s2 * s3_1, s2 * c3_1, c2 * c13 );
          break;

        case 'YXY':
          q.set( s2 * c3_1, c2 * s13, s2 * s3_1, c2 * c13 );
          break;

        case 'ZYZ':
          q.set( s2 * s3_1, s2 * c3_1, c2 * s13, c2 * c13 );
          break;

        default:
          console.warn( 'THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: ' + order );

      }

    }

  };


  /**
   * @author mikael emtinger / http://gomo.se/
   * @author alteredq / http://alteredqualia.com/
   * @author WestLangley / http://github.com/WestLangley
   * @author bhouston / http://clara.io
   */

  // import { MathUtils } from './MathUtils.js';

  function Quaternion( x, y, z, w ) {

    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    this._w = ( w !== undefined ) ? w : 1;

  }

  Object.assign( Quaternion, {

    slerp: function ( qa, qb, qm, t ) {

      return qm.copy( qa ).slerp( qb, t );

    },

    slerpFlat: function ( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

      // fuzz-free, array-based Quaternion SLERP operation

      var x0 = src0[ srcOffset0 + 0 ],
        y0 = src0[ srcOffset0 + 1 ],
        z0 = src0[ srcOffset0 + 2 ],
        w0 = src0[ srcOffset0 + 3 ],

        x1 = src1[ srcOffset1 + 0 ],
        y1 = src1[ srcOffset1 + 1 ],
        z1 = src1[ srcOffset1 + 2 ],
        w1 = src1[ srcOffset1 + 3 ];

      if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

        var s = 1 - t,

          cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,

          dir = ( cos >= 0 ? 1 : - 1 ),
          sqrSin = 1 - cos * cos;

        // Skip the Slerp for tiny steps to avoid numeric problems:
        if ( sqrSin > Number.EPSILON ) {

          var sin = Math.sqrt( sqrSin ),
            len = Math.atan2( sin, cos * dir );

          s = Math.sin( s * len ) / sin;
          t = Math.sin( t * len ) / sin;

        }

        var tDir = t * dir;

        x0 = x0 * s + x1 * tDir;
        y0 = y0 * s + y1 * tDir;
        z0 = z0 * s + z1 * tDir;
        w0 = w0 * s + w1 * tDir;

        // Normalize in case we just did a lerp:
        if ( s === 1 - t ) {

          var f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

          x0 *= f;
          y0 *= f;
          z0 *= f;
          w0 *= f;

        }

      }

      dst[ dstOffset ] = x0;
      dst[ dstOffset + 1 ] = y0;
      dst[ dstOffset + 2 ] = z0;
      dst[ dstOffset + 3 ] = w0;

    },

    multiplyQuaternionsFlat: function ( dst, dstOffset, src0, srcOffset0, src1, srcOffset1 ) {

      var x0 = src0[ srcOffset0 ];
      var y0 = src0[ srcOffset0 + 1 ];
      var z0 = src0[ srcOffset0 + 2 ];
      var w0 = src0[ srcOffset0 + 3 ];

      var x1 = src1[ srcOffset1 ];
      var y1 = src1[ srcOffset1 + 1 ];
      var z1 = src1[ srcOffset1 + 2 ];
      var w1 = src1[ srcOffset1 + 3 ];

      dst[ dstOffset ] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
      dst[ dstOffset + 1 ] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
      dst[ dstOffset + 2 ] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
      dst[ dstOffset + 3 ] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

      return dst;

    }

  } );

  Object.defineProperties( Quaternion.prototype, {

    x: {

      get: function () {

        return this._x;

      },

      set: function ( value ) {

        this._x = value;
        this._onChangeCallback();

      }

    },

    y: {

      get: function () {

        return this._y;

      },

      set: function ( value ) {

        this._y = value;
        this._onChangeCallback();

      }

    },

    z: {

      get: function () {

        return this._z;

      },

      set: function ( value ) {

        this._z = value;
        this._onChangeCallback();

      }

    },

    w: {

      get: function () {

        return this._w;

      },

      set: function ( value ) {

        this._w = value;
        this._onChangeCallback();

      }

    }

  } );

  Object.assign( Quaternion.prototype, {

    isQuaternion: true,

    set: function ( x, y, z, w ) {

      this._x = x;
      this._y = y;
      this._z = z;
      this._w = w;

      this._onChangeCallback();

      return this;

    },

    clone: function () {

      return new this.constructor( this._x, this._y, this._z, this._w );

    },

    copy: function ( quaternion ) {

      this._x = quaternion.x;
      this._y = quaternion.y;
      this._z = quaternion.z;
      this._w = quaternion.w;

      this._onChangeCallback();

      return this;

    },

    setFromEuler: function ( euler, update ) {

      if ( ! ( euler && euler.isEuler ) ) {

        throw new Error( 'THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.' );

      }

      var x = euler._x, y = euler._y, z = euler._z, order = euler.order;

      // http://www.mathworks.com/matlabcentral/fileexchange/
      // 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
      //	content/SpinCalc.m

      var cos = Math.cos;
      var sin = Math.sin;

      var c1 = cos( x / 2 );
      var c2 = cos( y / 2 );
      var c3 = cos( z / 2 );

      var s1 = sin( x / 2 );
      var s2 = sin( y / 2 );
      var s3 = sin( z / 2 );

      switch ( order ) {

        case 'XYZ':
          this._x = s1 * c2 * c3 + c1 * s2 * s3;
          this._y = c1 * s2 * c3 - s1 * c2 * s3;
          this._z = c1 * c2 * s3 + s1 * s2 * c3;
          this._w = c1 * c2 * c3 - s1 * s2 * s3;
          break;

        case 'YXZ':
          this._x = s1 * c2 * c3 + c1 * s2 * s3;
          this._y = c1 * s2 * c3 - s1 * c2 * s3;
          this._z = c1 * c2 * s3 - s1 * s2 * c3;
          this._w = c1 * c2 * c3 + s1 * s2 * s3;
          break;

        case 'ZXY':
          this._x = s1 * c2 * c3 - c1 * s2 * s3;
          this._y = c1 * s2 * c3 + s1 * c2 * s3;
          this._z = c1 * c2 * s3 + s1 * s2 * c3;
          this._w = c1 * c2 * c3 - s1 * s2 * s3;
          break;

        case 'ZYX':
          this._x = s1 * c2 * c3 - c1 * s2 * s3;
          this._y = c1 * s2 * c3 + s1 * c2 * s3;
          this._z = c1 * c2 * s3 - s1 * s2 * c3;
          this._w = c1 * c2 * c3 + s1 * s2 * s3;
          break;

        case 'YZX':
          this._x = s1 * c2 * c3 + c1 * s2 * s3;
          this._y = c1 * s2 * c3 + s1 * c2 * s3;
          this._z = c1 * c2 * s3 - s1 * s2 * c3;
          this._w = c1 * c2 * c3 - s1 * s2 * s3;
          break;

        case 'XZY':
          this._x = s1 * c2 * c3 - c1 * s2 * s3;
          this._y = c1 * s2 * c3 - s1 * c2 * s3;
          this._z = c1 * c2 * s3 + s1 * s2 * c3;
          this._w = c1 * c2 * c3 + s1 * s2 * s3;
          break;

        default:
          console.warn( 'THREE.Quaternion: .setFromEuler() encountered an unknown order: ' + order );

      }

      if ( update !== false ) this._onChangeCallback();

      return this;

    },

    setFromAxisAngle: function ( axis, angle ) {

      // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

      // assumes axis is normalized

      var halfAngle = angle / 2, s = Math.sin( halfAngle );

      this._x = axis.x * s;
      this._y = axis.y * s;
      this._z = axis.z * s;
      this._w = Math.cos( halfAngle );

      this._onChangeCallback();

      return this;

    },

    setFromRotationMatrix: function ( m ) {

      // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

      // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

      var te = m.elements,

        m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
        m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
        m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

        trace = m11 + m22 + m33,
        s;

      if ( trace > 0 ) {

        s = 0.5 / Math.sqrt( trace + 1.0 );

        this._w = 0.25 / s;
        this._x = ( m32 - m23 ) * s;
        this._y = ( m13 - m31 ) * s;
        this._z = ( m21 - m12 ) * s;

      } else if ( m11 > m22 && m11 > m33 ) {

        s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

        this._w = ( m32 - m23 ) / s;
        this._x = 0.25 * s;
        this._y = ( m12 + m21 ) / s;
        this._z = ( m13 + m31 ) / s;

      } else if ( m22 > m33 ) {

        s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

        this._w = ( m13 - m31 ) / s;
        this._x = ( m12 + m21 ) / s;
        this._y = 0.25 * s;
        this._z = ( m23 + m32 ) / s;

      } else {

        s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

        this._w = ( m21 - m12 ) / s;
        this._x = ( m13 + m31 ) / s;
        this._y = ( m23 + m32 ) / s;
        this._z = 0.25 * s;

      }

      this._onChangeCallback();

      return this;

    },

    setFromUnitVectors: function ( vFrom, vTo ) {

      // assumes direction vectors vFrom and vTo are normalized

      var EPS = 0.000001;

      var r = vFrom.dot( vTo ) + 1;

      if ( r < EPS ) {

        r = 0;

        if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

          this._x = - vFrom.y;
          this._y = vFrom.x;
          this._z = 0;
          this._w = r;

        } else {

          this._x = 0;
          this._y = - vFrom.z;
          this._z = vFrom.y;
          this._w = r;

        }

      } else {

        // crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

        this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
        this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
        this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
        this._w = r;

      }

      return this.normalize();

    },

    angleTo: function ( q ) {

      return 2 * Math.acos( Math.abs( MathUtils.clamp( this.dot( q ), - 1, 1 ) ) );

    },

    rotateTowards: function ( q, step ) {

      var angle = this.angleTo( q );

      if ( angle === 0 ) return this;

      var t = Math.min( 1, step / angle );

      this.slerp( q, t );

      return this;

    },

    inverse: function () {

      // quaternion is assumed to have unit length

      return this.conjugate();

    },

    conjugate: function () {

      this._x *= - 1;
      this._y *= - 1;
      this._z *= - 1;

      this._onChangeCallback();

      return this;

    },

    dot: function ( v ) {

      return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

    },

    lengthSq: function () {

      return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

    },

    length: function () {

      return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

    },

    normalize: function () {

      var l = this.length();

      if ( l === 0 ) {

        this._x = 0;
        this._y = 0;
        this._z = 0;
        this._w = 1;

      } else {

        l = 1 / l;

        this._x = this._x * l;
        this._y = this._y * l;
        this._z = this._z * l;
        this._w = this._w * l;

      }

      this._onChangeCallback();

      return this;

    },

    multiply: function ( q, p ) {

      if ( p !== undefined ) {

        console.warn( 'THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.' );
        return this.multiplyQuaternions( q, p );

      }

      return this.multiplyQuaternions( this, q );

    },

    premultiply: function ( q ) {

      return this.multiplyQuaternions( q, this );

    },

    multiplyQuaternions: function ( a, b ) {

      // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

      var qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
      var qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

      this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
      this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
      this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
      this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

      this._onChangeCallback();

      return this;

    },

    slerp: function ( qb, t ) {

      if ( t === 0 ) return this;
      if ( t === 1 ) return this.copy( qb );

      var x = this._x, y = this._y, z = this._z, w = this._w;

      // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

      var cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

      if ( cosHalfTheta < 0 ) {

        this._w = - qb._w;
        this._x = - qb._x;
        this._y = - qb._y;
        this._z = - qb._z;

        cosHalfTheta = - cosHalfTheta;

      } else {

        this.copy( qb );

      }

      if ( cosHalfTheta >= 1.0 ) {

        this._w = w;
        this._x = x;
        this._y = y;
        this._z = z;

        return this;

      }

      var sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

      if ( sqrSinHalfTheta <= Number.EPSILON ) {

        var s = 1 - t;
        this._w = s * w + t * this._w;
        this._x = s * x + t * this._x;
        this._y = s * y + t * this._y;
        this._z = s * z + t * this._z;

        this.normalize();
        this._onChangeCallback();

        return this;

      }

      var sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
      var halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
      var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
        ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

      this._w = ( w * ratioA + this._w * ratioB );
      this._x = ( x * ratioA + this._x * ratioB );
      this._y = ( y * ratioA + this._y * ratioB );
      this._z = ( z * ratioA + this._z * ratioB );

      this._onChangeCallback();

      return this;

    },

    equals: function ( quaternion ) {

      return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

    },

    fromArray: function ( array, offset ) {

      if ( offset === undefined ) offset = 0;

      this._x = array[ offset ];
      this._y = array[ offset + 1 ];
      this._z = array[ offset + 2 ];
      this._w = array[ offset + 3 ];

      this._onChangeCallback();

      return this;

    },

    toArray: function ( array, offset ) {

      if ( array === undefined ) array = [];
      if ( offset === undefined ) offset = 0;

      array[ offset ] = this._x;
      array[ offset + 1 ] = this._y;
      array[ offset + 2 ] = this._z;
      array[ offset + 3 ] = this._w;

      return array;

    },

    fromBufferAttribute: function ( attribute, index ) {

      this._x = attribute.getX( index );
      this._y = attribute.getY( index );
      this._z = attribute.getZ( index );
      this._w = attribute.getW( index );

      return this;

    },

    _onChange: function ( callback ) {

      this._onChangeCallback = callback;

      return this;

    },

    _onChangeCallback: function () {}

  } );


  /**
   * @author mrdoob / http://mrdoob.com/
   * @author kile / http://kile.stravaganza.org/
   * @author philogb / http://blog.thejit.org/
   * @author mikael emtinger / http://gomo.se/
   * @author egraether / http://egraether.com/
   * @author WestLangley / http://github.com/WestLangley
   */

  var _vector = new Vector3();
  var _quaternion = new Quaternion();

  function Vector3( x, y, z ) {

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;

  }

  Object.assign( Vector3.prototype, {

    isVector3: true,

    set: function ( x, y, z ) {

      this.x = x;
      this.y = y;
      this.z = z;

      return this;

    },

    setScalar: function ( scalar ) {

      this.x = scalar;
      this.y = scalar;
      this.z = scalar;

      return this;

    },

    setX: function ( x ) {

      this.x = x;

      return this;

    },

    setY: function ( y ) {

      this.y = y;

      return this;

    },

    setZ: function ( z ) {

      this.z = z;

      return this;

    },

    setComponent: function ( index, value ) {

      switch ( index ) {

        case 0: this.x = value; break;
        case 1: this.y = value; break;
        case 2: this.z = value; break;
        default: throw new Error( 'index is out of range: ' + index );

      }

      return this;

    },

    getComponent: function ( index ) {

      switch ( index ) {

        case 0: return this.x;
        case 1: return this.y;
        case 2: return this.z;
        default: throw new Error( 'index is out of range: ' + index );

      }

    },

    clone: function () {

      return new this.constructor( this.x, this.y, this.z );

    },

    copy: function ( v ) {

      this.x = v.x;
      this.y = v.y;
      this.z = v.z;

      return this;

    },

    add: function ( v, w ) {

      if ( w !== undefined ) {

        console.warn( 'THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
        return this.addVectors( v, w );

      }

      this.x += v.x;
      this.y += v.y;
      this.z += v.z;

      return this;

    },

    addScalar: function ( s ) {

      this.x += s;
      this.y += s;
      this.z += s;

      return this;

    },

    addVectors: function ( a, b ) {

      this.x = a.x + b.x;
      this.y = a.y + b.y;
      this.z = a.z + b.z;

      return this;

    },

    addScaledVector: function ( v, s ) {

      this.x += v.x * s;
      this.y += v.y * s;
      this.z += v.z * s;

      return this;

    },

    sub: function ( v, w ) {

      if ( w !== undefined ) {

        console.warn( 'THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
        return this.subVectors( v, w );

      }

      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;

      return this;

    },

    subScalar: function ( s ) {

      this.x -= s;
      this.y -= s;
      this.z -= s;

      return this;

    },

    subVectors: function ( a, b ) {

      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;

      return this;

    },

    multiply: function ( v, w ) {

      if ( w !== undefined ) {

        console.warn( 'THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.' );
        return this.multiplyVectors( v, w );

      }

      this.x *= v.x;
      this.y *= v.y;
      this.z *= v.z;

      return this;

    },

    multiplyScalar: function ( scalar ) {

      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;

      return this;

    },

    multiplyVectors: function ( a, b ) {

      this.x = a.x * b.x;
      this.y = a.y * b.y;
      this.z = a.z * b.z;

      return this;

    },

    applyEuler: function ( euler ) {

      if ( ! ( euler && euler.isEuler ) ) {

        console.error( 'THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order.' );

      }

      return this.applyQuaternion( _quaternion.setFromEuler( euler ) );

    },

    applyAxisAngle: function ( axis, angle ) {

      return this.applyQuaternion( _quaternion.setFromAxisAngle( axis, angle ) );

    },

    applyMatrix3: function ( m ) {

      var x = this.x, y = this.y, z = this.z;
      var e = m.elements;

      this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
      this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
      this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

      return this;

    },

    applyNormalMatrix: function ( m ) {

      return this.applyMatrix3( m ).normalize();

    },

    applyMatrix4: function ( m ) {

      var x = this.x, y = this.y, z = this.z;
      var e = m.elements;

      var w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

      this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
      this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
      this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

      return this;

    },

    applyQuaternion: function ( q ) {

      var x = this.x, y = this.y, z = this.z;
      var qx = q.x, qy = q.y, qz = q.z, qw = q.w;

      // calculate quat * vector

      var ix = qw * x + qy * z - qz * y;
      var iy = qw * y + qz * x - qx * z;
      var iz = qw * z + qx * y - qy * x;
      var iw = - qx * x - qy * y - qz * z;

      // calculate result * inverse quat

      this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
      this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
      this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

      return this;

    },

    project: function ( camera ) {

      return this.applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

    },

    unproject: function ( camera ) {

      return this.applyMatrix4( camera.projectionMatrixInverse ).applyMatrix4( camera.matrixWorld );

    },

    transformDirection: function ( m ) {

      // input: THREE.Matrix4 affine matrix
      // vector interpreted as a direction

      var x = this.x, y = this.y, z = this.z;
      var e = m.elements;

      this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
      this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
      this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

      return this.normalize();

    },

    divide: function ( v ) {

      this.x /= v.x;
      this.y /= v.y;
      this.z /= v.z;

      return this;

    },

    divideScalar: function ( scalar ) {

      return this.multiplyScalar( 1 / scalar );

    },

    min: function ( v ) {

      this.x = Math.min( this.x, v.x );
      this.y = Math.min( this.y, v.y );
      this.z = Math.min( this.z, v.z );

      return this;

    },

    max: function ( v ) {

      this.x = Math.max( this.x, v.x );
      this.y = Math.max( this.y, v.y );
      this.z = Math.max( this.z, v.z );

      return this;

    },

    clamp: function ( min, max ) {

      // assumes min < max, componentwise

      this.x = Math.max( min.x, Math.min( max.x, this.x ) );
      this.y = Math.max( min.y, Math.min( max.y, this.y ) );
      this.z = Math.max( min.z, Math.min( max.z, this.z ) );

      return this;

    },

    clampScalar: function ( minVal, maxVal ) {

      this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
      this.y = Math.max( minVal, Math.min( maxVal, this.y ) );
      this.z = Math.max( minVal, Math.min( maxVal, this.z ) );

      return this;

    },

    clampLength: function ( min, max ) {

      var length = this.length();

      return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

    },

    floor: function () {

      this.x = Math.floor( this.x );
      this.y = Math.floor( this.y );
      this.z = Math.floor( this.z );

      return this;

    },

    ceil: function () {

      this.x = Math.ceil( this.x );
      this.y = Math.ceil( this.y );
      this.z = Math.ceil( this.z );

      return this;

    },

    round: function () {

      this.x = Math.round( this.x );
      this.y = Math.round( this.y );
      this.z = Math.round( this.z );

      return this;

    },

    roundToZero: function () {

      this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
      this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
      this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );

      return this;

    },

    negate: function () {

      this.x = - this.x;
      this.y = - this.y;
      this.z = - this.z;

      return this;

    },

    dot: function ( v ) {

      return this.x * v.x + this.y * v.y + this.z * v.z;

    },

    // TODO lengthSquared?

    lengthSq: function () {

      return this.x * this.x + this.y * this.y + this.z * this.z;

    },

    length: function () {

      return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

    },

    manhattanLength: function () {

      return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

    },

    normalize: function () {

      return this.divideScalar( this.length() || 1 );

    },

    setLength: function ( length ) {

      return this.normalize().multiplyScalar( length );

    },

    lerp: function ( v, alpha ) {

      this.x += ( v.x - this.x ) * alpha;
      this.y += ( v.y - this.y ) * alpha;
      this.z += ( v.z - this.z ) * alpha;

      return this;

    },

    lerpVectors: function ( v1, v2, alpha ) {

      return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 );

    },

    cross: function ( v, w ) {

      if ( w !== undefined ) {

        console.warn( 'THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.' );
        return this.crossVectors( v, w );

      }

      return this.crossVectors( this, v );

    },

    crossVectors: function ( a, b ) {

      var ax = a.x, ay = a.y, az = a.z;
      var bx = b.x, by = b.y, bz = b.z;

      this.x = ay * bz - az * by;
      this.y = az * bx - ax * bz;
      this.z = ax * by - ay * bx;

      return this;

    },

    projectOnVector: function ( v ) {

      var denominator = v.lengthSq();

      if ( denominator === 0 ) return this.set( 0, 0, 0 );

      var scalar = v.dot( this ) / denominator;

      return this.copy( v ).multiplyScalar( scalar );

    },

    projectOnPlane: function ( planeNormal ) {

      _vector.copy( this ).projectOnVector( planeNormal );

      return this.sub( _vector );

    },

    reflect: function ( normal ) {

      // reflect incident vector off plane orthogonal to normal
      // normal is assumed to have unit length

      return this.sub( _vector.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

    },

    angleTo: function ( v ) {

      var denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

      if ( denominator === 0 ) return Math.PI / 2;

      var theta = this.dot( v ) / denominator;

      // clamp, to handle numerical problems

      return Math.acos( MathUtils.clamp( theta, - 1, 1 ) );

    },

    distanceTo: function ( v ) {

      return Math.sqrt( this.distanceToSquared( v ) );

    },

    distanceToSquared: function ( v ) {

      var dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

      return dx * dx + dy * dy + dz * dz;

    },

    manhattanDistanceTo: function ( v ) {

      return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

    },

    setFromSpherical: function ( s ) {

      return this.setFromSphericalCoords( s.radius, s.phi, s.theta );

    },

    setFromSphericalCoords: function ( radius, phi, theta ) {

      var sinPhiRadius = Math.sin( phi ) * radius;

      this.x = sinPhiRadius * Math.sin( theta );
      this.y = Math.cos( phi ) * radius;
      this.z = sinPhiRadius * Math.cos( theta );

      return this;

    },

    setFromCylindrical: function ( c ) {

      return this.setFromCylindricalCoords( c.radius, c.theta, c.y );

    },

    setFromCylindricalCoords: function ( radius, theta, y ) {

      this.x = radius * Math.sin( theta );
      this.y = y;
      this.z = radius * Math.cos( theta );

      return this;

    },

    setFromMatrixPosition: function ( m ) {

      var e = m.elements;

      this.x = e[ 12 ];
      this.y = e[ 13 ];
      this.z = e[ 14 ];

      return this;

    },

    setFromMatrixScale: function ( m ) {

      var sx = this.setFromMatrixColumn( m, 0 ).length();
      var sy = this.setFromMatrixColumn( m, 1 ).length();
      var sz = this.setFromMatrixColumn( m, 2 ).length();

      this.x = sx;
      this.y = sy;
      this.z = sz;

      return this;

    },

    setFromMatrixColumn: function ( m, index ) {

      return this.fromArray( m.elements, index * 4 );

    },

    setFromMatrix3Column: function ( m, index ) {

      return this.fromArray( m.elements, index * 3 );

    },

    equals: function ( v ) {

      return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

    },

    fromArray: function ( array, offset ) {

      if ( offset === undefined ) offset = 0;

      this.x = array[ offset ];
      this.y = array[ offset + 1 ];
      this.z = array[ offset + 2 ];

      return this;

    },

    toArray: function ( array, offset ) {

      if ( array === undefined ) array = [];
      if ( offset === undefined ) offset = 0;

      array[ offset ] = this.x;
      array[ offset + 1 ] = this.y;
      array[ offset + 2 ] = this.z;

      return array;

    },

    fromBufferAttribute: function ( attribute, index, offset ) {

      if ( offset !== undefined ) {

        console.warn( 'THREE.Vector3: offset has been removed from .fromBufferAttribute().' );

      }

      this.x = attribute.getX( index );
      this.y = attribute.getY( index );
      this.z = attribute.getZ( index );

      return this;

    },

    random: function () {

      this.x = Math.random();
      this.y = Math.random();
      this.z = Math.random();

      return this;

    }

  } );
  
  calculateNormals = function(index, positions) {
    var normals = new Array(positions.length).fill(0);
  
    var vA, vB, vC;
    var pA = new Vector3(),
      pB = new Vector3(),
      pC = new Vector3();
    var cb = new Vector3(),
      ab = new Vector3();
  
  
    var indices = index;
  
    for (var i = 0, il = index.length; i < il; i += 3) {
  
      vA = indices[i + 0] * 3;
      vB = indices[i + 1] * 3;
      vC = indices[i + 2] * 3;
      
      pA.fromArray(positions, vA);
      pB.fromArray(positions, vB);
      pC.fromArray(positions, vC);
      
      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab);
      
      normals[vA] += cb.x;
      normals[vA + 1] += cb.y;
      normals[vA + 2] += cb.z;
  
      normals[vB] += cb.x;
      normals[vB + 1] += cb.y;
      normals[vB + 2] += cb.z;
  
      normals[vC] += cb.x;
      normals[vC + 1] += cb.y;
      normals[vC + 2] += cb.z;
  
    }
  
    var _vector = new Vector3();
    var itemSize = 3;
    for ( var i = 0, il = normals.length / itemSize; i < il; i ++ ) {
  
      _vector.x = normals[i * itemSize];
      _vector.y = normals[(i * itemSize) + 1];
      _vector.z = normals[(i * itemSize) + 2];
  
      _vector.normalize();
      normals[i * itemSize] = _vector.x;
      normals[(i * itemSize) + 1] = _vector.y;
      normals[(i * itemSize) + 2] = _vector.z;
  
    }
    return normals;
  }
})();
