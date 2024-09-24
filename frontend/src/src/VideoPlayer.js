import React, { useState, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { fetchSignedUrl } from '../api';

const VideoPlayer = ({ problemId }) => {
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const loadVideo = async () => {
      const response = await fetchSignedUrl(problemId);
      setVideoUrl(response.signedUrl);
    };
    loadVideo();
  }, [problemId]);

  return (
    <div>
      <video className="video-js" controls preload="auto" width="640" height="264">
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;