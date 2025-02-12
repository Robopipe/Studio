import { useCallback, useEffect, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { CameraControl } from "./CameraControl/CameraControl";
import "./CameraControls.scss";

export const CameraControls = ({ apiUrl }) => {
  const [control, setControl] = useState({});
  const [changed, setChanged] = useState(false);

  const onChange = useCallback(
    (name, value) => {
      setControl(prev => ({ ...prev, [name]: value }));
      console.log(name, value);
      setChanged(true);
    },
    [setControl]
  );
  const updateControl = useCallback(async () => {
    const updatedControl = await (
      await fetch(`${apiUrl}/control`, {
        method: "POST",
        body: JSON.stringify(control),
        headers: { "Content-Type": "application/json" }
      })
    ).json();
    setControl(updatedControl);
    setChanged(false);
  }, [control, setControl, setChanged]);

  useEffect(() => {
    (async () => {
      const fetchedControl = await (await fetch(`${apiUrl}/control`)).json();
      setControl(fetchedControl);
    })();
  }, [apiUrl]);

  useEffect(() => {
    let timeout;

    if (changed) {
      timeout = setTimeout(updateControl, 750);
    }

    return () => clearTimeout(timeout);
  }, [changed, updateControl]);

  return (
    <Block name="camera-controls">
      <CameraControl
        name="exposure_time"
        label="Exposure time"
        onChange={onChange}
        min={1}
        max={33000}
      />
      <CameraControl
        name="sensitivity_iso"
        label="ISO sensitivity"
        onChange={onChange}
        min={100}
        max={5000}
      />
      <CameraControl
        name="brightness"
        label="Brightness"
        onChange={onChange}
        min={-10}
        max={10}
      />
      <CameraControl
        name="contrast"
        label="Contrast"
        onChange={onChange}
        min={-10}
        max={10}
      />
      <CameraControl
        name="saturation"
        label="Saturation"
        onChange={onChange}
        min={-10}
        max={10}
      />
      <CameraControl
        name="chroma_denoise"
        label="Chroma denoise"
        onChange={onChange}
        min={0}
        max={4}
      />
      <CameraControl
        name="luma_denoise"
        label="Luma denoise"
        onChange={onChange}
        min={0}
        max={4}
      />
    </Block>
  );
};
