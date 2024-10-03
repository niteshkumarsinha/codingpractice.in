import React from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = () => {
  const videoUrl = 'http://localhost:8000/acquisition.mp4'; // Replace with your S3 video URL

  return (
    <div>
      <ReactPlayer 
        url={videoUrl} 
        controls={true} 
        width="800px" 
        height="450px" 
      />
    </div>
  );
};

export default VideoPlayer;