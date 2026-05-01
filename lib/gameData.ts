export interface Question {
  id: number
  name: string
  hint: string
  image: string
  category?: string
  aliases?: string[]
}

// Using multiple CDN sources for reliability
const WK = (path: string) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}`
const WKen = (path: string) => `https://upload.wikimedia.org/wikipedia/en/thumb/${path}`
const CDN = (url: string) => `https://logo.clearbit.com/${url}`

export const CAR_LOGOS: Question[] = [
  { id: 1, name: 'Toyota', hint: 'يابانية الأكثر مبيعاً', image: CDN('toyota.com'), aliases: ['تويوتا'] },
  { id: 2, name: 'BMW', hint: 'ألمانية فاخرة - بافاريا', image: CDN('bmw.com'), aliases: ['بي ام دبليو','بي ام و'] },
  { id: 3, name: 'Mercedes', hint: 'النجمة الثلاثية الألمانية', image: CDN('mercedes-benz.com'), aliases: ['مرسيدس','mercedes-benz','مرسيدس بنز'] },
  { id: 4, name: 'Ferrari', hint: 'الحصان الأصفر الإيطالي', image: CDN('ferrari.com'), aliases: ['فيراري','فراري'] },
  { id: 5, name: 'Lamborghini', hint: 'الثور الإيطالي الأسطوري', image: CDN('lamborghini.com'), aliases: ['لامبورغيني','لمبرغيني'] },
  { id: 6, name: 'Porsche', hint: 'الحصان الألماني للسباقات', image: CDN('porsche.com'), aliases: ['بورش','بورشه'] },
  { id: 7, name: 'Audi', hint: 'أربع حلقات متداخلة', image: CDN('audi.com'), aliases: ['أودي','اودي'] },
  { id: 8, name: 'Ford', hint: 'الأمريكية الكلاسيكية', image: CDN('ford.com'), aliases: ['فورد'] },
  { id: 9, name: 'Honda', hint: 'يابانية بحرف H', image: CDN('honda.com'), aliases: ['هوندا'] },
  { id: 10, name: 'Chevrolet', hint: 'الفراشة الذهبية الأمريكية', image: CDN('chevrolet.com'), aliases: ['شيفروليه','شيفروليت','chevy'] },
  { id: 11, name: 'Volkswagen', hint: 'سيارة الشعب الألمانية', image: CDN('volkswagen.com'), aliases: ['فولكس واغن','فولكسواغن','vw'] },
  { id: 12, name: 'Hyundai', hint: 'الكورية بحرف H مائل', image: CDN('hyundai.com'), aliases: ['هيونداي','هيونداى'] },
  { id: 13, name: 'Kia', hint: 'الكورية العصرية', image: CDN('kia.com'), aliases: ['كيا'] },
  { id: 14, name: 'Nissan', hint: 'يابانية شمس النهار', image: CDN('nissan.com'), aliases: ['نيسان'] },
  { id: 15, name: 'Jeep', hint: 'مغامرات برية أمريكية', image: CDN('jeep.com'), aliases: ['جيب'] },
  { id: 16, name: 'Tesla', hint: 'الكهربائية بحرف T', image: CDN('tesla.com'), aliases: ['تسلا'] },
  { id: 17, name: 'Peugeot', hint: 'الأسد الفرنسي', image: CDN('peugeot.com'), aliases: ['بيجو'] },
  { id: 18, name: 'Renault', hint: 'المعين الفرنسي', image: CDN('renault.com'), aliases: ['رينو','رونو'] },
  { id: 19, name: 'Lexus', hint: 'الفاخرة اليابانية L', image: CDN('lexus.com'), aliases: ['لكزس','لكسس'] },
  { id: 20, name: 'Mazda', hint: 'أجنحة يابانية', image: CDN('mazda.com'), aliases: ['مازدا'] },
  { id: 21, name: 'Subaru', hint: 'نجوم الثريا اليابانية', image: CDN('subaru.com'), aliases: ['سوبارو'] },
  { id: 22, name: 'Mitsubishi', hint: 'ثلاث ألماسات يابانية', image: CDN('mitsubishi.com'), aliases: ['ميتسوبيشي'] },
  { id: 23, name: 'Volvo', hint: 'السويدية الآمنة', image: CDN('volvocars.com'), aliases: ['فولفو'] },
  { id: 24, name: 'Bugatti', hint: 'أسرع سيارة في العالم', image: CDN('bugatti.com'), aliases: ['بوغاتي','بوجاتي'] },
  { id: 25, name: 'Bentley', hint: 'الفاخرة البريطانية الجناح', image: CDN('bentleymotors.com'), aliases: ['بنتلي'] },
  { id: 26, name: 'Rolls-Royce', hint: 'Spirit of Ecstasy البريطانية', image: CDN('rolls-roycemotorcars.com'), aliases: ['رولز رويس'] },
  { id: 27, name: 'Maserati', hint: 'الشوكة الإيطالية', image: CDN('maserati.com'), aliases: ['مازيراتي'] },
  { id: 28, name: 'Alfa Romeo', hint: 'الصليب والثعبان الإيطالي', image: CDN('alfaromeo.com'), aliases: ['ألفا روميو','الفا روميو'] },
  { id: 29, name: 'Dodge', hint: 'الرام الأمريكي', image: CDN('dodge.com'), aliases: ['دودج'] },
  { id: 30, name: 'Cadillac', hint: 'الفخامة الأمريكية', image: CDN('cadillac.com'), aliases: ['كاديلاك'] },
  { id: 31, name: 'Lincoln', hint: 'الفاخرة الأمريكية النجمة', image: CDN('lincolnvehicles.com'), aliases: ['لينكولن'] },
  { id: 32, name: 'Acura', hint: 'الفاخرة اليابانية من هوندا', image: CDN('acura.com'), aliases: ['أكيورا','اكيورا'] },
  { id: 33, name: 'Infiniti', hint: 'الفاخرة من نيسان', image: CDN('infiniti.com'), aliases: ['انفينيتي','إنفينيتي'] },
  { id: 34, name: 'Genesis', hint: 'الكورية الفاخرة الجديدة', image: CDN('genesis.com'), aliases: ['جينيسيس'] },
  { id: 35, name: 'Land Rover', hint: 'ملك الطرق الوعرة البريطاني', image: CDN('landrover.com'), aliases: ['لاند روفر','landrover'] },
  { id: 36, name: 'Jaguar', hint: 'القفزة البريطانية الأنيقة', image: CDN('jaguar.com'), aliases: ['جاكوار','جاغوار'] },
  { id: 37, name: 'Aston Martin', hint: 'سيارة جيمس بوند', image: CDN('astonmartin.com'), aliases: ['أستون مارتن','استون مارتن'] },
  { id: 38, name: 'McLaren', hint: 'البريطانية الفائقة السرعة', image: CDN('mclaren.com'), aliases: ['ماكلارين','مكلارين'] },
  { id: 39, name: 'Chrysler', hint: 'الجناح الأمريكي', image: CDN('chrysler.com'), aliases: ['كرايسلر'] },
  { id: 40, name: 'Seat', hint: 'الإسبانية من فولكس', image: CDN('seat.com'), aliases: ['سيات'] },
  { id: 41, name: 'Skoda', hint: 'التشيكية بالسهم', image: CDN('skoda-auto.com'), aliases: ['شكودا','سكودا'] },
  { id: 42, name: 'Citroen', hint: 'الشيفرونات الفرنسية', image: CDN('citroen.com'), aliases: ['سيتروين','سيترون'] },
  { id: 43, name: 'Fiat', hint: 'الإيطالية الصغيرة الشهيرة', image: CDN('fiat.com'), aliases: ['فيات'] },
  { id: 44, name: 'Suzuki', hint: 'اليابانية الخفيفة', image: CDN('suzuki.com'), aliases: ['سوزوكي'] },
  { id: 45, name: 'Opel', hint: 'الألمانية البرق', image: CDN('opel.com'), aliases: ['أوبل','اوبل'] },
]

