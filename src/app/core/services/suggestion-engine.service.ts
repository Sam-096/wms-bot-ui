import { Injectable } from '@angular/core';
import { Language } from '../models/chat-message.model';

type Intent = 'INWARD' | 'OUTWARD' | 'STOCK' | 'GATE_PASS' | 'BOND' | 'REPORT' | 'GENERAL';

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  INWARD:    ['inward', 'grn', 'incoming', 'receive', 'pending inward', 'అందుకున్న', 'आवक'],
  OUTWARD:   ['outward', 'dispatch', 'delivery', 'send', 'నిర్గమన', 'जावक'],
  STOCK:     ['stock', 'inventory', 'items', 'quantity', 'low stock', 'నిల్వ', 'स्टॉक'],
  GATE_PASS: ['gate pass', 'vehicle', 'entry', 'exit', 'గేట్', 'गेट पास'],
  BOND:      ['bond', 'bonded', 'customs', 'బాండ్', 'बॉन्ड'],
  REPORT:    ['report', 'summary', 'analysis', 'నివేదిక', 'रिपोर्ट'],
  GENERAL:   [],
};

const SUGGESTIONS: Record<Intent, Record<Language, string[]>> = {
  INWARD: {
    en: ['Show all GRNs', 'Approve pending', 'New inward entry'],
    te: ['అన్ని GRNలు', 'Pending approve చేయి', 'కొత్త inward'],
    hi: ['सभी GRN देखें', 'Pending approve करें', 'नई inward एंट्री'],
    ta: ['GRN பட்டியல்', 'Pending approve', 'புதிய inward'],
    kn: ['ಎಲ್ಲಾ GRN', 'Pending approve', 'ಹೊಸ inward'],
    mr: ['सर्व GRN', 'Pending approve', 'नवीन inward'],
  },
  OUTWARD: {
    en: ['View dispatches', 'Pending outward', 'New dispatch'],
    te: ['Dispatches చూడు', 'Pending outward', 'కొత్త dispatch'],
    hi: ['सभी dispatch', 'Pending outward', 'नई dispatch'],
    ta: ['Dispatch பட்டியல்', 'Pending outward', 'புதிய dispatch'],
    kn: ['ಎಲ್ಲಾ dispatch', 'Pending outward', 'ಹೊಸ dispatch'],
    mr: ['सर्व dispatch', 'Pending outward', 'नवीन dispatch'],
  },
  STOCK: {
    en: ['Low stock items', 'Search item', 'Stock report'],
    te: ['తక్కువ stock', 'Item వెతుకు', 'Stock report'],
    hi: ['Low stock items', 'Item खोजें', 'Stock रिपोर्ट'],
    ta: ['குறைந்த stock', 'Item தேடு', 'Stock report'],
    kn: ['Low stock items', 'Item ಹುಡುಕು', 'Stock report'],
    mr: ['Low stock items', 'Item शोधा', 'Stock report'],
  },
  GATE_PASS: {
    en: ['Open gate passes', 'New gate pass', "Today's log"],
    te: ['Open gate passes', 'కొత్త gate pass', 'నేటి log'],
    hi: ['Open gate passes', 'नई gate pass', 'आज का log'],
    ta: ['Open gate passes', 'புதிய gate pass', 'இன்று log'],
    kn: ['Open gate passes', 'ಹೊಸ gate pass', 'ಇಂದಿನ log'],
    mr: ['Open gate passes', 'नवीन gate pass', 'आजचा log'],
  },
  BOND: {
    en: ['Active bonds', 'Bond expiry', 'Bond report'],
    te: ['Active bonds', 'Bond expiry', 'Bond report'],
    hi: ['Active bonds', 'Bond expiry', 'Bond report'],
    ta: ['Active bonds', 'Bond expiry', 'Bond report'],
    kn: ['Active bonds', 'Bond expiry', 'Bond report'],
    mr: ['Active bonds', 'Bond expiry', 'Bond report'],
  },
  REPORT: {
    en: ['Daily summary', 'Weekly report', 'Export data'],
    te: ['Daily summary', 'Weekly report', 'Export data'],
    hi: ['Daily summary', 'Weekly report', 'Export data'],
    ta: ['Daily summary', 'Weekly report', 'Export data'],
    kn: ['Daily summary', 'Weekly report', 'Export data'],
    mr: ['Daily summary', 'Weekly report', 'Export data'],
  },
  GENERAL: {
    en: ['Check stock', 'Gate pass status', 'Warehouse summary'],
    te: ['Stock చెక్ చేయి', 'Gate pass status', 'Warehouse summary'],
    hi: ['Stock check करें', 'Gate pass status', 'Warehouse summary'],
    ta: ['Stock சரிபார்', 'Gate pass status', 'Warehouse summary'],
    kn: ['Stock ಪರಿಶೀಲಿಸಿ', 'Gate pass status', 'Warehouse summary'],
    mr: ['Stock तपासा', 'Gate pass status', 'Warehouse summary'],
  },
};

@Injectable({ providedIn: 'root' })
export class SuggestionEngineService {
  getSuggestions(botResponse: string, language: Language): string[] {
    const intent = this.detectIntent(botResponse);
    return SUGGESTIONS[intent][language] ?? SUGGESTIONS[intent]['en'];
  }

  private detectIntent(text: string): Intent {
    const lower = text.toLowerCase();
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Intent, string[]][]) {
      if (intent === 'GENERAL') continue;
      if (keywords.some((kw) => lower.includes(kw))) return intent;
    }
    return 'GENERAL';
  }
}
