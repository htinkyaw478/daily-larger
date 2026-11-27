import type { Category, TransactionType } from '../types/ledger';
import { toLocalDateString } from '../utils/formatters';

export interface ParsedVoiceEntry {
  rawTranscript: string;
  amount: number | null;
  type: TransactionType | null;
  categoryId: number | null;
  paymentMethod: string | null;
  transactionDate: string | null;
  note: string;
}

const INCOME_KEYWORDS = [
  'income',
  'salary',
  'paycheck',
  'wage',
  'wages',
  'bonus',
  'earned',
  'earn',
  'received',
  'receive',
  'deposit',
  'freelance',
  'dividend',
  'refund',
  'revenue',
  'sold',
  'sales',
  'sale',
  'profit',
  'ဝင်ငွေ',
  'လစာ',
  'ရောင်းရငွေ',
  'ရငွေ',
  'အမြတ်',
  '수입',
  '급여',
  '월급',
  '매출',
  '보너스',
  '입금',
  '収入',
  '給料',
  '給与',
  '売上',
  'ボーナス',
  '入金',
];

const EXPENSE_KEYWORDS = [
  'expense',
  'spent',
  'spend',
  'paid',
  'pay',
  'bought',
  'buy',
  'purchase',
  'cost',
  'bill',
  'bills',
  'rent',
  'lunch',
  'dinner',
  'breakfast',
  'coffee',
  'coffees',
  'tea',
  'teas',
  'drink',
  'drinks',
  'snack',
  'snacks',
  'meal',
  'meals',
  'taxi',
  'taxis',
  'bus',
  'grab',
  'groceries',
  'grocery',
  'shopping',
  'medicine',
  'hospital',
  'ထွက်ငွေ',
  'ဝယ်',
  'သုံး',
  'ပေး',
  'စား',
  'နေ့လယ်စာ',
  'ကော်ဖီ',
  'လက်ဖက်ရည်',
  'ကားခ',
  'ဈေးဝယ်',
  'မီတာ',
  '지출',
  '결제',
  '소비',
  '식비',
  '점심',
  '저녁',
  '커피',
  '택시',
  '교통',
  '쇼핑',
  '월세',
  '支出',
  '支払い',
  '購入',
  'ランチ',
  '昼食',
  '夕食',
  'コーヒー',
  '食費',
  '交通費',
  '家賃',
];

