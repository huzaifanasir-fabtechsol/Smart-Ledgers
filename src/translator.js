
import { API_BASE_URL } from './config';

export const translateText = async (text, targetLang) => {
  if (targetLang === 'en' || !text) return text;
  
  try {
    const response = await fetch(`${API_BASE_URL}/revenue/translate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_lang: targetLang })
    });
    const data = await response.json();
    return data.text || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

export const translateBatch = async (texts, targetLang) => {
  if (targetLang === 'en' || !texts.length) return texts;
  
  try {
    const response = await fetch(`${API_BASE_URL}/revenue/translate-batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target_lang: targetLang })
    });
    const data = await response.json();
    return data.texts || texts;
  } catch (error) {
    console.error('Translation error:', error);
    return texts;
  }
};
