/**
 * Web (Agora_1.0.1) problem seti – mobilde Go Ağacı ile kullanılır.
 * Tipler src/types/tsumego.ts ile aynıdır.
 */
import type { Problem } from '../types/tsumego';

export type { Problem } from '../types/tsumego';

/** Kategori adına göre problem listesi (GameManager ile uyumlu). Eşleşme büyük/küçük harf duyarsız. */
export function getProblemsForCategory(categoryId: string): Problem[] {
  const key = categoryId.trim().toLowerCase();
  return problemSet.filter((p) => p.category.trim().toLowerCase() === key);
}

export const problemSet: Problem[] = [
 {
  id: "1",
  size: 19,
  labels: "[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]]",
  turn: "black",
  title: "Go",
  category: "Kurallar",
  description: "Go, basit kuralları ile düşünce ve duygusal derinliği arasındaki karşıtlıkla öğrenmesi basit, ustalaşması zor bir oyun, üstelik bir sanattır. Fakat tahmin edeceğiniz üzere keyif almak için usta olmaktan ziyade Go'yu sevmek gerekiyor. Lafı daha fazla uzatmadan sizi kurallar setini öğrenmeye davet ediyoruz. İyi eğlenceler! ",
  initialState: "[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]]",
  solution: []
},

  {
    id: "2",
    category: "Kurallar",
    size: 9,
    labels:'[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,1,null,null,null,null],[null,null,null,2,null,4,null,null,null],[null,null,null,null,3,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]',
    description: "Oyun boş bir tahta ve siyahın hamlesi ile başlar. Sırayla dizilen taşlar neticesinde iki tarafın 'pas' demesi oyunu sonlandırır. Taşlar, çizgilerin kesişim noktalarına yerleştirilir. Bir taşın yatay ve dikey düzlemde komşusu olan tüm boş kesişim noktaları o taşın nefeslerini oluşturur.",
    turn: "white",
    title: "Kurallar",
    initialState: '[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,{\"color\":\"black\"},null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]',      
     solution: []
    
},
  
 {
    id: "3",
    category: "Kurallar",
    size: 9,
    labels:'[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]',
    description: "Eğer bir taşın etrafındaki tüm nefes yolları diğer renk taşlarla kapatılırsa tahtadan kaldırılır",
    turn: "white",  
    title: "Kurallar",
    initialState: '[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,{\"color\":\"white\"},null,null,null,null],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]', 
       solution:{
    "children": [
      {
        "x": 5,
        "y": 4,
        "color": "white",
      }
    ]
  }
},{
  id: "4",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Atari",
  category: "Kurallar",
  description: "Bir taş için geçerli olan durum taş grupları için de geçerlidir. Beyaz, siyah grubun toplam 7 nefesinden 6 tanesini kapatmış durumda, son nefesini de kapatması durumunda siyah grubu esir ederek tahtadan kaldırabilir.",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},null,null,null,null],[null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,null,null,null,{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,null,null,null,{\"color\":\"white\"},null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 4,
        y: 3,
        color: "white",
        children: [],
        status: "correct"
      }
    ]
  }},
  {
  id: "5",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Yasak Hamle",
  category: "Kurallar",
  description: "Tahtada yalnızca nefesimiz olduğu noktalara oynayabiliriz. Siyah grubun ortasında beyazın tüm nefeslerinin kapalı olmasından dolayı oraya hamle yapılamaz.",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,{\"color\":\"black\"},null,null,null,null,null],[null,null,{\"color\":\"black\"},null,{\"color\":\"black\"},null,null,null,null],[null,null,null,{\"color\":\"black\"},null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: []
},
{
  id: "6",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Nefes Tutma",
  category: "Kurallar",
  description: "Taşlarımızın nefesi olmayan bir noktaya oynayabilmesinin bir şartı vardır: o noktaya oynadığımızda karşı renkteki taşları esir edip tahtanın dışına çıkarabiliyor ve dolayısı ile kendimize nefes açabiliyorsak o noktaya oynayabiliriz.",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},null,null,null,null],[null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,{\"color\":\"white\"},{\"color\":\"black\"},null,{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 3,
        y: 3,
        color: "white",
        children: [],
        status: "correct"
      }
    ]
  }
},
{
  id: "7",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Ko",
  category: "Kurallar",
  description: "コウ or 劫 (kō), taşların sürekli birbirini yiyerek tahtanın aynı duruma dönmesini ve oyunun sonsuz bir döngüye girmesini engelleyen bir kuraldır.Beyaz F5 taşını yerse, siyah hemen E5 taşını esir olarak alamaz. Bu kuraldan dolayı tahtanın başka bir noktasına oynamak zorunda veya pas diyebilir. Böylece beyaz isterse F5 Oynayarak Ko'yu bitirebilir veya başka bir noktaya oynayarak siyahın E5'teki taşı almasına izin verebilir. Merak etmeyin ileride bununla ilgili çok daha açıklayıcı pozisyonlar göreceğiz. ",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,{\"color\":\"black\"},null,null,null,null],[null,null,null,{\"color\":\"black\"},null,{\"color\":\"black\"},null,null,null],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,null,null,null,{\"color\":\"white\"},null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution:  [],
  
},
{
  id: "8",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Ko",
  category: "Kurallar",
  description: "Ko kuralına bir örnek. Ko sayesinde ayrı kalmış iki grubumuzu bağlayabiliriz.",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,{\"color\":\"black\"},null,null],[null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"white\"},null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,{\"color\":\"black\"},null],[null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"white\"},null],[null,null,null,null,null,null,{\"color\":\"black\"},null,null],[null,null,null,null,null,null,{\"color\":\"black\"},null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 4,
        y: 6,
        color: "white",
        children: [
          {
            x: 2,
            y: 7,
            color: "black",
            children: [
              {
                x: 4,
                y: 8,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          },
          {
            x: 6,
            y: 7,
            color: "black",
            children: [
              {
                x: 4,
                y: 8,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 4,
        y: 8,
        color: "white",
        children: [
          {
            x: 4,
            y: 6,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},{
  id: "9",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Oyunun Sonlandırılması",
  category: "Kurallar",
  description: "Sınırları belirlenmemiş alan kalmadığında ve oyuncular hamle yapmanın kendilerine fayda sağlamayacağı konusunda hemfikir olduğunda ardarda pas dediklerinde, oyun sonlanır. İki etrafını çevirdiği kesişim noktaları kadar puan kazanır. Ölü taşlar tahtadan kaldırılır ve karşı tarafa esir olarak verilir. Bu hesaplamaların nasıl yapıldığını 'Oyun Sonlandırma' setinde öğrenebilirsiniz. ",
  initialState: "[[null,null,null,null,{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,{\"color\":\"black\"},null,{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,null,{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"}],[{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},{\"color\":\"white\"},null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"white\"}],[{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"}],[null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},null],[null,{\"color\":\"white\"},null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},null,{\"color\":\"black\"}],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"}],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"}]]",
  solution:[]
},{
  id: "11",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Atari",
  category: "Esir Alma 1",
  description: "Atari, bir taşın veya taş grubunun nefes sayısını 1'e düşürerek esir alma tehditinde bulunmaktır. Beyazlar siyah gruba atari çekebilir mi?",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},null,null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},null,null],[null,null,null,null,null,{\"color\":\"white\"},null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 3,
        y: 7,
        color: "white",
        children: [],
        status: "correct"
      },
      {
        x: 4,
        y: 6,
        color: "white",
        children: [],
        status: "correct"
      }
    ]
  }
},
{
  id: "12",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Atari",
  category: "Esir Alma 1",
  description: "Her seferinde atari çekerek siyah taşları esir alabilir misiniz?",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},null,null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 5,
        y: 5,
        color: "white",
        children: [
          {
            x: 4,
            y: 6,
            color: "black",
            children: [
              {
                x: 5,
                y: 6,
                color: "white",
                children: [
                  {
                    x: 4,
                    y: 7,
                    color: "black",
                    children: [
                      {
                        x: 5,
                        y: 7,
                        color: "white",
                        children: [
                          {
                            x: 4,
                            y: 8,
                            color: "black",
                            children: [
                              {
                                x: 3,
                                y: 8,
                                color: "white",
                                children: [
                                  {
                                    x: 5,
                                    y: 8,
                                    color: "black",
                                    children: [
                                      {
                                        x: 6,
                                        y: 8,
                                        color: "white",
                                        children: [],
                                        status: "correct"
                                      }
                                    ],
                                    status: null
                                  }
                                ],
                                status: null
                              },
                              {
                                x: 5,
                                y: 8,
                                color: "white",
                                children: [
                                  {
                                    x: 3,
                                    y: 8,
                                    color: "black",
                                    children: [
                                      {
                                        x: 2,
                                        y: 8,
                                        color: "white",
                                        children: [],
                                        status: "correct"
                                      }
                                    ],
                                    status: null
                                  }
                                ],
                                status: null
                              }
                            ],
                            status: null
                          }
                        ],
                        status: null
                      },
                      {
                        x: 4,
                        y: 8,
                        color: "white",
                        children: [
                          {
                            x: 5,
                            y: 7,
                            color: "black",
                            children: [
                              {
                                x: 6,
                                y: 7,
                                color: "white",
                                children: [
                                  {
                                    x: 5,
                                    y: 8,
                                    color: "black",
                                    children: [
                                      {
                                        x: 6,
                                        y: 8,
                                        color: "white",
                                        children: [],
                                        status: "correct"
                                      }
                                    ],
                                    status: null
                                  }
                                ],
                                status: null
                              },
                              {
                                x: 5,
                                y: 8,
                                color: "white",
                                children: [
                                  {
                                    x: 6,
                                    y: 7,
                                    color: "black",
                                    children: [],
                                    status: "wrong"
                                  }
                                ],
                                status: null
                              }
                            ],
                            status: null
                          }
                        ],
                        status: null
                      }
                    ],
                    status: null
                  }
                ],
                status: null
              },
              {
                x: 4,
                y: 7,
                color: "white",
                children: [
                  {
                    x: 5,
                    y: 6,
                    color: "black",
                    children: [
                      {
                        x: 6,
                        y: 6,
                        color: "white",
                        children: [
                          {
                            x: 5,
                            y: 7,
                            color: "black",
                            children: [
                              {
                                x: 6,
                                y: 7,
                                color: "white",
                                children: [
                                  {
                                    x: 5,
                                    y: 8,
                                    color: "black",
                                    children: [
                                      {
                                        x: 4,
                                        y: 8,
                                        color: "white",
                                        children: [
                                          {
                                            x: 6,
                                            y: 8,
                                            color: "black",
                                            children: [
                                              {
                                                x: 7,
                                                y: 8,
                                                color: "white",
                                                children: [],
                                                status: "correct"
                                              }
                                            ],
                                            status: null
                                          }
                                        ],
                                        status: null
                                      },
                                      {
                                        x: 6,
                                        y: 8,
                                        color: "white",
                                        children: [
                                          {
                                            x: 4,
                                            y: 8,
                                            color: "black",
                                            children: [
                                              {
                                                x: 3,
                                                y: 8,
                                                color: "white",
                                                children: [],
                                                status: "correct"
                                              }
                                            ],
                                            status: null
                                          }
                                        ],
                                        status: null
                                      }
                                    ],
                                    status: null
                                  }
                                ],
                                status: null
                              },
                              {
                                x: 5,
                                y: 8,
                                color: "white",
                                children: [
                                  {
                                    x: 6,
                                    y: 7,
                                    color: "black",
                                    children: [
                                      {
                                        x: 7,
                                        y: 7,
                                        color: "white",
                                        children: [
                                          {
                                            x: 6,
                                            y: 8,
                                            color: "black",
                                            children: [
                                              {
                                                x: 7,
                                                y: 8,
                                                color: "white",
                                                children: [],
                                                status: "correct"
                                              }
                                            ],
                                            status: null
                                          }
                                        ],
                                        status: null
                                      },
                                      {
                                        x: 6,
                                        y: 8,
                                        color: "white",
                                        children: [
                                          {
                                            x: 7,
                                            y: 7,
                                            color: "black",
                                            children: [],
                                            status: "wrong"
                                          }
                                        ],
                                        status: null
                                      }
                                    ],
                                    status: null
                                  }
                                ],
                                status: null
                              }
                            ],
                            status: null
                          }
                        ],
                        status: null
                      },
                      {
                        x: 5,
                        y: 7,
                        color: "white",
                        children: [
                          {
                            x: 6,
                            y: 6,
                            color: "black",
                            children: [],
                            status: "wrong"
                          }
                        ],
                        status: null
                      }
                    ],
                    status: null
                  }
                ],
                status: null
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 4,
        y: 6,
        color: "white",
        children: [
          {
            x: 5,
            y: 5,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},{
  id: "13",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Esir Alma",
  category: "Esir Alma 1",
  description: "Siyahın bir grubu halihazırda ataride, yani bir nefesi var. Kendi taşlarımızı, siyahın taşlarını esir ederek kurtarabiliriz.",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},null,null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},null],[null,null,null,null,null,null,{\"color\":\"black\"},{\"color\":\"white\"},null],[null,null,null,null,null,{\"color\":\"black\"},{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,null,null,{\"color\":\"black\"},{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,null,null,{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 3,
        y: 5,
        color: "white",
        children: [],
        status: "correct"
      },
      {
        x: 6,
        y: 5,
        color: "white",
        children: [
          {
            x: 6,
            y: 4,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},
{
  id: "14",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Atari",
  category: "Esir Alma 1",
  description: "Beyaz siyahın gruplarını birbirlerinden ayıracak şekilde atari çekmeli, aksi halde siyah 3 taşını kurtarabilir.",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,{\"color\":\"white\"},null,{\"color\":\"white\"},null,{\"color\":\"white\"},{\"color\":\"white\"}],[null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"white\"}],[null,null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"}],[null,null,null,null,{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,{\"color\":\"black\"},null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 4,
        y: 7,
        color: "white",
        children: [
          {
            x: 4,
            y: 8,
            color: "black",
            children: [
              {
                x: 5,
                y: 8,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          },
          {
            x: 5,
            y: 7,
            color: "black",
            children: [
              {
                x: 4,
                y: 8,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 4,
        y: 8,
        color: "white",
        children: [
          {
            x: 4,
            y: 7,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},
{
  id: "14",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Atari",
  category: "Esir alma 1",
  description: "Siyahın iki grubunu atari çekerek ayırabilir miyiz?",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"}],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,{\"color\":\"black\"},{\"color\":\"white\"}],[null,null,null,{\"color\":\"black\"},{\"color\":\"black\"},null,null,{\"color\":\"white\"},null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 4,
        y: 5,
        color: "white",
        children: [
          {
            x: 3,
            y: 6,
            color: "black",
            children: [
              {
                x: 4,
                y: 6,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          },
          {
            x: 4,
            y: 6,
            color: "black",
            children: [
              {
                x: 3,
                y: 6,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 3,
        y: 6,
        color: "white",
        children: [
          {
            x: 4,
            y: 6,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},
{
  id: "15",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Çifte Atari",
  category: "Esir Alma 1",
  description: "Çifte atari çekerek siyahın iki grubundan birinini kesin olarak esir alabiliriz.",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,{\"color\":\"white\"},null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},null,null],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,{\"color\":\"black\"},null,null],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,null,{\"color\":\"black\"},null],[null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},null],[null,null,null,{\"color\":\"white\"},null,{\"color\":\"white\"},{\"color\":\"white\"},null,null],[null,null,null,null,null,null,null,{\"color\":\"white\"},null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 3,
        y: 5,
        color: "white",
        children: [
          {
            x: 3,
            y: 6,
            color: "black",
            children: [
              {
                x: 2,
                y: 5,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 3,
        y: 6,
        color: "white",
        children: [
          {
            x: 3,
            y: 5,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      },
      {
        x: 2,
        y: 5,
        color: "white",
        children: [
          {
            x: 3,
            y: 5,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},
{
  id: "16",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Esir Alma",
  category: "Esir Alma 1",
  description: "Beyaz grupları ayıran siyah gruplardan birisini esir almaya çalışıyoruz. Siyahın diğer taşlarına bağlanmasını engellemenin şık bir yolu var, bulabilir misiniz?",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},null],[null,null,null,null,{\"color\":\"black\"},null,{\"color\":\"black\"},{\"color\":\"white\"},null],[null,null,null,{\"color\":\"black\"},null,null,{\"color\":\"black\"},{\"color\":\"white\"},null],[null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,{\"color\":\"black\"},null,null,null,{\"color\":\"black\"},null],[null,null,null,null,null,{\"color\":\"black\"},null,{\"color\":\"black\"},null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 2,
        y: 5,
        color: "white",
        children: [
          {
            x: 3,
            y: 5,
            color: "black",
            children: [
              {
                x: 3,
                y: 4,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 3,
        y: 5,
        color: "white",
        children: [
          {
            x: 2,
            y: 5,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},
{
  id: "17",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Atari",
  category: "Esir Alma 1",
  description: "Altaki iki siyah taşı esir almanın birçok yolu var, hangi yolu tercih edersiniz?",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,{\"color\":\"white\"},null],[null,null,null,null,null,{\"color\":\"black\"},{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,null,null,{\"color\":\"black\"},{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"}],[null,null,null,null,null,{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 2,
        y: 8,
        color: "white",
        children: [
          {
            x: 3,
            y: 8,
            color: "black",
            children: [
              {
                x: 5,
                y: 8,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 3,
        y: 8,
        color: "white",
        children: [
          {
            x: 2,
            y: 8,
            color: "black",
            children: [
              {
                x: 1,
                y: 8,
                color: "white",
                children: [
                  {
                    x: 3,
                    y: 8,
                    color: "black",
                    children: [
                      {
                        x: 5,
                        y: 8,
                        color: "white",
                        children: [],
                        status: "correct"
                      }
                    ],
                    status: null
                  }
                ],
                status: null
              }
            ],
            status: null
          },
          {
            x: 5,
            y: 8,
            color: "black",
            children: [
              {
                x: 2,
                y: 8,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      }
    ]
  }
},{
  id: "18",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Snapback",
  category: "Esir Alma 1",
  description: "Siyahın üç taşını bağlamasına izin vermeden, doğru hamle sırasıyla atari çekmeliyiz.",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,{\"color\":\"white\"},null],[null,null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"white\"}],[null,null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"}],[null,null,null,null,null,{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"black\"}],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 4,
        y: 8,
        color: "white",
        children: [
          {
            x: 3,
            y: 8,
            color: "black",
            children: [
              {
                x: 4,
                y: 8,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 3,
        y: 8,
        color: "white",
        children: [
          {
            x: 4,
            y: 8,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},
{
  id: "19",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "black",
  title: "Atari",
  category: "Esir Alma 1",
  description: "Siyah, doğru taraftan atari çekerek kendi taşlarını kurtarabilir mi?",
  initialState: "[[null,null,null,null,null,{\"color\":\"black\"},null,null,null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},null],[null,{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},{\"color\":\"white\"},{\"color\":\"black\"},null],[null,null,null,null,null,null,{\"color\":\"white\"},null,null],[null,null,null,null,null,null,{\"color\":\"white\"},null,null],[null,null,null,null,null,{\"color\":\"white\"},null,null,null],[null,{\"color\":\"black\"},null,{\"color\":\"black\"},null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 1,
        y: 3,
        color: "black",
        children: [
          {
            x: 0,
            y: 4,
            color: "white",
            children: [
              {
                x: 0,
                y: 3,
                color: "black",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 0,
        y: 4,
        color: "black",
        children: [
          {
            x: 1,
            y: 3,
            color: "white",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
},{
  id: "20",
  size: 9,
  labels: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  turn: "white",
  title: "Snapback",
  category: "Esir Alma 1",
  description: "Siyahın 3 taşını bir taşımızı feda ederek nasıl esir alabiliriz?",
  initialState: "[[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"black\"},null,null],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},{\"color\":\"white\"},null,null,null],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,{\"color\":\"white\"},null,null],[null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,{\"color\":\"black\"},null,null],[null,null,null,null,{\"color\":\"white\"},{\"color\":\"black\"},null,null,null],[null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null]]",
  solution: {
    children: [
      {
        x: 5,
        y: 5,
        color: "white",
        children: [
          {
            x: 4,
            y: 5,
            color: "black",
            children: [
              {
                x: 5,
                y: 5,
                color: "white",
                children: [],
                status: "correct"
              }
            ],
            status: null
          }
        ],
        status: null
      },
      {
        x: 4,
        y: 5,
        color: "white",
        children: [
          {
            x: 5,
            y: 5,
            color: "black",
            children: [],
            status: "wrong"
          }
        ],
        status: null
      }
    ]
  }
}
]