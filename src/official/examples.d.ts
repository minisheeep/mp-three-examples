import type { Loader, TypedArray } from 'three';

export interface BaseTag<T extends string> {
  tag: T;
  content: string;
}

export interface ATag extends BaseTag<'a'> {
  link: string;
}

export type TextTag = BaseTag<'text'>;

export type TagItem = TextTag | ATag;

export type VideoOptions = {
  src: string;
  //video 的 naturalWidth
  width: number;
  //video 的 naturalHeight
  height: number;
  loop?: boolean;
  autoplay?: boolean;
  muted?: boolean;
};

export interface LoadContext {
  //为了减少官方代码的改动，实际上等同于 canvas
  window: EventTarget & { innerWidth: number; innerHeight: number; devicePixelRatio: number };
  canvas: any;
  GUI: any;
  Stats: any;

  needToDispose: (...objs: any[]) => void | ((fromFn: () => any[]) => void);

  useFrame(animateFunc: (delta: number) => void): { cancel: () => void };

  requestLoading(text?: string): Promise<void>;

  cancelLoading(): void;

  saveFile(
    fileName: string,
    data: ArrayBuffer | TypedArray | DataView | string
  ): Promise<string | null>;

  DecoderPath: {
    GLTF: string;
    STANDARD: string;
  };

  withCDNPrefix(path: string): string;

  getVideoTexture(videoOptions: VideoOptions): Promise<[{ isVideoTexture: true }, video: any]>;

  getCameraTexture(): { isVideoTexture: true };

  bindInfoText(template: `$${string}$`, initValue?: string): { value: string };

  onSlideStart(handle: () => void): void;

  onSlideEnd(handle: () => void): void;

  onSlideChange(handle: (offset: number, boxSize: number) => void): void;
}

/**
 * 官网的演示例子
 * */
export interface OfficialExampleInfo {
  name: string;
  useLoaders: Loader[];
  info: TagItem[][];
  infoPanel?: {
    left?: [string, string][];
    right?: [string, string][];
  };
  needSlider?: {
    direction?: 'horizontal' | 'vertical';
    initPosition?: number;
  };
  needArrowControls?: boolean;
  canvasType?: '2d' | 'webgl' | 'webgl2';
  canvasStyle?: {
    bgColor?: string;
    width?: number | string;
    height?: number | string;
  };
  initAfterConfirm?: {
    /**
     * 提示类型
     * @default 'default'
     * */
    type?: 'warning' | 'default';
    text: string[];
  };
  init: (context: LoadContext) => void;
}
