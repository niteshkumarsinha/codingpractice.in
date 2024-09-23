import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videojs(videoRef.current, { controls: true, autoplay: false, preload: 'auto' });
    }
  }, [videoUrl]);

  return (
    <div>
      <video ref={videoRef} className="video-js" controls preload="auto" width="640" height="264">
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
