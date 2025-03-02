import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ✅ ULCA Translation API Details
const TRANSLATION_API_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/compute";
const MODEL_ID = "67b8742e7d193a1beb4b8621"; // Your model ID

router.post("/translate", async (req, res) => {
  try {
    const { text } = req.body;

    console.log("Received text for translation:", text);

    const requestData = {
      modelId: MODEL_ID,
      task: "translation",
      input: [{ source: text }],
      userId: null,
    };

    console.log("Sending request to ULCA API:", JSON.stringify(requestData, null, 2));

    const response = await axios.post(TRANSLATION_API_URL, requestData, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("Received response from ULCA API:", JSON.stringify(response.data, null, 2));

    const translatedText = response.data?.output?.[0]?.target || "Translation failed.";

    res.json({ translatedText });
  } catch (error) {
    console.error("Translation API Error:", error);
    res.status(500).json({ error: "Failed to translate text." });
  }
});

export default router;
