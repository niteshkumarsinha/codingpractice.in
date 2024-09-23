import React, { useState, useEffect } from 'react';
import { fetchProblems } from '../api';

const ProblemList = ({ onProblemSelect }) => {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    const getProblems = async () => {
      const problemsList = await fetchProblems();
      setProblems(problemsList || []);
    };

    getProblems();
  }, []);

  return (
    <div>
      <h2>Problems List</h2>
      <ul>
        {problems.map((problem) => (
          <li key={problem.problem_id} onClick={() => onProblemSelect(problem)}>
            {problem.title} - {problem.difficulty}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProblemList;