export const BRAND_LOGOS: Question[] = [
  { id: 1, name: 'Apple', hint: 'التفاحة المقضومة', image: CDN('apple.com'), category: 'تقنية', aliases: ['أبل','ابل'] },
  { id: 2, name: 'Nike', hint: 'Just Do It - Swoosh', image: CDN('nike.com'), category: 'رياضة', aliases: ['نايك'] },
  { id: 3, name: 'Adidas', hint: 'ثلاثة خطوط موازية', image: CDN('adidas.com'), category: 'رياضة', aliases: ['أديداس','اديداس'] },
  { id: 4, name: 'McDonald\'s', hint: 'القوسان الذهبيان M', image: CDN('mcdonalds.com'), category: 'طعام', aliases: ['ماكدونالدز','ماكدونالد','mcdonalds'] },
  { id: 5, name: 'Coca-Cola', hint: 'الخط الأحمر الكلاسيكي', image: CDN('coca-cola.com'), category: 'مشروبات', aliases: ['كوكاكولا','كوكا كولا'] },
  { id: 6, name: 'Amazon', hint: 'السهم من A إلى Z ابتسامة', image: CDN('amazon.com'), category: 'تجارة', aliases: ['أمازون','امازون'] },
  { id: 7, name: 'Google', hint: 'ألوان قوس قزح الأربعة', image: CDN('google.com'), category: 'تقنية', aliases: ['جوجل','قوقل'] },
  { id: 8, name: 'Samsung', hint: 'الكورية ملك الشاشات', image: CDN('samsung.com'), category: 'تقنية', aliases: ['سامسونج','سامسونغ'] },
  { id: 9, name: 'Netflix', hint: 'N الحمراء للبث', image: CDN('netflix.com'), category: 'ترفيه', aliases: ['نتفليكس'] },
  { id: 10, name: 'Spotify', hint: 'الدوائر الخضراء الثلاث', image: CDN('spotify.com'), category: 'موسيقى', aliases: ['سبوتيفاي'] },
  { id: 11, name: 'YouTube', hint: 'مثلث التشغيل الأحمر', image: CDN('youtube.com'), category: 'فيديو', aliases: ['يوتيوب'] },
  { id: 12, name: 'IKEA', hint: 'أزرق وأصفر سويدية', image: CDN('ikea.com'), category: 'أثاث', aliases: ['إيكيا','ايكيا'] },
  { id: 13, name: 'Microsoft', hint: 'نافذة الألوان الأربعة', image: CDN('microsoft.com'), category: 'تقنية', aliases: ['مايكروسوفت'] },
  { id: 14, name: 'Pepsi', hint: 'الكرة الزرقاء الحمراء', image: CDN('pepsi.com'), category: 'مشروبات', aliases: ['بيبسي'] },
  { id: 15, name: 'Starbucks', hint: 'حورية البحر الخضراء', image: CDN('starbucks.com'), category: 'قهوة', aliases: ['ستاربكس','ستارباكس'] },
  { id: 16, name: 'Shell', hint: 'الصدفة الصفراء والحمراء', image: CDN('shell.com'), category: 'نفط', aliases: ['شل','شيل'] },
  { id: 17, name: 'Adobe', hint: 'A الحمراء للإبداع', image: CDN('adobe.com'), category: 'تقنية', aliases: ['أدوبي','ادوبي'] },
  { id: 18, name: 'PayPal', hint: 'P المزدوجة الزرقاء', image: CDN('paypal.com'), category: 'مالية', aliases: ['باي بال'] },
  { id: 19, name: 'Visa', hint: 'بطاقة الدفع الزرقاء', image: CDN('visa.com'), category: 'مالية', aliases: ['فيزا'] },
  { id: 20, name: 'MasterCard', hint: 'الدائرتان الحمراء والصفراء', image: CDN('mastercard.com'), category: 'مالية', aliases: ['ماستركارد','master card'] },
  { id: 21, name: 'Intel', hint: 'داخل كل حاسوب', image: CDN('intel.com'), category: 'تقنية', aliases: ['إنتل','انتل'] },
  { id: 22, name: 'Twitter', hint: 'طائر التغريدات الأزرق', image: CDN('twitter.com'), category: 'تواصل', aliases: ['تويتر','X'] },
  { id: 23, name: 'Facebook', hint: 'F الزرقاء الاجتماعية', image: CDN('facebook.com'), category: 'تواصل', aliases: ['فيسبوك','فيس بوك'] },
  { id: 24, name: 'Instagram', hint: 'كاميرا التدرج الملون', image: CDN('instagram.com'), category: 'تواصل', aliases: ['انستغرام','انستجرام','انستقرام'] },
  { id: 25, name: 'WhatsApp', hint: 'فقاعة الدردشة الخضراء', image: CDN('whatsapp.com'), category: 'تواصل', aliases: ['واتساب','واتس اب','واتس'] },
  { id: 26, name: 'Telegram', hint: 'الطائرة الورقية الزرقاء', image: CDN('telegram.org'), category: 'تواصل', aliases: ['تيليجرام','تلغرام'] },
  { id: 27, name: 'TikTok', hint: 'نوتة موسيقية ملونة', image: CDN('tiktok.com'), category: 'تواصل', aliases: ['تيكتوك','تيك توك'] },
  { id: 28, name: 'LinkedIn', hint: 'الشبكة المهنية الزرقاء', image: CDN('linkedin.com'), category: 'تواصل', aliases: ['لينكدإن','لينكد إن'] },
  { id: 29, name: 'Snapchat', hint: 'الشبح الأصفر', image: CDN('snapchat.com'), category: 'تواصل', aliases: ['سناب شات','سناب','سنابشات'] },
  { id: 30, name: 'Disney', hint: 'قلعة سندريلا بتوقيع والت', image: CDN('disney.com'), category: 'ترفيه', aliases: ['ديزني'] },
  { id: 31, name: 'NASA', hint: 'وكالة الفضاء الأمريكية', image: CDN('nasa.gov'), category: 'علوم', aliases: ['ناسا'] },
  { id: 32, name: 'Red Bull', hint: 'ثوران الطاقة الثورين', image: CDN('redbull.com'), category: 'مشروبات', aliases: ['ريد بول','ريدبول'] },
  { id: 33, name: 'Puma', hint: 'القفزة البرية', image: CDN('puma.com'), category: 'رياضة', aliases: ['بوما'] },
  { id: 34, name: 'Reebok', hint: 'الغزال الرياضي', image: CDN('reebok.com'), category: 'رياضة', aliases: ['ريبوك','ريباك'] },
  { id: 35, name: 'Louis Vuitton', hint: 'LV الفرنسية الفاخرة', image: CDN('louisvuitton.com'), category: 'فاخرة', aliases: ['لويس فيتون','lv'] },
  { id: 36, name: 'Gucci', hint: 'الـ GG الإيطالية', image: CDN('gucci.com'), category: 'فاخرة', aliases: ['غوتشي','قوتشي'] },
  { id: 37, name: 'Chanel', hint: 'الـ CC الفرنسية', image: CDN('chanel.com'), category: 'فاخرة', aliases: ['شانيل'] },
  { id: 38, name: 'Rolex', hint: 'التاج الذهبي للساعات', image: CDN('rolex.com'), category: 'ساعات', aliases: ['رولكس'] },
  { id: 39, name: 'Lego', hint: 'مكعبات البناء الملونة', image: CDN('lego.com'), category: 'ألعاب', aliases: ['ليغو','ليجو'] },
  { id: 40, name: 'Airbnb', hint: 'رمز الإقامة الوردي', image: CDN('airbnb.com'), category: 'سفر', aliases: ['إير بي إن بي','ايرباند'] },
  { id: 41, name: 'Uber', hint: 'مربع الرحلات السوداء', image: CDN('uber.com'), category: 'نقل', aliases: ['أوبر','اوبر'] },
  { id: 42, name: 'Zoom', hint: 'الفيديو الأزرق للاجتماعات', image: CDN('zoom.us'), category: 'تقنية', aliases: ['زوم'] },
  { id: 43, name: 'Twitch', hint: 'البث المباشر البنفسجي', image: CDN('twitch.tv'), category: 'ترفيه', aliases: ['تويتش'] },
  { id: 44, name: 'Nvidia', hint: 'بطاقة الشاشة الخضراء', image: CDN('nvidia.com'), category: 'تقنية', aliases: ['نفيديا','انفيديا'] },
  { id: 45, name: 'Dell', hint: 'الحاسوب الأمريكي', image: CDN('dell.com'), category: 'تقنية', aliases: ['ديل'] },
]

