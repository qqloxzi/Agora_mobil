/**
 * inlineSgf — Agora Mobil
 *
 * SGF dosya içerikleri doğrudan gömülmüş string'ler olarak burada saklanır.
 * Bu yaklaşım Expo Go dahil tüm ortamlarda güvenilir çalışır;
 * expo-asset / fetch() zinciri gerekmez.
 *
 * Yeni SGF eklemek için bu dosyaya yeni bir const ekleyin.
 */

export const SGF_TAS_GELISIM_1 = `(;FF[4]
CA[UTF-8]
GM[1]
GN[Demo Board]
PC[https://online-go.com/review/1708176]
PB[Black]
PW[White]
BR[3p]
WR[3p]
RE[?]
SZ[19]
KM[6.5]
RU[Japanese]

;B[pc]
;W[dq]
;B[pp]
;W[cd]
;B[ec]
;W[ic]
;B[pe]
;W[qe]
;B[ph]
;W[ld]
;B[ef]
;W[cg]LB[cb:A]LB[cc:B]LB[qd:C]LB[ef:1]LB[cg:2]LB[dh:D]C[Siyahın sağ tarafta sağlam bir duvarı henüz yok, beyaz üst kenarda henüz şeklini tamamlamamış. Bu durumda siyahın hangi taraftan oynaması gerekiyor?]
(;B[cb]
;W[qd]C[Siyahın hamlesi gerçek bir tehdit oluşturmuyor, dolayısıyla beyaz sağ taraftaki taşını güçlendirerek siyahın güçlü bir duvar yapmasını engelleyebilir.]
)(;B[cc]
;W[bc]
;B[dd]
(;W[cb]
;B[dc]
;W[qd]C[Beyazın son hamlesi siyahın duvarını zayıflatıyor ve akla sağdaki ve soldaki siyah grupların aslında ne işe yaradığı sorusunu getiriyor.]
)(;W[ce]
;B[cb]
;W[qd]C[Siyah iki türlü de gote'de çıkıyor ve beyaza R16 imkanını sunuyor.]
))(;B[dh]LB[dc:B]LB[ch:A]C[Siyahın bu hamlesine beyaz tenuki yapabilir. Eğer siyah C12 dönerse D17 ile köşe yaşayabilir. Dolayısıyla beyaz tekrar R16 oynama fırsatını buluyor.]
)(;B[qd]C[R16, siyahın şeklini tamamlıyor ve güçlü bir duvar kuruyor. Böylelikle artık üst kenardaki beyaz gruba saldırılabilir.]
))`;

export const SGF_TAS_GELISIM_2 = `(;FF[4]
CA[UTF-8]
GM[1]
GN[Tas-Gelisim-2]
PC[https://online-go.com/review/1708821]
PB[Black]
PW[White]
BR[3p]
WR[3p]
RE[?]
SZ[19]
KM[6.5]
RU[Japanese]

;B[qp]
;W[ec]
;B[cd]
;W[pd]
;B[oq]
;W[dp]C[Beyazın iki taşı da hoşi'de. Dördüncü satırdaki taşlar, doğrudan köşe alanı kazanmak yerine tahtanın merkezine doğru geniş bir etki alanı ve duvar inşa etmeyi amaçlar.]
;B[hd]
;W[ef]
;B[cg]LB[cc:1]LB[jd:3]LB[dh:2]C[Beyaz, sol üstteki grubunu nasıl geliştirebilir? Burada düşünmemiz gereken soru diğer taşlarımızla nasıl etkili bir oyun kurabiliriz?]
(;W[cc]C[Beyazın hızlıca yerleşmeye çalışması, hoşi'deki taşının saldırı potansiyelini biraz azaltıyor.]
;B[bc]
;W[dd]
;B[cb]
;W[dc]
;B[ce]
;W[jc]
;B[hf]
)(;W[dh]C[Beyaz daha aktif oynamayı tercih ederse, siyahı 3. satıra sabitleyebilir. Böylece hoşi'deki taşlarının merkeze yönelik etkilerini daha etkili kullanabilir.]
;B[ch]
;W[di]
;B[ci]
;W[dj]LB[kc:2]LB[cj:A]LB[ck:1]C[Siyah, üstteki taşının zayıf olduğunu düşünerek 1 numara yerine 2 numaraya oynayabilir. Fakat bu sefer beyaz C10 oynayarak siyahı köşeye mühürler.]
;B[ck]LB[de:A]C[Kendi grubumuzu güçlendiren ve rakibi cevap vermeye zorlayan hamleleri arıyoruz.]
;W[de]
;B[ce]LB[jd:A]C[Artık 4. satırdaki taşlarımız ve duvarımız ile siyah taşa saldırı başlatabiliriz.]
;W[jd]
)(;W[jd]C[Bu hamle de mümkün, fakat önce sol tarafta bir duvar inşa etmek saldırımızı daha etkili hale getirir.]
))`;

/** Tüm inline SGF'ler — key: relatif yol (Agora_gravity ile uyumlu) */
export const INLINE_SGF_MAP: Record<string, string> = {
  'assets/sgf/Egitim/Tas-Gelisim-1.sgf': SGF_TAS_GELISIM_1,
  'assets/sgf/Egitim/tas-gelisim-2.sgf': SGF_TAS_GELISIM_2,
};
