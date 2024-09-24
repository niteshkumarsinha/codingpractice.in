import axios from 'axios';

// Set your backend API URL here
const API_BASE_URL = "http://localhost:5000";

// Fetch problems from backend
export const fetchProblems = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/problems`);
    return response.data;
  } catch (error) {
    console.error("Error fetching problems", error);
  }
};

// Submit code
export const submitCode = async (userId, problemId, code) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/submit`, {
      userId,
      problemId,
      code,
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting code", error);
  }
};

// Upload video
export const uploadVideo = async (problemId, videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload-video/${problemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading video", error);
  }
};
