import dotenv from "dotenv";

dotenv.config();

export const GQRO_API_KEY = process.env.GROQ_API_KEY;
export const PORT = process.env.PORT || 5002;