export const PHONE_LOGOS: Question[] = [
  { id: 1, name: 'Apple', hint: 'صانع iPhone', image: CDN('apple.com'), aliases: ['أبل','ابل','iphone'] },
  { id: 2, name: 'Samsung', hint: 'صانع Galaxy', image: CDN('samsung.com'), aliases: ['سامسونج','galaxy'] },
  { id: 3, name: 'Huawei', hint: 'الزهرة الصينية', image: CDN('huawei.com'), aliases: ['هواوي','هاوي'] },
  { id: 4, name: 'Xiaomi', hint: 'MI الصينية الصغيرة', image: CDN('xiaomi.com'), aliases: ['شاومي','شاومى','mi'] },
  { id: 5, name: 'OnePlus', hint: 'Never Settle', image: CDN('oneplus.com'), aliases: ['ون بلس','oneplus'] },
  { id: 6, name: 'Sony', hint: 'صانع Xperia', image: CDN('sony.com'), aliases: ['سوني','xperia'] },
  { id: 7, name: 'Nokia', hint: 'Connecting People', image: CDN('nokia.com'), aliases: ['نوكيا'] },
  { id: 8, name: 'Motorola', hint: 'M المبطنة الأمريكية', image: CDN('motorola.com'), aliases: ['موتورولا','موتورلا'] },
  { id: 9, name: 'OPPO', hint: 'O الصينية الدائرية', image: CDN('oppo.com'), aliases: ['أوبو','اوبو'] },
  { id: 10, name: 'Vivo', hint: 'V الصينية الموسيقية', image: CDN('vivo.com'), aliases: ['فيفو'] },
  { id: 11, name: 'Realme', hint: 'الصينية الشبابية', image: CDN('realme.com'), aliases: ['ريلمي','ريل مي'] },
  { id: 12, name: 'Google', hint: 'صانع Pixel', image: CDN('google.com'), aliases: ['جوجل','pixel'] },
  { id: 13, name: 'LG', hint: 'Life is Good الكورية', image: CDN('lg.com'), aliases: ['إل جي','ال جي'] },
  { id: 14, name: 'HTC', hint: 'Quietly Brilliant', image: CDN('htc.com'), aliases: ['إتش تي سي'] },
  { id: 15, name: 'BlackBerry', hint: 'لوحة المفاتيح الكندية', image: CDN('blackberry.com'), aliases: ['بلاك بيري','بلاكبيري'] },
  { id: 16, name: 'Asus', hint: 'التايوانية بالحرف A', image: CDN('asus.com'), aliases: ['أسوس','ايسوس'] },
  { id: 17, name: 'Lenovo', hint: 'الصينية اللفظ الجديد', image: CDN('lenovo.com'), aliases: ['لينوفو'] },
  { id: 18, name: 'Honor', hint: 'الفرع المستقل من هواوي', image: CDN('honor.com'), aliases: ['هونر','هونور'] },
  { id: 19, name: 'Nothing', hint: 'الشفاف الجديد المميز', image: CDN('nothing.tech'), aliases: ['ناثينج','نثينج'] },
  { id: 20, name: 'Tecno', hint: 'الإفريقية الصينية', image: CDN('tecno-mobile.com'), aliases: ['تيكنو','تكنو'] },
  { id: 21, name: 'Infinix', hint: 'العلامة الشبابية', image: CDN('infinixmobility.com'), aliases: ['إنفينيكس','انفينيكس'] },
  { id: 22, name: 'Sharp', hint: 'اليابانية الحادة', image: CDN('sharp.com'), aliases: ['شارب'] },
  { id: 23, name: 'Panasonic', hint: 'الإلكترونيات اليابانية', image: CDN('panasonic.com'), aliases: ['باناسونيك','باناسونك'] },
  { id: 24, name: 'ZTE', hint: 'الاتصالات الصينية', image: CDN('zte.com.cn'), aliases: ['زد تي إي','زتي'] },
  { id: 25, name: 'Meizu', hint: 'الصينية بالدائرة', image: CDN('meizu.com'), aliases: ['مييزو','ميزو'] },
]