const CATEGORY_KEYWORD_MAP: Array<{
  categoryName: string;
  type: TransactionType;
  keywords: string[];
}> = [
  {
    categoryName: 'Salary',
    type: 'income',
    keywords: ['salary', 'payroll', 'paycheck', 'wage', 'wages', 'bonus', 'လစာ', '급여', '월급', '給料', '給与'],
  },
  {
    categoryName: 'Sales',
    type: 'income',
    keywords: ['sales', 'sale', 'sold', 'customer', 'shop sales', 'ရောင်းရငွေ', 'ဆိုင်ရောင်း', '매출', '판매', '売上'],
  },
  {
    categoryName: 'Freelance',
    type: 'income',
    keywords: ['freelance', 'client', 'project', 'consulting', 'gig', 'အလွတ်တန်း', '프리랜서', '외주', 'フリーランス'],
  },
  {
    categoryName: 'Investment',
    type: 'income',
    keywords: ['investment', 'invest', 'dividend', 'interest', 'stock', 'stocks', 'crypto', 'ရင်းနှီး', 'အတိုး', '투자', '배당', '이자', '投資', '配当', '利息'],
  },
  {
    categoryName: 'Food & Dining',
    type: 'expense',
    keywords: [
      'food',
      'dining',
      'lunch',
      'dinner',
      'breakfast',
      'brunch',
      'coffee',
      'coffees',
      'tea',
      'teas',
      'snack',
      'snacks',
      'meal',
      'meals',
      'restaurant',
      'restaurants',
      'cafe',
      'cafes',
      'eat',
      'groceries',
      'grocery',
      'rice',
      'noodle',
      'noodles',
      'pizza',
      'burger',
      'burgers',
      'drink',
      'drinks',
      'အစားအသောက်',
      'နေ့လယ်စာ',
      'ညစာ',
      'မနက်စာ',
      'ထမင်း',
      'ဟင်း',
      'မုန့်',
      'ကော်ဖီ',
      'လက်ဖက်ရည်',
      '식비',
      '점심',
      '저녁',
      '아침',
      '밥',
      '식사',
      '음식',
      '커피',
      '카페',
      '간식',
      '마트',
      '食費',
      'ランチ',
      '昼食',
      '夕食',
      '朝食',
      'ご飯',
      '食事',
      'コーヒー',
      'カフェ',
      'おやつ',
    ],
  },
  {
    categoryName: 'Transport',
    type: 'expense',
    keywords: [
      'transport',
      'taxi',
      'taxis',
      'cab',
      'grab',
      'uber',
      'bus',
      'buses',
      'train',
      'trains',
      'subway',
      'metro',
      'fuel',
      'gas',
      'petrol',
      'parking',
      'toll',
      'flight',
      'flights',
      'ticket',
      'tickets',
      'ride',
      'rides',
      'ခရီး',
      'ကားခ',
      'ဘတ်စ်',
      'တက္ကစီ',
      'ဓာတ်ဆီ',
      '교통',
      '택시',
      '버스',
      '지하철',
      '주유',
      '기름',
      '주차',
      '交通',
      'タクシー',
      '電車',
      'バス',
      '地下鉄',
      'ガソリン',
      '駐車',
    ],
  },
  {
    categoryName: 'Bills & Utilities',
    type: 'expense',
    keywords: [
      'bill',
      'bills',
      'utility',
      'utilities',
      'electric',
      'electricity',
      'water',
      'internet',
      'wifi',
      'phone',
      'mobile',
      'topup',
      'top-up',
      'subscription',
      'မီတာ',
      'ဘေလ်',
      'အင်တာနက်',
      'ဖုန်းဘေလ်',
      '공과금',
      '전기',
      '수도',
      '가스',
      '통신',
      '인터넷',
      '요금',
      '光熱費',
      '電気',
      '水道',
      '通信',
      '携帯',
      '請求',
    ],
  },
  {
    categoryName: 'Shopping',
    type: 'expense',
    keywords: [
      'shop',
      'shopping',
      'clothes',
      'clothing',
      'shirt',
      'shoes',
      'bag',
      'mall',
      'market',
      'amazon',
      'gift',
      'gifts',
      'ဈေးဝယ်',
      'အဝတ်',
      'ဖိနပ်',
      '쇼핑',
      '옷',
      '신발',
      '선물',
      '買い物',
      '服',
      '靴',
      'ギフト',
    ],
  },
  {
    categoryName: 'Health',
    type: 'expense',
    keywords: [
      'health',
      'hospital',
      'clinic',
      'doctor',
      'pharmacy',
      'medicine',
      'medical',
      'dental',
      'dentist',
      'vitamin',
      'gym',
      'ကျန်းမာရေး',
      'ဆေး',
      'ဆေးခန်း',
      'ဆေးရုံ',
      '건강',
      '병원',
      '약국',
      '약',
      '의료',
      '치과',
      '健康',
      '病院',
      '薬局',
      '薬',
      '医療',
      '歯医者',
    ],
  },
  {
    categoryName: 'Home & Rent',
    type: 'expense',
    keywords: [
      'rent',
      'home',
      'house',
      'apartment',
      'room',
      'furniture',
      'cleaning',
      'repair',
      'maintenance',
      'အိမ်ငှား',
      'အိမ်လခ',
      'အိမ်သုံး',
      '월세',
      '전세',
      '관리비',
      '집',
      '가구',
      '家賃',
      '住居',
      '住宅',
      '部屋',
      '家具',
    ],
  },
];

