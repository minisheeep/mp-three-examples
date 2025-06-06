import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VelocityShader } from 'three/examples/jsm/shaders/VelocityShader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_channels',
  useLoaders: { OBJLoader },
  info: [
    [
      { tag: 'a', link: 'https://threejs.org', content: 'three.js' },
      { tag: 'text', content: '-' }
    ],
    [
      { tag: 'text', content: 'ninja head from' },
      {
        tag: 'a',
        link: 'https://gpuopen.com/archive/gamescgi/amd-gpu-meshmapper/',
        content: 'AMD GPU MeshMapper'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer;

    const params = {
      material: 'normal',
      camera: 'perspective',
      side: 'double'
    };

    const sides = {
      front: THREE.FrontSide,
      back: THREE.BackSide,
      double: THREE.DoubleSide
    };

    let cameraOrtho, cameraPerspective;
    let controlsOrtho, controlsPerspective;

    let mesh,
      materialStandard,
      materialDepthBasic,
      materialDepthRGBA,
      materialDepthRGB,
      materialDepthRG,
      materialNormal,
      materialVelocity;

    const SCALE = 2.436143; // from original model
    const BIAS = -0.428408; // from original model

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      //

      scene = new THREE.Scene();

      const aspect = window.innerWidth / window.innerHeight;
      cameraPerspective = new THREE.PerspectiveCamera(45, aspect, 500, 3000);
      cameraPerspective.position.z = 1500;
      scene.add(cameraPerspective);

      const height = 500;
      cameraOrtho = new THREE.OrthographicCamera(
        -height * aspect,
        height * aspect,
        height,
        -height,
        1000,
        2500
      );
      cameraOrtho.position.z = 1500;
      scene.add(cameraOrtho);

      camera = cameraPerspective;

      controlsPerspective = new OrbitControls(cameraPerspective, renderer.domElement);
      controlsPerspective.minDistance = 1000;
      controlsPerspective.maxDistance = 2400;
      controlsPerspective.enableDamping = true;

      controlsOrtho = new OrbitControls(cameraOrtho, renderer.domElement);
      controlsOrtho.minZoom = 0.5;
      controlsOrtho.maxZoom = 1.5;
      controlsOrtho.enableDamping = true;

      // lights

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xff0000, 1.5, 0, 0);
      pointLight.position.z = 2500;
      scene.add(pointLight);

      const pointLight2 = new THREE.PointLight(0xff6666, 3, 0, 0);
      camera.add(pointLight2);

      const pointLight3 = new THREE.PointLight(0x0000ff, 1.5, 0, 0);
      pointLight3.position.x = -1000;
      pointLight3.position.z = 1000;
      scene.add(pointLight3);

      // textures

      const textureLoader = new THREE.TextureLoader();
      const normalMap = textureLoader.load('models/obj/ninja/normal.png');
      const aoMap = textureLoader.load('models/obj/ninja/ao.jpg');
      const displacementMap = textureLoader.load('models/obj/ninja/displacement.jpg');

      // material

      materialStandard = new THREE.MeshStandardMaterial({
        color: 0xffffff,

        metalness: 0.5,
        roughness: 0.6,

        displacementMap: displacementMap,
        displacementScale: SCALE,
        displacementBias: BIAS,

        aoMap: aoMap,

        normalMap: normalMap,
        normalScale: new THREE.Vector2(1, -1),

        //flatShading: true,

        side: THREE.DoubleSide
      });

      materialDepthBasic = new THREE.MeshDepthMaterial({
        depthPacking: THREE.BasicDepthPacking,

        displacementMap: displacementMap,
        displacementScale: SCALE,
        displacementBias: BIAS,

        side: THREE.DoubleSide
      });

      materialDepthRGBA = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,

        displacementMap: displacementMap,
        displacementScale: SCALE,
        displacementBias: BIAS,

        side: THREE.DoubleSide
      });

      materialDepthRGB = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBDepthPacking,

        displacementMap: displacementMap,
        displacementScale: SCALE,
        displacementBias: BIAS,

        side: THREE.DoubleSide
      });

      materialDepthRG = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGDepthPacking,

        displacementMap: displacementMap,
        displacementScale: SCALE,
        displacementBias: BIAS,

        side: THREE.DoubleSide
      });

      materialNormal = new THREE.MeshNormalMaterial({
        displacementMap: displacementMap,
        displacementScale: SCALE,
        displacementBias: BIAS,

        normalMap: normalMap,
        normalScale: new THREE.Vector2(1, -1),

        //flatShading: true,

        side: THREE.DoubleSide
      });

      materialVelocity = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.clone(VelocityShader.uniforms),
        vertexShader: VelocityShader.vertexShader,
        fragmentShader: VelocityShader.fragmentShader,
        side: THREE.DoubleSide
      });
      materialVelocity.displacementMap = displacementMap; // required for defines
      materialVelocity.uniforms.displacementMap.value = displacementMap;
      materialVelocity.uniforms.displacementScale.value = SCALE;
      materialVelocity.uniforms.displacementBias.value = BIAS;

      //

      const loader = new OBJLoader();
      loader.load('models/obj/ninja/ninjaHead_Low.obj', function (group) {
        const geometry = group.children[0].geometry;
        geometry.center();

        mesh = new THREE.Mesh(geometry, materialNormal);
        mesh.scale.multiplyScalar(25);
        mesh.userData.matrixWorldPrevious = new THREE.Matrix4(); // for velocity
        scene.add(mesh);
      });

      //

      stats = new Stats(renderer);

      //

      const gui = new GUI();
      gui.add(params, 'material', [
        'standard',
        'normal',
        'velocity',
        'depthBasic',
        'depthRGBA',
        'depthRGB',
        'depthRG'
      ]);
      gui.add(params, 'camera', ['perspective', 'ortho']);
      gui.add(params, 'side', ['front', 'back', 'double']);

      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controlsOrtho, controlsPerspective);
    }

    function onWindowResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = window.innerWidth / window.innerHeight;

      camera.aspect = aspect;

      camera.left = -height * aspect;
      camera.right = height * aspect;
      camera.top = height;
      camera.bottom = -height;

      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    //

    function animate() {
      stats.begin();
      render();
      stats.end();
      stats.update();
    }

    function render() {
      if (mesh) {
        let material = mesh.material;

        switch (params.material) {
          case 'standard':
            material = materialStandard;
            break;
          case 'depthBasic':
            material = materialDepthBasic;
            break;
          case 'depthRGBA':
            material = materialDepthRGBA;
            break;
          case 'depthRGB':
            material = materialDepthRGB;
            break;
          case 'depthRG':
            material = materialDepthRG;
            break;
          case 'normal':
            material = materialNormal;
            break;
          case 'velocity':
            material = materialVelocity;
            break;
        }

        if (sides[params.side] !== material.side) {
          switch (params.side) {
            case 'front':
              material.side = THREE.FrontSide;
              break;
            case 'back':
              material.side = THREE.BackSide;
              break;
            case 'double':
              material.side = THREE.DoubleSide;
              break;
          }

          material.needsUpdate = true;
        }

        mesh.material = material;
      }

      switch (params.camera) {
        case 'perspective':
          camera = cameraPerspective;
          break;
        case 'ortho':
          camera = cameraOrtho;
          break;
      }

      controlsPerspective.update();
      controlsOrtho.update(); // must update both controls for damping to complete

      // remember camera projection changes

      materialVelocity.uniforms.previousProjectionViewMatrix.value.copy(
        materialVelocity.uniforms.currentProjectionViewMatrix.value
      );
      materialVelocity.uniforms.currentProjectionViewMatrix.value.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );

      if (mesh && mesh.userData.matrixWorldPrevious) {
        materialVelocity.uniforms.modelMatrixPrev.value.copy(mesh.userData.matrixWorldPrevious);
      }

      renderer.render(scene, camera);

      scene.traverse(function (object) {
        if (object.isMesh) {
          object.userData.matrixWorldPrevious.copy(object.matrixWorld);
        }
      });
    }
  }
};
export { exampleInfo as default };
