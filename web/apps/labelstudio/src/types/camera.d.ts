declare enum CameraPlatform {
  X_LINK_ANY_PLATFORM,
  X_LINK_MYRIAD_X,
  X_LINK_MYRIAD_2
}

declare enum CameraProtocol {
  X_LINK_ANY_PROTOCOL,
  X_LINK_IPC,
  X_LINK_PCIE,
  X_LINK_TCP_IP,
  X_LINK_USB_CDC,
  X_LINK_USB_VSC
}

declare enum CameraState {
  X_LINK_ANY_STATE,
  X_LINK_BOOTED,
  X_LINK_BOOTLOADER,
  X_LINK_FLASH_BOOTED,
  X_LINK_UNBOOTED
}

declare type APICamera = {
  mxid: string;
  name: string;
  camera_name: string;
  platform: keyof typeof CameraPlatform;
  protocol: keyof typeof CameraProtocol;
  state: keyof typeof CameraState;
  status: string;
};

declare type APICameraStream = {
  name: string;
  active: boolean;
};