export const GAME_TYPES = [
  { id: 'logo_guess', name: 'تخمين اللوجو', emoji: '🎯', description: 'خمّن الماركة من لوجوها', color: 'from-purple-600 to-pink-600', maxPlayers: 8, route: '/game/logo_guess' },
  { id: 'car_logo', name: 'لوجو السيارات', emoji: '🚗', description: 'من يعرف اللوجوهات أكثر؟', color: 'from-blue-600 to-cyan-600', maxPlayers: 8, route: '/game/car_logo' },
  { id: 'brand_logo', name: 'ماركات عالمية', emoji: '🌍', description: 'تحدي الماركات العالمية', color: 'from-orange-600 to-red-600', maxPlayers: 8, route: '/game/brand_logo' },
  { id: 'phone_guess', name: 'خمّن الهاتف', emoji: '📱', description: 'شركات الهواتف الكبرى', color: 'from-green-600 to-teal-600', maxPlayers: 8, route: '/game/phone_guess' },
  { id: 'tic_tac_toe', name: 'إكس أو', emoji: '⭕', description: 'الكلاسيكية الخالدة', color: 'from-yellow-600 to-orange-600', maxPlayers: 2, route: '/game/tic_tac_toe' },
  { id: 'snake', name: 'الثعبان', emoji: '🐍', description: 'كُل وتحدّ صديقك!', color: 'from-emerald-600 to-green-600', maxPlayers: 2, route: '/game/snake' },
  { id: 'islamic', name: 'الاختبار الإسلامي', emoji: '🕌', description: 'أسئلة دينية وارتقِ في الرتب', color: 'from-teal-700 to-emerald-700', maxPlayers: 8, route: '/game/islamic' },
]

export function getRandomQuestions(gameType: string, count: number = 10): Question[] {
  let pool: Question[] = []
  if (gameType === 'car_logo') pool = CAR_LOGOS
  else if (gameType === 'brand_logo' || gameType === 'logo_guess') pool = BRAND_LOGOS
  else if (gameType === 'phone_guess') pool = PHONE_LOGOS
  return [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length))
}

export function checkAnswer(userAnswer: string, question: Question): boolean {
  const n = (s: string) => s.trim().toLowerCase()
    .replace(/[-\s_]/g, '').replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/ى/g, 'ي')
  const ua = n(userAnswer)
  if (!ua || ua.length < 2) return false
  if (n(question.name) === ua) return true
  if (question.aliases?.some(a => n(a) === ua)) return true
  if (ua.length >= 4 && n(question.name).includes(ua)) return true
  return false
}

export function calculatePoints(timeLeft: number, maxTime: number = 15): number {
  return 100 + Math.round((timeLeft / maxTime) * 50)
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
