import Editor from "@monaco-editor/react";

function CodeEditor() {
  return (
    <div className="App">
      <h1>Monaco Editor in React</h1>
      <Editor
        height="90vh"  // You can adjust the height
        defaultLanguage="javascript"  // Choose a default language (e.g., 'javascript', 'python', etc.)
        defaultValue="// Write your code here"
        theme="vs-dark"  // Theme (e.g., 'vs-light', 'vs-dark')
      />
    </div>
  );
}

export default CodeEditor;