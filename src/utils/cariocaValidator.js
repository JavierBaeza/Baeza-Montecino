export const SUITS = ['corazon', 'diamante', 'trebol', 'pica'];

export const SUIT_LABELS = {
  corazon: 'Corazón ♥',
  diamante: 'Diamante ♦',
  trebol: 'Trébol ♣',
  pica: 'Pica ♠',
  joker_rojo: 'Joker Rojo 🃏',
  joker_negro: 'Joker Negro 🃏'
};

export const SUIT_SYMBOLS = {
  corazon: '♥',
  diamante: '♦',
  trebol: '♣',
  pica: '♠',
  joker_rojo: '🃏',
  joker_negro: '🃏'
};

export const SUIT_COLORS = {
  corazon: '#e11d48',
  diamante: '#dc2626',
  trebol: '#1e293b',
  pica: '#0f172a',
  joker_rojo: '#dc2626',
  joker_negro: '#111827'
};

// Convierte el valor ingresado a número de carta (1 al 13) o reconoce si es Joker
export function parseCardValue(input) {
  if (input === null || input === undefined) return null;
  const str = String(input).trim().toUpperCase();
  
  if (str === 'A') return 1;
  if (str === 'J') return 11;
  if (str === 'Q') return 12;
  if (str === 'K') return 13;
  if (str === 'JOKER' || str === 'COMODIN' || str === '0') return 'JOKER';
  
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 1 && num <= 13) {
    return num;
  }
  return null;
}

export function getCardLabel(valor, isJoker = false) {
  if (isJoker || valor === 'JOKER' || valor === 0) return 'Joker';
  if (valor === 1) return 'A';
  if (valor === 11) return 'J';
  if (valor === 12) return 'Q';
  if (valor === 13) return 'K';
  return String(valor);
}

// Un trío consiste en 3 cartas del mismo número (soporta hasta 1 comodín/Joker)
export function isTrio(cards) {
  if (cards.length !== 3) return false;
  const jokers = cards.filter(c => c.isJoker);
  const reals = cards.filter(c => !c.isJoker);

  if (jokers.length > 1) return false; // Máximo 1 comodín por juego

  if (jokers.length === 0) {
    return reals[0].valor === reals[1].valor && reals[1].valor === reals[2].valor;
  }

  // 1 Joker + 2 cartas reales: las 2 reales deben tener el mismo número
  return reals[0].valor === reals[1].valor;
}

// Una escala consiste en 4 cartas consecutivas de la misma pinta (soporta hasta 1 comodín/Joker)
export function isEscala(cards) {
  if (cards.length !== 4) return false;
  const jokers = cards.filter(c => c.isJoker);
  const reals = cards.filter(c => !c.isJoker);

  if (jokers.length > 1) return false; // Máximo 1 comodín por juego

  if (jokers.length === 0) {
    const suit = reals[0].pinta;
    if (!reals.every(c => c.pinta === suit)) return false;

    const vals = reals.map(c => c.valor).sort((a, b) => a - b);
    const isConsecutiveStandard = vals.every((val, idx) => idx === 0 || val === vals[idx - 1] + 1);
    if (isConsecutiveStandard) return true;

    if (vals.includes(1)) {
      const highVals = vals.map(v => (v === 1 ? 14 : v)).sort((a, b) => a - b);
      const isConsecutiveHighAce = highVals.every((val, idx) => idx === 0 || val === highVals[idx - 1] + 1);
      if (isConsecutiveHighAce) return true;
    }
    return false;
  }

  // Con 1 Joker y 3 cartas reales:
  const suit = reals[0].pinta;
  if (!reals.every(c => c.pinta === suit)) return false;

  const vals = reals.map(c => c.valor).sort((a, b) => a - b);
  // No puede haber valores reales duplicados en una misma escala
  if (new Set(vals).size !== 3) return false;

  // Secuencia estándar (ej: 4, 5, 7 o 4, 6, 7 o 4, 5, 6)
  const spreadNormal = vals[2] - vals[0];
  if (spreadNormal === 2 || spreadNormal === 3) {
    return true;
  }

  // Secuencia con As alto (ej: J, Q, A con Joker haciendo de K)
  if (vals.includes(1)) {
    const highVals = vals.map(v => (v === 1 ? 14 : v)).sort((a, b) => a - b);
    const spreadHigh = highVals[2] - highVals[0];
    if (spreadHigh === 2 || spreadHigh === 3) {
      return true;
    }
  }

  return false;
}

