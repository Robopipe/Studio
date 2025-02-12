const { createContext, useState, useContext } = require("react");

const CaptureContext = createContext();

export const CaptureProvider = ({ children }) => {
  const [capturedImages, setCapturedImages] = useState([]);

  return (
    <CaptureContext.Provider value={{ capturedImages, setCapturedImages }}>
      {children}
    </CaptureContext.Provider>
  );
};

export const useCapture = () => useContext(CaptureContext) ?? {};
