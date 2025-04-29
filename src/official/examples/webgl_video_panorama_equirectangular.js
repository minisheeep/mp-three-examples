import * as THREE from 'three';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'webgl_video_panorama_equirectangular',
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
        content: '- video panorama'
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
    let camera, scene, renderer, texture;

    let isUserInteracting = false,
      lon = 0,
      lat = 0,
      phi = 0,
      theta = 0,
      onPointerDownPointerX = 0,
      onPointerDownPointerY = 0,
      onPointerDownLon = 0,
      onPointerDownLat = 0;

    const distance = 0.5;

    init();

    async function init() {
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.25, 10);

      scene = new THREE.Scene();

      const geometry = new THREE.SphereGeometry(5, 60, 40);
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale(-1, 1, 1);

      const [videoTexture, video] = await getVideoTexture({
        width: 1920,
        height: 1080,
        src: withCDNPrefix(`textures/pano.mp4`),
        loop: true
      });
      video.play();

      texture = videoTexture;
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      renderer = new THREE.WebGLRenderer({ canvas });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);

      //

      window.addEventListener('resize', onWindowResize);

      needToDispose(renderer, scene);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onPointerDown(event) {
      isUserInteracting = true;

      onPointerDownPointerX = event.clientX;
      onPointerDownPointerY = event.clientY;

      onPointerDownLon = lon;
      onPointerDownLat = lat;
    }

    function onPointerMove(event) {
      if (isUserInteracting === true) {
        lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
        lat = (onPointerDownPointerY - event.clientY) * 0.1 + onPointerDownLat;
      }
    }

    function onPointerUp() {
      isUserInteracting = false;
    }

    function animate() {
      if (texture) {
        texture.update();
      }
      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
      camera.position.y = distance * Math.cos(phi);
      camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
  }
};
export { exampleInfo as default };
