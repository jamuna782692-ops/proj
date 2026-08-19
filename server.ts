import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 25mb payload for document scans/photos
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Gemini Client Initialization (Server-side only)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY'),
    });
  });

  // AI Document Analysis & Auto-Extraction Endpoint
  app.post('/api/documents/analyze', async (req, res) => {
    try {
      const { imageBase64, mimeType, documentText, fileName } = req.body;

      if (!imageBase64 && !documentText) {
        return res.status(400).json({ error: 'Missing document image or text content' });
      }

      if (!ai || !geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY') {
        // Fallback intelligent heuristics if Gemini Key is not set
        const simulatedResult = generateSmartFallbackExtraction(fileName || 'Document', documentText || '');
        return res.json({
          success: true,
          data: simulatedResult,
          source: 'local_heuristic',
        });
      }

      const prompt = `You are an expert personal document organization assistant. Analyze this uploaded document (image or text) and accurately extract all key identification, warranty, certificate, insurance, or legal details.
Identify whether this document has an expiration date, renewal requirements, holder name, document/policy ID, and issuing authority.
Format the output strictly according to the requested JSON schema.
If an issue date or expiration date is present, format as YYYY-MM-DD. If it does not expire (e.g. birth certificate, diploma, lifetime warranty), set isLifetime: true and expiryDate: null.`;

      const contentsParts: any[] = [];

      if (imageBase64) {
        // Clean base64 header if present
        const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
        contentsParts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      if (documentText) {
        contentsParts.push({
          text: `Document text content / notes:\n${documentText}`,
        });
      }

      contentsParts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: { parts: contentsParts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Concise, clear document title (e.g. US Passport, GEICO Auto Insurance, Dell XPS 15 Warranty, Master of Science Degree)',
              },
              category: {
                type: Type.STRING,
                description: 'Best matching category: identification, certificates, insurance, warranties, medical, financial, vehicles, or other',
              },
              documentNumber: {
                type: Type.STRING,
                description: 'Document ID number, policy number, serial number, or license number if visible',
              },
              holderName: {
                type: Type.STRING,
                description: 'Full name of the document owner / holder / insured party',
              },
              issuer: {
                type: Type.STRING,
                description: 'Issuing government agency, company, university, or insurer',
              },
              issueDate: {
                type: Type.STRING,
                description: 'Issue date in YYYY-MM-DD format if available, otherwise empty string',
              },
              expiryDate: {
                type: Type.STRING,
                description: 'Expiration date or warranty end date in YYYY-MM-DD format if available, otherwise empty string',
              },
              isLifetime: {
                type: Type.BOOLEAN,
                description: 'True if this document does not expire (e.g., birth certificate, diploma, lifetime warranty)',
              },
              reminderDaysBefore: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: 'Recommended reminder triggers in days before expiration (e.g., [90, 30, 7])',
              },
              summary: {
                type: Type.STRING,
                description: 'Concise 1-2 sentence overview of document purpose and key terms or coverage',
              },
              renewalInstructions: {
                type: Type.STRING,
                description: 'Actionable tips for renewal, maintenance, or claims if applicable',
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key relevant search tags (e.g. ["Travel", "Govt ID", "Primary"])',
              },
              customFields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                  },
                  required: ['label', 'value'],
                },
                description: 'Additional extracted key-value pairs (e.g. Coverage Amount, Support Contact, Deductible, Model Number)',
              },
            },
            required: ['title', 'category', 'isLifetime', 'summary'],
          },
        },
      });

      const textResponse = response.text;
      if (!textResponse) {
        throw new Error('Empty response from AI model');
      }

      const parsedData = JSON.parse(textResponse);
      return res.json({
        success: true,
        data: parsedData,
        source: 'gemini_ai',
      });
    } catch (err: any) {
      console.error('Gemini document extraction error:', err);
      // Fallback on error
      const fallback = generateSmartFallbackExtraction(req.body.fileName || 'Scanned Document', req.body.documentText || '');
      return res.json({
        success: true,
        data: fallback,
        source: 'fallback_error_recovery',
        errorNote: err.message,
      });
    }
  });

  // AI Smart Advisor / Expiration Audit endpoint
  app.post('/api/documents/audit-advice', async (req, res) => {
    try {
      const { documents } = req.body;
      if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({ error: 'Documents list required' });
      }

      if (!ai || !geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY') {
        return res.json({
          success: true,
          insights: generateQuickAuditInsights(documents),
          source: 'local_engine',
        });
      }

      const docsSummary = documents.map(d => ({
        title: d.title,
        category: d.category,
        holderName: d.holderName,
        issuer: d.issuer,
        expiryDate: d.expiryDate,
        isLifetime: d.isLifetime,
        status: d.status,
      }));

      const prompt = `Review these user documents and expiration statuses. Provide a structured audit:
1. Missing essential documents every individual/family should have (e.g., updated Will, Health Proxy, Passport renewal if expiring within 6 months).
2. Actionable advice on upcoming expirations, renewal timelines, or warranty checkups.
3. Security & organization recommendations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          { text: `Current User Documents:\n${JSON.stringify(docsSummary, null, 2)}` },
          { text: prompt }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urgencyScore: { type: Type.STRING, description: 'Low, Moderate, or High' },
              urgentWarnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key immediate items needing attention',
              },
              recommendedMissingDocs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    priority: { type: Type.STRING },
                  },
                  required: ['title', 'category', 'reason'],
                },
              },
              generalAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['urgencyScore', 'urgentWarnings', 'recommendedMissingDocs', 'generalAdvice'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        insights: parsed,
        source: 'gemini_ai',
      });
    } catch (err: any) {
      console.error('Audit advice error:', err);
      return res.json({
        success: true,
        insights: generateQuickAuditInsights(req.body.documents || []),
        source: 'fallback_engine',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DocVault Server running on http://localhost:${PORT}`);
  });
}

