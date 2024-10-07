import Editor from "@monaco-editor/react";

function CodeEditor() {
  return (
    <div className="App">
      <h1>Monaco Editor in React</h1>
      <Editor
        width="70vw"
        height="80vh"  // You can adjust the height
        defaultLanguage="python"  // Choose a default language (e.g., 'javascript', 'python', etc.)
        defaultValue="// Write your code here"
        theme="vs-dark"  // Theme (e.g., 'vs-light', 'vs-dark')
      />
    </div>
  );
}

export default CodeEditor;