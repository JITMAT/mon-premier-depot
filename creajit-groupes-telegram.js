// ─── Groupes Telegram CreaJit (routage des notifications) ───────────
// 9 ateliers (production) + 3 supports. Chaque groupe a un chat_id propre
// (à remplir une fois les groupes connectés au bot via /api/telegram).
//
// Pour récupérer le chat_id d'un groupe : ajoute le bot @Creajitatalierbot
// au groupe, écris un message, puis ouvre /api/telegram?action=chatid.
// Les groupes ont un chat_id NÉGATIF (ex: -1001234567890).

window.CJ_GROUPES_TELEGRAM = {
  ateliers: [
    { code: 'A', emoji: '🔵', nom: 'Atelier A', chef: 'Ayoub El Yagiz',        specialite: 'Tapisserie (Canapé/Fauteuil/Lit)', chatId: '' },
    { code: 'B', emoji: '🟠', nom: 'Atelier B', chef: 'Ahmed Araji',           specialite: 'Chaise / Transat',                 chatId: '' },
    { code: 'C', emoji: '🟣', nom: 'Atelier C', chef: 'Bahri El Othmani',      specialite: 'CNC & Laser',                      chatId: '' },
    { code: 'D', emoji: '🔵', nom: 'Atelier D', chef: 'Ettaib Bougatouch',     specialite: 'Résine & Polystyrène',             chatId: '' },
    { code: 'E', emoji: '🟤', nom: 'Atelier E', chef: 'Dit Chnitifa',          specialite: 'Menuiserie',                       chatId: '' },
    { code: 'F', emoji: '🔴', nom: 'Atelier F', chef: 'Abdelhamid Elkarmani',  specialite: 'Peinture',                         chatId: '' },
    { code: 'G', emoji: '⚫', nom: 'Atelier G', chef: 'Mohamed Boualili',      specialite: 'Ferronnerie & Soudure',            chatId: '' },
    { code: 'H', emoji: '🟡', nom: 'Atelier H', chef: 'Mustapha Aababou',      specialite: 'Pierre & Marbre',                  chatId: '' },
    { code: 'I', emoji: '✨', nom: 'Atelier I', chef: 'Noureddine Ouzza',      specialite: 'Cuivre & Laiton',                  chatId: '' },
  ],
  supports: [
    { code: 'LIV', emoji: '📦', nom: 'Livraison CREAJIT',    role: 'Logistique / livraisons', chatId: '' },
    { code: 'COM', emoji: '📋', nom: 'Commerciaux CREAJIT',  role: 'Ventes / commerciaux',    chatId: '' },
    { code: 'DIR', emoji: '🏢', nom: 'Direction CREAJIT ✨', role: 'Direction / Driss',       chatId: '' },
  ],
};
