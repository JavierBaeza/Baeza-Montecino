import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getCardLabel, SUIT_SYMBOLS, SUIT_COLORS } from '../utils/cariocaValidator';
import { getCardImagePath, getCardImageAltPath } from '../utils/cardImages';

export default function Card({ card, onRemove, highlightType }) {
  const [imageError, setImageError] = useState(false);
  const [useAlt, setUseAlt] = useState(false);

  const label = getCardLabel(card.valor, card.isJoker);
  const symbol = SUIT_SYMBOLS[card.pinta] || '♠';
  const color = SUIT_COLORS[card.pinta] || '#000000';

  const handleImageError = () => {
    if (!useAlt) {
      setUseAlt(true);
    } else {
      setImageError(true);
    }
  };

  const imageSrc = card.imagePath 
    ? (useAlt ? card.imageAltPath || card.imagePath : card.imagePath)
    : (useAlt ? getCardImageAltPath(card.pinta, card.valor) : getCardImagePath(card.pinta, card.valor));

  let badgeText = null;
  let badgeClass = 'bg-secondary text-white';
  if (highlightType === 'trio') {
    badgeText = 'Trío';
    badgeClass = 'bg-warning text-dark';
  } else if (highlightType === 'escala1') {
    badgeText = 'Escala 1';
    badgeClass = 'bg-primary text-white';
  } else if (highlightType === 'escala2') {
    badgeText = 'Escala 2';
    badgeClass = 'bg-info text-dark';
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.4, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.1, rotate: -25, transition: { duration: 0.3 } }}
      transition={{ duration: 0.25 }}
      className="carta-item m-2"
    >
      {/* Botón X para descartar */}
      <button
        type="button"
        className="btn-descartar"
        title="Descartar"
        onClick={() => onRemove(card.id)}
      >
        ✕
      </button>

      {/* Imagen de la carta o respaldo con número y pinta */}
      {!imageError ? (
        <img
          src={imageSrc}
          alt={card.isJoker ? 'Joker' : `${label} de ${card.pinta}`}
          onError={handleImageError}
        />
      ) : (
        <div className="text-center" style={{ color }}>
          <div className="fs-4 fw-bold">{card.isJoker ? 'JOKER' : label}</div>
          <div className="fs-1">{symbol}</div>
          <small className="text-muted text-uppercase">
            {card.isJoker ? (card.pinta === 'joker_rojo' ? 'Rojo' : 'Negro') : card.pinta}
          </small>
        </div>
      )}

      {/* Badge cuando la carta forma parte de un juego validado */}
      {badgeText && (
        <span className={`badge-jugada badge ${badgeClass}`}>
          {badgeText}
        </span>
      )}
    </motion.div>
  );
}
