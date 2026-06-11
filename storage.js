// ============================================================
// storage.js
// Responsável por salvar e carregar dados no localStorage
// ============================================================

const Storage = {

  // Chave usada no localStorage
  KEY: 'schedule_activities',

  // Retorna todas as atividades salvas (array)
  getAll() {
    const data = localStorage.getItem(this.KEY);
    return data ? JSON.parse(data) : [];
  },

  // Salva a lista completa de atividades
  saveAll(activities) {
    localStorage.setItem(this.KEY, JSON.stringify(activities));
  },

  // Adiciona uma nova atividade e retorna a lista atualizada
  add(activity) {
    const activities = this.getAll();
    activities.push(activity);
    this.saveAll(activities);
    return activities;
  },

  // Atualiza uma atividade pelo id
  update(id, newData) {
    const activities = this.getAll().map(act => {
      return act.id === id ? { ...act, ...newData } : act;
    });
    this.saveAll(activities);
    return activities;
  },

  // Remove uma atividade pelo id
  remove(id) {
    const activities = this.getAll().filter(act => act.id !== id);
    this.saveAll(activities);
    return activities;
  }

};
