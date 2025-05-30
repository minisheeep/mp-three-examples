import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Refractor } from 'three/examples/jsm/objects/Refractor.js';
import { WaterRefractionShader } from 'three/examples/jsm/shaders/WaterRefractionShader.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_refraction',
  useLoaders: {},
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- refraction'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let camera, scene, renderer, clock;

    let refractor, smallSphere;

    init();

    async function init() {
      clock = new THREE.Clock();

      // scene
      scene = new THREE.Scene();

      // camera
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
      camera.position.set(0, 75, 160);

      // refractor

      const refractorGeometry = new THREE.PlaneGeometry(90, 90);

      refractor = new Refractor(refractorGeometry, {
        color: 0xcbcbcb,
        textureWidth: 1024,
        textureHeight: 1024,
        shader: WaterRefractionShader
      });

      refractor.position.set(0, 50, 0);

      scene.add(refractor);

      // load dudv map for distortion effect

      const loader = new THREE.TextureLoader();
      const dudvMap = await loader.loadAsync('textures/waterdudv.jpg');

      dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;
      refractor.material.uniforms.tDudv.value = dudvMap;

      //

      const geometry = new THREE.IcosahedronGeometry(5, 0);
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x333333,
        flatShading: true
      });
      smallSphere = new THREE.Mesh(geometry, material);
      scene.add(smallSphere);

      // walls
      const planeGeo = new THREE.PlaneGeometry(100.1, 100.1);

      const planeTop = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
      planeTop.position.y = 100;
      planeTop.rotateX(Math.PI / 2);
      scene.add(planeTop);

      const planeBottom = new THREE.Mesh(
        planeGeo,
        new THREE.MeshPhongMaterial({ color: 0xffffff })
      );
      planeBottom.rotateX(-Math.PI / 2);
      scene.add(planeBottom);

      const planeBack = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0x7f7fff }));
      planeBack.position.z = -50;
      planeBack.position.y = 50;
      scene.add(planeBack);

      const planeRight = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
      planeRight.position.x = 50;
      planeRight.position.y = 50;
      planeRight.rotateY(-Math.PI / 2);
      scene.add(planeRight);

      const planeLeft = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xff0000 }));
      planeLeft.position.x = -50;
      planeLeft.position.y = 50;
      planeLeft.rotateY(Math.PI / 2);
      scene.add(planeLeft);

      // lights
      const mainLight = new THREE.PointLight(0xe7e7e7, 2.5, 250, 0);
      mainLight.position.y = 60;
      scene.add(mainLight);

      const greenLight = new THREE.PointLight(0x00ff00, 0.5, 1000, 0);
      greenLight.position.set(550, 50, 0);
      scene.add(greenLight);

      const redLight = new THREE.PointLight(0xff0000, 0.5, 1000, 0);
      redLight.position.set(-550, 50, 0);
      scene.add(redLight);

      const blueLight = new THREE.PointLight(0xbbbbfe, 0.5, 1000, 0);
      blueLight.position.set(0, 50, 550);
      scene.add(blueLight);

      // renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      // controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 40, 0);
      controls.maxDistance = 400;
      controls.minDistance = 10;
      controls.update();

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      const time = clock.getElapsedTime();

      refractor.material.uniforms.time.value = time;

      smallSphere.position.set(
        Math.cos(time) * 30,
        Math.abs(Math.cos(time * 2)) * 20 + 5,
        Math.sin(time) * 30
      );
      smallSphere.rotation.y = Math.PI / 2 - time;
      smallSphere.rotation.z = time * 8;

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
