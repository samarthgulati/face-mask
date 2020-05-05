class FaceMask {
  static get VERTEX_SHADER_SOURCE() {
    return /* GLSL */`
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  gl_Position = v_position;
}
`
  }
  static get FRAGMENT_SHADER_SOURCE() {
    return /* GLSL */`
precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_colorMult;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              abs(l),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((
  u_lightColor * (diffuseColor * litR.y * u_colorMult +
                u_specular * litR.z * u_specularFactor)).rgb,
      diffuseColor.a);
 gl_FragColor = outColor;
  // gl_FragColor = vec4(litR.yyy, 1);
}
`
  }

  _setupProgram() {
    this._gl.enable(this._gl.DEPTH_TEST);
    var half_w = this._canvas.width * 0.5;
    var half_h = this._canvas.height * 0.5;
    var zPos = -450;
    // an indexed quad
    this._arrays = {
      position: { numComponents: 3, data: this._positionBufferData },
      texcoord: { numComponents: 2, data: textureMap },
      normal:   { numComponents: 3, data: this._normalBufferData },
      indices:  { numComponents: 3, data: TRIANGULATION },
    };

    this._bufferInfo = webglUtils.createBufferInfoFromArrays(this._gl, this._arrays);

    // setup GLSL program
    this._programInfo = webglUtils.createProgramInfo(this._gl, [FaceMask.VERTEX_SHADER_SOURCE, FaceMask.FRAGMENT_SHADER_SOURCE]);
    this._uniformsThatAreTheSameForAllObjects = {
      u_lightWorldPos:         [half_w, 0, zPos],
      u_viewInverse:           m4.identity(),
      u_lightColor:            [1, 1, 1, 1],
    };
  
    this._uniformsThatAreComputedForEachObject = {
      u_worldViewProjection:   m4.identity(),
      u_world:                 m4.identity(),
      u_worldInverseTranspose: m4.identity(),
    };

    // Create a texture.
    var texture = this._gl.createTexture();
    this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
    
    // Fill the texture with a 1x1 blue pixel.
    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, 1, 1, 0, this._gl.RGBA, this._gl.UNSIGNED_BYTE,
                  new Uint8Array([0,   0,   255, 50]));
    
    // Asynchronously load an image
    var image = new Image();
    // image.src = "f-texture.png";
    image.src = this._textureFilePath;
    image.addEventListener('load', () => {
      // Now that the image has loaded make copy it to the texture.
      this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
      this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, image);
      this._gl.generateMipmap(this._gl.TEXTURE_2D);
    });


    this._fieldOfViewRadians = 60 * Math.PI / 180;
    this._objects = [];
    // var numObjects = 300;
    // var baseColor = rand(240);
    this._objects.push({
      // radius: rand(150),
      xRotation: 0,
      yRotation: 0,
      materialUniforms: {
        u_colorMult:             [1, 1, 1, 1],
        u_diffuse:               texture,
        u_specular:              [1, 1, 1, 1],
        u_shininess:             100,
        u_specularFactor:        0.1,
      },
    });

    // Tell WebGL how to convert from clip space to pixels
    this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    // var aspect = this._gl.canvas.clientWidth / this._gl.canvas.clientHeight;
    // var aspect = this._gl.canvas.width / this._gl.canvas.height;
    // orthographic(left, right, bottom, top, near, far, dst)
    // perspective(fieldOfViewInRadians, aspect, near, far, dst)

    // half_h * 0.5 to avoid up the nose view
    var cameraPosition = [half_w, half_h * 0.5, zPos];
    var left = -half_w;
    var right = half_w;
    var top = half_h;
    var bottom = -half_h;
    var projectionMatrix = 
      m4.orthographic(left, right, bottom, top, 0, 2000);
    //m4.perspective(this._fieldOfViewRadians, aspect, 1, 2000);
        // m4.perspective(this._fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var target = [half_w, half_h, 0];
    var up = [0, -1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up, this._uniformsThatAreTheSameForAllObjects.u_viewInverse);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    this._gl.useProgram(this._programInfo.program);

    // Setup all the needed buffers and attributes.
    webglUtils.setBuffersAndAttributes(this._gl, this._programInfo, this._bufferInfo);

    // Set the uniforms that are the same for all objects.
    webglUtils.setUniforms(this._programInfo, this._uniformsThatAreTheSameForAllObjects);
    var object = this._objects[0];
    var worldMatrix = m4.yRotation(0);
    // var worldMatrix = m4.zRotation(0);
    // Compute a position for this object based on the time.
    // var worldMatrix = m4.xRotation(object.xRotation);
    // worldMatrix = m4.yRotate(worldMatrix, object.yRotation);
    // worldMatrix = m4.translate(worldMatrix, 10, 0, 0);
    this._uniformsThatAreComputedForEachObject.u_world = worldMatrix;

    // Multiply the matrices.
    m4.multiply(viewProjectionMatrix, worldMatrix, this._uniformsThatAreComputedForEachObject.u_worldViewProjection);
    m4.transpose(m4.inverse(worldMatrix), this._uniformsThatAreComputedForEachObject.u_worldInverseTranspose);

    // Set the uniforms we just computed
    webglUtils.setUniforms(this._programInfo, this._uniformsThatAreComputedForEachObject);

    // Set the uniforms that are specific to the this object.
    webglUtils.setUniforms(this._programInfo, object.materialUniforms);
    console.log(this._bufferInfo.numElements)
    
  }

  render(positionBufferData) {
    
    this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
    // webglUtils.resizeCanvasToDisplaySize(this._gl.canvas);
    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._bufferInfo.attribs.a_position.buffer);
    this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(positionBufferData), this._gl.STATIC_DRAW);
    // Draw the geometry.
    this._gl.drawElements(this._gl.TRIANGLES, this._bufferInfo.numElements, this._gl.UNSIGNED_SHORT, 0);

  }

  constructor(id, {textureFilePath, w, h, positionBufferData, normalBufferData}) {
    this._canvas = document.querySelector(`#${id}`);
    this._canvas.width = w;
    this._canvas.height = h;
    this._textureFilePath = textureFilePath;
    this._gl = this._canvas.getContext("webgl");
    this._positionBufferData = positionBufferData; 
    this._normalBufferData = normalBufferData;
    this._setupProgram();
  }
}