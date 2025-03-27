import { effectScope, onScopeDispose } from 'vue';
import { GUI } from 'lil-gui';
import Stats from 'stats.js';
import * as THREE from 'three';
import { VideoTexture } from '@minisheep/three-platform-adapter/override/jsm/textures/VideoTexture.js';
import { debounce } from 'lodash-es';
import { LoadContext, VideoOptions } from '@/official';

function useFrame(animateFunc: (delta: number) => void) {
  let lastTime = performance.now();
  let requestId: number;
  const renderFunc = (timestamp: number) => {
    if (lastTime === undefined) {
      lastTime = timestamp || (globalThis as any).performance?.now() || Date.now();
    } else {
      const currentTime = timestamp || (globalThis as any).performance?.now() || Date.now();
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      try {
        animateFunc(delta);
      } catch (e) {
        console.error('error in frame: ', e);
      }
    }
    requestId = requestAnimationFrame(renderFunc);
  };
  requestId = requestAnimationFrame(renderFunc);
  return {
    cancel: () => cancelAnimationFrame(requestId)
  };
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function disposeMaterial(material: THREE.Material) {
  if (!material) return;

  // 释放材质
  material.dispose();

  // 检查并释放关联的纹理
  const textureKeys = [
    'map',
    'alphaMap',
    'aoMap',
    'bumpMap',
    'displacementMap',
    'emissiveMap',
    'environmentMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap'
  ];

  textureKeys.forEach((key) => {
    if (material[key as keyof THREE.Material]) {
      (material[key as keyof THREE.Material] as THREE.Texture).dispose();
    }
  });
}

export function useThreeExample(
  canvas: HTMLCanvasElement,
  cb?: (threeExampleCtx: LoadContext) => void
) {
  const scope = effectScope(true);
  scope.run(() => {
    const { autoDispose } = useAutoDispose();
    const mockWindow = Object.defineProperties(canvas.parentElement!, {
      innerWidth: {
        configurable: true,
        get() {
          return canvas.parentElement!.clientWidth - 20;
        }
      },
      innerHeight: {
        configurable: true,
        get() {
          return canvas.parentElement!.clientHeight - 20;
        }
      },
      devicePixelRatio: {
        configurable: true,
        value: window.devicePixelRatio
      }
    }) as unknown as LoadContext['window'];

    const triggerResize = debounce(() => {
      mockWindow.dispatchEvent(new Event('resize'));
      (mockWindow as any).onresize?.();
    }, 200);

    const resizeObserver = new ResizeObserver(triggerResize);

    let usedGUI: GUI | null = null;

    class GGUI extends GUI {
      constructor(...args: any[]) {
        super(...args);
        usedGUI = this;
      }

      destroy() {
        super.destroy();
        usedGUI = null;
      }
    }

    let usedStats: SStats | null = null;

    class SStats {
      stats: any;

      constructor() {
        const stats = new Stats();
        document.body.appendChild(stats.dom);
        this.stats = stats;
        usedStats = this;
        return stats as unknown as SStats;
      }

      destroy() {
        this.stats.dom.remove();
        usedStats = null;
      }
    }

    resizeObserver.observe(canvas.parentElement!);
    const context: LoadContext = {
      window: mockWindow,
      canvas,
      GUI: GGUI,
      Stats: SStats,
      useFrame,
      needToDispose: autoDispose,
      requestLoading(text?: string) {
        //todo
        console.log('loading');
        return Promise.resolve();
      },
      cancelLoading() {
        console.log('hideLoading');
      },
      saveFile(fileName, data) {
        console.log('save file', fileName, data);
        //todo
        return Promise.resolve('');
      },
      DecoderPath: {
        GLTF: 'https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/draco/gltf/',
        STANDARD: 'https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/libs/draco/'
      },

      withCDNPrefix(path) {
        return 'https://oss.minisheep.cn/three-assets/' + path;
      },
      getVideoTexture({
        src,
        muted = true,
        loop = true,
        autoplay = false,
        width,
        height
      }: VideoOptions) {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.loop = loop;
        video.autoplay = autoplay;
        video.muted = muted;
        video.style.visibility = 'hidden';
        video.preload = 'auto';
        document.body.appendChild(video);
        return new Promise((resolve) => {
          video.addEventListener(
            'loadeddata',
            () => {
              resolve([new VideoTexture(video, width, height) as THREE.VideoTexture, video]);
            },
            { once: true }
          );
          video.src = src;
        });
      },
      getCameraTexture() {
        const video = document.createElement('video');
        const texture = new THREE.VideoTexture(video);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } };

          navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (stream) {
              // apply the stream to the video element used in the texture

              video.srcObject = stream;
              video.play();
            })
            .catch(function (error) {
              console.error('Unable to access the camera/webcam.', error);
            });
        } else {
          console.error('MediaDevices interface not available.');
        }
        return texture;
      },
      bindInfoText(template) {
        //todo 更新 info 中的模板
        let _value = '';
        return Object.defineProperty({}, 'value', {
          get() {
            return _value;
          },
          set(value) {
            _value = value;
          }
        }) as any;
      },
      onSlideStart(handle: () => void) {
        //todo
      },
      onSlideEnd(handle: () => void) {
        //todo
      },
      onSlideChange(handle: (offset: number, boxSize: number) => void) {
        //todo
      }
    };
    cb?.(context);

    onScopeDispose(async () => {
      usedGUI?.destroy();
      usedStats?.destroy();

      resizeObserver.disconnect();
    });
  });
  return scope;
}

export function useAutoDispose() {
  let disposeItems: any[] = [];
  onScopeDispose(() => {
    //try to dispose
    const resources = new Set<any>();
    [...disposeItems].forEach((disposeItem) => {
      if (typeof disposeItem === 'function') {
        disposeItems.push(...disposeItem());
      }
    });
    disposeItems
      .filter((item) => !!item)
      .forEach((item) => {
        if (item.isWebGLRenderer) {
          item.setAnimationLoop(null);
        }
        if (item instanceof THREE.Object3D) {
          item.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry && resources.add(object.geometry);
              object.material && resources.add(object.material);
            }
          });
        }
        if (item instanceof THREE.Scene) {
          item.children = [];
        }
        resources.add(item);
      });

    for (const resource of resources) {
      if (resource && resource.dispose) {
        if (resource.isMaterial) {
          disposeMaterial(resource as THREE.Material);
        } else {
          resource.dispose();
        }
      }
    }

    //w
    disposeItems = [];
  });
  return {
    autoDispose(...objs: any[]) {
      disposeItems.push(...objs);
    }
  };
}
