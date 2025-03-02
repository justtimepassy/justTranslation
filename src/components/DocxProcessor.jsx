import React, { useState } from "react";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

const TRANSLATION_API_URL = "http://localhost:5002/api/translate";
const TELUGU_TO_ENGLISH_API_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/compute";

const DocxProcessor = () => {
  const [translatedLines, setTranslatedLines] = useState([]);
  const [voiceResponses, setVoiceResponses] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [recordingIndex, setRecordingIndex] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(null); // Stores the uploaded DOCX file

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedDoc(file); // Store the uploaded file for later modification

    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoading(true);
      const arrayBuffer = e.target.result;

      // ✅ Extract text from DOCX
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value.trim();

      // ✅ Split into lines while maintaining structure
      let textLines = extractedText.split("\n").map(line => line.trim()).filter(line => line.length > 0);

      if (!textLines[0].includes("______")) {
        textLines = textLines.slice(1);
      }

      // ✅ Translate each line separately
      const translatedLines = await Promise.all(textLines.map(translateText));

      setTranslatedLines(translatedLines);
      setVoiceResponses(Array(translatedLines.length).fill(null));
      setFormData({});
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // ✅ Function to Translate Telugu DOCX Text
  const translateText = async (text) => {
    try {
      const response = await fetch(TRANSLATION_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      return data.translatedText || "Translation failed.";
    } catch (error) {
      console.error("❌ Error translating text:", error);
      return "Translation failed.";
    }
  };

  // ✅ Function to Convert Telugu Speech → English Translation (Stored)
  const handleVoiceInput = (index) => {
    if (recordingIndex !== null) return;

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "te-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setRecordingIndex(index);
    recognition.start();

    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      console.log("🎤 Recognized Telugu Speech:", spokenText);

      const translatedText = await translateTeluguToEnglish(spokenText);

      const updatedVoiceResponses = [...voiceResponses];
      updatedVoiceResponses[index] = spokenText;
      setVoiceResponses(updatedVoiceResponses);

      setFormData((prevData) => ({
        ...prevData,
        [`Blank ${index + 1}`]: {
          telugu: spokenText,
          english: translatedText,
        },
      }));

      setRecordingIndex(null);
    };

    recognition.onerror = (event) => {
      console.error("❌ Speech recognition error:", event);
      setRecordingIndex(null);
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setRecordingIndex(null);
    };

    recognition.onend = () => {
      setRecordingIndex(null);
    };
  };

  // ✅ Function to Translate Telugu to English
  const translateTeluguToEnglish = async (teluguText) => {
    try {
      const response = await fetch(TELUGU_TO_ENGLISH_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "6571be3c4e7d42484da6352e",
          task: "translation",
          input: [{ source: teluguText }],
          userId: null
        }),
      });

      const data = await response.json();
      return data.output[0]?.target || "Translation failed.";
    } catch (error) {
      console.error("❌ Error translating Telugu to English:", error);
      return "Translation failed.";
    }
  };

  // ✅ Function to Modify and Fill the DOCX File
  const fillDocxFile = async () => {
    if (!uploadedDoc) {
      alert("Please upload a DOCX file first!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;

      // ✅ Extract text from DOCX again
      const result = await mammoth.extractRawText({ arrayBuffer });
      let docText = result.value.trim();

      // ✅ Replace blanks in the text with English translations
      Object.keys(formData).forEach((key, index) => {
        const { english } = formData[key];
        docText = docText.replace("__________", english || "N/A");
      });

      // ✅ Create a new DOCX with modified text
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docText.split("\n").map(line => new Paragraph({ children: [new TextRun(line)] })),
          },
        ],
      });

      try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "filled_document.docx");
        alert("✅ DOCX file has been successfully modified and downloaded!");
      } catch (error) {
        console.error("❌ Error generating filled DOCX:", error);
        alert("Error modifying the document.");
      }
    };

    reader.readAsArrayBuffer(uploadedDoc);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Upload DOCX File</h2>
      <input type="file" accept=".docx" onChange={handleFileUpload} className="mb-4" />
      <button className="bg-gray-700 text-white px-4 py-2 rounded" onClick={fillDocxFile}>
        Fill & Download DOCX
      </button>

      {loading && <p>Translating text...</p>}

      {translatedLines.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mt-4">Fill the Blanks Using Voice</h3>
          {translatedLines.map((line, index) => (
            <div key={index} className="mb-4">
              <label className="block text-white font-bold">{line}</label>

              <div className="flex items-center">
                <input
                  type="text"
                  value={voiceResponses[index] || ""}
                  readOnly
                  className="bg-gray-700 text-white px-4 py-2 rounded flex-grow"
                />

                {/* ✅ Speak Button to Record */}
                <button
                  className={`ml-2 px-4 py-2 rounded ${
                    recordingIndex === index ? "bg-red-600" : "bg-blue-600"
                  } text-white`}
                  onClick={() => handleVoiceInput(index)}
                >
                  {recordingIndex === index ? "🛑 Stop" : "🎙 Speak"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocxProcessor;
