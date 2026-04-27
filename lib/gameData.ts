export const CAR_LOGOS = [
  { id: 1, name: 'Toyota', hint: 'يابانية', emoji: '🚗' },
  { id: 2, name: 'BMW', hint: 'ألمانية فاخرة', emoji: '🚘' },
  { id: 3, name: 'Mercedes', hint: 'النجمة الثلاثية', emoji: '⭐' },
  { id: 4, name: 'Ferrari', hint: 'الحصان الإيطالي', emoji: '🐎' },
  { id: 5, name: 'Lamborghini', hint: 'الثور الإيطالي', emoji: '🐂' },
  { id: 6, name: 'Porsche', hint: 'الحصان الألماني', emoji: '🏎️' },
  { id: 7, name: 'Audi', hint: 'أربع حلقات', emoji: '⭕' },
  { id: 8, name: 'Ford', hint: 'أمريكية', emoji: '🇺🇸' },
  { id: 9, name: 'Honda', hint: 'يابانية H', emoji: '🏍️' },
  { id: 10, name: 'Chevrolet', hint: 'الفراشة الذهبية', emoji: '✈️' },
  { id: 11, name: 'Volkswagen', hint: 'سيارة الشعب', emoji: '🇩🇪' },
  { id: 12, name: 'Hyundai', hint: 'كورية H', emoji: '🇰🇷' },
  { id: 13, name: 'Kia', hint: 'كورية', emoji: '🎯' },
  { id: 14, name: 'Nissan', hint: 'يابانية الشمس', emoji: '🌅' },
  { id: 15, name: 'Jeep', hint: 'مغامرات برية', emoji: '🏔️' },
]

export const BRAND_LOGOS = [
  { id: 1, name: 'Apple', hint: 'التفاحة المقضومة', emoji: '🍎', category: 'تقنية' },
  { id: 2, name: 'Nike', hint: 'Swoosh', emoji: '✔️', category: 'رياضة' },
  { id: 3, name: 'Adidas', hint: 'ثلاثة خطوط', emoji: '3️⃣', category: 'رياضة' },
  { id: 4, name: 'McDonald\'s', hint: 'القوسان الذهبيان', emoji: '🍔', category: 'طعام' },
  { id: 5, name: 'Coca-Cola', hint: 'الخط الأحمر', emoji: '🥤', category: 'مشروبات' },
  { id: 6, name: 'Amazon', hint: 'السهم من A إلى Z', emoji: '📦', category: 'تجارة' },
  { id: 7, name: 'Google', hint: 'ألوان قوس قزح', emoji: '🌈', category: 'تقنية' },
  { id: 8, name: 'Samsung', hint: 'كورية التقنية', emoji: '📱', category: 'تقنية' },
  { id: 9, name: 'Netflix', hint: 'N الحمراء', emoji: '🎬', category: 'ترفيه' },
  { id: 10, name: 'Spotify', hint: 'الدوائر الخضراء', emoji: '🎵', category: 'موسيقى' },
  { id: 11, name: 'Twitter', hint: 'طائر أزرق', emoji: '🐦', category: 'تواصل' },
  { id: 12, name: 'Instagram', hint: 'كاميرا ملونة', emoji: '📸', category: 'تواصل' },
  { id: 13, name: 'Facebook', hint: 'F الزرقاء', emoji: '👥', category: 'تواصل' },
  { id: 14, name: 'YouTube', hint: 'مثلث أحمر', emoji: '▶️', category: 'فيديو' },
  { id: 15, name: 'IKEA', hint: 'السويدية الزرقاء والصفراء', emoji: '🪑', category: 'أثاث' },
]

export const PHONE_LOGOS = [
  { id: 1, name: 'iPhone 15', hint: 'جزيرة ديناميكية', emoji: '📱' },
  { id: 2, name: 'Samsung Galaxy S24', hint: 'كورية رائدة', emoji: '📱' },
  { id: 3, name: 'Google Pixel 8', hint: 'بار الكاميرا المميز', emoji: '📱' },
  { id: 4, name: 'OnePlus 12', hint: 'Never Settle', emoji: '📱' },
  { id: 5, name: 'Xiaomi 14', hint: 'صينية متقدمة', emoji: '📱' },
  { id: 6, name: 'Huawei P60', hint: 'المحدقة الدائرية', emoji: '📱' },
  { id: 7, name: 'Sony Xperia', hint: 'شاشة OLED', emoji: '📱' },
  { id: 8, name: 'OPPO Find X', hint: 'كاميرا حسكو', emoji: '📱' },
]

export const GAME_TYPES = [
  {
    id: 'logo_guess',
    name: 'تخمين اللوجو',
    emoji: '🎯',
    description: 'خمّن الماركة من لوجوها',
    color: 'from-purple-600 to-pink-600',
    maxPlayers: 8,
  },
  {
    id: 'car_logo',
    name: 'لوجو السيارات',
    emoji: '🚗',
    description: 'من يعرف اللوجوهات أكثر؟',
    color: 'from-blue-600 to-cyan-600',
    maxPlayers: 8,
  },
  {
    id: 'brand_logo',
    name: 'ماركات عالمية',
    emoji: '🌍',
    description: 'تحدي الماركات العالمية',
    color: 'from-orange-600 to-red-600',
    maxPlayers: 8,
  },
  {
    id: 'phone_guess',
    name: 'خمّن الهاتف',
    emoji: '📱',
    description: 'هواتف من صورتها',
    color: 'from-green-600 to-teal-600',
    maxPlayers: 8,
  },
  {
    id: 'tic_tac_toe',
    name: 'إكس أو',
    emoji: '⭕',
    description: 'الكلاسيكية الخالدة',
    color: 'from-yellow-600 to-orange-600',
    maxPlayers: 2,
  },
  {
    id: 'snake',
    name: 'الثعبان',
    emoji: '🐍',
    description: 'كُل وكبر وتفوق',
    color: 'from-emerald-600 to-green-600',
    maxPlayers: 1,
  },
]

export function getRandomQuestions(gameType: string, count: number = 10) {
  let pool: Array<{ id: number; name: string; hint: string; emoji: string; [key: string]: unknown }> = []
  
  if (gameType === 'car_logo') pool = CAR_LOGOS
  else if (gameType === 'brand_logo' || gameType === 'logo_guess') pool = BRAND_LOGOS
  else if (gameType === 'phone_guess') pool = PHONE_LOGOS
  
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
