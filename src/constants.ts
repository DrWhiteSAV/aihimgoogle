import { AlchemyElement, Rarity } from "./types";

export const RARITY_COLORS: Record<Rarity, string> = {
  'Обычный': '[--card-bg:#F1F5F9] [--card-border:#CBD5E1] text-slate-700',
  'Редкий': '[--card-bg:#ECFDF5] [--card-border:#A7F3D0] text-emerald-800',
  'Эпический': '[--card-bg:#F0F9FF] [--card-border:#BAE6FD] text-sky-800',
  'Легендарный': '[--card-bg:#FFFBEB] [--card-border:#FDE68A] text-amber-800',
  'Мифический': '[--card-bg:#FEF2F2] [--card-border:#FECACA] text-rose-800',
  'Божественный': '[--card-bg:#FFF7ED] [--card-border:#FFEDD5] text-orange-800',
  'Вечный': '[--card-bg:#F5F3FF] [--card-border:#DDD6FE] text-violet-800',
  'Космический': '[--card-bg:#FDF2F9] [--card-border:#FBCFE8] text-pink-800',
  'Изначальный': '[--card-bg:#1E1B18] [--card-border:#4A453F] text-ash',
  'Трансцендентный': '[--card-bg:#000000] [--card-border:#C9A343] text-gold',
};

export const STABILITY_TAP_COST: Record<Rarity, number> = {
  'Обычный': 1,
  'Редкий': 2,
  'Эпический': 4,
  'Легендарный': 8,
  'Мифический': 16,
  'Божественный': 32,
  'Вечный': 64,
  'Космический': 128,
  'Изначальный': 256,
  'Трансцендентный': 512,
};

export const STABILITY_DECAY_INTERVAL: Record<Rarity, number> = {
  'Обычный': 60,
  'Редкий': 120,
  'Эпический': 240,
  'Легендарный': 480,
  'Мифический': 960,
  'Божественный': 1920,
  'Вечный': 3840,
  'Космический': 7680,
  'Изначальный': 15360,
  'Трансцендентный': 30720,
};

export const TEMPERATURE_DECAY_INTERVAL: Record<Rarity, number> = {
  'Обычный': 60,
  'Редкий': 120,
  'Эпический': 240,
  'Легендарный': 480,
  'Мифический': 960,
  'Божественный': 1920,
  'Вечный': 3840,
  'Космический': 7680,
  'Изначальный': 15360,
  'Трансцендентный': 30720,
};

export const INITIAL_ELEMENTS: AlchemyElement[] = [
  {
    id: 'water',
    name: 'Вода',
    description: 'Жидкость жизни, адаптируемая и настойчивая. Она течет по венам мира.',
    icon: '💧',
    rarity: 'Обычный',
    type: 'Материя',
    state: 'Жидкое',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 20,
    targetTemperature: 20,
    stability: 90,
    essences: ['life', 'order'],
    realityLevel: 1,
  },
  {
    id: 'fire',
    name: 'Огонь',
    description: 'Танцующее тепло, которое поглощает и трансформирует. Искра божественного солнца.',
    icon: '🔥',
    rarity: 'Обычный',
    type: 'Энергия',
    state: 'Плазма',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 800,
    targetTemperature: 800,
    stability: 40,
    essences: ['destruction', 'chaos'],
    realityLevel: 1,
  },
  {
    id: 'earth',
    name: 'Земля',
    description: 'Основа всего сущего. Тяжелая, безмолвная и выносливая.',
    icon: '🌍',
    rarity: 'Обычный',
    type: 'Материя',
    state: 'Твердое',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 15,
    targetTemperature: 15,
    stability: 100,
    essences: ['order'],
    realityLevel: 1,
  },
  {
    id: 'air',
    name: 'Воздух',
    description: 'Невидимое дыхание мира. Свободное, мимолетное и необходимое.',
    icon: '💨',
    rarity: 'Обычный',
    type: 'Материя',
    state: 'Газ',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 20,
    targetTemperature: 20,
    stability: 70,
    essences: ['void'],
    realityLevel: 1,
  },
  {
    id: 'metal',
    name: 'Металл',
    description: 'Кости земли, очищенные жаром. Прочный и резонирующий.',
    icon: '🛡️',
    rarity: 'Обычный',
    type: 'Материя',
    state: 'Твердое',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 10,
    targetTemperature: 10,
    stability: 95,
    essences: ['order'],
    realityLevel: 1,
  },
  {
    id: 'energy',
    name: 'Энергия',
    description: 'Чистая сила, движущая материю. Ее нельзя создать или уничтожить, только изменить.',
    icon: '⚡',
    rarity: 'Обычный',
    type: 'Энергия',
    state: 'Эфир',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 100,
    targetTemperature: 100,
    stability: 50,
    essences: ['creation', 'chaos'],
    realityLevel: 1,
  },
  {
    id: 'crystal',
    name: 'Кристалл',
    description: 'Порядок, застывший во времени. Он преломляет свет и хранит древние воспоминания.',
    icon: '💎',
    rarity: 'Обычный',
    type: 'Материя',
    state: 'Твердое',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 5,
    targetTemperature: 5,
    stability: 98,
    essences: ['order', 'creation'],
    realityLevel: 1,
  },
  {
    id: 'darkness',
    name: 'Тьма',
    description: 'Пустота между звездами. Это не отсутствие света, а его вместилище.',
    icon: '🌑',
    rarity: 'Обычный',
    type: 'Энергия',
    state: 'Эфир',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: -50,
    targetTemperature: -50,
    stability: 60,
    essences: ['void', 'destruction'],
    realityLevel: 1,
  },
  {
    id: 'light',
    name: 'Свет',
    description: 'Первое слово творения. Он открывает истину и изгоняет тени.',
    icon: '✨',
    rarity: 'Обычный',
    type: 'Энергия',
    state: 'Эфир',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 50,
    targetTemperature: 50,
    stability: 80,
    essences: ['creation', 'order'],
    realityLevel: 1,
  },
  {
    id: 'organics',
    name: 'Органика',
    description: 'Сложный танец материи, стремящейся к росту и размножению.',
    icon: '🌿',
    rarity: 'Обычный',
    type: 'Материя',
    state: 'Твердое',
    complexity: 1,
    discoveredAt: Date.now(),
    temperature: 25,
    targetTemperature: 25,
    stability: 85,
    essences: ['life'],
    realityLevel: 1,
  },
];

