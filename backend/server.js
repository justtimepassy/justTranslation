import express from "express";
import cors from "cors";
import { PORT } from "./config/config.js";
import translationRoutes from "./routes/translationRoutes.js"; // ✅ Import translation route
import speechTranslationRoutes from "./routes/speechTranslationRoutes.js"; // ✅ New Route




const app = express();

// ✅ Enable CORS for frontend communication
app.use(cors({
  origin: "http://localhost:5173",
  methods: "GET,POST",
  allowedHeaders: "Content-Type"
}));

app.use(express.json());

// ✅ Register API Route
app.use("/api", translationRoutes); // ✅ Ensure this line is present
app.use("/api", speechTranslationRoutes);

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
