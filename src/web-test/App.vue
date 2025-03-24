<template>
  <ExampleLoader :name="currentExample"></ExampleLoader>
  <div class="search-box">
    <div class="query-line">
      <input placeholder="关键字搜索" v-model="searchText" />
      <div>{{ currentExample }}</div>
      <div>{{ checked }}/{{ total }}</div>
    </div>
    <ul>
      <li
        :id="key"
        v-for="key in filterList"
        :key="key"
        :data-key="key"
        :class="{
          active: currentExample === key,
          checked: checkedState[key]
        }"
        @click="currentExample = key"
      >
        <span>{{ key }}</span>
        <span
          class="operate"
          v-if="currentExample === key"
          @click="checkedState[key] = !checkedState[key]"
        >
          {{ checkedState[key] ? 'mark uncheck' : 'mark checked' }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
import { exampleLoaders } from '@/web-test/constant.ts';
import ExampleLoader from '@/web-test/ExampleLoader.vue';

const saveSign = '__example__';

const searchText = ref('');

const filterList = computed(() => {
  return Object.keys(exampleLoaders).filter((item) => {
    return searchText.value ? item.includes(searchText.value) : true;
  });
});

const currentExample = ref(localStorage.getItem(saveSign) || '');

watchEffect(() => {
  localStorage.setItem(saveSign, currentExample.value);
});

const checkedSign = '__checkedExamples__';

const checkedState = ref({
  ...Object.fromEntries(Object.keys(exampleLoaders).map((item) => [item, false])),
  ...JSON.parse(localStorage.getItem(checkedSign) || '{}')
});

const total = ref(Object.keys(exampleLoaders).length);
const checked = ref(0);

watchEffect(() => {
  localStorage.setItem(checkedSign, JSON.stringify(checkedState.value));

  checked.value = Object.keys(exampleLoaders).filter((key) => {
    return checkedState.value[key];
  }).length;
});

onMounted(() => {
  const name = Object.keys(exampleLoaders)
    .reverse()
    .find((item) => !checkedState.value[item]);
  const el = document.getElementById(name!);
  el?.scrollIntoView();
});
</script>

<style lang="scss">
body {
  padding: 10px;
}

.search-box {
  margin-top: 20px;
  .query-line {
    display: flex;
    justify-content: space-between;
  }

  input {
    margin-left: 2em;
  }

  ul {
    max-height: 220px;
    overflow-y: auto;
  }

  li {
    padding: 5px;
    display: flex;
    justify-content: space-between;
    background-color: ghostwhite;

    &:hover {
      background-color: whitesmoke;
    }

    &.active {
      background-color: deepskyblue !important;
    }

    &.checked {
      background-color: lightgreen;
    }

    .operate {
      opacity: 0;
      transition: opacity 0.3s;
      cursor: pointer;
    }

    &:hover .operate {
      opacity: 1;
    }
  }
}
</style>
