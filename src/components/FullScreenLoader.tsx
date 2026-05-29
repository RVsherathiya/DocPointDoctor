import React from 'react';
import './FullScreenLoader.css';

interface FullScreenLoaderProps {
  visible: boolean;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="web-loader-overlay">
      <div className="web-loader-overlay-layer1"></div>
      <div className="web-loader-overlay-layer2"></div>
      <div className="web-loader-overlay-layer3"></div>

      <div className="web-loader-center">
        <div className="web-loader-rings">
          <div className="web-loader-ring ring-1"></div>
          <div className="web-loader-ring ring-2"></div>
          <div className="web-loader-ring ring-3"></div>

          <div className="web-loader-icon-container">
            <div className="web-loader-icon-glow"></div>
            <div className="web-loader-icon-inner">
              <span className="web-loader-emoji">🩺</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenLoader;
