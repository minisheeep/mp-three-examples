import { createApp } from 'vue';
import App from '@/web-test/App.vue';
import * as THREE from 'three';

const allowedFolders = ['models', 'textures', 'luts', 'fonts', 'sounds', 'files'];
const loaderManager = THREE.DefaultLoadingManager;
loaderManager.setURLModifier((url: string) => {
  // Absolute URL http://,https://,//
  if (/^(https?:)?\/\//i.test(url)) return url;
  // Data URI
  if (/^data:.*,.*$/i.test(url)) return url;
  // Blob URL
  if (/^blob:.*$/i.test(url)) return url;

  if (
    allowedFolders.some((prefix) => url.startsWith(prefix + '/') || url.startsWith(`./${prefix}/`))
  )
    return 'https://oss.minisheep.cn/three-assets/' + url;

  return url;
});

createApp(App).mount('#app');
