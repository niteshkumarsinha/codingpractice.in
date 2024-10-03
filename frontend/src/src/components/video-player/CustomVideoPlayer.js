import React, { useRef, useState, useEffect } from 'react';

const CustomVideoPlayer = () => {
  const videoRef = useRef(null); // Reference to the video element
  const [currentTime, setCurrentTime] = useState(0); // Current time of the video
  const [duration, setDuration] = useState(0); // Total duration of the video
  const [buffered, setBuffered] = useState(0); // Buffered percentage of the video
  const [isBuffering, setIsBuffering] = useState(false); // Indicate if buffering is happening

  // Updates current time as the video plays
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Updates the total duration once the metadata is loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Updates buffered percentage
  const handleProgress = () => {
    if (videoRef.current) {
      const bufferedTime = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const bufferedPercent = (bufferedTime / videoRef.current.duration) * 100;
      setBuffered(bufferedPercent);
    }
  };

  // Jump to the timeline
  const handleSeek = (event) => {
    const seekTime = (event.target.value / 100) * duration;
    videoRef.current.currentTime = seekTime;
  };

  // Show buffering state
  const handleWaiting = () => {
    setIsBuffering(true);
  };

  // Hide buffering state
  const handlePlaying = () => {
    setIsBuffering(false);
  };

  return (
    <div>
      <div>
        <video
          ref={videoRef}
          width="800"
          controls
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onProgress={handleProgress}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
        >
          {/* <source src={`${process.env.PUBLIC_URL}/video.mp4`} type="video/mp4" /> */}
          <source src={`http://localhost:8000/acquisition.mp4`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div>
        {/* Video Timeline */}
        <input
          type="range"
          min="0"
          max="100"
          value={(currentTime / duration) * 100}
          onChange={handleSeek}
        />
        <div>
          <span>
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
          </span>{' '}
          /{' '}
          <span>
            {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Buffering Indicator */}
        <div>
          <span>Buffered: {buffered.toFixed(2)}%</span>
        </div>
        {isBuffering && <div>Buffering...</div>}
      </div>
    </div>
  );
};

export default CustomVideoPlayer;