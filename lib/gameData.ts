// ============================================================
// GAME DATA - 40-50 questions per category
// ============================================================

export interface Question {
  id: number
  name: string
  hint: string
  image: string
  category?: string
  aliases?: string[] // accepted alternative answers
}

export const CAR_LOGOS: Question[] = [
  { id: 1, name: 'Toyota', hint: 'يابانية الأكثر مبيعاً', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Toyota_carlogo.svg/320px-Toyota_carlogo.svg.png', aliases: ['تويوتا'] },
  { id: 2, name: 'BMW', hint: 'ألمانية فاخرة - محرك بافاريا', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/320px-BMW.svg.png', aliases: ['بي ام دبليو', 'بي ام و'] },
  { id: 3, name: 'Mercedes', hint: 'النجمة الثلاثية الألمانية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_logo%282011%29.svg/320px-Mercedes-Benz_logo%282011%29.svg.png', aliases: ['مرسيدس', 'mercedes-benz', 'مرسيدس بنز'] },
  { id: 4, name: 'Ferrari', hint: 'الحصان الأصفر الإيطالي', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Ferrari-Logo.svg/320px-Ferrari-Logo.svg.png', aliases: ['فيراري', 'فراري'] },
  { id: 5, name: 'Lamborghini', hint: 'الثور الإيطالي الأسطوري', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Lamborghini_Logo.svg/320px-Lamborghini_Logo.svg.png', aliases: ['لامبورغيني', 'لمبرغيني'] },
  { id: 6, name: 'Porsche', hint: 'الحصان الألماني للسباقات', image: 'https://upload.wikimedia.org/wikipedia/de/thumb/5/5b/Porsche_Logo.svg/320px-Porsche_Logo.svg.png', aliases: ['بورش', 'بورشه'] },
  { id: 7, name: 'Audi', hint: 'أربع حلقات متداخلة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Audi-Logo_2016.svg/320px-Audi-Logo_2016.svg.png', aliases: ['أودي', 'اودي'] },
  { id: 8, name: 'Ford', hint: 'الأمريكية الكلاسيكية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/320px-Ford_logo_flat.svg.png', aliases: ['فورد'] },
  { id: 9, name: 'Honda', hint: 'يابانية بحرف H', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/320px-Honda.svg.png', aliases: ['هوندا'] },
  { id: 10, name: 'Chevrolet', hint: 'العلامة الفراشة الذهبية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Chevrolet_logo.svg/320px-Chevrolet_logo.svg.png', aliases: ['شيفروليه', 'شيفروليت', 'chevy'] },
  { id: 11, name: 'Volkswagen', hint: 'سيارة الشعب الألمانية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/320px-Volkswagen_logo_2019.svg.png', aliases: ['فولكس واغن', 'فولكسواغن', 'vw'] },
  { id: 12, name: 'Hyundai', hint: 'الكورية بحرف H مائل', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hyundai_Motor_Company_logo.svg/320px-Hyundai_Motor_Company_logo.svg.png', aliases: ['هيونداي', 'هيونداى'] },
  { id: 13, name: 'Kia', hint: 'الكورية العصرية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Kia-logo.svg/320px-Kia-logo.svg.png', aliases: ['كيا'] },
  { id: 14, name: 'Nissan', hint: 'يابانية شمس النهار', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Nissan_2020_logo.svg/320px-Nissan_2020_logo.svg.png', aliases: ['نيسان'] },
  { id: 15, name: 'Jeep', hint: 'مغامرات برية أمريكية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Jeep_logo.svg/320px-Jeep_logo.svg.png', aliases: ['جيب'] },
  { id: 16, name: 'Tesla', hint: 'الكهربائية بحرف T', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/320px-Tesla_Motors.svg.png', aliases: ['تسلا'] },
  { id: 17, name: 'Peugeot', hint: 'الأسد الفرنسي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Peugeot_Logo.svg/320px-Peugeot_Logo.svg.png', aliases: ['بيجو', 'پيجو'] },
  { id: 18, name: 'Renault', hint: 'المعين الفرنسي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Renault_2021_Text.svg/320px-Renault_2021_Text.svg.png', aliases: ['رينو', 'رونو'] },
  { id: 19, name: 'Lexus', hint: 'الفاخرة اليابانية بحرف L', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Lexus_division_emblem.svg/320px-Lexus_division_emblem.svg.png', aliases: ['لكزس', 'لكسس'] },
  { id: 20, name: 'Mazda', hint: 'أجنحة يابانية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Mazda_logo_with_wordmark.svg/320px-Mazda_logo_with_wordmark.svg.png', aliases: ['مازدا'] },
  { id: 21, name: 'Subaru', hint: 'نجوم الثريا اليابانية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Subaru_logo.svg/320px-Subaru_logo.svg.png', aliases: ['سوبارو', 'سوبارو'] },
  { id: 22, name: 'Mitsubishi', hint: 'ثلاث ألماسات يابانية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mitsubishi_logo.svg/320px-Mitsubishi_logo.svg.png', aliases: ['ميتسوبيشي', 'ميتسوبيشى'] },
  { id: 23, name: 'Volvo', hint: 'السويدية الآمنة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Volvo_Cars_logo.svg/320px-Volvo_Cars_logo.svg.png', aliases: ['فولفو'] },
  { id: 24, name: 'Bugatti', hint: 'أسرع سيارة في العالم', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Bugatti_logo.svg/320px-Bugatti_logo.svg.png', aliases: ['بوغاتي', 'بوجاتي'] },
  { id: 25, name: 'Bentley', hint: 'الفاخرة البريطانية الجناح', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Bentley_logo.svg/320px-Bentley_logo.svg.png', aliases: ['بنتلي'] },
  { id: 26, name: 'Rolls-Royce', hint: 'Spirit of Ecstasy البريطانية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Rolls-Royce_Motor_Cars_logo.svg/320px-Rolls-Royce_Motor_Cars_logo.svg.png', aliases: ['رولز رويس', 'rollsroyce', 'rolls royce'] },
  { id: 27, name: 'Maserati', hint: 'الشوكة الإيطالية', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/Maserati_logo.svg/320px-Maserati_logo.svg.png', aliases: ['مازيراتي', 'مازيراتى'] },
  { id: 28, name: 'Alfa Romeo', hint: 'الصليب والثعبان الإيطالي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alfa_Romeo_logo_%282015%29.svg/320px-Alfa_Romeo_logo_%282015%29.svg.png', aliases: ['ألفا روميو', 'الفا روميو'] },
  { id: 29, name: 'Dodge', hint: 'الرام الأمريكي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Dodge_logo.svg/320px-Dodge_logo.svg.png', aliases: ['دودج'] },
  { id: 30, name: 'Cadillac', hint: 'الفخامة الأمريكية درع', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Cadillac_logo.svg/320px-Cadillac_logo.svg.png', aliases: ['كاديلاك'] },
  { id: 31, name: 'Lincoln', hint: 'الفاخرة الأمريكية النجمة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Lincoln_star_logo.svg/320px-Lincoln_star_logo.svg.png', aliases: ['لينكولن'] },
  { id: 32, name: 'Acura', hint: 'الفاخرة اليابانية من هوندا', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Acura_logo_%28new%29.svg/320px-Acura_logo_%28new%29.svg.png', aliases: ['أكيورا', 'اكيورا'] },
  { id: 33, name: 'Infiniti', hint: 'الفاخرة من نيسان', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Infiniti_logo.svg/320px-Infiniti_logo.svg.png', aliases: ['انفينيتي', 'إنفينيتي'] },
  { id: 34, name: 'Genesis', hint: 'الكورية الفاخرة الجديدة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Genesis_logo.svg/320px-Genesis_logo.svg.png', aliases: ['جينيسيس'] },
  { id: 35, name: 'Land Rover', hint: 'ملك الطرق الوعرة البريطاني', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Land_Rover_logo.svg/320px-Land_Rover_logo.svg.png', aliases: ['لاند روفر', 'landrover'] },
  { id: 36, name: 'Jaguar', hint: 'القفزة البريطانية الأنيقة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Jaguar_Cars_logo.svg/320px-Jaguar_Cars_logo.svg.png', aliases: ['جاكوار', 'جاغوار'] },
  { id: 37, name: 'Aston Martin', hint: 'سيارة جيمس بوند البريطانية', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/54/Aston_Martin_logo.svg/320px-Aston_Martin_logo.svg.png', aliases: ['أستون مارتن', 'استون مارتن'] },
  { id: 38, name: 'McLaren', hint: 'البريطانية الفائقة السرعة', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6a/McLaren_logo.svg/320px-McLaren_logo.svg.png', aliases: ['ماكلارين', 'مكلارين'] },
  { id: 39, name: 'Pagani', hint: 'الإيطالية النادرة الحورا', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Pagani_logo.svg/320px-Pagani_logo.svg.png', aliases: ['باغاني', 'پاگاني'] },
  { id: 40, name: 'Koenigsegg', hint: 'السويدية الأسرع', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Koenigsegg_logo.svg/320px-Koenigsegg_logo.svg.png', aliases: ['كونيغسيغ', 'كونيجسيج'] },
  { id: 41, name: 'Chrysler', hint: 'الجناح الأمريكي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Chrysler_logo.svg/320px-Chrysler_logo.svg.png', aliases: ['كرايسلر'] },
  { id: 42, name: 'Seat', hint: 'الإسبانية من فولكس', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/SEAT_logo_2012.svg/320px-SEAT_logo_2012.svg.png', aliases: ['سيات'] },
  { id: 43, name: 'Skoda', hint: 'التشيكية بالسهم', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Skoda_Auto_2016_logo.svg/320px-Skoda_Auto_2016_logo.svg.png', aliases: ['شكودا', 'سكودا'] },
  { id: 44, name: 'Citroen', hint: 'الشيفرونات الفرنسية المزدوجة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Citro%C3%ABn_2022.svg/320px-Citro%C3%ABn_2022.svg.png', aliases: ['سيتروين', 'سيترون'] },
  { id: 45, name: 'Fiat', hint: 'الإيطالية الصغيرة الشهيرة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Fiat_Automobiles_logo_%282020%29.svg/320px-Fiat_Automobiles_logo_%282020%29.svg.png', aliases: ['فيات'] },
]

export const BRAND_LOGOS: Question[] = [
  { id: 1, name: 'Apple', hint: 'التفاحة المقضومة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/320px-Apple_logo_black.svg.png', category: 'تقنية', aliases: ['أبل', 'ابل'] },
  { id: 2, name: 'Nike', hint: 'Just Do It - Swoosh', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/320px-Logo_NIKE.svg.png', category: 'رياضة', aliases: ['نايك'] },
  { id: 3, name: 'Adidas', hint: 'ثلاثة خطوط موازية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/320px-Adidas_Logo.svg.png', category: 'رياضة', aliases: ['أديداس', 'اديداس'] },
  { id: 4, name: 'McDonald\'s', hint: 'القوسان الذهبيان M', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/320px-McDonald%27s_Golden_Arches.svg.png', category: 'طعام', aliases: ['ماكدونالدز', 'ماكدونالد', 'mcdonalds'] },
  { id: 5, name: 'Coca-Cola', hint: 'الخط الأحمر الكلاسيكي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/320px-Coca-Cola_logo.svg.png', category: 'مشروبات', aliases: ['كوكاكولا', 'كوكا كولا', 'cocacola'] },
  { id: 6, name: 'Amazon', hint: 'السهم من A إلى Z ابتسامة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png', category: 'تجارة', aliases: ['أمازون', 'امازون'] },
  { id: 7, name: 'Google', hint: 'ألوان قوس قزح الأربعة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png', category: 'تقنية', aliases: ['جوجل', 'قوقل'] },
  { id: 8, name: 'Samsung', hint: 'الكورية ملك الشاشات', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/320px-Samsung_Logo.svg.png', category: 'تقنية', aliases: ['سامسونج', 'سامسونغ'] },
  { id: 9, name: 'Netflix', hint: 'N الحمراء للبث', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/320px-Netflix_2015_logo.svg.png', category: 'ترفيه', aliases: ['نتفليكس', 'نيتفليكس'] },
  { id: 10, name: 'Spotify', hint: 'الدوائر الخضراء الثلاث', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_with_text.svg/320px-Spotify_logo_with_text.svg.png', category: 'موسيقى', aliases: ['سبوتيفاي', 'سبوتفاي'] },
  { id: 11, name: 'YouTube', hint: 'مثلث التشغيل الأحمر', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/320px-YouTube_Logo_2017.svg.png', category: 'فيديو', aliases: ['يوتيوب', 'يوتيب'] },
  { id: 12, name: 'IKEA', hint: 'أزرق وأصفر سويدية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ikea_logo.svg/320px-Ikea_logo.svg.png', category: 'أثاث', aliases: ['إيكيا', 'ايكيا'] },
  { id: 13, name: 'Microsoft', hint: 'نافذة الألوان الأربعة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/320px-Microsoft_logo_%282012%29.svg.png', category: 'تقنية', aliases: ['مايكروسوفت', 'مايكروسوفت'] },
  { id: 14, name: 'Pepsi', hint: 'الكرة الزرقاء الحمراء', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Pepsi_logo_2014.svg/320px-Pepsi_logo_2014.svg.png', category: 'مشروبات', aliases: ['بيبسي', 'بيبسى'] },
  { id: 15, name: 'Starbucks', hint: 'حورية البحر الخضراء', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/320px-Starbucks_Corporation_Logo_2011.svg.png', category: 'قهوة', aliases: ['ستاربكس', 'ستارباكس'] },
  { id: 16, name: 'Shell', hint: 'الصدفة الصفراء والحمراء', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/Shell_logo.svg/320px-Shell_logo.svg.png', category: 'نفط', aliases: ['شل', 'شيل'] },
  { id: 17, name: 'Adobe', hint: 'A الحمراء للإبداع', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Adobe_Corporate_Logo.png/320px-Adobe_Corporate_Logo.png', category: 'تقنية', aliases: ['أدوبي', 'ادوبي'] },
  { id: 18, name: 'PayPal', hint: 'P المزدوجة الزرقاء', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/PayPal_Logo_Icon_2014.svg/320px-PayPal_Logo_Icon_2014.svg.png', category: 'مالية', aliases: ['باي بال', 'paypal'] },
  { id: 19, name: 'Visa', hint: 'بطاقة الدفع الزرقاء', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/320px-Visa_Inc._logo.svg.png', category: 'مالية', aliases: ['فيزا', 'فيزا كارد'] },
  { id: 20, name: 'MasterCard', hint: 'الدائرتان الحمراء والصفراء', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/320px-Mastercard-logo.svg.png', category: 'مالية', aliases: ['ماستركارد', 'master card'] },
  { id: 21, name: 'Intel', hint: 'داخل كل حاسوب', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Intel_logo_%282006-2020%29.svg/320px-Intel_logo_%282006-2020%29.svg.png', category: 'تقنية', aliases: ['إنتل', 'انتل'] },
  { id: 22, name: 'Twitter', hint: 'طائر التغريدات الأزرق', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/320px-Logo_of_Twitter.svg.png', category: 'تواصل', aliases: ['تويتر', 'تويتور', 'X'] },
  { id: 23, name: 'Facebook', hint: 'F الزرقاء الاجتماعية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/320px-Facebook_Logo_%282019%29.png', category: 'تواصل', aliases: ['فيسبوك', 'فيس بوك'] },
  { id: 24, name: 'Instagram', hint: 'كاميرا التدرج الملون', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/320px-Instagram_logo_2016.svg.png', category: 'تواصل', aliases: ['انستغرام', 'انستجرام', 'انستقرام'] },
  { id: 25, name: 'WhatsApp', hint: 'فقاعة الدردشة الخضراء', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/320px-WhatsApp.svg.png', category: 'تواصل', aliases: ['واتساب', 'واتس اب', 'واتس'] },
  { id: 26, name: 'Telegram', hint: 'الطائرة الورقية الزرقاء', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/320px-Telegram_logo.svg.png', category: 'تواصل', aliases: ['تيليجرام', 'تلغرام'] },
  { id: 27, name: 'TikTok', hint: 'نوتة موسيقية ملونة', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/320px-TikTok_logo.svg.png', category: 'تواصل', aliases: ['تيكتوك', 'تيك توك'] },
  { id: 28, name: 'LinkedIn', hint: 'الشبكة المهنية الزرقاء', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/320px-LinkedIn_logo_initials.png', category: 'تواصل', aliases: ['لينكدإن', 'لينكد إن'] },
  { id: 29, name: 'Snapchat', hint: 'الشبح الأصفر', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ad/Snapchat_logo.svg/320px-Snapchat_logo.svg.png', category: 'تواصل', aliases: ['سناب شات', 'سناب', 'سنابشات'] },
  { id: 30, name: 'Disney', hint: 'قلعة سندريلا بتوقيع والت', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney_logo.svg/320px-Disney_logo.svg.png', category: 'ترفيه', aliases: ['ديزني', 'ديزنى'] },
  { id: 31, name: 'NASA', hint: 'وكالة الفضاء الأمريكية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/320px-NASA_logo.svg.png', category: 'علوم', aliases: ['ناسا'] },
  { id: 32, name: 'Red Bull', hint: 'ثوران الطاقة الثورين', image: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/RedBull_Logo.svg/320px-RedBull_Logo.svg.png', category: 'مشروبات', aliases: ['ريد بول', 'ريدبول'] },
  { id: 33, name: 'Puma', hint: 'القفزة البرية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Puma_AG_logo.svg/320px-Puma_AG_logo.svg.png', category: 'رياضة', aliases: ['بوما'] },
  { id: 34, name: 'Reebok', hint: 'الغزال الرياضي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Reebok_logo_2019.svg/320px-Reebok_logo_2019.svg.png', category: 'رياضة', aliases: ['ريبوك', 'ريباك'] },
  { id: 35, name: 'Louis Vuitton', hint: 'LV الفرنسية الفاخرة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Louis_Vuitton_logo_and_wordmark.svg/320px-Louis_Vuitton_logo_and_wordmark.svg.png', category: 'فاخرة', aliases: ['لويس فيتون', 'lv', 'louis vuitton'] },
  { id: 36, name: 'Gucci', hint: 'الـ GG الإيطالية الفاخرة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/1960s_Gucci_Logo.svg/320px-1960s_Gucci_Logo.svg.png', category: 'فاخرة', aliases: ['غوتشي', 'قوتشي'] },
  { id: 37, name: 'Chanel', hint: 'الـ CC الفرنسية الأنيقة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Chanel_logo_interlocking_cs.svg/320px-Chanel_logo_interlocking_cs.svg.png', category: 'فاخرة', aliases: ['شانيل', 'شانيل'] },
  { id: 38, name: 'Rolex', hint: 'التاج الذهبي للساعات', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Rolex_logo.svg/320px-Rolex_logo.svg.png', category: 'ساعات', aliases: ['رولكس', 'رولكس'] },
  { id: 39, name: 'Mastercard', hint: 'دائرتان متداخلتان', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/320px-Mastercard-logo.svg.png', category: 'مالية', aliases: ['ماستركارد'] },
  { id: 40, name: 'Lego', hint: 'مكعبات البناء الملونة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/320px-LEGO_logo.svg.png', category: 'ألعاب', aliases: ['ليغو', 'ليجو'] },
  { id: 41, name: 'LEGO', hint: 'مكعبات البناء الشهيرة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/LEGO_logo.svg/320px-LEGO_logo.svg.png', category: 'ألعاب', aliases: ['ليغو', 'ليجو', 'lego'] },
  { id: 42, name: 'Airbnb', hint: 'رمز الإقامة الوردي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/320px-Airbnb_Logo_B%C3%A9lo.svg.png', category: 'سفر', aliases: ['إير بي إن بي', 'ايرباند'] },
  { id: 43, name: 'Uber', hint: 'مربع الرحلات السوداء', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Uber_logo_2018.svg/320px-Uber_logo_2018.svg.png', category: 'نقل', aliases: ['أوبر', 'اوبر'] },
  { id: 44, name: 'Zoom', hint: 'الفيديو الأزرق للاجتماعات', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Zoom_Logo_2022.svg/320px-Zoom_Logo_2022.svg.png', category: 'تقنية', aliases: ['زوم'] },
  { id: 45, name: 'Twitch', hint: 'البث المباشر البنفسجي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Twitch_logo.svg/320px-Twitch_logo.svg.png', category: 'ترفيه', aliases: ['تويتش', 'تويتش'] },
]

export const PHONE_LOGOS: Question[] = [
  { id: 1, name: 'Apple', hint: 'صانع iPhone', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/320px-Apple_logo_black.svg.png', aliases: ['أبل', 'ابل', 'iphone'] },
  { id: 2, name: 'Samsung', hint: 'صانع Galaxy', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/320px-Samsung_Logo.svg.png', aliases: ['سامسونج', 'galaxy'] },
  { id: 3, name: 'Huawei', hint: 'الزهرة الصينية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Huawei_Logo.svg/320px-Huawei_Logo.svg.png', aliases: ['هواوي', 'هاوي'] },
  { id: 4, name: 'Xiaomi', hint: 'MI الصينية الصغيرة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/320px-Xiaomi_logo_%282021-%29.svg.png', aliases: ['شاومي', 'شاومى', 'mi'] },
  { id: 5, name: 'OnePlus', hint: 'Never Settle الصينية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/OnePlus_Logo.svg/320px-OnePlus_Logo.svg.png', aliases: ['ون بلس', 'oneplus'] },
  { id: 6, name: 'Sony', hint: 'صانع Xperia', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/320px-Sony_logo.svg.png', aliases: ['سوني', 'xperia'] },
  { id: 7, name: 'Nokia', hint: 'Connecting People الفنلندية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nokia_wordmark.svg/320px-Nokia_wordmark.svg.png', aliases: ['نوكيا'] },
  { id: 8, name: 'Motorola', hint: 'M المبطنة الأمريكية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Motorola_logomark.svg/320px-Motorola_logomark.svg.png', aliases: ['موتورولا', 'موتورلا'] },
  { id: 9, name: 'OPPO', hint: 'O الصينية الدائرية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Oppo_logo.svg/320px-Oppo_logo.svg.png', aliases: ['أوبو', 'اوبو'] },
  { id: 10, name: 'Vivo', hint: 'V الصينية الموسيقية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Vivo_logo.svg/320px-Vivo_logo.svg.png', aliases: ['فيفو'] },
  { id: 11, name: 'Realme', hint: 'الصينية الشبابية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Realme_logo.svg/320px-Realme_logo.svg.png', aliases: ['ريلمي', 'ريل مي'] },
  { id: 12, name: 'Google', hint: 'صانع Pixel', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png', aliases: ['جوجل', 'pixel'] },
  { id: 13, name: 'LG', hint: 'Life is Good الكورية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/LG_logo_%282015%29.svg/320px-LG_logo_%282015%29.svg.png', aliases: ['إل جي', 'ال جي'] },
  { id: 14, name: 'HTC', hint: 'Quietly Brilliant التايوانية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/HTC_logo_2013.svg/320px-HTC_logo_2013.svg.png', aliases: ['إتش تي سي', 'اتش تي سي'] },
  { id: 15, name: 'BlackBerry', hint: 'لوحة المفاتيح الكندية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/BlackBerry_Limited_Logo.svg/320px-BlackBerry_Limited_Logo.svg.png', aliases: ['بلاك بيري', 'بلاكبيري'] },
  { id: 16, name: 'Asus', hint: 'التايوانية بالحرف A', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/320px-ASUS_Logo.svg.png', aliases: ['أسوس', 'ايسوس'] },
  { id: 17, name: 'Lenovo', hint: 'الصينية اللفظ الجديد', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/320px-Lenovo_logo_2015.svg.png', aliases: ['لينوفو', 'ليناف'] },
  { id: 18, name: 'ZTE', hint: 'الاتصالات الصينية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/ZTE_Logo_2021.svg/320px-ZTE_Logo_2021.svg.png', aliases: ['زد تي إي', 'زتي'] },
  { id: 19, name: 'Honor', hint: 'الفرع المستقل من هواوي', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Honor_logo.svg/320px-Honor_logo.svg.png', aliases: ['هونر', 'هونور'] },
  { id: 20, name: 'Nothing', hint: 'الشفاف الجديد المميز', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Nothing_logo.svg/320px-Nothing_logo.svg.png', aliases: ['ناثينج', 'نثينج'] },
  { id: 21, name: 'Meizu', hint: 'الصينية بالدائرة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Meizu_logo.svg/320px-Meizu_logo.svg.png', aliases: ['مييزو', 'ميزو'] },
  { id: 22, name: 'Tecno', hint: 'الإفريقية الصينية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Tecno_Logo.svg/320px-Tecno_Logo.svg.png', aliases: ['تيكنو', 'تكنو'] },
  { id: 23, name: 'Infinix', hint: 'العلامة الشبابية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Infinix_Mobile_logo.svg/320px-Infinix_Mobile_logo.svg.png', aliases: ['إنفينيكس', 'انفينيكس'] },
  { id: 24, name: 'Sharp', hint: 'اليابانية الحادة', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Sharp_logo.svg/320px-Sharp_logo.svg.png', aliases: ['شارب'] },
  { id: 25, name: 'Panasonic', hint: 'الإلكترونيات اليابانية', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Panasonic_Corporation_%28logo%29.svg/320px-Panasonic_Corporation_%28logo%29.svg.png', aliases: ['باناسونيك', 'باناسونك'] },
]

export const GAME_TYPES = [
  { id: 'logo_guess', name: 'تخمين اللوجو', emoji: '🎯', description: 'خمّن الماركة من لوجوها', color: 'from-purple-600 to-pink-600', maxPlayers: 8, route: '/game/logo_guess' },
  { id: 'car_logo', name: 'لوجو السيارات', emoji: '🚗', description: 'من يعرف اللوجوهات أكثر؟', color: 'from-blue-600 to-cyan-600', maxPlayers: 8, route: '/game/car_logo' },
  { id: 'brand_logo', name: 'ماركات عالمية', emoji: '🌍', description: 'تحدي الماركات العالمية', color: 'from-orange-600 to-red-600', maxPlayers: 8, route: '/game/brand_logo' },
  { id: 'phone_guess', name: 'خمّن الهاتف', emoji: '📱', description: 'شركات الهواتف الكبرى', color: 'from-green-600 to-teal-600', maxPlayers: 8, route: '/game/phone_guess' },
  { id: 'tic_tac_toe', name: 'إكس أو', emoji: '⭕', description: 'الكلاسيكية الخالدة', color: 'from-yellow-600 to-orange-600', maxPlayers: 2, route: '/game/tic_tac_toe' },
  { id: 'snake', name: 'الثعبان', emoji: '🐍', description: 'كُل وتحدّ صديقك!', color: 'from-emerald-600 to-green-600', maxPlayers: 2, route: '/game/snake' },
  { id: 'islamic', name: 'الاختبار الإسلامي', emoji: '🕌', description: 'أسئلة دينية وارتقِ في الرتب', color: 'from-teal-700 to-emerald-700', maxPlayers: 1, route: '/game/islamic' },
]

export function getRandomQuestions(gameType: string, count: number = 10): Question[] {
  let pool: Question[] = []
  if (gameType === 'car_logo') pool = CAR_LOGOS
  else if (gameType === 'brand_logo' || gameType === 'logo_guess') pool = BRAND_LOGOS
  else if (gameType === 'phone_guess') pool = PHONE_LOGOS
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function checkAnswer(userAnswer: string, question: Question): boolean {
  const normalize = (s: string) => s.trim().toLowerCase()
    .replace(/[-\s_]/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/ى/g, 'ي')
  const ua = normalize(userAnswer)
  if (!ua) return false
  if (normalize(question.name) === ua) return true
  if (question.aliases?.some(a => normalize(a) === ua)) return true
  // partial match for long names (>5 chars)
  if (ua.length >= 4 && normalize(question.name).includes(ua)) return true
  return false
}

export function calculatePoints(timeLeft: number, maxTime: number = 15): number {
  // Base 100 points, bonus up to 50 for speed
  const speedBonus = Math.round((timeLeft / maxTime) * 50)
  return 100 + speedBonus
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
