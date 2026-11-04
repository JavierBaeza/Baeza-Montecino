import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './components/Card';
import { 
  parseCardValue, 
  checkCardLimit, 
  validateNaipeInglesHand, 
  SUITS, 
  SUIT_LABELS,
  getCardLabel,
  SUIT_SYMBOLS
} from './utils/cariocaValidator';
import { saveJugadaCarioca } from './services/firebase';

export default function App() {
  const [cards, setCards] = useState([]);
  const [inputValor, setInputValor] = useState('');
  const [selectedPinta, setSelectedPinta] = useState('corazon');
  const [mensajeError, setMensajeError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [mensajeFirebase, setMensajeFirebase] = useState('');

  // Función para agregar un Joker (Rojo o Negro)
  const agregarJoker = (tipo) => {
    setMensajeError('');
    const esRojo = tipo === 'joker_rojo';
    const nuevoJoker = {
      isJoker: true,
      valor: 'JOKER',
      pinta: tipo
    };

    const validacion = checkCardLimit(cards, nuevoJoker);
    if (!validacion.allowed) {
      setMensajeError(validacion.message);
      return;
    }

    const cantidadExistente = cards.filter((c) => c.pinta === tipo).length;
    const numImagen = cantidadExistente === 0 ? '1' : '2';
    const imagePath = esRojo 
      ? `/cards/joker_rojo${numImagen}.jpeg` 
      : `/cards/joker_negro${numImagen}.jpeg`;

    setCards((prev) => [
      ...prev,
      {
        id: `${tipo}_${Date.now()}_${Math.random()}`,
        valor: 'JOKER',
        pinta: tipo,
        isJoker: true,
        imagePath
      }
    ]);

    setResultado(null);
    setMensajeFirebase('');
  };

  // Agregar carta manual
  const handleAgregarCarta = (e) => {
    e.preventDefault();
    setMensajeError('');

    // Si seleccionó un Joker en el dropdown
    if (selectedPinta === 'joker_rojo' || selectedPinta === 'joker_negro') {
      agregarJoker(selectedPinta);
      setInputValor('');
      return;
    }

    if (!inputValor.trim()) {
      setMensajeError('Escribe el número de la carta (1-13 o A, J, Q, K).');
      return;
    }

    const valor = parseCardValue(inputValor);
    if (valor === 'JOKER') {
      agregarJoker(selectedPinta.includes('negro') || selectedPinta === 'pica' || selectedPinta === 'trebol' ? 'joker_negro' : 'joker_rojo');
      setInputValor('');
      return;
    }

    if (!valor) {
      setMensajeError('Valor no válido. Usa números del 1 al 13 o las letras A, J, Q, K.');
      return;
    }

    const nuevaCarta = { valor, pinta: selectedPinta };
    const validacion = checkCardLimit(cards, nuevaCarta);
    if (!validacion.allowed) {
      setMensajeError(validacion.message);
      return;
    }

    setCards((prev) => [
      ...prev,
      {
        id: `${selectedPinta}_${valor}_${Date.now()}_${Math.random()}`,
        valor,
        pinta: selectedPinta,
        isJoker: false,
        imagePath: `/cards/${selectedPinta}_${valor}.png`
      }
    ]);

    setInputValor('');
    setResultado(null);
    setMensajeFirebase('');
  };

  // Descartar carta por su ID
  const handleDescartarCarta = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setResultado(null);
    setMensajeFirebase('');
  };

  // Ordenar cartas por número
  const handleOrdenarPorNumero = () => {
    setCards((prev) => [...prev].sort((a, b) => {
      if (a.isJoker) return 1;
      if (b.isJoker) return -1;
      return a.valor - b.valor;
    }));
  };

  // Ordenar cartas por pinta
  const handleOrdenarPorPinta = () => {
    const orden = { corazon: 1, diamante: 2, trebol: 3, pica: 4, joker_rojo: 5, joker_negro: 6 };
    setCards((prev) =>
      [...prev].sort((a, b) => {
        if (orden[a.pinta] !== orden[b.pinta]) {
          return orden[a.pinta] - orden[b.pinta];
        }
        return (a.valor || 0) - (b.valor || 0);
      })
    );
  };

  // Cargar jugada ganadora normal (1 Trío y 2 Escalas con imágenes de la carpeta)
  const handleCargarJugadaPrueba = () => {
    const jugadaPrueba = [
      // Trío de Reyes (13): Diamante, Pica, Trébol
      { id: `trio_1_${Date.now()}`, valor: 13, pinta: 'diamante', isJoker: false, imagePath: '/cards/diamante_13.png' },
      { id: `trio_2_${Date.now()}`, valor: 13, pinta: 'pica', isJoker: false, imagePath: '/cards/pica_13.png' },
      { id: `trio_3_${Date.now()}`, valor: 13, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_13.png' },

      // Escala 1 de Trébol: 4, 5, 6, 7
      { id: `e1_1_${Date.now()}`, valor: 4, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_4.png' },
      { id: `e1_2_${Date.now()}`, valor: 5, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_5.png' },
      { id: `e1_3_${Date.now()}`, valor: 6, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_6.png' },
      { id: `e1_4_${Date.now()}`, valor: 7, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_7.png' },

      // Escala 2 de Corazón: 8, 9, 10, J(11)
      { id: `e2_1_${Date.now()}`, valor: 8, pinta: 'corazon', isJoker: false, imagePath: '/cards/corazon_8.png' },
      { id: `e2_2_${Date.now()}`, valor: 9, pinta: 'corazon', isJoker: false, imagePath: '/cards/corazon_9.png' },
      { id: `e2_3_${Date.now()}`, valor: 10, pinta: 'corazon', isJoker: false, imagePath: '/cards/corazon_10.png' },
      { id: `e2_4_${Date.now()}`, valor: 11, pinta: 'corazon', isJoker: false, imagePath: '/cards/corazon_11.png' },
    ];

    setCards(jugadaPrueba);
    setResultado(null);
    setMensajeFirebase('');
  };

  // Cargar jugada ganadora usando un JOKER
  const handleCargarJugadaConJoker = () => {
    const jugadaConJoker = [
      // Trío de Reyes con Joker: Diamante, Pica y JOKER Rojo
      { id: `trio_1_${Date.now()}`, valor: 13, pinta: 'diamante', isJoker: false, imagePath: '/cards/diamante_13.png' },
      { id: `trio_2_${Date.now()}`, valor: 13, pinta: 'pica', isJoker: false, imagePath: '/cards/pica_13.png' },
      { id: `trio_joker_${Date.now()}`, valor: 'JOKER', pinta: 'joker_rojo', isJoker: true, imagePath: '/cards/joker_rojo1.jpeg' },

      // Escala 1 de Trébol: 4, 5, 6, 7
      { id: `e1_1_${Date.now()}`, valor: 4, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_4.png' },
      { id: `e1_2_${Date.now()}`, valor: 5, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_5.png' },
      { id: `e1_3_${Date.now()}`, valor: 6, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_6.png' },
      { id: `e1_4_${Date.now()}`, valor: 7, pinta: 'trebol', isJoker: false, imagePath: '/cards/trebol_7.png' },

      // Escala 2 de Corazón: 8, 9, 10, J(11)
      { id: `e2_1_${Date.now()}`, valor: 8, pinta: 'corazon', isJoker: false, imagePath: '/cards/corazon_8.png' },
      { id: `e2_2_${Date.now()}`, valor: 9, pinta: 'corazon', isJoker: false, imagePath: '/cards/corazon_9.png' },
      { id: `e2_3_${Date.now()}`, valor: 10, pinta: 'corazon', isJoker: false, imagePath: '/cards/corazon_10.png' },
      { id: `e2_4_${Date.now()}`, valor: 11, pinta: 'corazon', isJoker: false, imagePath: '/cards/corazon_11.png' },
    ];

    setCards(jugadaConJoker);
    setResultado(null);
    setMensajeFirebase('');
  };

  // Validar juego
  const handleValidarJuego = async () => {
    const res = validateNaipeInglesHand(cards);
    setResultado(res);

    if (res.isValid) {
      try {
        const resp = await saveJugadaCarioca(cards, res.details);
        setMensajeFirebase(resp.message);
      } catch (err) {
        setMensajeFirebase('Error al guardar en Firebase: ' + err.message);
      }
    } else {
      setMensajeFirebase('');
    }
  };

  // Identificar qué cartas pertenecen al trío o escalas
  const obtenerGrupoCarta = (card) => {
    if (!resultado?.isValid || !resultado?.details) return null;
    const { trio, escala1, escala2 } = resultado.details;
    if (trio.some((c) => c.id === card.id)) return 'trio';
    if (escala1.some((c) => c.id === card.id)) return 'escala1';
    if (escala2.some((c) => c.id === card.id)) return 'escala2';
    return null;
  };

  const esJokerSeleccionado = selectedPinta === 'joker_rojo' || selectedPinta === 'joker_negro';

  return (
    <div className="container py-4" style={{ maxWidth: '960px' }}>
      
      {/* Encabezado */}
      <header className="text-center mb-4 pb-2 border-bottom">
        <h2 className="fw-bold mb-1">Juego de Naipe Inglés</h2>
        <p className="text-muted mb-1">
          Certamen 2 - Desarrollo Web Utilizando React &bull; <strong>Baeza y Montecino</strong>
        </p>
        <span className="badge bg-primary">Jugada: 1 Trío y 2 Escalas (11 cartas)</span>
      </header>

      {/* Formulario */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleAgregarCarta} className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label fw-bold">Número de Carta</label>
              <input
                type="text"
                className="form-control"
                placeholder={esJokerSeleccionado ? 'Comodín Joker' : 'Ej: 7, A, 10, K, Q...'}
                disabled={esJokerSeleccionado}
                value={esJokerSeleccionado ? 'JOKER' : inputValor}
                onChange={(e) => setInputValor(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Pinta o Comodín</label>
              <select
                className="form-select"
                value={selectedPinta}
                onChange={(e) => setSelectedPinta(e.target.value)}
              >
                {SUITS.map((p) => (
                  <option key={p} value={p}>
                    {SUIT_LABELS[p]}
                  </option>
                ))}
                <option value="joker_rojo">Joker Rojo 🃏</option>
                <option value="joker_negro">Joker Negro 🃏</option>
              </select>
            </div>

            <div className="col-md-3">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary w-100 fw-bold"
              >
                + Agregar Carta
              </motion.button>
            </div>
          </form>

          {mensajeError && (
            <div className="alert alert-danger py-2 mt-3 mb-0" role="alert">
              {mensajeError}
            </div>
          )}

          {/* Botones alineados a la derecha */}
          <div className="d-flex justify-content-end align-items-center mt-3 pt-2 border-top gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              onClick={handleCargarJugadaPrueba}
              title="Cargar jugada ganadora normal"
            >
              Ganadora Normal
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-warning text-dark"
              onClick={handleCargarJugadaConJoker}
              title="Cargar jugada ganadora que usa un Joker"
            >
              Con Joker
            </button>
            {cards.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setCards([])}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tablero */}
      <div className="mesa-juego mb-4 shadow">
        <div className="d-flex justify-content-between align-items-center mb-3 text-white border-bottom pb-2">
          <span className="fw-bold">Cartas en Tablero ({cards.length})</span>
          <div>
            <span className="me-2 small">Ordenar:</span>
            <button
              type="button"
              className="btn btn-sm btn-light me-1"
              disabled={cards.length === 0}
              onClick={handleOrdenarPorNumero}
            >
              Por Número
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light"
              disabled={cards.length === 0}
              onClick={handleOrdenarPorPinta}
            >
              Por Pinta
            </button>
          </div>
        </div>

        <div className="d-flex flex-wrap justify-content-center align-items-center" style={{ minHeight: '180px' }}>
          <AnimatePresence>
            {cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                onRemove={handleDescartarCarta}
                highlightType={obtenerGrupoCarta(card)}
              />
            ))}
          </AnimatePresence>

          {cards.length === 0 && (
            <div className="text-white-50 text-center py-4">
              <p className="mb-0">No hay cartas en la mesa.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <motion.button
            type="button"
            whileHover={cards.length > 0 ? { scale: 1.05 } : {}}
            whileTap={cards.length > 0 ? { scale: 0.95 } : {}}
            disabled={cards.length === 0}
            className="btn btn-success btn-lg fw-bold px-5 shadow"
            onClick={handleValidarJuego}
          >
            Validar Juego
          </motion.button>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className={`card shadow-sm mb-4 border-${resultado.isValid ? 'success' : 'danger'}`}>
          <div className="card-body text-center py-4">
            {resultado.isValid ? (
              <motion.h1
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-success fw-bold mb-2"
              >
                ¡JUEGO VÁLIDO: 1 TRÍO Y 2 ESCALAS! :D
              </motion.h1>
            ) : (
              <motion.h1
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-danger fw-bold mb-2"
              >
                NO FORMA JUEGO :C
              </motion.h1>
            )}

            <p className="lead fs-6 mb-3 text-secondary">{resultado.reason}</p>

            {mensajeFirebase && (
              <div className="alert alert-success py-2 mt-3 mb-0 small">
                {mensajeFirebase}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
