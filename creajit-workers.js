// Registre partagé des ouvriers réels CREAJIT (par atelier).
// id = nom en minuscules sans espaces. Utilisé par Hanane (affectation)
// et par la fiche ouvrier (ouvrier.html?w=<id>).
window.CJ_WORKERS = [
  ['F','Youssef Ibnradiya','ibnradiya'], // ouvrier de la maquette (défaut)
  ['A','Ayoub El Yagiz',null,1],['A','Abdessamie El Yagiz'],['A','Labiade De Mohssine'],['A','Said Lamghari'],['A','Abdelhadi Bouchfer'],['A','Mohamad Marhoub'],['A','Hassan Labiad'],['A','Abdelaati Lafdili'],['A','M. Fadil El Mouaden'],
  ['B','Ahmed Araji',null,1],['B','Abdelilah Dakhama'],['B','Mustapha Boudrif'],['B','Abdelmajid Anjar'],['B','Khalid Houfati'],['B','Youssef Argibi'],['B','Yassine Madidi'],['B','Adil Rehaimine'],['B','Souhail Sakat'],['B','Youssef Ben Elarradia'],
  ['C','Bahri El Othmani',null,1],
  ['D','Ettaib Bougatouch',null,1],['D','Rachid Ait Taleb'],
  ['E','Dit Chnitifa',null,1],['E','Chaise Ayoub'],['E','Mourad Zemit'],['E','Redouan Houfati'],['E','El Mahdi Bahaj'],
  ['F','Mohamed Elkarmani',null,1],['F','Abdelaaziz Ben Amer'],['F','Mohamed Elmoussaoui'],['F','Mouad Elmaamlem'],['F','Milouda El Azaoui'],
  ['G','Mohamed Boualili',null,1],['G','Abdelghani Malih'],
  ['H','Mustapha Aababou',null,1],['H','Anoir Touati'],['H','Amine Samadi'],
  ['I','Noureddine Ouzzat',null,1],
].map(w => ({ at: w[0], nm: w[1], id: w[2] || w[1].toLowerCase().replace(/[^a-z]/g, ''), chef: !!w[3] }));
