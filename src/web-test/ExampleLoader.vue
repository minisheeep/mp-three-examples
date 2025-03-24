<template>
  <div class="canvas-box">
    <canvas ref="canvas"></canvas>
  </div>
</template>
<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { exampleLoaders } from '@/web-test/constant.ts';
import { useThreeExample } from '@/web-test/example-helper.ts';
import { OfficialExampleInfo } from '@/official';

type ExampleLoaderProps = {
  name: string;
};

const props = defineProps<ExampleLoaderProps>();

const canvas = ref();

async function loadExample(name: string) {
  const loader = exampleLoaders[name];
  const component = await loader();
  return component.default;
}

const exampleInfo = ref<OfficialExampleInfo>();

watchEffect(async (onCleanup) => {
  if (props.name in exampleLoaders) {
    const data = await loadExample(props.name);
    exampleInfo.value = data;
  }
});

watchEffect((onCleanup) => {
  const exampleData = exampleInfo.value;
  if (exampleData) {
    const canvasStyle = exampleData.canvasStyle;
    if (canvasStyle?.bgColor) {
      canvas.value.style.backgroundColor = canvasStyle.bgColor;
    }
    if (canvasStyle?.width) {
      canvas.value.style.width =
        typeof canvasStyle.width === 'number' ? canvasStyle.width + 'px' : canvasStyle.width;
    }
    if (canvasStyle?.height) {
      canvas.value.style.height =
        typeof canvasStyle.height === 'number' ? canvasStyle.height + 'px' : canvasStyle.height;
    }
    if (exampleData.initAfterConfirm) {
      const flag = window.confirm(
        `${exampleData.initAfterConfirm.type === 'warning' ? '警告' : '提示'}：${exampleData.initAfterConfirm.text.join('\n')}`
      );
      if (!flag) return;
    }

    const scope = useThreeExample(canvas.value, exampleData.init);
    onCleanup(() => {
      scope.stop();
    });
  }
});
</script>

<style scoped lang="scss">
.canvas-box {
  padding: 10px;
  border-radius: 5px;
  background-color: navajowhite;
  resize: both;
  min-width: 800px;
  min-height: 600px;
  max-width: calc(100vw - 20px);
  max-height: 1000px;
  width: 1200px;
  height: 768px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  background-color: whitesmoke;
  border-radius: 5px;
}
</style>
