router.post("/generate-hints", async (req, res) => {
    try {
      const { blanks } = req.body;
  
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an AI assistant that provides hints for filling in blanks in a document. Provide short and clear hints specific to each blank." },
          ...blanks.map(blank => ({
            role: "user",
            content: `The form field is "${blank.label}". Generate a brief, clear, and relevant hint for what should be entered in this blank. Keep it short and precise.`,
          }))
        ],
        max_tokens: 50,
      });
  
      res.json({ hints: response.choices.map(choice => choice.message.content.trim()) });
    } catch (error) {
      console.error("Groq API Error:", error);
      res.status(500).json({ error: "Failed to generate hints" });
    }
  });
  