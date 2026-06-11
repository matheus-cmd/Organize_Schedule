// ============================================================
// app.js
// Ponto principal da aplicação.
// Controla navegação, modal, formulário e renderização.
// ============================================================

// -------------------------------------------------------
// 1. VARIÁVEIS DE CONTROLE
// -------------------------------------------------------

let editingId = null; // guarda o id da atividade sendo editada (null = criando nova)

// -------------------------------------------------------
// 2. UTILITÁRIOS DE DATA
// -------------------------------------------------------

// Retorna a data de hoje no formato YYYY-MM-DD (sem fuso)
function today() {
  return new Date().toISOString().split('T')[0];
}

// Formata uma data YYYY-MM-DD para exibição amigável
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Retorna o status de uma atividade
function getStatus(activity) {
  if (activity.done) return 'concluida';
  if (activity.date < today()) return 'atrasada';
  return 'pendente';
}

// Verifica se a data está nos próximos 7 dias (incluindo hoje)
function isNext7Days(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const actDate = new Date(dateStr + 'T00:00:00');
  const diff = (actDate - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 7;
}

// -------------------------------------------------------
// 3. RENDERIZAÇÃO DOS CARDS
// -------------------------------------------------------

const typeLabels = {
  prova: 'Prova',
  trabalho: 'Trabalho',
  atividade: 'Atividade',
  apresentacao: 'Apresentação'
};

// Cria e retorna um elemento de card de atividade
function createCard(activity) {
  const status = getStatus(activity);
  const card = document.createElement('div');
  card.className = `activity-card type-${activity.type}`;
  if (status === 'atrasada') card.classList.add('is-late');
  if (status === 'concluida') card.classList.add('is-done');

  const time = activity.time ? ` às ${activity.time}` : '';
  const typeLabel = typeLabels[activity.type] || activity.type;

  card.innerHTML = `
    <input
      type="checkbox"
      class="activity-check"
      title="Marcar como concluída"
      ${activity.done ? 'checked' : ''}
      data-id="${activity.id}"
    />
    <div class="activity-info">
      <div class="activity-title">${activity.title}</div>
      <div class="activity-meta">
        <span class="activity-discipline">${activity.discipline}</span>
        <span class="badge badge-${activity.type}">${typeLabel}</span>
        ${status === 'atrasada' ? '<span class="badge badge-atrasada">Atrasada</span>' : ''}
        ${status === 'concluida' ? '<span class="badge badge-concluida">Concluída</span>' : ''}
        <span class="activity-date">📅 ${formatDate(activity.date)}${time}</span>
      </div>
    </div>
    <div class="activity-actions">
      <button class="btn-icon" title="Editar" data-id="${activity.id}" data-action="edit">✏️</button>
      <button class="btn-icon" title="Excluir" data-id="${activity.id}" data-action="delete">🗑️</button>
    </div>
  `;

  return card;
}

// Renderiza uma lista de atividades em um container
function renderList(containerId, activities) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (activities.length === 0) {
    container.innerHTML = '<p class="empty-msg">Nenhuma atividade aqui.</p>';
    return;
  }

  activities.forEach(act => container.appendChild(createCard(act)));
}

// -------------------------------------------------------
// 4. RENDERIZAÇÃO DO DASHBOARD
// -------------------------------------------------------

