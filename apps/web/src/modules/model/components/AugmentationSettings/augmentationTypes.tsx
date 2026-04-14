/**
 * Augmentation type definitions referencing the albumentations library.
 * Each augmentation maps to an albumentations transform.
 */

import { ModelAugmentationTypeEnum } from "@repo/schema";
import { ReactNode } from "react";
import {
  BlurImage,
  BrightnessImage,
  ClaheImage,
  CropImage,
  CutoutImage,
  DownscaleImage,
  EqualizeImage,
  ExposureImage,
  FlipImage,
  GrayscaleImage,
  HueImage,
  ImageCompressionImage,
  MedianBlurImage,
  MosaicImage,
  MotionBlurImage,
  NoiseImage,
  PerspectiveImage,
  PosterizeImage,
  RgbShiftImage,
  Rotate90Image,
  RotationImage,
  SaturationImage,
  SharpenImage,
  ShearImage,
} from "./illustrations";

export type AugmentationCategory = "image" | "bbox";

export interface AugmentationParam {
  key: string;
  label: string;
  type: "number" | "range" | "boolean" | "select";
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean | string;
  /** For range type: the key for the second value */
  rangeEndKey?: string;
  rangeEndDefault?: number;
  options?: { label: string; value: string }[];
  unit?: string;
}

export interface AugmentationDefinition {
  id: ModelAugmentationTypeEnum;
  /** Display name */
  name: string;
  category: AugmentationCategory;
  description: string;
  image: ReactNode;
  params: AugmentationParam[];
}

export interface AppliedAugmentation {
  id: string;
  type: ModelAugmentationTypeEnum;
  params: Record<string, number | boolean | string>;
  duplicateImage?: boolean;
}

/** Summary text for an applied augmentation */
export function getAugmentationSummary(
  def: AugmentationDefinition,
  params: Record<string, number | boolean | string>,
): string {
  switch (def.id) {
    case ModelAugmentationTypeEnum.FLIP:
      return `Horizontal: ${params.horizontal ? "Yes" : "No"}, Vertical: ${params.vertical ? "Yes" : "No"}`;
    case ModelAugmentationTypeEnum.ROTATE90:
      return "Random 90° rotations";
    case ModelAugmentationTypeEnum.CROP:
      return `Min Zoom: ${params.scale_min}, Max Zoom: ${params.scale_max}`;
    case ModelAugmentationTypeEnum.ROTATION:
      return `Between ${params.min}° and +${params.max}°`;
    case ModelAugmentationTypeEnum.SHEAR:
      return `${params.min}° Horizontal, ${params.max}° Vertical`;
    case ModelAugmentationTypeEnum.GRAYSCALE:
      return "Apply grayscale conversion";
    case ModelAugmentationTypeEnum.HUE:
      return `Hue shift ${params.hue_shift_limit_min} to ${params.hue_shift_limit_max}`;
    case ModelAugmentationTypeEnum.SATURATION:
      return `Saturation ${params.min} to ${params.max}`;
    case ModelAugmentationTypeEnum.BRIGHTNESS:
      return `Brightness ${params.brightness_limit_min} to ${params.brightness_limit_max}`;
    case ModelAugmentationTypeEnum.CONTRAST:
      return `Contrast ${params.contrast_limit_min} to ${params.contrast_limit_max}`;
    case ModelAugmentationTypeEnum.BLUR:
      return `Kernel size: ${params.blur_limit}`;
    case ModelAugmentationTypeEnum.NOISE:
      return `Std ${params.std_min}–${params.std_max}, Mean ${params.mean_min}–${params.mean_max}`;
    case ModelAugmentationTypeEnum.CUTOUT:
      return "Random cutout regions";
    case ModelAugmentationTypeEnum.MOSAIC:
      return `${params.rows}×${params.cols} grid`;
    case ModelAugmentationTypeEnum.CLAHE:
      return `Clip: ${params.clip_limit}, Grid: ${params.tile_grid_size}`;
    case ModelAugmentationTypeEnum.SHARPEN:
      return `Alpha: ${params.alpha_min}–${params.alpha_max}, Light: ${params.lightness_min}–${params.lightness_max}`;
    case ModelAugmentationTypeEnum.MOTION_BLUR:
      return `Kernel size: ${params.blur_limit}`;
    case ModelAugmentationTypeEnum.MEDIAN_BLUR:
      return `Kernel size: ${params.blur_limit}`;
    case ModelAugmentationTypeEnum.DOWNSCALE:
      return `Scale: ${params.scale_min}–${params.scale_max}`;
    case ModelAugmentationTypeEnum.IMAGE_COMPRESSION:
      return `Quality: ${params.quality_lower}–${params.quality_upper}`;
    case ModelAugmentationTypeEnum.PERSPECTIVE:
      return `Scale: ${params.scale}`;
    case ModelAugmentationTypeEnum.EQUALIZE:
      return "Histogram equalization";
    case ModelAugmentationTypeEnum.POSTERIZE:
      return `Bits: ${params.num_bits}`;
    case ModelAugmentationTypeEnum.RGB_SHIFT:
      return `R: ${params.r_shift_limit}, G: ${params.g_shift_limit}, B: ${params.b_shift_limit}`;
    default:
      return "";
  }
}

