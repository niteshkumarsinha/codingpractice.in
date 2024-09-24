import React, { useState } from 'react';
import { uploadVideo } from '../api'; // Assume this function uploads the video to the backend.

const VideoUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("video", selectedFile);

    try {
      const response = await uploadVideo(formData);
      setMessage(response.message || "Video uploaded successfully.");
    } catch (error) {
      setMessage("Failed to upload video.");
    }
  };

  return (
    <div>
      <h2>Upload Video (Admin Only)</h2>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Video</button>
      <p>{message}</p>
    </div>
  );
};

export default VideoUpload;