const PAYMENT_KEYWORD_RULES: Array<{ method: string; patterns: RegExp[] }> = [
  { method: 'KBZPay', patterns: [/\bkbz\s*pay\b/i, /\bk\s*pay\b/i, /\bkbz\b/i] },
  { method: 'WavePay', patterns: [/\bwave\s*pay\b/i, /\bwave\s*money\b/i, /\bwave\b/i] },
  {
    method: 'Bank Transfer',
    patterns: [
      /\bbank\s*transfer\b/i,
      /\bwire\s*transfer\b/i,
      /\bbank\b/i,
      /\btransfer\b/i,
      /ဘဏ်လွှဲ/u,
      /ဘဏ်/u,
      /계좌이체/u,
      /계좌/u,
      /이체/u,
      /銀行振込/u,
      /振込/u,
    ],
  },
  {
    method: 'Card',
    patterns: [
      /\bcredit\s*card\b/i,
      /\bdebit\s*card\b/i,
      /\bvisa\b/i,
      /\bmastercard\b/i,
      /\bcard\b/i,
      /ကတ်/u,
      /카드/u,
      /カード/u,
    ],
  },
  {
    method: 'Cash',
    patterns: [/\bcash\b/i, /ငွေသား/u, /현금/u, /現金/u],
  },
];

const SMALL_NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const SCALE_WORDS: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  million: 1000000,
};

const MYANMAR_UNIT_WORDS: Record<string, number> = {
  'တစ်': 1,
  'တ': 1,
  'နှစ်': 2,
  'သုံး': 3,
  'လေး': 4,
  'ငါး': 5,
  'ခြောက်': 6,
  'ခုနစ်': 7,
  'ခုနှစ်': 7,
  'ရှစ်': 8,
  'ကိုး': 9,
  'ဆယ်': 10,
};

const MYANMAR_SCALE_WORDS: Record<string, number> = {
  'ရာ': 100,
  'ထောင်': 1000,
  'သောင်း': 10000,
  'သိန်း': 100000,
  'သန်း': 1000000,
};

function normalizeDigits(text: string): string {
  return text
    .replace(/[\u1040-\u1049]/g, (ch) => String(ch.charCodeAt(0) - 0x1040))
    .replace(/[\uFF10-\uFF19]/g, (ch) => String(ch.charCodeAt(0) - 0xff10));
}

function containsKeyword(lowerText: string, keyword: string): boolean {
  if (/^[a-z0-9\s-]+$/i.test(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerText);
  }
  return lowerText.includes(keyword.toLowerCase());
}

function parseSpokenNumberWords(text: string): { value: number; matchedText: string } | null {
  const tokens = text.split(/\s+/);
  let best: { value: number; start: number; end: number } | null = null;

  for (let i = 0; i < tokens.length; i++) {
    let current = 0;
    let total = 0;
    let consumed = 0;
    let hasScale = false;

    for (let j = i; j < tokens.length; j++) {
      const clean = tokens[j].toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '');
      if (clean === 'and' && consumed > 0) {
        consumed++;
        continue;
      }
      if (clean in SMALL_NUMBER_WORDS) {
        current += SMALL_NUMBER_WORDS[clean];
        consumed++;
      } else if (clean in SCALE_WORDS) {
        const scale = SCALE_WORDS[clean];
        hasScale = true;
        if (scale === 100) {
          current = (current || 1) * 100;
        } else {
          total += (current || 1) * scale;
          current = 0;
        }
        consumed++;
      } else {
        break;
      }
    }

    const finalVal = total + current;
    if (consumed > 0 && finalVal > 0 && (hasScale || finalVal >= 10 || consumed >= 2)) {
      best = { value: finalVal, start: i, end: i + consumed };
      break;
    }
  }

  if (!best) return null;
  return {
    value: best.value,
    matchedText: tokens.slice(best.start, best.end).join(' '),
  };
}

