import express from "express";
import axios from "axios";

const router = express.Router();

// ✅ ULCA APIs
const ASR_API_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/asr/v1/model/compute"; // Telugu Speech-to-Text
const TRANSLATION_API_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/compute"; // Telugu → English Translation

// ✅ New Route for Speech-to-English Translation
router.post("/speech-to-english", async (req, res) => {
  try {
    const { audioBase64 } = req.body;

    // ✅ Step 1: Convert Speech to Telugu Text (ASR)
    const asrResponse = await axios.post(ASR_API_URL, {
      modelId: "660e9e144e7d42484da6356d", // Telugu ASR Model ID
      task: "asr",
      audioContent: audioBase64,
      source: "te",
      userId: null,
    }, { headers: { "Content-Type": "application/json" } });

    console.log("✅ ASR Response:", JSON.stringify(asrResponse.data, null, 2));

    if (!asrResponse.data.data?.source) throw new Error("ASR failed.");

    const teluguText = asrResponse.data.data.source;

    // ✅ Step 2: Translate Telugu Text to English
    const translationResponse = await axios.post(TRANSLATION_API_URL, {
      modelId: "6571be3c4e7d42484da6352e", // Telugu → English Model ID
      task: "translation",
      input: [{ source: teluguText }],
      userId: null,
    }, { headers: { "Content-Type": "application/json" } });

    console.log("✅ Translation Response:", JSON.stringify(translationResponse.data, null, 2));

    if (!translationResponse.data.output || translationResponse.data.output.length === 0) {
      throw new Error("Translation failed.");
    }

    const englishText = translationResponse.data.output[0].target;

    res.json({ teluguText, englishText });
  } catch (error) {
    console.error("❌ Speech-to-English API Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Failed to process speech translation." });
  }
});

export default router;
