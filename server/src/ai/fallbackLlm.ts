import type { SupportedLanguage, UserRole, ToolCallResult } from '../types.js';

/**
 * DeterministicLLM — Template-based fallback that produces natural-sounding responses
 * when the Gemini API is unavailable. Same structure as real Gemini output,
 * just less fluid phrasing.
 */

interface DeterministicLLMInput {
  role: UserRole;
  message: string;
  language: SupportedLanguage;
  toolResults?: ToolCallResult[];
}

// Simple translations for common phrases
const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    gate_status: 'Gate Status',
    current_level: 'Current crowd level',
    suggestion: 'Suggestion',
    route_to: 'Route to',
    estimated_time: 'Estimated time',
    distance: 'Distance',
    step: 'Step',
    food_options: 'Food Options',
    queue_wait: 'Queue wait',
    minutes: 'minutes',
    meters: 'meters',
    incident_filed: 'Incident Report Filed',
    priority: 'Priority',
    department: 'Assigned Department',
    lost_found: 'Lost & Found Results',
    items_found: 'items found',
    no_items: 'No matching items found',
    forecast: 'Crowd Forecast',
    trending: 'trending',
    ask_volunteer: 'I don\'t have enough information. Please ask a nearby volunteer for help.',
    nearest: 'Nearest',
    overload_risk: 'Overload Risk Assessment',
    gates_at_risk: 'gates at risk',
  },
  es: {
    gate_status: 'Estado de la puerta',
    current_level: 'Nivel actual de multitud',
    suggestion: 'Sugerencia',
    route_to: 'Ruta a',
    estimated_time: 'Tiempo estimado',
    distance: 'Distancia',
    step: 'Paso',
    food_options: 'Opciones de comida',
    queue_wait: 'Espera en cola',
    minutes: 'minutos',
    meters: 'metros',
    incident_filed: 'Reporte de incidente registrado',
    priority: 'Prioridad',
    department: 'Departamento asignado',
    lost_found: 'Resultados de objetos perdidos',
    items_found: 'objetos encontrados',
    no_items: 'No se encontraron objetos coincidentes',
    forecast: 'Pronóstico de multitud',
    trending: 'tendencia',
    ask_volunteer: 'No tengo suficiente información. Por favor, pregunte a un voluntario cercano.',
    nearest: 'Más cercano',
    overload_risk: 'Evaluación de riesgo de sobrecarga',
    gates_at_risk: 'puertas en riesgo',
  },
  pt: {
    gate_status: 'Status do portão',
    current_level: 'Nível atual de multidão',
    suggestion: 'Sugestão',
    route_to: 'Rota para',
    estimated_time: 'Tempo estimado',
    distance: 'Distância',
    step: 'Passo',
    food_options: 'Opções de comida',
    queue_wait: 'Espera na fila',
    minutes: 'minutos',
    meters: 'metros',
    incident_filed: 'Relatório de incidente registrado',
    priority: 'Prioridade',
    department: 'Departamento designado',
    lost_found: 'Resultados de achados e perdidos',
    items_found: 'itens encontrados',
    no_items: 'Nenhum item correspondente encontrado',
    forecast: 'Previsão de multidão',
    trending: 'tendência',
    ask_volunteer: 'Não tenho informação suficiente. Por favor, pergunte a um voluntário próximo.',
    nearest: 'Mais próximo',
    overload_risk: 'Avaliação de risco de sobrecarga',
    gates_at_risk: 'portões em risco',
  },
  fr: {
    gate_status: 'État de la porte',
    current_level: 'Niveau actuel de foule',
    suggestion: 'Suggestion',
    route_to: 'Itinéraire vers',
    estimated_time: 'Temps estimé',
    distance: 'Distance',
    step: 'Étape',
    food_options: 'Options de restauration',
    queue_wait: 'Attente en file',
    minutes: 'minutes',
    meters: 'mètres',
    incident_filed: 'Rapport d\'incident enregistré',
    priority: 'Priorité',
    department: 'Département assigné',
    lost_found: 'Résultats des objets trouvés',
    items_found: 'objets trouvés',
    no_items: 'Aucun objet correspondant trouvé',
    forecast: 'Prévision de foule',
    trending: 'tendance',
    ask_volunteer: 'Je n\'ai pas assez d\'informations. Veuillez demander à un bénévole proche.',
    nearest: 'Le plus proche',
    overload_risk: 'Évaluation du risque de surcharge',
    gates_at_risk: 'portes à risque',
  },
  hi: {
    gate_status: 'गेट की स्थिति',
    current_level: 'वर्तमान भीड़ स्तर',
    suggestion: 'सुझाव',
    route_to: 'रास्ता',
    estimated_time: 'अनुमानित समय',
    distance: 'दूरी',
    step: 'चरण',
    food_options: 'खाने के विकल्प',
    queue_wait: 'कतार में प्रतीक्षा',
    minutes: 'मिनट',
    meters: 'मीटर',
    incident_filed: 'घटना रिपोर्ट दर्ज',
    priority: 'प्राथमिकता',
    department: 'नियुक्त विभाग',
    lost_found: 'खोया-पाया परिणाम',
    items_found: 'वस्तुएं मिलीं',
    no_items: 'कोई मेल खाने वाली वस्तु नहीं मिली',
    forecast: 'भीड़ का पूर्वानुमान',
    trending: 'रुझान',
    ask_volunteer: 'मेरे पास पर्याप्त जानकारी नहीं है। कृपया किसी नज़दीकी स्वयंसेवक से पूछें।',
    nearest: 'निकटतम',
    overload_risk: 'अधिभार जोखिम मूल्यांकन',
    gates_at_risk: 'जोखिम में गेट',
  },
  ar: {
    gate_status: 'حالة البوابة',
    current_level: 'مستوى الازدحام الحالي',
    suggestion: 'اقتراح',
    route_to: 'الطريق إلى',
    estimated_time: 'الوقت المقدر',
    distance: 'المسافة',
    step: 'خطوة',
    food_options: 'خيارات الطعام',
    queue_wait: 'وقت الانتظار',
    minutes: 'دقائق',
    meters: 'متر',
    incident_filed: 'تم تسجيل تقرير الحادث',
    priority: 'الأولوية',
    department: 'القسم المعين',
    lost_found: 'نتائج المفقودات',
    items_found: 'عناصر تم العثور عليها',
    no_items: 'لم يتم العثور على عناصر مطابقة',
    forecast: 'توقعات الازدحام',
    trending: 'الاتجاه',
    ask_volunteer: 'ليس لدي معلومات كافية. يرجى سؤال متطوع قريب.',
    nearest: 'الأقرب',
    overload_risk: 'تقييم مخاطر التحميل الزائد',
    gates_at_risk: 'بوابات معرضة للخطر',
  },
};