function renderDashboard() {
  const all = Storage.getAll();

  // Atividades atrasadas (não concluídas e com data anterior a hoje)
  const late = all.filter(a => !a.done && a.date < today());

  // Próximos 7 dias (não concluídas, data >= hoje e <= hoje+7)
  const upcoming = all.filter(a => !a.done && isNext7Days(a.date));

  // Atividade de hoje (para o clima)
  const activityToday = all.find(a => a.date === today() && !a.done);

  // Estatísticas
  document.getElementById('statTotal').textContent = all.length;
  document.getElementById('statPending').textContent = all.filter(a => !a.done && a.date >= today()).length;
  document.getElementById('statLate').textContent = late.length;
  document.getElementById('statDone').textContent = all.filter(a => a.done).length;

  // Listas
  if (late.length === 0) {
    document.getElementById('listLate').innerHTML = '<p class="empty-msg">Nenhuma atividade atrasada. 🎉</p>';
  } else {
    renderList('listLate', late);
  }

  if (upcoming.length === 0) {
    document.getElementById('listUpcoming').innerHTML = '<p class="empty-msg">Nenhuma atividade nos próximos 7 dias.</p>';
  } else {
    renderList('listUpcoming', upcoming);
  }

  // Data de hoje
  const hoje = new Date();
  document.getElementById('currentDate').textContent = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Clima (só carrega uma vez por visita à página)
  Weather.load(activityToday);
}

// -------------------------------------------------------
// 5. RENDERIZAÇÃO DA LISTA COMPLETA (com filtros)
// -------------------------------------------------------

function renderActivities() {
  let activities = Storage.getAll();

  const search = document.getElementById('searchInput').value.toLowerCase();
  const filterType = document.getElementById('filterType').value;
  const filterDiscipline = document.getElementById('filterDiscipline').value;
  const filterStatus = document.getElementById('filterStatus').value;

  // Aplica filtros
  if (search) {
    activities = activities.filter(a =>
      a.title.toLowerCase().includes(search) ||
      a.discipline.toLowerCase().includes(search)
    );
  }

  if (filterType) {
    activities = activities.filter(a => a.type === filterType);
  }

  if (filterDiscipline) {
    activities = activities.filter(a => a.discipline === filterDiscipline);
  }

  if (filterStatus) {
    activities = activities.filter(a => getStatus(a) === filterStatus);
  }

  // Ordena por data
  activities.sort((a, b) => a.date.localeCompare(b.date));

  if (activities.length === 0) {
    document.getElementById('listAll').innerHTML = '<p class="empty-msg">Nenhuma atividade encontrada.</p>';
  } else {
    renderList('listAll', activities);
  }
}

// Atualiza o select de disciplinas com base nas atividades cadastradas
function updateDisciplineFilter() {
  const activities = Storage.getAll();
  const disciplines = [...new Set(activities.map(a => a.discipline))].sort();
  const select = document.getElementById('filterDiscipline');
  const current = select.value;

  select.innerHTML = '<option value="">Todas as disciplinas</option>';
  disciplines.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    if (d === current) opt.selected = true;
    select.appendChild(opt);
  });
}

// -------------------------------------------------------
// 6. MODAL (abrir / fechar / preencher)
// -------------------------------------------------------

