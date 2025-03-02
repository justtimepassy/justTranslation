import React from "react";
import DocxProcessor from "./components/DocxProcessor";

const App = () => {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-center mb-6">DOCX Blank Detector</h1>
      <DocxProcessor />
    </div>
  );
};

export default App;
