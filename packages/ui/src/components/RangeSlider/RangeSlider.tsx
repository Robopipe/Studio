import {
  Slider as BaseSlider,
  SliderRootProps as BaseSliderProps,
} from "@base-ui/react";
import styles from "./RangeSlider.module.scss";

export interface RangeSliderProps extends BaseSliderProps {}

export const RangeSlider = (props: RangeSliderProps) => {
  return (
    <BaseSlider.Root {...props}>
      <BaseSlider.Control className={styles.Control}>
        <BaseSlider.Track className={styles.Track}>
          <BaseSlider.Indicator className={styles.Indicator} />
          <BaseSlider.Thumb index={0} className={styles.Thumb} />
          <BaseSlider.Thumb index={1} className={styles.Thumb} />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
};
