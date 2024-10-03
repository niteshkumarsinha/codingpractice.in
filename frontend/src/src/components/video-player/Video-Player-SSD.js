import React from 'react';
import ReactPlayer from 'react-player';


const VideoPlayer = () => {
  const videoUrl = 'http://localhost:8000/acquisition.mp4';  // Use the local server URL

  return (
    <div>
      {/* <video width="800" controls>
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video> */}
      <ReactPlayer url={videoUrl} controls width="800px" height="450px" />
    </div>
  );
};

export default VideoPlayer;