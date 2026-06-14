export type CourseArticleBlock =
  | { type: 'text'; content: string }
  | { type: 'board'; description?: string };

export type CourseArticle = {
  title: string;
  blocks: CourseArticleBlock[];
};

export const courseArticles: Record<string, CourseArticle> = {
  'oyun-yonu': {
    title: 'Oyun Yönü — Temel Prensipler',
    blocks: [
      {
        type: 'text',
        content:
          'Go oyununda oyun yönü, taşlarınızın tahta üzerinde doğru yönlere ilerlemesini ve birbirleriyle uyum içinde çalışmasını ifade eder. Aşağıdaki temel prensipler, oyununuzu güçlü tutmanın anahtarlarıdır.',
      },
      {
        type: 'text',
        content:
          'Acil Hamleler Büyük Hamlelerden Önce Gelir\n\nÇok puan getirecek geniş alanlara yönelmeden önce, zayıf gruplarınızın güvenliğini sağlayın veya rakibin zayıf gruplarına baskı yapın.',
      },
      {
        type: 'board',
        description:
          'Statik tahta örneği: acil olan zayıf grubu güvenceye almak, daha büyük görünen bölge hamlesinden önce gelir.',
      },
      {
        type: 'text',
        content:
          'En Geniş Alana Yönelin\n\nTaşların sıkıştığı dar bölgelerde mücadele etmek yerine, gelişime en açık ve tahtadaki en geniş boşlukların bulunduğu yöne doğru oynayın.',
      },
      {
        type: 'board',
        description:
          'Statik tahta örneği: dar merkez yerine açık kenar ve geniş gelişim yönü tercih edilir.',
      },
      {
        type: 'text',
        content:
          'Rakibi Kalınlığa Doğru İtin\n\nTahtada güçlü bir duvarınız veya sağlam bir grubunuz varsa, rakibinizi bu güçlü yapınıza doğru sürükleyecek yönden saldırın.',
      },
    ],
  },
};
