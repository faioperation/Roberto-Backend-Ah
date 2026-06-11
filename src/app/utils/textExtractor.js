import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import mammoth from "mammoth";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

export const extractTextFromFile = async (filePath, mimetype) => {
  try {
    const fullPath = path.resolve(filePath);
    
    // Check if file exists
    await fs.access(fullPath);
    
    // TXT file extraction
    if (mimetype === "text/plain" || filePath.endsWith(".txt")) {
      const content = await fs.readFile(fullPath, "utf-8");
      return content.trim();
    }
    
    // PDF file extraction
    if (mimetype === "application/pdf" || filePath.endsWith(".pdf")) {
      const dataBuffer = await fs.readFile(fullPath);
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      await parser.destroy();
      return (result.text || "").trim();
    }
    
    // DOCX Word file extraction
    if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      filePath.endsWith(".docx")
    ) {
      const dataBuffer = await fs.readFile(fullPath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return (result.value || "").trim();
    }
    
    console.warn(`[TextExtractor] Unsupported file type for text extraction: ${mimetype} (${filePath})`);
    return "";
  } catch (error) {
    console.error(`[TextExtractor] Error extracting text from file ${filePath}:`, error.message);
    return "";
  }
};