// ─── Image-Level Augmentations ───────────────────────────────────────────────

const probabilityParam: AugmentationParam = {
  key: "p",
  label: "Probability",
  type: "number",
  min: 0,
  max: 1,
  step: 0.05,
  default: 0.5,
};

const flip: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.FLIP,
  name: "Flip",
  category: "image",
  description:
    "Randomly flip the image horizontally or vertically to add mirror-image variations.",
  params: [
    {
      key: "horizontal",
      label: "Horizontal Flip",
      type: "boolean",
      default: true,
    },
    {
      key: "vertical",
      label: "Vertical Flip",
      type: "boolean",
      default: false,
    },
    probabilityParam,
  ],
  image: <FlipImage />,
};

const rotate90: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.ROTATE90,
  name: "90° Rotate",
  category: "image",
  description: "Randomly rotate the image by 90 degrees zero or more times.",
  params: [probabilityParam],
  image: <Rotate90Image />,
};

const crop: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.CROP,
  name: "Crop",
  category: "image",
  description:
    "Randomly crop a portion of the image and resize it back to the original size.",
  params: [
    {
      key: "scale_min",
      label: "Minimum Zoom",
      type: "number",
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.08,
    },
    {
      key: "scale_max",
      label: "Maximum Zoom",
      type: "number",
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.8,
    },
    probabilityParam,
  ],
  image: <CropImage />,
};

const rotation: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.ROTATION,
  name: "Rotation",
  category: "image",
  description: "Randomly rotate the image within a specified degree range.",
  params: [
    {
      key: "min",
      label: "Min Degrees",
      type: "number",
      min: -180,
      max: 0,
      step: 1,
      default: -7,
      unit: "°",
    },
    {
      key: "max",
      label: "Max Degrees",
      type: "number",
      min: 0,
      max: 180,
      step: 1,
      default: 7,
      unit: "°",
    },
    probabilityParam,
  ],
  image: <RotationImage />,
};

const shear: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.SHEAR,
  name: "Shear",
  category: "image",
  description:
    "Apply random shear transformations along horizontal and vertical axes.",
  params: [
    {
      key: "min",
      label: "",
      type: "number",
      min: 0,
      max: 45,
      step: 1,
      default: 10,
      unit: "°",
    },
    {
      key: "max",
      label: "Vertical Shear (°)",
      type: "number",
      min: 0,
      max: 45,
      step: 1,
      default: 0,
      unit: "°",
    },
    probabilityParam
  ],
  image: <ShearImage />,
};

const grayscale: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.GRAYSCALE,
  name: "Grayscale",
  category: "image",
  description:
    "Merge color channels to make your model faster and insensitive to subject color.",
  params: [probabilityParam],
  image: <GrayscaleImage />,
};

const hue: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.HUE,
  name: "Hue",
  category: "image",
  description: "Randomly shift the hue channel to create color variations.",
  params: [
    {
      key: "hue_shift_limit_min",
      label: "Min Hue Shift",
      type: "number",
      min: -180,
      max: 180,
      step: 1,
      default: -20,
    },
    {
      key: "hue_shift_limit_max",
      label: "Max Hue Shift",
      type: "number",
      min: -180,
      max: 180,
      step: 1,
      default: 20,
    },
    probabilityParam,
  ],
  image: <HueImage />,
};

const saturation: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.SATURATION,
  name: "Saturation",
  category: "image",
  description:
    "Randomly adjust the saturation of the image to simulate varying lighting conditions.",
  params: [
    {
      key: "min",
      label: "Min Saturation Shift",
      type: "number",
      min: -255,
      max: 255,
      step: 1,
      default: 30,
    },
    {
      key: "max",
      label: "Max Saturation Shift",
      type: "number",
      min: -255,
      max: 255,
      step: 1,
      default: 30,
    },
    probabilityParam,
  ],
  image: <SaturationImage />,
};

