import React, { useState } from 'react';

const CodeEditor = ({ problem, onSubmit }) => {
  const [code, setCode] = useState('');

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleSubmit = () => {
    onSubmit(code);
  };

  return (
    <div>
      <h3>{problem.title}</h3>
      <textarea value={code} onChange={handleCodeChange} rows="10" style={{ width: '100%' }} />
      <button onClick={handleSubmit}>Submit Code</button>
    </div>
  );
};

export default CodeEditor;
