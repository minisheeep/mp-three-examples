import type { Loader, TypedArray } from 'three';

/**
 * 官网示例的多端使用封装把版本
 * */
export interface OfficialExampleInfo extends MiniProgramMeta {
  /*** 示例名称（保持和官网一致）*/
  name: string;
  /** main */
  init: (context: LoadContext) => void;
}

export interface LoadContext {
  window: EventTarget & { innerWidth: number; innerHeight: number; devicePixelRatio: number };
  /** HTMLCanvasElement */
  canvas: any;
  /** https://www.npmjs.com/package/lil-gui */
  GUI: any;
  /**
   * https://www.npmjs.com/package/stats.js
   * 也可以使用其他受支持的版本
   * */
  Stats: any;
  /** 收集需要 dispose 的对象（官方示例没有处理这部分）*/
  needToDispose: (...objs: any[]) => void | ((fromFn: () => any[]) => void);

  /**基于 raq 的通用封装 */
  useFrame(animateFunc: (/** ms */ delta: number) => void): { cancel: () => void };

  /** 显示加载模态框 */
  requestLoading(text?: string): Promise<void>;

  /** 隐藏加载模态框*/
  cancelLoading(): void;

  /** 保存文件的通用封装*/
  saveFile(
    fileName: string,
    data: ArrayBuffer | TypedArray | DataView | string
  ): Promise<string | null>;

  /** 示例使用 DracoDecoder 时的资源路径 */
  DecoderPath: {
    GLTF: string;
    STANDARD: string;
  };

  /** 为资源路径拼上 CDN 前缀 */
  withCDNPrefix(path: string): string;

  /**
   * 在小程序中应使用 import { VideoTexture } from '@minisheep/three-platform-adapter/override/jsm/textures/VideoTexture.js';
   * 正常情况（web） 可直接使用 THREE.VideoTexture
   * */
  getVideoTexture(videoOptions: VideoOptions): Promise<[{ isVideoTexture: true }, video: any]>;

  /**
   * 在小程序中应使用 import { CameraTexture } from '@minisheep/three-platform-adapter/override/jsm/textures/CameraTexture.js';
   * 正常情况（web） 可参考示例 webgl_materials_video_webcam
   * */
  getCameraTexture(): { isVideoTexture: true };

  /** 用于动态修改 info 中的占位符*/
  bindInfoText(template: `$${string}$`, initValue?: string): { value: string };

  /** 分屏控件对应的事件回调 */
  onSlideStart(handle: () => void): void;
  /** 分屏控件对应的事件回调 */
  onSlideEnd(handle: () => void): void;
  /** 分屏控件对应的事件回调 */
  onSlideChange(handle: (offset: number, boxSize: number) => void): void;
}

export type VideoOptions = {
  src: string;
  /** 相当于 HTMLVideoElement 的 naturalWidth (小程序中获取不到)*/
  width: number;
  /** 相当于 HTMLVideoElement 的 naturalHeight (小程序中获取不到)*/
  height: number;
  loop?: boolean;
  autoplay?: boolean;
  muted?: boolean;
};

/** 示例小程序中使用的一些配置 */
export interface MiniProgramMeta {
  /** 用于统计加载相关信息 */
  useLoaders: Loader[];
  /** 通用 info */
  info: TagItem[][];
  /** 特殊 info */
  infoPanel?: {
    left?: [string, string][];
    right?: [string, string][];
  };
  /** 分屏控件配置 */
  needSlider?: {
    /** 方向 */
    direction?: 'horizontal' | 'vertical';
    /** 初始偏移 0-100 */
    initPosition?: number;
  };
  /** 操作摇杆控件 */
  needArrowControls?: boolean;
  /** 默认需要的画布类型 */
  canvasType?: '2d' | 'webgl' | 'webgl2';
  /** 为保持效果一致所需要的画布样式 */
  canvasStyle?: {
    bgColor?: string;
    width?: number | string;
    height?: number | string;
  };
  /** 部分示例需要在加载前进行一些提示 */
  initAfterConfirm?: {
    /**
     * 提示类型
     * @default 'default'
     * */
    type?: 'warning' | 'default';
    text: string[];
  };
}

export interface BaseTag<T extends string> {
  tag: T;
  content: string;
}

export interface ATag extends BaseTag<'a'> {
  link: string;
}

export type TextTag = BaseTag<'text'>;

export type TagItem = TextTag | ATag;
