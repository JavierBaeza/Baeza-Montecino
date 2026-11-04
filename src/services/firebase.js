import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCOKme8cxfxLWyBv5FnWv1sf8CzHNfIT7A",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "naipe-ingles-60138.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "naipe-ingles-60138",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "naipe-ingles-60138.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1050404811412",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1050404811412:web:64deb8db2986283bb8fa81"
};

// Verifica si se proporcionaron las claves en el archivo .env
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "TU_API_KEY_AQUI" && 
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "TU_PROJECT_ID_AQUI"
);

let db = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error) {
    console.error("Error al inicializar Firebase:", error);
  }
}

const LOCAL_STORAGE_KEY = "carioca_jugadas_local";

// Guarda la jugada en la colección "jugadascarioca" de Firestore
export async function saveJugadaCarioca(cards, validationDetails) {
  const cardsPayload = cards.map(c => ({
    numero: c.valor,
    pinta: c.pinta
  }));

  const payload = {
    tipo_jugada: "1 Trío y 2 Escalas",
    cartas: cardsPayload,
    total_cartas: cards.length,
    detalle: {
      trio: validationDetails.trio.map(c => ({ numero: c.valor, pinta: c.pinta })),
      escala1: validationDetails.escala1.map(c => ({ numero: c.valor, pinta: c.pinta })),
      escala2: validationDetails.escala2.map(c => ({ numero: c.valor, pinta: c.pinta })),
      sobrantes: (validationDetails.sobrantes || []).map(c => ({ numero: c.valor, pinta: c.pinta }))
    },
    fecha_guardado: new Date().toISOString(),
    fecha_legible: new Date().toLocaleString('es-CL')
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "jugadascarioca"), {
        ...payload,
        timestamp: serverTimestamp()
      });
      return {
        success: true,
        id: docRef.id,
        isFirebase: true,
        message: "Guardado exitosamente en la colección 'jugadascarioca' de Firebase."
      };
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
      throw error;
    }
  } else {
    // Almacenamiento local de respaldo si aún no se configuran las credenciales en .env
    try {
      const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      const localId = `local-${Date.now()}`;
      const newPlay = { id: localId, ...payload, isDemo: true };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([newPlay, ...current]));
      return {
        success: true,
        id: localId,
        isFirebase: false,
        message: "Guardado localmente (configura .env para guardar en Firestore en la nube)."
      };
    } catch (e) {
      console.error("Error al guardar localmente:", e);
      return { success: false, error: e.message };
    }
  }
}

// Obtiene las jugadas registradas previamente
export async function fetchJugadasCarioca() {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "jugadascarioca"), orderBy("timestamp", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      const plays = [];
      querySnapshot.forEach((doc) => {
        plays.push({ id: doc.id, ...doc.data() });
      });
      return plays;
    } catch (error) {
      console.warn("Intento de lectura con orden fallido, intentando lectura directa:", error);
      try {
        const querySnapshot = await getDocs(collection(db, "jugadascarioca"));
        const plays = [];
        querySnapshot.forEach((doc) => {
          plays.push({ id: doc.id, ...doc.data() });
        });
        return plays.reverse().slice(0, 20);
      } catch (fallbackError) {
        console.error("Error al leer colección jugadascarioca:", fallbackError);
        return [];
      }
    }
  } else {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
}
