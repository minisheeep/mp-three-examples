import * as THREE from 'three';
import { UVsDebug } from 'three/examples/jsm/utils/UVsDebug.js';

// /** @type {import("..").OfficialExampleInfo} */
const exampleInfo = {
  name: 'misc_uv_tests',
  useLoaders: {},
  canvasType: '2d',
  canvasStyle: {
    width: '90vmin',
    height: '90vmin'
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
        content: 'uv test'
      }
    ],
    [
      {
        tag: 'text',
        content: '$currentText$'
      }
    ]
  ],
  init: ({ window, canvas, GUI, Stats, needToDispose, useFrame, bindInfoText }) => {
    canvas.width = 1024;
    canvas.height = 1024;
    const currentText = bindInfoText('$currentText$');

    const api = {};
    const ctx = canvas.getContext('2d');

    const gui = new GUI();

    function test(name, geometry, clickThis = false) {
      const canvas = UVsDebug(geometry, 1024);

      api[name] = () => {
        currentText.value = name;

        ctx.drawImage(canvas, 0, 0);
      };

      gui.add(api, name).name(name.slice(10, name.indexOf('(')));

      clickThis && api[name]();
    }

    const points = [];

    for (let i = 0; i < 10; i++) {
      points.push(new THREE.Vector2(Math.sin(i * 0.2) * 15 + 50, (i - 5) * 2));
    }

    //

    test(
      'new THREE.PlaneGeometry( 100, 100, 4, 4 )',
      new THREE.PlaneGeometry(100, 100, 4, 4),
      true
    );

    test('new THREE.SphereGeometry( 75, 12, 6 )', new THREE.SphereGeometry(75, 12, 6));

    test('new THREE.IcosahedronGeometry( 30, 1 )', new THREE.IcosahedronGeometry(30, 1));

    test('new THREE.OctahedronGeometry( 30, 2 )', new THREE.OctahedronGeometry(30, 2));

    test(
      'new THREE.CylinderGeometry( 25, 75, 100, 10, 5 )',
      new THREE.CylinderGeometry(25, 75, 100, 10, 5)
    );

    test(
      'new THREE.BoxGeometry( 100, 100, 100, 4, 4, 4 )',
      new THREE.BoxGeometry(100, 100, 100, 4, 4, 4)
    );

    test('new THREE.LatheGeometry( points, 8 )', new THREE.LatheGeometry(points, 8));

    test('new THREE.TorusGeometry( 50, 20, 8, 8 )', new THREE.TorusGeometry(50, 20, 8, 8));

    test(
      'new THREE.TorusKnotGeometry( 50, 10, 12, 6 )',
      new THREE.TorusKnotGeometry(50, 10, 12, 6)
    );
  }
};
export { exampleInfo as default };
