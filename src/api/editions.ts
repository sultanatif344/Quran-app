export interface UrduEdition {
  id: string
  /** Translator name in Urdu (shown to the reader). */
  nameUrdu: string
  /** Translator name in English (secondary). */
  nameEnglish: string
  note?: string
}

/**
 * Urdu translation editions available on api.alquran.cloud (verified).
 * Deliberately limited to Ahl-e-Sunnat wal Jama'at scholars; the API also offers
 * ur.jawadi and ur.najafi (Shia), which are intentionally excluded.
 */
export const URDU_EDITIONS: UrduEdition[] = [
  { id: 'ur.jalandhry', nameUrdu: 'فتح محمد جالندھری', nameEnglish: 'Fateh Muhammad Jalandhry', note: 'سب سے زیادہ رائج، تاج کمپنی کے مصاحف والا' },
  { id: 'ur.kanzuliman', nameUrdu: 'کنز الایمان — احمد رضا خان', nameEnglish: 'Kanz-ul-Iman (Ahmed Raza Khan)' },
  { id: 'ur.maududi', nameUrdu: 'سید ابوالاعلیٰ مودودی', nameEnglish: 'Abul A\'ala Maududi', note: 'تفہیم القرآن' },
  { id: 'ur.junagarhi', nameUrdu: 'محمد جوناگڑھی', nameEnglish: 'Muhammad Junagarhi' },
  { id: 'ur.ahmedali', nameUrdu: 'احمد علی', nameEnglish: 'Ahmed Ali' },
  { id: 'ur.qadri', nameUrdu: 'طاہر القادری', nameEnglish: 'Tahir ul Qadri', note: 'عرفان القرآن' },
]

export const DEFAULT_EDITION = 'ur.jalandhry'
