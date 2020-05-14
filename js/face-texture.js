var faceTexture = document.querySelector('#faceTexture');
// https://codepen.io/desandro/pen/GzvbJN
(function() {
var gl = faceTexture.getContext('webgl');
faceTexture.width = 2048;
faceTexture.height = 2048;
var width = height = 2048;
var startTime = new Date().getTime(); // Get start time for animating

// ----- Uniform ----- //

function Uniform( name, suffix ) {
  this.name = name;
  this.suffix = suffix;
  this.location = gl.getUniformLocation( program, name );
}

Uniform.prototype.set = function( ...values ) {
  var method = 'uniform' + this.suffix;
  var args = [ this.location ].concat( values );
  gl[ method ].apply( gl, args );
};

// ----- Rect ----- //

function Rect( gl ) {
  var buffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, buffer );
  gl.bufferData( gl.ARRAY_BUFFER, Rect.verts, gl.STATIC_DRAW );
}

Rect.verts = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
   1,  1,
]);

Rect.prototype.render = function( gl ) {
  gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
};

// ----- init WebGL ----- //

// create program
var program = gl.createProgram();
// add shaders
var vertexShaderSource = /*GLSL*/`attribute vec2 a_position;
void main() {
  gl_Position = vec4( a_position, 0, 1 );
}`;
var fragmentShaderSource = /*GLSL*/`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float rectangle(vec2 pt, vec2 start, vec2 dim) {
    return (pt.x >= start.x) && (pt.x <= start.x + dim.x)
            && (pt.y >= start.y) && (pt.y <= start.y + dim.y) ? 1.0 : 0.0;
}

int rectangleWithBorder(vec2 pt, vec2 start, vec2 dim, float border) {
        if((pt.x >= start.x) && (pt.x <= start.x + dim.x)
            && (pt.y >= start.y) && (pt.y <= start.y + dim.y)) {
                if((pt.x < start.x + border) || 
                  (pt.y < start.y + border) || 
                  (pt.x > start.x + dim.x - border) || 
                  (pt.y > start.y + dim.y - border)) {
                      return 1;
                  } else {
                      return 2;
                  }
        }
        return 0;
}

float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

vec4 circle(vec2 pt, vec2 center, float r, vec4 color) {
    float d = distance(center, pt);
    return smoothstep(r, r - 0.01, abs(d)) * color;
}

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                            6.0)-3.0)-1.0,
                    0.0,
                    1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(){
    vec2 st = gl_FragCoord.xy / u_resolution;
    st.x *= u_resolution.x / u_resolution.y;
    float zoom = 50.0;
    vec2 pos = fract(st * zoom);
    float x = abs(st.x * zoom - pos.x);
    float y = abs(st.y * zoom - pos.y);
    gl_FragColor = vec4(vec3(1.0) - circle(
                vec2(pos.x, pos.y), 
                vec2(0.5),
                ((tan(sin(u_time * 0.5 + sin(y) + cos(x))) + 0.01)) * 0.2,  
                vec4(hsb2rgb(vec3(fract(u_time * 0.01) + noise(vec2(y, x)) * 0.2, 0.65, 0.65)), 1.0)
            ).rgb, 1.0);
}
`;
addShader( vertexShaderSource, gl.VERTEX_SHADER );
addShader( fragmentShaderSource, gl.FRAGMENT_SHADER );
// link & use program
gl.linkProgram( program );
gl.useProgram( program );

// create fragment uniforms
var uResolution = new Uniform( 'u_resolution', '2f' );

var uTime = new Uniform( 'u_time', '1f' );
uResolution.set( width, height );
gl.viewport( 0, 0, width, height );
// create position attrib
var billboard = new Rect( gl );
var positionLocation = gl.getAttribLocation( program, 'a_position' );
gl.enableVertexAttribArray( positionLocation );
gl.vertexAttribPointer( positionLocation, 2, gl.FLOAT, false, 0, 0 );

animate();

// ----- addShader ----- //

function addShader( source, type ) {
  var shader = gl.createShader( type );
  gl.shaderSource( shader, source );
  gl.compileShader( shader );
  var isCompiled = gl.getShaderParameter( shader, gl.COMPILE_STATUS );
  if ( !isCompiled ) {
    throw new Error( 'Shader compile error: ' + gl.getShaderInfoLog( shader ) );
  }
  gl.attachShader( program, shader );
}

// ----- render ----- //

function animate() {
  // update
  var now = new Date().getTime();
  var currentTime = ( now - startTime ) / 1000;
  uTime.set( currentTime );
  // render
  billboard.render( gl );
  // animate next frame
  requestAnimationFrame( animate );
}


})();