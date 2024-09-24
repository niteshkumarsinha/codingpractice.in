import React, { useState } from 'react';
import ProblemList from './components/ProblemList';
import CodeEditor from './components/CodeEditor';
import VideoPlayer from './components/VideoPlayer';
import { submitCode } from './api';
import { AmplifyAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';


function App() {
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);

  const userId = 1; // Hardcoded for simplicity

  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem);
    setSubmissionResult(null);
  };

  const handleCodeSubmit = async (code) => {
    const result = await submitCode(userId, selectedProblem.problem_id, code);
    setSubmissionResult(result);
  };

  return (
    <AmplifyAuthenticator>
    <div>
      <h1>Coding Platform</h1>
      {!selectedProblem ? (
        <ProblemList onProblemSelect={handleProblemSelect} />
      ) : (
        <>
          <CodeEditor problem={selectedProblem} onSubmit={handleCodeSubmit} />
          {selectedProblem.video_url && (
            <VideoPlayer videoUrl={selectedProblem.video_url} />
          )}
        </>
      )}
    </div>
    </AmplifyAuthenticator>
  );
}

export default App;