const brightness: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.BRIGHTNESS,
  name: "Brightness",
  category: "image",
  description:
    "Randomly adjust image brightness to simulate different lighting.",
  params: [
    {
      key: "brightness_limit_min",
      label: "Min Brightness Shift",
      type: "number",
      min: -1,
      max: 1,
      step: 0.05,
      default: -0.2,
    },
    {
      key: "brightness_limit_max",
      label: "Max Brightness Shift",
      type: "number",
      min: -1,
      max: 1,
      step: 0.05,
      default: 0.2,
    },
    probabilityParam,
  ],
  image: <BrightnessImage />,
};

const contrast: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.CONTRAST,
  name: "Contrast",
  category: "image",
  description: "Randomly adjust the tone curve to simulate contrast changes.",
  params: [
    {
      key: "contrast_limit_min",
      label: "Min Contrast",
      type: "number",
      min: -1,
      max: 1,
      step: 0.05,
      default: -0.2,
    },
    {
      key: "contrast_limit_max",
      label: "Max Contrast",
      type: "number",
      min: -1,
      max: 1,
      step: 0.05,
      default: 0.2,
    },
    probabilityParam,
  ],
  image: <ExposureImage />,
};

const blur: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.BLUR,
  name: "Blur",
  category: "image",
  description:
    "Apply Gaussian blur to simulate out-of-focus or motion conditions.",
  params: [
    {
      key: "blur_limit",
      label: "Kernel Size",
      type: "number",
      min: 3,
      max: 31,
      step: 2,
      default: 7,
    },
    probabilityParam,
  ],
  image: <BlurImage />,
};

const noise: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.NOISE,
  name: "Noise",
  category: "image",
  description: "Add random Gaussian noise to simulate sensor noise.",
  params: [
    {
      key: "std_min",
      label: "Min standard deviation",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
    },
    {
      key: "std_max",
      label: "Max standard deviation",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.44,
    },
    {
      key: "mean_min",
      label: "Min mean",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0,
    },
    {
      key: "mean_max",
      label: "Max mean",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0,
    },
    {
      key: "per_channel",
      label: "Apply noise per channel",
      type: "boolean",
      default: false,
    },
    probabilityParam
  ],
  image: <NoiseImage />,
};

const cutout: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.CUTOUT,
  name: "Cutout",
  category: "image",
  description:
    "Randomly erases rectangular regions from the image, helping the model learn to handle occlusions.",
  params: [probabilityParam],
  image: <CutoutImage />,
};

const mosaic: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.MOSAIC,
  name: "Mosaic",
  category: "image",
  description:
    "Downscale and upscale the image to create a mosaic/pixelation effect.",
  params: [
    {
      key: "rows",
      label: "Rows",
      type: "number",
      min: 1,
      max: 100,
      step: 1,
      default: 2,
    },
    {
      key: "cols",
      label: "Columns",
      type: "number",
      min: 1,
      max: 100,
      step: 1,
      default: 2,
    },
    probabilityParam,
  ],
  image: <MosaicImage />,
};

const clahe: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.CLAHE,
  name: "CLAHE",
  category: "image",
  description:
    "Contrast Limited Adaptive Histogram Equalization. Great for varying factory lighting conditions.",
  params: [
    {
      key: "clip_limit",
      label: "Clip Limit",
      type: "number",
      min: 1,
      max: 20,
      step: 0.5,
      default: 4.0,
    },
    {
      key: "tile_grid_size",
      label: "Tile Grid Size",
      type: "number",
      min: 1,
      max: 16,
      step: 1,
      default: 8,
    },
    probabilityParam,
  ],
  image: <ClaheImage />,
};

const sharpen: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.SHARPEN,
  name: "Sharpen",
  category: "image",
  description:
    "Apply image sharpening. Useful for enhancing edge visibility in defect detection.",
  params: [
    {
      key: "alpha_min",
      label: "Min Alpha",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
    },
    {
      key: "alpha_max",
      label: "Max Alpha",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
    },
    {
      key: "lightness_min",
      label: "Min Lightness",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
    },
    {
      key: "lightness_max",
      label: "Max Lightness",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 1.0,
    },
    probabilityParam,
  ],
  image: <SharpenImage />,
};

const motionBlur: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.MOTION_BLUR,
  name: "Motion Blur",
  category: "image",
  description:
    "Simulates motion blur. Common artifact in conveyor belt scenarios.",
  params: [
    {
      key: "blur_limit",
      label: "Kernel Size",
      type: "number",
      min: 3,
      max: 31,
      step: 2,
      default: 7,
    },
    probabilityParam,
  ],
  image: <MotionBlurImage />,
};

