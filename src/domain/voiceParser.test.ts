import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from './ledgerLogic';
import { parseVoiceTranscript } from './voiceParser';

const REF_DATE = new Date(2026, 10, 27, 10, 0, 0); // 2026-11-27 local

describe('parseVoiceTranscript', () => {
  it('extracts expense amount, Food & Dining category, payment method, and note from English speech', () => {
    const parsed = parseVoiceTranscript(
      'Lunch iced coffee 5500 kyats by KBZPay',
      DEFAULT_CATEGORIES,
      REF_DATE
    );

    expect(parsed.amount).toBe(5500);
    expect(parsed.type).toBe('expense');
    expect(parsed.categoryId).toBe(6); // Food & Dining
    expect(parsed.paymentMethod).toBe('KBZPay');
    expect(parsed.note).toBe('Lunch iced coffee');
  });

  it('infers income type and Salary category from income phrases', () => {
    const parsed = parseVoiceTranscript(
      'Monthly salary 500,000 bank transfer',
      DEFAULT_CATEGORIES,
      REF_DATE
    );

    expect(parsed.amount).toBe(500000);
    expect(parsed.type).toBe('income');
    expect(parsed.categoryId).toBe(1); // Salary
    expect(parsed.paymentMethod).toBe('Bank Transfer');
    expect(parsed.note).toBe('Monthly salary');
  });

  it('parses spoken English number words and shorthand k multipliers', () => {
    const spoken = parseVoiceTranscript(
      'Taxi ride five thousand yesterday',
      DEFAULT_CATEGORIES,
      REF_DATE
    );
    expect(spoken.amount).toBe(5000);
    expect(spoken.type).toBe('expense');
    expect(spoken.categoryId).toBe(7); // Transport
    expect(spoken.transactionDate).toBe('2026-11-26');
    expect(spoken.note).toBe('Taxi ride');

    const shorthand = parseVoiceTranscript(
      'Dinner 12.5k with card',
      DEFAULT_CATEGORIES,
      REF_DATE
    );
    expect(shorthand.amount).toBe(12500);
    expect(shorthand.paymentMethod).toBe('Card');
    expect(shorthand.categoryId).toBe(6);
    expect(shorthand.note).toBe('Dinner');
  });

  it('normalizes Myanmar digits and matches Burmese, Korean, and Japanese speech', () => {
    const myanmar = parseVoiceTranscript(
      'နေ့လယ်စာ ၃၅၀၀ ကျပ် WavePay',
      DEFAULT_CATEGORIES,
      REF_DATE
    );
    expect(myanmar.amount).toBe(3500);
    expect(myanmar.type).toBe('expense');
    expect(myanmar.categoryId).toBe(6);
    expect(myanmar.paymentMethod).toBe('WavePay');

    const korean = parseVoiceTranscript(
      '점심 커피 6500원 카드 어제',
      DEFAULT_CATEGORIES,
      REF_DATE
    );
    expect(korean.amount).toBe(6500);
    expect(korean.type).toBe('expense');
    expect(korean.categoryId).toBe(6);
    expect(korean.paymentMethod).toBe('Card');
    expect(korean.transactionDate).toBe('2026-11-26');

    const japanese = parseVoiceTranscript(
      'タクシー 2400円 現金 今日',
      DEFAULT_CATEGORIES,
      REF_DATE
    );
    expect(japanese.amount).toBe(2400);
    expect(japanese.type).toBe('expense');
    expect(japanese.categoryId).toBe(7);
    expect(japanese.paymentMethod).toBe('Cash');
    expect(japanese.transactionDate).toBe('2026-11-27');
  });

  it('prefers monetary amount over item count and preserves unmatched note safely', () => {
    const parsed = parseVoiceTranscript(
      '2 coffees 4800',
      DEFAULT_CATEGORIES,
      REF_DATE
    );
    expect(parsed.amount).toBe(4800);
    expect(parsed.categoryId).toBe(6);
  });
});