function parseMyanmarSpokenAmount(text: string): { value: number; matchedText: string } | null {
  const partRegex =
    /(တစ်|တ|နှစ်|သုံး|လေး|ငါး|ခြောက်|ခုနစ်|ခုနှစ်|ရှစ်|ကိုး|ဆယ်)\s*(သန်း|သိန်း|သောင်း|ထောင်|ရာ)[့]?(ခွဲ)?(?=[\s,.;:!?()\-/]|တစ်|နှစ်|သုံး|လေး|ငါး|ခြောက်|ခုနစ်|ခုနှစ်|ရှစ်|ကိုး|ဆယ်|ကျပ်|$)/gu;

  const segments: Array<{
    start: number;
    end: number;
    scale: number;
    amount: number;
  }> = [];

  let match: RegExpExecArray | null;
  while ((match = partRegex.exec(text)) !== null) {
    const unit = MYANMAR_UNIT_WORDS[match[1]];
    const scale = MYANMAR_SCALE_WORDS[match[2]];
    if (!unit || !scale) continue;
    const halfBonus = match[3] ? 0.5 * scale : 0;
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      scale,
      amount: unit * scale + halfBonus,
    });
  }

  if (segments.length === 0) return null;

  // Combine consecutive descending Myanmar unit+scale phrases like "တစ်သိန်း ငါးသောင်း"
  let groupStart = segments[0].start;
  let groupEnd = segments[0].end;
  let groupTotal = segments[0].amount;
  let prevScale = segments[0].scale;

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const between = text.slice(groupEnd, seg.start);
    if (/^\s*$/.test(between) && seg.scale < prevScale) {
      groupEnd = seg.end;
      groupTotal += seg.amount;
      prevScale = seg.scale;
    } else {
      break;
    }
  }

  return {
    value: groupTotal,
    matchedText: text.slice(groupStart, groupEnd),
  };
}

