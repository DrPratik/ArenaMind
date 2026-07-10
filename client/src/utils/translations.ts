import type { SupportedLanguage } from '../types';

export interface Translations {
  // Navigation & Header
  fanAppTab: string;
  organizerTab: string;
  selectLanguage: string;

  // Fan Home Hero
  welcomeTitle: string;
  welcomeSubtitle: string;

  // Input & Chat
  inputPlaceholder: string;
  inputPlaceholderAccessible: string;

  // Quick Action Chips
  quickChips: Array<{ label: string; prompt: string }>;

  // Match Countdown
  liveNow: string;
  matchFinished: string;

  // Crowd Banner
  considerNearbyGate: string;

  // E-Ticket
  eTicketTitle: string;
  gateLabel: string;
  sectionLabel: string;
  seatLabel: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    fanAppTab: 'Fan App (PWA)',
    organizerTab: 'Organizer Dashboard',
    selectLanguage: 'Select language',
    welcomeTitle: 'Welcome to ArenaMind',
    welcomeSubtitle: 'Your AI stadium companion • FIFA World Cup 2026',
    inputPlaceholder: 'Ask ArenaMind anything...',
    inputPlaceholderAccessible: 'Type your question here...',
    quickChips: [
      { label: '🚪 Find my gate', prompt: 'Help me find my gate' },
      { label: '🚻 Nearest restroom', prompt: 'Where is the nearest restroom?' },
      { label: '🍔 Food near me', prompt: 'What food options are near me with the shortest queue?' },
      { label: '🌐 Translate for me', prompt: 'I need help translating something' },
      { label: '♿ Wheelchair route', prompt: 'I need an accessible wheelchair route' },
      { label: '🆘 I need help', prompt: 'I need help, please connect me with assistance' },
    ],
    liveNow: 'LIVE NOW',
    matchFinished: 'FULL TIME',
    considerNearbyGate: 'Consider using a nearby gate for faster entry',
    eTicketTitle: 'Your E-Ticket',
    gateLabel: 'Gate',
    sectionLabel: 'Section',
    seatLabel: 'Seat',
  },
  es: {
    fanAppTab: 'App para Aficionados (PWA)',
    organizerTab: 'Panel del Organizador',
    selectLanguage: 'Seleccionar idioma',
    welcomeTitle: 'Bienvenido a ArenaMind',
    welcomeSubtitle: 'Tu asistente inteligente en el estadio • Copa Mundial FIFA 2026',
    inputPlaceholder: 'Pregunta lo que sea a ArenaMind...',
    inputPlaceholderAccessible: 'Escribe tu pregunta aquí...',
    quickChips: [
      { label: '🚪 Buscar mi puerta', prompt: 'Ayúdame a encontrar mi puerta de acceso' },
      { label: '🚻 Baño más cercano', prompt: '¿Dónde está el baño más cercano?' },
      { label: '🍔 Comida cerca', prompt: '¿Qué puestos de comida cercanos tienen la fila más corta?' },
      { label: '🌐 Traducir', prompt: 'Necesito ayuda para traducir algo' },
      { label: '♿ Ruta accesible', prompt: 'Necesito una ruta accesible en silla de ruedas' },
      { label: '🆘 Necesito ayuda', prompt: 'Necesito ayuda, por favor conéctenme con asistencia' },
    ],
    liveNow: 'EN VIVO AHORA',
    matchFinished: 'PARTIDO FINALIZADO',
    considerNearbyGate: 'Considera usar una puerta cercana para un acceso más rápido',
    eTicketTitle: 'Tu Entrada Electrónica',
    gateLabel: 'Puerta',
    sectionLabel: 'Sección',
    seatLabel: 'Asiento',
  },
  pt: {
    fanAppTab: 'App do Torcedor (PWA)',
    organizerTab: 'Painel do Organizador',
    selectLanguage: 'Selecionar idioma',
    welcomeTitle: 'Bem-vindo ao ArenaMind',
    welcomeSubtitle: 'Seu assistente inteligente no estádio • Copa do Mundo FIFA 2026',
    inputPlaceholder: 'Pergunte qualquer coisa ao ArenaMind...',
    inputPlaceholderAccessible: 'Digite sua pergunta aqui...',
    quickChips: [
      { label: '🚪 Encontrar meu portão', prompt: 'Ajude-me a encontrar meu portão' },
      { label: '🚻 Banheiro próximo', prompt: 'Onde fica o banheiro mais próximo?' },
      { label: '🍔 Comida perto de mim', prompt: 'Quais opções de comida perto de mim têm a menor fila?' },
      { label: '🌐 Traduzir', prompt: 'Preciso de ajuda para traduzir algo' },
      { label: '♿ Rota acessível', prompt: 'Preciso de uma rota acessível para cadeira de rodas' },
      { label: '🆘 Preciso de ajuda', prompt: 'Preciso de ajuda, conecte-me com a assistência' },
    ],
    liveNow: 'AO VIVO AGORA',
    matchFinished: 'FIM DE JOGO',
    considerNearbyGate: 'Considere usar um portão próximo para entrada mais rápida',
    eTicketTitle: 'Seu E-Ticket',
    gateLabel: 'Portão',
    sectionLabel: 'Setor',
    seatLabel: 'Assento',
  },
  fr: {
    fanAppTab: 'App Supporter (PWA)',
    organizerTab: 'Tableau de Bord Organisateur',
    selectLanguage: 'Sélectionner la langue',
    welcomeTitle: 'Bienvenue sur ArenaMind',
    welcomeSubtitle: 'Votre compagnon IA au stade • Coupe du Monde FIFA 2026',
    inputPlaceholder: 'Demandez n’importe quoi à ArenaMind...',
    inputPlaceholderAccessible: 'Tapez votre question ici...',
    quickChips: [
      { label: '🚪 Trouver ma porte', prompt: 'Aidez-moi à trouver ma porte' },
      { label: '🚻 Toilettes proches', prompt: 'Où sont les toilettes les plus proches ?' },
      { label: '🍔 Restauration rapide', prompt: 'Quelles sont les options de restauration avec la file la plus courte ?' },
      { label: '🌐 Traduire', prompt: 'J’ai besoin d’aide pour traduire quelque chose' },
      { label: '♿ Trajet PMR', prompt: 'J’ai besoin d’un itinéraire accessible aux fauteuils roulants' },
      { label: '🆘 J’ai besoin d’aide', prompt: 'J’ai besoin d’aide, mettez-moi en contact avec l’assistance' },
    ],
    liveNow: 'EN DIRECT',
    matchFinished: 'TERMINÉ',
    considerNearbyGate: 'Pensez à utiliser une porte voisine pour une entrée plus rapide',
    eTicketTitle: 'Votre E-Billet',
    gateLabel: 'Porte',
    sectionLabel: 'Section',
    seatLabel: 'Siège',
  },
  hi: {
    fanAppTab: 'फैन ऐप (PWA)',
    organizerTab: 'आयोजक डैशबोर्ड',
    selectLanguage: 'भाषा चुनें',
    welcomeTitle: 'एरीनामाइंड में आपका स्वागत है',
    welcomeSubtitle: 'आपका एआई स्टेडियम साथी • फीफा विश्व कप 2026',
    inputPlaceholder: 'एरीनामाइंड से कुछ भी पूछें...',
    inputPlaceholderAccessible: 'अपना प्रश्न यहाँ लिखें...',
    quickChips: [
      { label: '🚪 मेरा गेट खोजें', prompt: 'कृपया मेरा गेट खोजने में मदद करें' },
      { label: '🚻 निकटतम शौचालय', prompt: 'निकटतम शौचालय कहाँ है?' },
      { label: '🍔 मेरे पास खाना', prompt: 'मेरे पास सबसे छोटी कतार वाले भोजन विकल्प कौन से हैं?' },
      { label: '🌐 अनुवाद करें', prompt: 'मुझे अनुवाद करने में सहायता चाहिए' },
      { label: '♿ व्हीलचेयर मार्ग', prompt: 'मुझे व्हीलचेयर सुलभ मार्ग चाहिए' },
      { label: '🆘 सहायता चाहिए', prompt: 'कृपया मुझे सहायता दल से जोड़ें' },
    ],
    liveNow: 'अभी लाइव',
    matchFinished: 'मैच समाप्त',
    considerNearbyGate: 'तेज प्रवेश के लिए पास के गेट का उपयोग करने पर विचार करें',
    eTicketTitle: 'आपका ई-टिकट',
    gateLabel: 'गेट',
    sectionLabel: 'खंड',
    seatLabel: 'सीट',
  },
  ar: {
    fanAppTab: 'تطبيق المشجعين (PWA)',
    organizerTab: 'لوحة تحكم المنظمين',
    selectLanguage: 'اختر اللغة',
    welcomeTitle: 'مرحباً بك في ArenaMind',
    welcomeSubtitle: 'مساعدك الذكي في الملعب • كأس العالم فيفا 2026',
    inputPlaceholder: 'اسأل ArenaMind أي شيء...',
    inputPlaceholderAccessible: 'اكتب سؤالك هنا...',
    quickChips: [
      { label: '🚪 البحث عن بوابتي', prompt: 'ساعدني في العثور على بوابتي' },
      { label: '🚻 أقرب دورة مياه', prompt: 'أين تقع أقرب دورة مياه؟' },
      { label: '🍔 طعام بالقرب مني', prompt: 'ما هي خيارات الطعام القريبة مني بأقصر طابور؟' },
      { label: '🌐 مساعدة في الترجمة', prompt: 'أحتاج مساعدة في ترجمة شيء ما' },
      { label: '♿ مسار الكراسي المتحركة', prompt: 'أحتاج إلى مسار مخصص للكراسي المتحركة' },
      { label: '🆘 أحتاج إلى مساعدة', prompt: 'أحتاج إلى مساعدة، يرجى توصيلي بفريق الدعم' },
    ],
    liveNow: 'مباشر الآن',
    matchFinished: 'انتهت المباراة',
    considerNearbyGate: 'فكر في استخدام بوابة قريبة للدخول بشكل أسرع',
    eTicketTitle: 'تذكرتك الإلكترونية',
    gateLabel: 'بوابة',
    sectionLabel: 'القسم',
    seatLabel: 'المقعد',
  },
};
