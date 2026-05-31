/* Coût horaire CHARGÉ par atelier — repris du module Rentabilité de Driss.
   (salaires + quote-part de toutes les charges fixes) / (ouvriers × heures prod).
   Sert au coût de revient, au coût main d'œuvre de l'ouvrier et aux primes. */
window.CJ_COUT_HORAIRE = {
  // code atelier CREAJIT (A→I)  ->  DH/heure chargé
  A: 67,  // Tapisserie
  B: 67,  // Chaise
  C: 28,  // CNC
  D: 71,  // Résine / Polystyrène
  E: 70,  // Menuiserie
  F: 55,  // Peinture
  G: 63,  // Ferronnerie
  H: 72,  // Pierre
  I: 73,  // Cuivre
};
window.CJ_COUT_HORAIRE_MOYEN = 60; // moyenne chargée (fallback)
window.coutHoraire = function (codeAtelier) {
  return (window.CJ_COUT_HORAIRE && window.CJ_COUT_HORAIRE[codeAtelier]) || window.CJ_COUT_HORAIRE_MOYEN;
};
