export type OnboardingQuestionType = 'single' | 'multi' | 'text' | 'levelTargetSlider';

export type OnboardingQuestion = {
  id: string;
  answerKey: string;
  type: OnboardingQuestionType;
  title: string;
  description: string;
  options?: { label: string; value: string }[];
  layout?: 'vertical' | 'horizontal';
  textPlaceholder?: string;
};

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: 'preferredName',
    answerKey: 'preferredName',
    type: 'text',
    title: 'Size nasıl hitap etmemizi istersiniz?',
    description: 'Kısa bir ifade yeterli (ör. adınız veya tercih ettiğiniz hitap şekli).',
    textPlaceholder: 'Örn. Ali, A. Yılmaz…',
  },
  {
    id: 'clubMembership',
    answerKey: 'clubMembership',
    type: 'single',
    title: 'Herhangi bir Go derneğine veya üniversite topluluğuna üyeliğiniz var mı?',
    description: 'Size uygun seçeneği işaretleyin.',
    options: [
      { label: 'İstanbul Go Oyuncuları Derneği', value: 'istanbul-go' },
      { label: 'Ankara Go Oyuncuları Derneği', value: 'ankara-go' },
      { label: 'İzmir Go Oyuncuları Derneği', value: 'izmir-go' },
      { label: 'Eskişehir Go Oyuncuları Derneği', value: 'eskisehir-go' },
      { label: 'Türkiye Go Derneği', value: 'tdg' },
      { label: 'Çanakkale Go Topluluğu', value: 'canakkale-go' },
      { label: 'Antalya Go Topluluğu', value: 'antalya-go' },
      { label: 'Bursa Go Oyuncuları Derneği', value: 'bursa-go' },
      { label: 'ODTÜ Alpar Kılınç Go Topluluğu', value: 'odtu-go' },
      { label: 'Hacettepe Üniversitesi Go Topluluğu', value: 'hacettepe-go' },
      { label: 'Bilkent Üniversitesi Go Kulübü', value: 'bilkent-go' },
      { label: 'İYTE Go Topluluğu', value: 'iyte-go' },
      { label: 'Herhangi bir üyeliğim yok', value: 'none' },
    ],
  },
  {
    id: 'playingDuration',
    answerKey: 'playingDuration',
    type: 'single',
    title: 'Ne kadar zamandır Go oynuyorsunuz?',
    description: 'Deneyiminize uygun aralığı seçin.',
    options: [
      { label: '1-2 aydır', value: '1-2mo' },
      { label: '3-6 aydır', value: '3-6mo' },
      { label: '7-8 aydır', value: '7-8mo' },
      { label: '1-2 yıldır', value: '1-2y' },
      { label: '3-4 yıldır', value: '3-4y' },
      { label: '5 yıl ve üzeri', value: '5y-plus' },
    ],
  },
  {
    id: 'level',
    answerKey: 'level',
    type: 'single',
    title: 'Mevcut seviye aralığınız nedir?',
    description: 'Program ve lig önerilerini buna göre uyarlayacağız.',
    options: [
      { label: 'Başlangıç Seviyesi', value: 'beginner' },
      { label: '17-12 Kyu', value: '17-12' },
      { label: '11-6 Kyu', value: '11-6' },
      { label: '5-1 Kyu', value: '5-1' },
      { label: '1 Dan ve üzeri', value: '1d-plus' },
    ],
  },
  {
    id: 'internalGoals',
    answerKey: 'internalGoals',
    type: 'multi',
    title: 'Go oynarken kendinize koyduğunuz içsel hedefler nelerdir?',
    description: 'Birden fazla seçebilirsiniz; seçtikten sonra Devam Et’e basın.',
    options: [
      { label: 'Analitik zekâmı geliştirmek', value: 'analytical' },
      { label: 'Anda kalarak odaklanma becerimi artırmak', value: 'focus' },
      { label: 'Duygularımı ve düşüncelerimi gözlemleyerek kendimi daha iyi anlamak', value: 'self-awareness' },
      { label: 'Karakterimi ve düşünce tarzımı tahtaya yansıtabilmek', value: 'character' },
      { label: 'Tahtadaki denge ve uyum felsefesini hayatıma entegre etmek', value: 'philosophy' },
    ],
  },
  {
    id: 'difficulties',
    answerKey: 'difficulties',
    type: 'multi',
    title: 'Oyununuzda geliştirmeye açık veya eksik gördüğünüz yönler nelerdir?',
    description: 'Birden fazla seçebilirsiniz; seçtikten sonra Devam Et’e basın.',
    options: [
      { label: 'Standart Köşe Dizilimleri (Joseki)', value: 'joseki' },
      { label: 'Açılış (Fuseki)', value: 'fuseki' },
      { label: 'Orta Oyun (Chuban)', value: 'chuban' },
      { label: 'Oyun Sonu (Yose)', value: 'yose' },
      { label: 'Yaşam ve Ölüm (Tsumego / Semeai)', value: 'life-death' },
      { label: 'Oyun Yönü (Direction of Play)', value: 'direction' },
      { label: 'Zayıf Şekiller (Shape)', value: 'shape' },
      { label: 'Saldırı ve Savunma Zamanlaması', value: 'attack-defense-timing' },
      { label: 'Zaman Yönetimi', value: 'time-management' },
      { label: 'Kritik anlarda sakin kalabilmek', value: 'calm-critical' },
      { label: 'Çabuk pes etmek ve ani motivasyon kayıpları', value: 'motivation-loss' },
      { label: 'Rakibi anlama (Empati)', value: 'empathy' },
      { label: 'Taşlar arası uyum ve bağlantı', value: 'stone-harmony' },
    ],
  },
  {
    id: 'trainingMethods',
    answerKey: 'trainingMethods',
    type: 'multi',
    title: 'Bugüne kadarki çalışma ve antrenman yöntemleriniz nelerdi?',
    description: 'Birden fazla seçebilirsiniz; seçtikten sonra Devam Et’e basın.',
    options: [
      { label: 'Düzenli çalışmıyordum', value: 'not-regular' },
      { label: 'Sadece oyun oynayarak', value: 'play-only' },
      { label: 'Oyun oynama ve sonrasında analiz yapma', value: 'play-analyze' },
      { label: 'Oyun + Analiz + Problem Çözümü (Tsumego)', value: 'play-analyze-tsumego' },
      { label: 'Topluluk / Kulüp etkinlikleri ve turnuvalara katılım', value: 'club-events' },
      { label: 'Eğitim videoları izleme / Özel ders alma', value: 'video-lessons' },
    ],
  },
  {
    id: 'weeklyHours',
    answerKey: 'weeklyHours',
    type: 'single',
    title: '1.5 aylık lig programında, maçlar ve analizler dışında Go çalışmak için haftalık ne kadar zaman ayırabilirsiniz?',
    description: 'Program planlaması için tahmini sürenizi seçin.',
    options: [
      { label: 'Ekstra zaman ayıramam', value: 'extra-none' },
      { label: '1-2 saat', value: '1-2' },
      { label: '3 saat ve üzeri', value: '3-plus' },
    ],
  },
  {
    id: 'targetLeagueLevel',
    answerKey: 'target_league_level',
    type: 'levelTargetSlider',
    title: 'Lig sonunda ulaşmayı hedeflediğiniz seviye nedir?',
    description: 'Kaydırıcıyı hareket ettirerek hedefinizi seçin; seçim ortada vurgulanır.',
  },
];