function openModal(activity = null) {
  editingId = activity ? activity.id : null;

  document.getElementById('modalTitle').textContent = activity ? 'Editar Atividade' : 'Nova Atividade';
  document.getElementById('inputTitle').value = activity ? activity.title : '';
  document.getElementById('inputDiscipline').value = activity ? activity.discipline : '';
  document.getElementById('inputType').value = activity ? activity.type : '';
  document.getElementById('inputDate').value = activity ? activity.date : '';
  document.getElementById('inputTime').value = activity ? activity.time : '';
  document.getElementById('formError').textContent = '';

  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('inputTitle').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

// -------------------------------------------------------
// 7. SALVAR ATIVIDADE (criar ou editar)
// -------------------------------------------------------

function saveActivity() {
  const title = document.getElementById('inputTitle').value.trim();
  const discipline = document.getElementById('inputDiscipline').value.trim();
  const type = document.getElementById('inputType').value;
  const date = document.getElementById('inputDate').value;
  const time = document.getElementById('inputTime').value;
  const errorEl = document.getElementById('formError');

  // Validação simples
  if (!title || !discipline || !type || !date) {
    errorEl.textContent = '⚠️ Preencha todos os campos obrigatórios.';
    return;
  }

  if (editingId) {
    // Editando atividade existente
    Storage.update(editingId, { title, discipline, type, date, time });
  } else {
    // Criando nova atividade
    const newActivity = {
      id: Date.now().toString(), // id único baseado no timestamp
      title,
      discipline,
      type,
      date,
      time,
      done: false
    };
    Storage.add(newActivity);
  }

  closeModal();
  updateDisciplineFilter();
  renderActivities();
  renderDashboard();
}

// -------------------------------------------------------
// 8. MARCAR COMO CONCLUÍDA
// -------------------------------------------------------

function toggleDone(id) {
  const activities = Storage.getAll();
  const act = activities.find(a => a.id === id);
  if (!act) return;

  Storage.update(id, { done: !act.done });
  renderActivities();
  renderDashboard();
}

// -------------------------------------------------------
// 9. EXCLUIR ATIVIDADE
// -------------------------------------------------------

function deleteActivity(id) {
  if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;
  Storage.remove(id);
  updateDisciplineFilter();
  renderActivities();
  renderDashboard();
}

// -------------------------------------------------------
// 10. EDITAR ATIVIDADE
// -------------------------------------------------------

function editActivity(id) {
  const activities = Storage.getAll();
  const act = activities.find(a => a.id === id);
  if (act) openModal(act);
}

// -------------------------------------------------------
// 11. NAVEGAÇÃO ENTRE PÁGINAS
// -------------------------------------------------------

function goToPage(pageName) {
  // Remove active de todos os itens de nav e páginas
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));

  // Ativa o item de nav correto
  const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
  if (navItem) navItem.classList.add('active');

  // Mostra a página correta
  const page = document.getElementById(`page-${pageName}`);
  if (page) page.classList.add('active');

  // Renderiza o conteúdo da página
  if (pageName === 'dashboard') renderDashboard();
  if (pageName === 'activities') {
    updateDisciplineFilter();
    renderActivities();
  }
}

// -------------------------------------------------------
// 12. MODO ESCURO
// -------------------------------------------------------

function initDarkMode() {
  const saved = localStorage.getItem('schedule_darkmode');
  if (saved === 'true') {
    document.body.classList.add('dark');
    document.getElementById('btnDarkMode').textContent = '☀️ Modo claro';
  }
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('schedule_darkmode', isDark);
  document.getElementById('btnDarkMode').textContent = isDark ? '☀️ Modo claro' : '🌙 Modo escuro';
}

// -------------------------------------------------------
// 13. EVENTOS
// -------------------------------------------------------

function setupEvents() {
  // Navegação
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      goToPage(this.dataset.page);
    });
  });

  // Botão abrir modal (nova atividade)
  document.getElementById('btnOpenModal').addEventListener('click', () => openModal());

  // Fechar modal
  document.getElementById('btnCloseModal').addEventListener('click', closeModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // Salvar atividade
  document.getElementById('btnSaveActivity').addEventListener('click', saveActivity);

  // Enter no formulário salva
  document.getElementById('modalOverlay').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') saveActivity();
    if (e.key === 'Escape') closeModal();
  });

  // Filtros e busca
  document.getElementById('searchInput').addEventListener('input', renderActivities);
  document.getElementById('filterType').addEventListener('change', renderActivities);
  document.getElementById('filterDiscipline').addEventListener('change', renderActivities);
  document.getElementById('filterStatus').addEventListener('change', renderActivities);

  // Delegação de eventos nos cards (editar, excluir, concluir)
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('activity-check')) {
      toggleDone(e.target.dataset.id);
    }
  });

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    if (btn.dataset.action === 'edit') editActivity(btn.dataset.id);
    if (btn.dataset.action === 'delete') deleteActivity(btn.dataset.id);
  });

  // Modo escuro
  document.getElementById('btnDarkMode').addEventListener('click', toggleDarkMode);
}

// -------------------------------------------------------
// 14. INICIALIZAÇÃO
// -------------------------------------------------------

function init() {
  initDarkMode();
  setupEvents();
  goToPage('dashboard');
}

// Roda quando o HTML terminar de carregar
document.addEventListener('DOMContentLoaded', init);
