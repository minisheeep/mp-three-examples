import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_materials_video',
  useLoaders: {},
  initAfterConfirm: {
    text: ['注意音量']
  },
  info: [
    [
      {
        tag: 'a',
        link: 'https://threejs.org',
        content: 'three.js'
      },
      {
        tag: 'text',
        content: '- webgl video demo'
      }
    ],
    [
      {
        tag: 'text',
        content: 'playing'
      },
      {
        tag: 'a',
        link: 'http://durian.blender.org/',
        content: 'sintel'
      },
      {
        tag: 'text',
        content: 'trailer'
      }
    ]
  ],
  init: ({
    window,
    canvas,
    GUI,
    Stats,
    needToDispose,
    useFrame,
    getVideoTexture,
    withCDNPrefix
  }) => {
    let camera, scene, renderer;

    let video, texture, material, mesh;

    let composer;

    let mouseX = 0;
    let mouseY = 0;

    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    let cube_count;

    const meshes = [],
      materials = [],
      xgrid = 20,
      ygrid = 10;

    async function init() {
      camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
      camera.position.z = 500;

      scene = new THREE.Scene();

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(0.5, 1, 1).normalize();
      scene.add(light);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      [texture, video] = await getVideoTexture({
        src: withCDNPrefix('textures/sintel.mp4'),
        width: 480,
        height: 204,
        muted: false,
        loop: true
      });
      // 'seek' in wx
      if ('seek' in video) {
        video.seek(3);
      } else {
        video.currentTime = 3;
      }
      video.play();

      texture.colorSpace = THREE.SRGBColorSpace;

      //

      let i, j, ox, oy, geometry;

      const ux = 1 / xgrid;
      const uy = 1 / ygrid;

      const xsize = 480 / xgrid;
      const ysize = 204 / ygrid;

      const parameters = { color: 0xffffff, map: texture };

      cube_count = 0;

      for (i = 0; i < xgrid; i++) {
        for (j = 0; j < ygrid; j++) {
          ox = i;
          oy = j;

          geometry = new THREE.BoxGeometry(xsize, ysize, xsize);

          change_uvs(geometry, ux, uy, ox, oy);

          materials[cube_count] = new THREE.MeshLambertMaterial(parameters);

          material = materials[cube_count];

          material.hue = i / xgrid;
          material.saturation = 1 - j / ygrid;

          material.color.setHSL(material.hue, material.saturation, 0.5);

          mesh = new THREE.Mesh(geometry, material);

          mesh.position.x = (i - xgrid / 2) * xsize;
          mesh.position.y = (j - ygrid / 2) * ysize;
          mesh.position.z = 0;

          mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;

          scene.add(mesh);

          mesh.dx = 0.001 * (0.5 - Math.random());
          mesh.dy = 0.001 * (0.5 - Math.random());

          meshes[cube_count] = mesh;

          cube_count += 1;
        }
      }

      renderer.autoClear = false;

      canvas.addEventListener('pointermove', onDocumentMouseMove);

      // postprocessing

      const renderPass = new RenderPass(scene, camera);
      const bloomPass = new BloomPass(1.3);
      const outputPass = new OutputPass();

      composer = new EffectComposer(renderer);

      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(outputPass);

      //

      window.addEventListener('resize', onWindowResize);
      needToDispose(renderer, scene);
      renderer.setAnimationLoop(animate);
    }

    function onWindowResize() {
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    }

    function change_uvs(geometry, unitx, unity, offsetx, offsety) {
      const uvs = geometry.attributes.uv.array;

      for (let i = 0; i < uvs.length; i += 2) {
        uvs[i] = (uvs[i] + offsetx) * unitx;
        uvs[i + 1] = (uvs[i + 1] + offsety) * unity;
      }
    }

    function onDocumentMouseMove(event) {
      mouseX = event.clientX - windowHalfX;
      mouseY = (event.clientY - windowHalfY) * 0.3;
    }

    //

    let h,
      counter = 1;

    function animate() {
      if (texture) {
        texture.update();
      }
      const time = Date.now() * 0.00005;

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;

      camera.lookAt(scene.position);

      for (let i = 0; i < cube_count; i++) {
        material = materials[i];

        h = ((360 * (material.hue + time)) % 360) / 360;
        material.color.setHSL(h, material.saturation, 0.5);
      }

      if (counter % 1000 > 200) {
        for (let i = 0; i < cube_count; i++) {
          mesh = meshes[i];

          mesh.rotation.x += 10 * mesh.dx;
          mesh.rotation.y += 10 * mesh.dy;

          mesh.position.x -= 150 * mesh.dx;
          mesh.position.y += 150 * mesh.dy;
          mesh.position.z += 300 * mesh.dx;
        }
      }

      if (counter % 1000 === 0) {
        for (let i = 0; i < cube_count; i++) {
          mesh = meshes[i];

          mesh.dx *= -1;
          mesh.dy *= -1;
        }
      }

      counter++;

      renderer.clear();
      composer.render();
    }

    init();
  }
};
export { exampleInfo as default };
