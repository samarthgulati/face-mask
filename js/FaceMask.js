class FaceMask {
	_addCamera() {
		this._camera = new THREE.OrthographicCamera(
			this._halfW,
			-this._halfW,
			-this._halfH,
			this._halfH,
			1, 1000
		);
		this._camera.position.x = this._halfW;
		this._camera.position.y = this._halfH;
		this._camera.position.z = -600;
		this._camera.lookAt(
			this._halfW,
			this._halfH,
			0
		);
	}

	_addLights() {
		const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
		this._scene.add(light);
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(this._halfW, this._halfW * 0.5, -1000).normalize();
		this._scene.add(directionalLight);
	}

	_addGeometry() {
		this._geometry = new THREE.BufferGeometry();

		this._geometry.setIndex(TRIANGULATION);
		this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBufferData, 3));
		this._geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
		this._geometry.computeVertexNormals();
	}

	_addMaterial() {
		const textureLoader = new THREE.TextureLoader();
		const texture = textureLoader.load(this._textureFilePath);
		// set the "color space" of the texture
		texture.encoding = THREE.sRGBEncoding;

		// reduce blurring at glancing angles
		texture.anisotropy = 16;
		const alpha = 0.4;
		const beta = 0.5;
		this._material = new THREE.MeshPhongMaterial({
			map: texture,
			color: new THREE.Color(0xffffff),
			specular: new THREE.Color(beta * 0.2, beta * 0.2, beta * 0.2),
			reflectivity: beta,
			shininess: Math.pow(2, alpha * 10),
		});
	}

	_setupScene() {
		this._scene = new THREE.Scene();
		this._addCamera();
		this._addLights();
		this._addGeometry();
		this._addMaterial();
		this._mesh = new THREE.Mesh(this._geometry, this._material);
		this._scene.add(this._mesh);
	}

	render(positionBufferData) {

		this._geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionBufferData, 3));
		this._geometry.attributes.position.needsUpdate = true;

		this._renderer.render(this._scene, this._camera);

	}

	constructor({
    id,
		textureFilePath,
		w,
		h
	}) {
		this._renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			canvas: document.querySelector(`#${id}`)
		});
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setSize(w, h);
		this._halfW = w * 0.5;
		this._halfH = h * 0.5;
		this._textureFilePath = textureFilePath;
		this._setupScene();
	}
}