// Valida si las cartas en mesa forman la jugada: 1 Trío y 2 Escalas.
// Cada carta física seleccionada (incluyendo Jokers) no puede pertenecer a más de un grupo.
export function validateNaipeInglesHand(cards) {
  if (!cards || cards.length < 11) {
    return {
      isValid: false,
      reason: `Se necesitan al menos 11 cartas (3 del trío y 4 de cada escala). Hay ${cards ? cards.length : 0} en mesa.`,
      details: null
    };
  }

  const n = cards.length;

  // 1. Buscar todas las combinaciones de 3 cartas que formen trío
  const possibleTrios = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const combo = [cards[i], cards[j], cards[k]];
        if (isTrio(combo)) {
          possibleTrios.push([i, j, k]);
        }
      }
    }
  }

  if (possibleTrios.length === 0) {
    return {
      isValid: false,
      reason: 'No se encontró ningún trío (3 cartas de igual número o con comodín).',
      details: null
    };
  }

  // 2. Buscar todas las combinaciones de 4 cartas que formen escala
  const possibleEscalas = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        for (let l = k + 1; l < n; l++) {
          const combo = [cards[i], cards[j], cards[k], cards[l]];
          if (isEscala(combo)) {
            possibleEscalas.push([i, j, k, l]);
          }
        }
      }
    }
  }

  if (possibleEscalas.length < 2) {
    return {
      isValid: false,
      reason: `Se requieren 2 escalas de 4 cartas consecutivas. Se encontraron ${possibleEscalas.length}.`,
      details: null
    };
  }

  // 3. Buscar partición disjunta: ninguna carta física (ni comodín) se puede compartir
  for (const trioIdxs of possibleTrios) {
    const trioSet = new Set(trioIdxs);

    const availableEscalas = possibleEscalas.filter(
      escalaIdxs => !escalaIdxs.some(idx => trioSet.has(idx))
    );

    for (let e1 = 0; e1 < availableEscalas.length; e1++) {
      const escala1Idxs = availableEscalas[e1];
      const e1Set = new Set(escala1Idxs);

      for (let e2 = e1 + 1; e2 < availableEscalas.length; e2++) {
        const escala2Idxs = availableEscalas[e2];

        const sharesWithE1 = escala2Idxs.some(idx => e1Set.has(idx));
        if (!sharesWithE1) {
          const trioCards = trioIdxs.map(i => cards[i]);
          const escala1Cards = escala1Idxs.map(i => cards[i]);
          const escala2Cards = escala2Idxs.map(i => cards[i]);

          const usedIndices = new Set([...trioIdxs, ...escala1Idxs, ...escala2Idxs]);
          const sobraCards = cards.filter((_, idx) => !usedIndices.has(idx));

          return {
            isValid: true,
            details: {
              trio: trioCards,
              escala1: escala1Cards,
              escala2: escala2Cards,
              sobrantes: sobraCards
            }
          };
        }
      }
    }
  }

  return {
    isValid: false,
    reason: 'Las cartas no forman 1 Trío y 2 Escalas simultáneamente sin compartir cartas entre sí.',
    details: null
  };
}

export const validateCariocaHand = validateNaipeInglesHand;

// Control de límites:
// - Para cartas normales: máximo 1 por baraja (o 2 en caso de 2 mazos).
// - Para Jokers: máximo 2 Jokers rojos y 2 Jokers negros en tablero.
export function checkCardLimit(cards, newCard) {
  if (newCard.isJoker) {
    const jokerCount = cards.filter(c => c.pinta === newCard.pinta).length;
    if (jokerCount >= 2) {
      return {
        allowed: false,
        message: `Límite alcanzado: Ya agregaste los 2 ${newCard.pinta === 'joker_rojo' ? 'Jokers rojos' : 'Jokers negros'} permitidos.`
      };
    }
    return { allowed: true };
  }

  const copies = cards.filter(
    c => !c.isJoker && c.valor === newCard.valor && c.pinta === newCard.pinta
  ).length;

  if (copies >= 1) {
    return {
      allowed: false,
      message: `Límite alcanzado: En la baraja de Naipe Inglés cada carta es única. Ya agregaste el ${getCardLabel(newCard.valor)} de ${newCard.pinta}.`
    };
  }

  return { allowed: true };
}