function t(lang: SupportedLanguage, key: string): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

export function generateDeterministicResponse(input: DeterministicLLMInput): string {
  const { language, toolResults } = input;

  if (!toolResults || toolResults.length === 0) {
    return t(language, 'ask_volunteer');
  }

  const parts: string[] = [];

  for (const tool of toolResults) {
    const data = tool.result;

    switch (tool.toolName) {
      case 'getGateStatus': {
        const gate = data.gate as Record<string, unknown> | undefined;
        if (gate) {
          parts.push(`**${t(language, 'gate_status')}: ${gate.name}**`);
          parts.push(`${t(language, 'current_level')}: ${gate.current_crowd_level}`);
          if (data.alternativeGate) {
            const alt = data.alternativeGate as Record<string, unknown>;
            parts.push(`\n${t(language, 'suggestion')}: ${data.alternativeReason}`);
            parts.push(`→ ${alt.name} (${alt.current_crowd_level})`);
          }
        }
        break;
      }
      case 'getRoute': {
        const to = data.to as Record<string, unknown> | undefined;
        if (to) {
          parts.push(`**${t(language, 'route_to')} ${to.name}**`);
          parts.push(`${t(language, 'estimated_time')}: ${data.estimatedMinutes} ${t(language, 'minutes')}`);
          parts.push(`${t(language, 'distance')}: ${data.distanceMeters} ${t(language, 'meters')}`);
          const steps = data.steps as Array<Record<string, unknown>> | undefined;
          if (steps) {
            steps.forEach((step, i) => {
              parts.push(`${t(language, 'step')} ${i + 1}: ${step.instruction}`);
            });
          }
        }
        break;
      }
      case 'getFoodQueue':
      case 'findFoodByPreference': {
        parts.push(`**${t(language, 'food_options')}**`);
        const stalls = (Array.isArray(data) ? data : data.stalls ?? []) as Array<Record<string, unknown>>;
        if (stalls.length > 0) {
          for (const stall of stalls.slice(0, 5)) {
            parts.push(`• ${stall.name} — ${t(language, 'queue_wait')}: ${stall.currentQueueMinutes} ${t(language, 'minutes')}`);
          }
        }
        break;
      }
      case 'getCrowdForecast': {
        parts.push(`**${t(language, 'forecast')}: ${data.gateName}**`);
        parts.push(`${t(language, 'current_level')}: ${data.currentLevel}`);
        parts.push(`${t(language, 'forecast')} (${data.minutesAhead} ${t(language, 'minutes')}): ${data.forecastLevel}`);
        parts.push(`${t(language, 'trending')}: ${data.trend} (${data.trendPercentage}%)`);
        if (data.reasoning) parts.push(`\n${data.reasoning}`);
        break;
      }
      case 'fileIncident': {
        const incident = data.incident as Record<string, unknown> | undefined;
        if (incident) {
          parts.push(`**${t(language, 'incident_filed')}**`);
          parts.push(`${t(language, 'priority')}: ${incident.priority}`);
          parts.push(`${t(language, 'department')}: ${incident.suggested_department}`);
        }
        break;
      }
      case 'searchLostFound': {
        parts.push(`**${t(language, 'lost_found')}**`);
        const items = data.items as Array<Record<string, unknown>> | undefined;
        if (items && items.length > 0) {
          parts.push(`${items.length} ${t(language, 'items_found')}:`);
          for (const item of items) {
            parts.push(`• ${item.description} — ${item.location_found}`);
          }
        } else {
          parts.push(t(language, 'no_items'));
        }
        break;
      }
      case 'findNearestAmenity': {
        parts.push(`**${t(language, 'nearest')} ${data.name}**`);
        const route = data.route as Record<string, unknown> | undefined;
        if (route) {
          parts.push(`${t(language, 'estimated_time')}: ${route.estimatedMinutes} ${t(language, 'minutes')}`);
          const steps = route.steps as Array<Record<string, unknown>> | undefined;
          if (steps) {
            steps.forEach((step, i) => {
              parts.push(`${t(language, 'step')} ${i + 1}: ${step.instruction}`);
            });
          }
        }
        break;
      }
      case 'getOverloadRisk': {
        const gatesAtRisk = data.gatesAtRisk as Array<Record<string, unknown>> | undefined;
        parts.push(`**${t(language, 'overload_risk')}**`);
        if (gatesAtRisk && gatesAtRisk.length > 0) {
          parts.push(`${gatesAtRisk.length} ${t(language, 'gates_at_risk')}:`);
          for (const g of gatesAtRisk) {
            parts.push(`• ${g.gateName}: ${g.currentLevel} → ${g.forecastLevel} (${g.trend} ${g.trendPercentage}%)`);
            if (g.estimatedMinutesToCritical != null) {
              parts.push(`  ~${g.estimatedMinutesToCritical} ${t(language, 'minutes')} to critical`);
            }
          }
        } else {
          parts.push('✅ No gates currently at risk.');
        }
        break;
      }
      default:
        parts.push(JSON.stringify(data, null, 2));
    }
  }

  return parts.join('\n');
}
