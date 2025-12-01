import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCoverLetterAnswer = async (question: string, keywords: string, resumeSummary: string): Promise<string> => {
  try {
    const prompt = `
      You are an expert career coach helping a student apply for an internship.
      
      Job Keywords: ${keywords}
      Candidate Skills: ${resumeSummary}
      
      The internship application asks the following question:
      "${question}"
      
      Write a professional, human-like, and persuasive answer (max 150 words). 
      Focus on value, enthusiasm, and specific skills. Do not include placeholders like [Your Name].
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate answer.";
  } catch (error) {
    console.error("Error generating answer:", error);
    return "Error: Unable to connect to AI service.";
  }
};

export const analyzeResume = async (resumeText: string): Promise<string> => {
     try {
    const prompt = `
      Analyze the following resume text and provide a concise summary of the candidate's top 5 technical skills and 3 soft skills.
      
      Resume Text:
      ${resumeText.substring(0, 2000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not analyze resume.";
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return "Error: Unable to analyze resume.";
  }
}
