import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_toon',
  useLoaders: { FontLoader },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- Toon Material with OutlineEffect'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame }) => {
    let stats;

    let camera, scene, renderer, effect;
    let particleLight;

    const loader = new FontLoader();
    loader.load('fonts/gentilis_regular.typeface.json', function (font) {
      init(font);
    });

    function init(font) {
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 2500);
      camera.position.set(0.0, 400, 400 * 3.5);

      //

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x444488);

      //

      renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      // Materials

      const cubeWidth = 400;
      const numberOfSphersPerSide = 5;
      const sphereRadius = (cubeWidth / numberOfSphersPerSide) * 0.8 * 0.5;
      const stepSize = 1.0 / numberOfSphersPerSide;

      const geometry = new THREE.SphereGeometry(sphereRadius, 32, 16);

      for (let alpha = 0, alphaIndex = 0; alpha <= 1.0; alpha += stepSize, alphaIndex++) {
        const colors = new Uint8Array(alphaIndex + 2);

        for (let c = 0; c <= colors.length; c++) {
          colors[c] = (c / colors.length) * 256;
        }

        const gradientMap = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
        gradientMap.needsUpdate = true;

        for (let beta = 0; beta <= 1.0; beta += stepSize) {
          for (let gamma = 0; gamma <= 1.0; gamma += stepSize) {
            // basic monochromatic energy preservation
            const diffuseColor = new THREE.Color()
              .setHSL(alpha, 0.5, gamma * 0.5 + 0.1)
              .multiplyScalar(1 - beta * 0.2);

            const material = new THREE.MeshToonMaterial({
              color: diffuseColor,
              gradientMap: gradientMap
            });

            const mesh = new THREE.Mesh(geometry, material);

            mesh.position.x = alpha * 400 - 200;
            mesh.position.y = beta * 400 - 200;
            mesh.position.z = gamma * 400 - 200;

            scene.add(mesh);
          }
        }
      }

      function addLabel(name, location) {
        const textGeo = new TextGeometry(name, {
          font: font,

          size: 20,
          depth: 1,
          curveSegments: 1
        });

        const textMaterial = new THREE.MeshBasicMaterial();
        const textMesh = new THREE.Mesh(textGeo, textMaterial);
        textMesh.position.copy(location);
        scene.add(textMesh);
      }

      addLabel('-gradientMap', new THREE.Vector3(-350, 0, 0));
      addLabel('+gradientMap', new THREE.Vector3(350, 0, 0));

      addLabel('-diffuse', new THREE.Vector3(0, 0, -300));
      addLabel('+diffuse', new THREE.Vector3(0, 0, 300));

      particleLight = new THREE.Mesh(
        new THREE.SphereGeometry(4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      scene.add(particleLight);

      // Lights

      scene.add(new THREE.AmbientLight(0xc1c1c1, 3));

      const pointLight = new THREE.PointLight(0xffffff, 2, 800, 0);
      particleLight.add(pointLight);

      //

      effect = new OutlineEffect(renderer);

      //

      stats = new Stats(renderer);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 200;
      controls.maxDistance = 2000;

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene, controls);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    function animate() {
      stats.begin();
      render();
      stats.end();
      stats.update();
    }

    function render() {
      const timer = Date.now() * 0.00025;

      particleLight.position.x = Math.sin(timer * 7) * 300;
      particleLight.position.y = Math.cos(timer * 5) * 400;
      particleLight.position.z = Math.cos(timer * 3) * 300;

      effect.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