function extractNumericAmount(text: string): { amount: number | null; matchedSpan: string | null } {
  const parseScaled = (
    numStr: string,
    asciiScale?: string,
    myScale?: string,
    halfMarker?: string
  ): { amount: number; scale: number } | null => {
    const base = Number(numStr.replace(/,/g, ''));
    if (!Number.isFinite(base) || base <= 0) return null;
    let mult = 1;
    if (asciiScale) {
      const s = asciiScale.toLowerCase();
      mult = s === 'k' || s === 'thousand' ? 1000 : s === 'hundred' ? 100 : 1;
    } else if (myScale && myScale in MYANMAR_SCALE_WORDS) {
      mult = MYANMAR_SCALE_WORDS[myScale];
    }
    const halfBonus = halfMarker && mult > 1 ? 0.5 * mult : 0;
    return {
      amount: Number((base * mult + halfBonus).toFixed(2)),
      scale: mult,
    };
  };

  const scalePattern =
    '(?:\\s*(?:(k|thousand|hundred)\\b|(ရာ|ထောင်|သောင်း|သိန်း|သန်း)[့]?(ခွဲ)?(?=[\\s,.;:!?()\\-/]|ကျပ်|mmk|ks|\\d|$)))?';

  const genericRegex = new RegExp(
    `\\b(\\d[\\d,]*(?:\\.\\d+)?)${scalePattern}`,
    'giu'
  );
  const candidates: Array<{
    amount: number;
    scale: number;
    start: number;
    end: number;
  }> = [];
  let match: RegExpExecArray | null;
  while ((match = genericRegex.exec(text)) !== null) {
    // Ignore ISO date segments like 2026-11-27
    const before = text[match.index - 1] ?? '';
    const after = text[match.index + match[0].length] ?? '';
    if (before === '-' || after === '-') continue;
    const parsed = parseScaled(match[1], match[2], match[3], match[4]);
    if (parsed !== null) {
      candidates.push({
        amount: parsed.amount,
        scale: parsed.scale,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Merge adjacent descending Myanmar digit+scale chunks like "1 သိန်း 5 သောင်း" -> 150000
  const prefixCurrencyRe =
    /(?:[$₩¥]|\b(?:ks|mmk|kyats?|won|krw|yen|jpy|dollars?|usd)\b|ကျပ်|원|엔|円)\s*$/iu;
  const postfixCurrencyRe =
    /^\s*(?:\b(?:ks|mmk|kyats?|won|krw|yen|jpy|dollars?|usd)\b|ကျပ်|원|엔|円|[$₩¥])(?=$|[\s,.;:!?()\-/]|[^a-z0-9])/iu;

  const merged: Array<{ amount: number; matchedSpan: string; hasCurrency: boolean }> = [];
  for (let i = 0; i < candidates.length; i++) {
    let total = candidates[i].amount;
    let spanStart = candidates[i].start;
    let spanEnd = candidates[i].end;
    let prevScale = candidates[i].scale;

    while (
      i + 1 < candidates.length &&
      prevScale >= 100 &&
      candidates[i + 1].scale >= 100 &&
      candidates[i + 1].scale < prevScale &&
      /^\s*$/.test(text.slice(spanEnd, candidates[i + 1].start))
    ) {
      i++;
      total += candidates[i].amount;
      spanEnd = candidates[i].end;
      prevScale = candidates[i].scale;
    }

    let hasCurrency = false;
    const prefixMatch = prefixCurrencyRe.exec(text.slice(0, spanStart));
    if (prefixMatch) {
      hasCurrency = true;
      spanStart -= prefixMatch[0].length;
    }
    const postfixMatch = postfixCurrencyRe.exec(text.slice(spanEnd));
    if (postfixMatch) {
      hasCurrency = true;
      spanEnd += postfixMatch[0].length;
    }

    merged.push({
      amount: total,
      matchedSpan: text.slice(spanStart, spanEnd),
      hasCurrency,
    });
  }

  if (merged.length > 0) {
    const currencyTagged = merged.filter((c) => c.hasCurrency);
    const pool = currencyTagged.length > 0 ? currencyTagged : merged;
    // Prefer amounts >= 10 or the last explicit number (e.g., "2 coffees 6000")
    const significant = pool.filter((c) => c.amount >= 10);
    const chosen =
      significant.length > 0 ? significant[significant.length - 1] : pool[pool.length - 1];
    return { amount: chosen.amount, matchedSpan: chosen.matchedSpan };
  }

  const spoken = parseSpokenNumberWords(text);
  if (spoken) {
    return { amount: spoken.value, matchedSpan: spoken.matchedText };
  }

  const mySpoken = parseMyanmarSpokenAmount(text);
  if (mySpoken) {
    return { amount: mySpoken.value, matchedSpan: mySpoken.matchedText };
  }

  return { amount: null, matchedSpan: null };
}

function extractDateFromText(
  lowerText: string,
  referenceDate: Date
): { date: string | null; stripPatterns: RegExp[] } {
  const yesterdayPatterns = [/\byesterday\b/gi, /မနေ့က/gu, /어제/gu, /昨日/gu];
  const todayPatterns = [/\btoday\b/gi, /ယနေ့/gu, /ဒီနေ့/gu, /오늘/gu, /今日/gu];

  for (const pat of yesterdayPatterns) {
    if (pat.test(lowerText)) {
      const d = new Date(referenceDate.getTime());
      d.setDate(d.getDate() - 1);
      return { date: toLocalDateString(d), stripPatterns: yesterdayPatterns };
    }
  }

  for (const pat of todayPatterns) {
    if (pat.test(lowerText)) {
      return { date: toLocalDateString(referenceDate), stripPatterns: todayPatterns };
    }
  }

  return { date: null, stripPatterns: [] };
}

function cleanNoteText(
  normalizedText: string,
  matchedAmountSpan: string | null,
  dateStripPatterns: RegExp[],
  paymentPatterns: RegExp[]
): string {
  let result = normalizedText;

  if (matchedAmountSpan) {
    result = result.replace(matchedAmountSpan, ' ');
  }

  for (const pat of dateStripPatterns) {
    result = result.replace(new RegExp(pat.source, pat.flags.includes('g') ? pat.flags : `${pat.flags}g`), ' ');
  }

  for (const pat of paymentPatterns) {
    result = result.replace(new RegExp(pat.source, pat.flags.includes('g') ? pat.flags : `${pat.flags}g`), ' ');
  }

  // Strip currency units, payment prepositions, and generic command lead-ins
  result = result
    .replace(/\b(?:ks|mmk|kyats?|won|krw|yen|jpy|dollars?|usd)\b/gi, ' ')
    .replace(/(?:[$₩¥]|ကျပ်|원|엔|円)/gu, ' ')
    .replace(/\b(?:paid\s+for|spent\s+on|paid\s+by|paid\s+with|paid|spent|bought|received|earned|expense|income)\b/gi, ' ')
    .replace(/\b(?:by|with|via|using|for)\b\s*$/gi, ' ')
    .replace(/(?:\s+(?:နဲ့|နှင့်|ဖြင့်|မှ))+\s*$/gu, ' ')
    .replace(/^\s*(?:for|on|by|with|via)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .trim();

  if (result.length > 0 && /^[a-z]/.test(result)) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result.slice(0, 255);
}

/**
 * Parses a spoken voice transcript into structured entry fields compatible with EntryDrawer.
 */
export function parseVoiceTranscript(
  rawTranscript: string,
  categories: Category[],
  referenceDate: Date = new Date()
): ParsedVoiceEntry {
  const trimmed = rawTranscript.trim();
  if (!trimmed) {
    return {
      rawTranscript: '',
      amount: null,
      type: null,
      categoryId: null,
      paymentMethod: null,
      transactionDate: null,
      note: '',
    };
  }

  const normalized = normalizeDigits(trimmed);
  const lower = normalized.toLowerCase();

  const { date: transactionDate, stripPatterns: dateStripPatterns } = extractDateFromText(
    lower,
    referenceDate
  );

  let paymentMethod: string | null = null;
  let paymentPatterns: RegExp[] = [];
  for (const rule of PAYMENT_KEYWORD_RULES) {
    if (rule.patterns.some((p) => p.test(normalized))) {
      paymentMethod = rule.method;
      paymentPatterns = rule.patterns;
      break;
    }
  }

  const { amount, matchedSpan } = extractNumericAmount(normalized);

  // Explicit income/expense intent keywords
  const hasIncomeKeyword = INCOME_KEYWORDS.some((kw) => containsKeyword(lower, kw));
  const hasExpenseKeyword = EXPENSE_KEYWORDS.some((kw) => containsKeyword(lower, kw));
  let explicitType: TransactionType | null = null;
  if (hasIncomeKeyword && !hasExpenseKeyword) {
    explicitType = 'income';
  } else if (hasExpenseKeyword && !hasIncomeKeyword) {
    explicitType = 'expense';
  }

  // Category matching (custom names first, then built-in keyword table)
  let matchedCategory: Category | undefined;
  const candidatePool = explicitType
    ? categories.filter((c) => c.type === explicitType)
    : categories;

  for (const cat of candidatePool) {
    if (
      containsKeyword(lower, cat.name) ||
      (cat.nameMy && containsKeyword(lower, cat.nameMy))
    ) {
      matchedCategory = cat;
      break;
    }
  }

  if (!matchedCategory) {
    for (const entry of CATEGORY_KEYWORD_MAP) {
      if (explicitType && entry.type !== explicitType) continue;
      if (entry.keywords.some((kw) => containsKeyword(lower, kw))) {
        matchedCategory = categories.find(
          (c) => c.name.toLowerCase() === entry.categoryName.toLowerCase() && c.type === entry.type
        );
        if (matchedCategory) break;
      }
    }
  }

  const resolvedType: TransactionType | null = explicitType ?? matchedCategory?.type ?? null;
  const note = cleanNoteText(normalized, matchedSpan, dateStripPatterns, paymentPatterns);

  return {
    rawTranscript: trimmed,
    amount,
    type: resolvedType,
    categoryId: matchedCategory?.id ?? null,
    paymentMethod,
    transactionDate,
    note,
  };
}