// Fallback smart parser for local heuristic extraction
function generateSmartFallbackExtraction(fileName: string, text: string) {
  const lower = (fileName + ' ' + text).toLowerCase();
  
  let category = 'other';
  let title = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  let isLifetime = false;
  let reminderDaysBefore = [90, 30, 7];

  if (lower.includes('passport')) {
    category = 'identification';
    title = 'Passport Document';
  } else if (lower.includes('license') || lower.includes('driver')) {
    category = 'identification';
    title = "Driver's License";
  } else if (lower.includes('insurance') || lower.includes('policy') || lower.includes('geico') || lower.includes('state farm')) {
    category = 'insurance';
    title = 'Insurance Policy Document';
  } else if (lower.includes('warranty') || lower.includes('receipt') || lower.includes('applecare')) {
    category = 'warranties';
    title = 'Product Warranty & Proof of Purchase';
  } else if (lower.includes('degree') || lower.includes('diploma') || lower.includes('certificate') || lower.includes('birth')) {
    category = 'certificates';
    title = 'Official Certificate';
    if (lower.includes('birth') || lower.includes('degree')) isLifetime = true;
  } else if (lower.includes('health') || lower.includes('vaccine') || lower.includes('medical') || lower.includes('dental')) {
    category = 'medical';
    title = 'Medical Record';
  } else if (lower.includes('tax') || lower.includes('bank') || lower.includes('deed') || lower.includes('lease')) {
    category = 'financial';
    title = 'Financial & Legal Agreement';
  }

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    category,
    documentNumber: '',
    holderName: '',
    issuer: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: isLifetime ? '' : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isLifetime,
    reminderDaysBefore,
    summary: 'Document uploaded and organized in your personal vault.',
    renewalInstructions: isLifetime ? 'Perpetual document. Keep copy safe.' : 'Check renewal requirements 30-60 days before expiration.',
    tags: [category.toUpperCase(), 'Uploaded'],
    customFields: [],
  };
}

function generateQuickAuditInsights(documents: any[]) {
  const now = new Date();
  const expiringSoon = documents.filter(d => {
    if (d.isLifetime || !d.expiryDate) return false;
    const diff = (new Date(d.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 60;
  });
  const expired = documents.filter(d => {
    if (d.isLifetime || !d.expiryDate) return false;
    return new Date(d.expiryDate).getTime() < now.getTime();
  });

  const missing: any[] = [];
  const hasPassport = documents.some(d => d.title.toLowerCase().includes('passport'));
  const hasInsurance = documents.some(d => d.category === 'insurance');
  const hasID = documents.some(d => d.category === 'identification');

  if (!hasPassport) {
    missing.push({
      title: 'International Passport',
      category: 'identification',
      reason: 'Crucial for international travel and high-security primary identity verification.',
      priority: 'High',
    });
  }
  if (!hasInsurance) {
    missing.push({
      title: 'Health / Life / Property Insurance',
      category: 'insurance',
      reason: 'Essential emergency coverage policies should be archived for quick claims access.',
      priority: 'Medium',
    });
  }
  if (!hasID) {
    missing.push({
      title: "Government Photo ID / Driver's License",
      category: 'identification',
      reason: 'Primary daily identification for legal and travel purposes.',
      priority: 'High',
    });
  }

  return {
    urgencyScore: expired.length > 0 ? 'High' : expiringSoon.length > 0 ? 'Moderate' : 'Low',
    urgentWarnings: [
      ...(expired.map(d => `"${d.title}" has expired! Action required.`)),
      ...(expiringSoon.map(d => `"${d.title}" will expire soon on ${d.expiryDate}.`)),
    ],
    recommendedMissingDocs: missing,
    generalAdvice: [
      'Enable calendar sync for high-value renewals like passports and insurance policies.',
      'Keep backup digital scans of both front and back sides of identification cards.',
      'Check warranty terms before paying for out-of-pocket electronics or appliance repairs.',
    ],
  };
}

startServer();
