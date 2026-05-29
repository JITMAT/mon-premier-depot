// ─── Modèle de données du Socle (CONTEXT.md §8, Module 1) ───────
// Ce fichier ne contient pas de code exécutable : il documente la forme
// des entités persistées par l'application. C'est la « base de données »
// du Module 1 (stockée localement pour l'instant, voir lib/db.js).
//
// Entités : ouvriers, ateliers, articles, parcours, affectations,
// chronos, bons (de commande matière), pointages, salaires.

/**
 * @typedef {Object} Ouvrier
 * @property {string} id           Identifiant unique
 * @property {string} nom          Nom complet
 * @property {string} atelierCode  Atelier de rattachement (A..I)
 * @property {string} pin          Code d'accès simple (Socle)
 * @property {number} salaireBase  Salaire de base mensuel (DH)
 */

/**
 * @typedef {Object} Article
 * @property {string} id        Identifiant unique
 * @property {string} ref       Référence commande (ex. "26040019")
 * @property {string} nom       Désignation (ex. "Chaise Cartel")
 * @property {number} quantite  Quantité commandée
 * @property {number} prixVente Prix de vente unitaire (DH)
 * @property {string} dim       Dimensions / notes
 * @property {string} statut    'todo' | 'wip' | 'pause' | 'fini' | 'qc' | 'livre'
 * @property {string} parcoursId Parcours d'ateliers associé
 */

/**
 * @typedef {Object} EtapeParcours
 * @property {string} atelierCode  Atelier de l'étape (A..I)
 * @property {number} ordre        Position dans le parcours (1, 2, 3…)
 */

/**
 * @typedef {Object} Parcours
 * Suite d'ateliers que traverse un article (ex. Chaise : G → A → F).
 * @property {string} id
 * @property {EtapeParcours[]} etapes
 */

/**
 * @typedef {Object} Affectation
 * Hanane affecte une étape d'un article à un ouvrier précis.
 * @property {string} id
 * @property {string} articleId
 * @property {number} ordreEtape
 * @property {string} ouvrierId
 * @property {boolean} verifie   Vérif Hanane faite (sinon ouvrier bloqué)
 */

/**
 * @typedef {Object} Chrono
 * Une session de travail d'un ouvrier sur une étape.
 * @property {string} id
 * @property {string} affectationId
 * @property {string} debut       ISO date
 * @property {?string} fin        ISO date (null si en cours)
 * @property {number} pauseMs     Temps de pause cumulé
 * @property {?string} motifPause 'rupture'|'dejeuner'|'technique'|'plan'|'fin_journee'|'autre'
 */

/**
 * @typedef {Object} Bon
 * Bon de commande matière (ouvrier → magasin Mohamed).
 * @property {string} id
 * @property {string} ouvrierId
 * @property {string} articleId
 * @property {{ nom:string, quantite:number, unite:string }[]} lignes
 * @property {string} statut      'envoye' | 'recu'
 * @property {?string} dateRecu
 */

/**
 * @typedef {Object} Pointage
 * Heures réelles (à brancher sur Hikvision plus tard).
 * @property {string} id
 * @property {string} ouvrierId
 * @property {string} date
 * @property {?string} arrivee
 * @property {?string} debutFab
 * @property {number} pauseMs
 */

/**
 * @typedef {Object} Salaire
 * @property {string} ouvrierId
 * @property {string} mois         "AAAA-MM"
 * @property {number} base
 * @property {number} retenueAbsences
 * @property {number} retenueRetards
 * @property {number} primes
 * @property {number} acompte
 */

// Collections vides initiales de la base locale.
export const COLLECTIONS_VIDES = {
  ouvriers: {},     // { id: Ouvrier }
  articles: {},     // { id: Article }
  parcours: {},     // { id: Parcours }
  affectations: {}, // { id: Affectation }
  chronos: {},      // { id: Chrono }
  bons: {},         // { id: Bon }
  pointages: {},    // { id: Pointage }
  salaires: {},     // { "ouvrierId:mois": Salaire }
}
