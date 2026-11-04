import { getCardLabel, SUITS } from './cariocaValidator';

// Declaración de rutas para las 52 cartas regulares de naipe inglés
export const DECLARED_CARD_IMAGES = {};

SUITS.forEach(pinta => {
  for (let valor = 1; valor <= 13; valor++) {
    const label = getCardLabel(valor);
    const key = `${pinta}_${valor}`;
    
    DECLARED_CARD_IMAGES[key] = {
      pinta,
      valor,
      label,
      primaryPath: `/cards/${pinta}_${valor}.png`,
      altPath: `/cards/${pinta}_${label}.png`,
      descripcion: `${label} de ${pinta}`
    };
  }
});

// Obtiene la ruta de imagen para cartas normales o Jokers
export function getCardImagePath(cardOrPinta, valor) {
  // Si se pasa un objeto carta
  if (typeof cardOrPinta === 'object' && cardOrPinta !== null) {
    if (cardOrPinta.imagePath) return cardOrPinta.imagePath;
    if (cardOrPinta.pinta === 'joker_rojo') return '/cards/joker_rojo1.jpeg';
    if (cardOrPinta.pinta === 'joker_negro') return '/cards/joker_negro1.jpeg';
    return `/cards/${cardOrPinta.pinta}_${cardOrPinta.valor}.png`;
  }

  const pinta = cardOrPinta;
  if (pinta === 'joker_rojo') return '/cards/joker_rojo1.jpeg';
  if (pinta === 'joker_negro') return '/cards/joker_negro1.jpeg';

  const key = `${pinta}_${valor}`;
  if (DECLARED_CARD_IMAGES[key]) {
    return DECLARED_CARD_IMAGES[key].primaryPath;
  }
  return `/cards/${pinta}_${valor}.png`;
}

export function getCardImageAltPath(pinta, valor) {
  if (pinta === 'joker_rojo') return '/cards/joker_rojo2.jpeg';
  if (pinta === 'joker_negro') return '/cards/joker_negro2.jpeg';
  const label = getCardLabel(valor);
  return `/cards/${pinta}_${label}.png`;
}
