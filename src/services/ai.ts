export const WORKER_URL = 'https://dossier-rani-ai.dossierrani.workers.dev';

const TIMEOUT_MS = 30_000;

async function workerFetch(body: object): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('Délai dépassé — vérifie ta connexion');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export type AiLang = 'fr' | 'darija';

export async function explainDocument(
  documentLabel: string,
  procedureTitle: string,
  lang: AiLang = 'fr',
): Promise<string> {
  const res = await workerFetch({ type: 'explain', documentLabel, procedureTitle, lang });
  if (!res.ok) throw new Error(`Worker error ${res.status}`);
  const data = await res.json() as { explanation?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.explanation) throw new Error('Réponse vide');
  return data.explanation;
}

export interface DiagnosticStep {
  id: string;
  reason: string;
}

export interface DiagnosticResult {
  intro: string;
  steps: DiagnosticStep[];
}

export async function getDiagnostic(situation: string): Promise<DiagnosticResult> {
  const res = await workerFetch({ type: 'diagnostic', situation });
  if (!res.ok) throw new Error(`Worker error ${res.status}`);
  const data = await res.json() as DiagnosticResult & { error?: string };
  if (data.error) throw new Error(data.error);
  return { intro: data.intro ?? '', steps: data.steps ?? [] };
}

export interface OcrResult {
  documentType: 'CIN' | 'Passeport' | 'PermisConduire' | 'CarteGrise' | 'Autre';
  nom:            string | null;
  prenom:         string | null;
  dateNaissance:  string | null;
  dateExpiration: string | null;
  numeroDocument: string | null;
  nationalite:    string | null;
}

export async function analyzeDocument(imageBase64: string): Promise<OcrResult> {
  const res = await workerFetch({ type: 'ocr', imageBase64 });
  if (!res.ok) throw new Error(`Worker error ${res.status}`);
  const data = await res.json() as { extracted?: OcrResult; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.extracted) throw new Error('Extraction vide');
  return data.extracted;
}

export type LetterType = 'reclamation' | 'delai' | 'documents' | 'explication' | 'aide';

export interface LetterResult {
  letter: string;
  subject: string;
}

export async function generateLetter(
  situation: string,
  letterType: LetterType = 'reclamation',
  city: string = 'Casablanca',
): Promise<LetterResult> {
  const res = await workerFetch({ type: 'letter', situation, letterType, city });
  if (!res.ok) throw new Error(`Worker error ${res.status}`);
  const data = await res.json() as LetterResult & { error?: string };
  if (data.error) throw new Error(data.error);
  return { letter: data.letter ?? '', subject: data.subject ?? '' };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
  const res = await workerFetch({ type: 'chat', messages });
  if (!res.ok) throw new Error(`Worker error ${res.status}`);
  const data = await res.json() as { reply?: string; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.reply) throw new Error('Réponse vide');
  return data.reply;
}

export async function searchByIntent(query: string): Promise<string[]> {
  const res = await workerFetch({ type: 'search', query });
  if (!res.ok) throw new Error(`Worker error ${res.status}`);
  const data = await res.json() as { procedureIds?: string[]; error?: string };
  if (data.error) throw new Error(data.error);
  return data.procedureIds ?? [];
}
