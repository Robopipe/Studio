import {
  Slider as BaseSlider,
  SliderRootProps as BaseSliderProps,
} from "@base-ui/react";

import styles from "./Slider.module.scss";

export interface SliderProps extends BaseSliderProps {}

export const Slider = (props: SliderProps) => {
  return (
    <BaseSlider.Root {...props}>
      <BaseSlider.Control className={styles.Control}>
        <BaseSlider.Track className={styles.Track}>
          <BaseSlider.Indicator className={styles.Indicator} />
          <BaseSlider.Thumb aria-label="Volume" className={styles.Thumb} />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
};