const medianBlur: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.MEDIAN_BLUR,
  name: "Median Blur",
  category: "image",
  description:
    "Median blur filter. Good for salt-and-pepper noise from industrial cameras.",
  params: [
    {
      key: "blur_limit",
      label: "Kernel Size",
      type: "number",
      min: 3,
      max: 31,
      step: 2,
      default: 5,
    },
    probabilityParam,
  ],
  image: <MedianBlurImage />,
};

const downscale: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.DOWNSCALE,
  name: "Downscale",
  category: "image",
  description:
    "Simulates lower resolution by downscaling and upscaling. Simulates camera distance/quality variations.",
  params: [
    {
      key: "scale_min",
      label: "Min Scale",
      type: "number",
      min: 0.1,
      max: 0.9,
      step: 0.05,
      default: 0.25,
    },
    {
      key: "scale_max",
      label: "Max Scale",
      type: "number",
      min: 0.1,
      max: 0.99,
      step: 0.01,
      default: 0.5,
    },
    probabilityParam,
  ],
  image: <DownscaleImage />,
};

const imageCompression: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.IMAGE_COMPRESSION,
  name: "Compression",
  category: "image",
  description:
    "JPEG compression artifacts. Common in industrial camera feeds with compression.",
  params: [
    {
      key: "quality_lower",
      label: "Min Quality",
      type: "number",
      min: 1,
      max: 100,
      step: 1,
      default: 50,
    },
    {
      key: "quality_upper",
      label: "Max Quality",
      type: "number",
      min: 1,
      max: 100,
      step: 1,
      default: 95,
    },
    probabilityParam,
  ],
  image: <ImageCompressionImage />,
};

const perspective: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.PERSPECTIVE,
  name: "Perspective",
  category: "image",
  description:
    "Random perspective transformation. Simulates viewing angle variations.",
  params: [
    {
      key: "scale",
      label: "Scale",
      type: "number",
      min: 0,
      max: 0.2,
      step: 0.005,
      default: 0.05,
    },
    probabilityParam,
  ],
  image: <PerspectiveImage />,
};

const equalize: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.EQUALIZE,
  name: "Equalize",
  category: "image",
  description:
    "Histogram equalization. Normalizes lighting across different conditions.",
  params: [probabilityParam],
  image: <EqualizeImage />,
};

const posterize: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.POSTERIZE,
  name: "Posterize",
  category: "image",
  description:
    "Reduces the number of bits per color channel. Simplifies color space for certain detection tasks.",
  params: [
    {
      key: "num_bits",
      label: "Number of Bits",
      type: "number",
      min: 1,
      max: 8,
      step: 1,
      default: 4,
    },
    probabilityParam,
  ],
  image: <PosterizeImage />,
};

const rgbShift: AugmentationDefinition = {
  id: ModelAugmentationTypeEnum.RGB_SHIFT,
  name: "RGB Shift",
  category: "image",
  description:
    "Shift R/G/B channels independently. Simulates lighting color temperature variations.",
  params: [
    {
      key: "r_shift_limit",
      label: "Red Shift Limit",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
    },
    {
      key: "g_shift_limit",
      label: "Green Shift Limit",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
    },
    {
      key: "b_shift_limit",
      label: "Blue Shift Limit",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
    },
    probabilityParam,
  ],
  image: <RgbShiftImage />,
};

export const IMAGE_AUGMENTATIONS: AugmentationDefinition[] = [
  flip,
  rotate90,
  crop,
  rotation,
  shear,
  grayscale,
  hue,
  saturation,
  brightness,
  contrast,
  blur,
  noise,
  cutout,
  mosaic,
  clahe,
  sharpen,
  motionBlur,
  medianBlur,
  downscale,
  imageCompression,
  perspective,
  equalize,
  posterize,
  rgbShift,
];

export const ALL_AUGMENTATIONS: AugmentationDefinition[] = [
  ...IMAGE_AUGMENTATIONS,
];

export function getAugmentationById(
  id: string,
): AugmentationDefinition | undefined {
  return ALL_AUGMENTATIONS.find((a) => a.id === id);
}

export function getDefaultValues(
  def: AugmentationDefinition,
): Record<string, number | boolean | string> {
  const values: Record<string, number | boolean | string> = {};
  for (const param of def.params) {
    values[param.key] = param.default;
  }
  return values;
}
