import React from 'react';
import { getModelState, ModelState } from '../utils/localModel';

export function ModelStatus() {
  const [modelState, setModelState] = React.useState<string>(getModelState());
  const [modelProgress, setModelProgress] = React.useState<number>(0);

  React.useEffect(() => {
    const handleModelStateChange = (event: any) => {
      setModelState(event.detail.state);
    };

    const handleModelProgress = (event: any) => {
      setModelProgress(event.detail.progress);
    };

    window.addEventListener('modelStateChange', handleModelStateChange);
    window.addEventListener('modelDownloadProgress', handleModelProgress);

    return () => {
      window.removeEventListener('modelStateChange', handleModelStateChange);
      window.removeEventListener('modelDownloadProgress', handleModelProgress);
    };
  }, []);

  if (modelState === ModelState.READY) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-md rounded-[20px] p-4 text-white">
      {modelState === ModelState.DOWNLOADING && (
        <div>
          <p>Downloading model... {modelProgress}%</p>
        </div>
      )}
      {modelState === ModelState.ERROR && (
        <div>
          <p>Error downloading model. Please try again.</p>
        </div>
      )}
    </div>
  );
}