export const COLORS = {
  sepia: '#704214',
  gold: '#C9A343',
  ink: '#1E1B18',
  ash: '#D8CFC4',
  parchment: '#F5F2ED',
};

export const REALITY_LAYERS = [
  { 
    level: 1, 
    name: "Физический", 
    desc: "Основы материи и энергии.",
    rules: "На этом слое действуют простейшие законы физики. Элементы стабильны, но ограничены в сложности. Основная цель: накопить базу первоэлементов.",
    unlock: "Доступен изначально."
  },
  { 
    level: 2, 
    name: "Химический", 
    desc: "Сложные реакции и превращения.",
    rules: "Реакции становятся более бурными. Температура и стабильность начинают играть ключевую роль. Появляются первые гибридные формы.",
    unlock: "Откройте 10 элементов 1-го слоя."
  },
  { 
    level: 3, 
    name: "Биологический", 
    desc: "Зарождение и эволюция жизни.",
    rules: "Материя начинает стремиться к самовоспроизведению. Сущность 'Жизнь' становится катализатором для большинства успешных реакций.",
    unlock: "Откройте 25 элементов и хотя бы один элемент с сущностью 'Жизнь'."
  },
  { 
    level: 4, 
    name: "Абстрактный", 
    desc: "Разум, время и нематериальное.",
    rules: "Границы между материей и мыслью стираются. Элементы могут существовать вне времени. Шанс мутаций значительно возрастает.",
    unlock: "Откройте 50 элементов и познайте 'Закон Времени'."
  },
  { 
    level: 5, 
    name: "Космический", 
    desc: "Тайны звезд и сингулярностей.",
    rules: "Законы локальной реальности более не действуют. Вы оперируете энергиями звездных масштабов. Возможно создание 'Запретных' элементов.",
    unlock: "Откройте 100 элементов и достигните ранга 'Магистр'."
  },
];

export const ESSENCE_TRANSLATIONS: Record<string, string> = {
  order: 'Порядок',
  chaos: 'Хаос',
  life: 'Жизнь',
  death: 'Смерть',
  void: 'Пустота',
  creation: 'Созидание',
  destruction: 'Разрушение',
  light: 'Свет',
  darkness: 'Тьма',
  energy: 'Энергия',
  matter: 'Материя',
  time: 'Время',
  mind: 'Разум',
  spirit: 'Дух',
};

export const translateEssence = (essence: string) => {
  return ESSENCE_TRANSLATIONS[essence.toLowerCase()] || essence;
};

export const HIDDEN_LAWS = [
  { id: 'temp', icon: 'Thermometer', name: 'Закон Температуры', desc: 'Жар и холод меняют суть вещей.', detail: 'При достижении экстремальных температур (выше 500°C) материя начинает вести себя непредсказуемо, открывая путь к плазменным и энергетическим формам.' },
  { id: 'opp', icon: 'Contrast', name: 'Закон Противоположностей', desc: 'Свет и тьма порождают хаос или синтез.', detail: 'Соединение сущностей Пустоты (Void) и Созидания (Creation) создает мощный резонанс, способный породить элементы высших порядков.' },
  { id: 'life', icon: 'Leaf', name: 'Закон Жизни', desc: 'Органика стремится к усложнению через энергию.', detail: 'Сущности Жизни (Life) в присутствии высокоэнергетических полей эволюционируют в сложные биологические системы.' },
  { id: 'time', icon: 'Hourglass', name: 'Закон Времени', desc: 'Сложные формы стареют и эволюционируют.', detail: 'После накопления критической массы знаний (более 20 элементов), время начинает влиять на стабильность реакций, позволяя создавать долгоживущие изотопы.' },
];

export const RANKS = [
  { min: 0, name: 'Новичок', title: 'Ученик Алхимика', icon: '🧪' },
  { min: 10, name: 'Подмастерье', title: 'Исследователь Эфира', icon: '⚗️' },
  { min: 25, name: 'Мастер', title: 'Повелитель Материи', icon: '🔮' },
  { min: 50, name: 'Магистр', title: 'Архитектор Реальности', icon: '✨' },
  { min: 100, name: 'Великий Алхимик', title: 'Творец Миров', icon: '🌟' },
];

export const calculateRank = (totalElements: number) => {
  const currentRank = [...RANKS].reverse().find(r => totalElements >= r.min) || RANKS[0];
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1];
  const progressToNext = nextRank ? ((totalElements - currentRank.min) / (nextRank.min - currentRank.min)) * 100 : 100;
  
  return { currentRank, nextRank, progressToNext };
};
