/* ===== 학습 웹앱 포털 ===== */

const STORAGE_KEY = 'webapp_portal_apps_v2';

/* ── 과목별 썸네일 테마 ── */
const SUBJECT_THEMES = {
  '수학':    { grad: 'linear-gradient(135deg,#3b82f6,#0ea5e9)', emoji: '🔢' },
  '과학':    { grad: 'linear-gradient(135deg,#10b981,#06b6d4)', emoji: '🔬' },
  '국어':    { grad: 'linear-gradient(135deg,#f97316,#ef4444)', emoji: '📖' },
  '영어':    { grad: 'linear-gradient(135deg,#f59e0b,#f97316)', emoji: '🌍' },
  '사회':    { grad: 'linear-gradient(135deg,#0ea5e9,#0d9488)', emoji: '🌏' },
  '음악':    { grad: 'linear-gradient(135deg,#ec4899,#a855f7)', emoji: '🎵' },
  '미술':    { grad: 'linear-gradient(135deg,#f43f5e,#ec4899)', emoji: '🎨' },
  '체육':    { grad: 'linear-gradient(135deg,#22c55e,#84cc16)', emoji: '⚽' },
  '정보':    { grad: 'linear-gradient(135deg,#6366f1,#3b82f6)', emoji: '💻' },
  '통합':    { grad: 'linear-gradient(135deg,#8b5cf6,#ec4899)', emoji: '🌈' },
  '도덕':    { grad: 'linear-gradient(135deg,#14b8a6,#0ea5e9)', emoji: '💛' },
  '창체':    { grad: 'linear-gradient(135deg,#a855f7,#6366f1)', emoji: '✨' },
  '자유학기': { grad: 'linear-gradient(135deg,#f59e0b,#10b981)', emoji: '🌱' },
  '기술':    { grad: 'linear-gradient(135deg,#64748b,#475569)', emoji: '⚙️' },
  '가정':    { grad: 'linear-gradient(135deg,#f87171,#fbbf24)', emoji: '🏠' },
  '진로':    { grad: 'linear-gradient(135deg,#0ea5e9,#6366f1)', emoji: '🎯' },
  '실과':    { grad: 'linear-gradient(135deg,#4ade80,#22d3ee)', emoji: '🌿' },
  'default': { grad: 'linear-gradient(135deg,#7c3aed,#3b82f6)', emoji: '📱' },
};

function getTheme(subjects) {
  const s = (subjects || [])[0];
  return SUBJECT_THEMES[s] || SUBJECT_THEMES['default'];
}

/* ── 데이터 레이어 ── */
function loadApps() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveApps(apps) { localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)); }
function createId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function nowDate() { return new Date().toISOString().slice(0, 10); }

/* ── 구형 데이터 마이그레이션 ── */
function migrate(app) {
  if (app.subjects) return app;
  return {
    ...app,
    grades:   [],
    subjects: app.subject ? [app.subject] : [],
    keywords: app.tags    || [],
    os:       [],
    aiTools:  [],
    subject: undefined,
    unit:    undefined,
    tags:    undefined,
  };
}

/* ── DOM 참조 ── */
const $ = id => document.getElementById(id);
const els = {
  viewPortal:   $('view-portal'),
  viewManage:   $('view-manage'),
  navPortal:    $('nav-portal'),
  navManage:    $('nav-manage'),
  cardGrid:     $('card-grid'),
  emptyState:   $('empty-state'),
  appCount:     $('app-count'),
  searchInput:  $('search-input'),
  subjFilterRow: $('subject-filter-row'),
  appForm:      $('app-form'),
  formTitle:    $('form-title'),
  editId:       $('edit-id'),
  inputName:    $('input-name'),
  inputUrl:     $('input-url'),
  inputDesc:    $('input-description'),
  inputThumb:   $('input-thumbnail'),
  kw1: $('kw1'), kw2: $('kw2'), kw3: $('kw3'),
  submitBtn:    $('submit-btn'),
  cancelBtn:    $('cancel-btn'),
  formError:    $('form-error'),
  tableBody:    $('app-table-body'),
  tableEmpty:   $('table-empty'),
  manageCount:  $('manage-count'),
  exportCsvBtn: $('export-csv-btn'),
  exportJsonBtn:$('export-json-btn'),
  importFile:   $('import-file'),
  clearBtn:     $('clear-btn'),
  modalOverlay: $('modal-overlay'),
  modalMessage: $('modal-message'),
  modalConfirm: $('modal-confirm'),
  modalCancel:  $('modal-cancel'),
  toast:        $('toast'),
};

/* ── 칩 선택 상태 ── */
const chipState = {
  grades:      new Set(),
  subjects:    new Set(),
  os:          new Set(),
  aiTools:     new Set(),
  gradeMode:   'single',
  subjectMode: 'single',
};

/* ── 라우팅 ── */
function route() {
  const isManage = location.hash === '#manage';
  els.viewPortal.classList.toggle('hidden', isManage);
  els.viewManage.classList.toggle('hidden', !isManage);
  els.navPortal.classList.toggle('active', !isManage);
  els.navManage.classList.toggle('active', isManage);
  if (isManage) renderTable(); else renderCards();
}
window.addEventListener('hashchange', route);

/* ── 현재 필터 상태 ── */
let activeSubjectFilter = 'all';
let activeLevelFilter = 'all';

/* ── 포털: 카드 렌더링 ── */
function renderCards() {
  const apps = loadApps().map(migrate);
  const q = els.searchInput.value.trim().toLowerCase();

  const filtered = apps.filter(a => {
    const matchQ = !q || a.name.toLowerCase().includes(q)
                     || (a.description || '').toLowerCase().includes(q)
                     || (a.keywords || []).some(k => k.toLowerCase().includes(q));
    const matchSubj = activeSubjectFilter === 'all' || (a.subjects || []).includes(activeSubjectFilter);
    const matchLevel = activeLevelFilter === 'all' || (a.grades || []).some(g => g.startsWith(activeLevelFilter));
    return matchQ && matchSubj && matchLevel;
  });

  els.appCount.textContent = filtered.length;

  if (filtered.length === 0) {
    els.cardGrid.innerHTML = '';
    els.emptyState.classList.remove('hidden');
  } else {
    els.emptyState.classList.add('hidden');
    els.cardGrid.innerHTML = filtered.map(appCard).join('');
  }

  rebuildSubjectFilter(apps);
}

function appCard(app) {
  const theme = getTheme(app.subjects);
  const grades = (app.grades || []);
  const subjects = (app.subjects || []);
  const keywords = (app.keywords || []);
  const os = (app.os || []);
  const ai = (app.aiTools || []);

  const gradeChips = grades.slice(0, 5).map(g =>
    `<span class="card-thumb-grade">${escHtml(g)}</span>`).join('');

  const subjectBadges = subjects.map(s =>
    `<span class="badge-subject">${escHtml(s)}</span>`).join('');

  const kwTags = keywords.map(k =>
    `<span class="kw-tag">#${escHtml(k)}</span>`).join('');

  const osBadges = os.slice(0, 3).map(o =>
    `<span class="badge-os">${escHtml(o)}</span>`).join('');

  const aiBadges = ai.slice(0, 3).map(t =>
    `<span class="badge-ai">${escHtml(t)}</span>`).join('');

  const thumbContent = app.thumbnail
    ? `<img src="${escHtml(app.thumbnail)}" alt="" onerror="this.style.display='none'">`
    : theme.emoji;

  return `
  <article class="app-card">
    <div class="card-thumb" style="background:${theme.grad}">
      ${thumbContent}
      ${gradeChips ? `<div class="card-thumb-grades">${gradeChips}</div>` : ''}
    </div>
    <div class="card-body">
      ${subjectBadges ? `<div class="card-subjects">${subjectBadges}</div>` : ''}
      <h3 class="card-title">${escHtml(app.name)}</h3>
      ${app.description ? `<p class="card-desc">${escHtml(app.description)}</p>` : ''}
      ${kwTags ? `<div class="card-keywords">${kwTags}</div>` : ''}
      ${(osBadges || aiBadges) ? `<div class="card-meta-row">${osBadges}${aiBadges}</div>` : ''}
    </div>
    <div class="card-footer">
      <a href="${escHtml(app.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">열기 →</a>
    </div>
  </article>`;
}

function rebuildSubjectFilter(apps) {
  const allSubjects = [...new Set(apps.flatMap(a => a.subjects || []))].sort();
  const cur = activeSubjectFilter;

  els.subjFilterRow.innerHTML =
    `<button class="filter-chip${cur === 'all' ? ' active' : ''}" data-filter="all">전체</button>` +
    allSubjects.map(s =>
      `<button class="filter-chip${cur === s ? ' active' : ''}" data-filter="${escHtml(s)}">${escHtml(s)}</button>`
    ).join('');

  els.subjFilterRow.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSubjectFilter = btn.dataset.filter;
      renderCards();
    });
  });
}

/* ── 관리: 테이블 렌더링 ── */
function renderTable() {
  const apps = loadApps().map(migrate);
  els.manageCount.textContent = `${apps.length}개`;

  if (apps.length === 0) {
    els.tableBody.innerHTML = '';
    els.tableEmpty.classList.remove('hidden');
    return;
  }
  els.tableEmpty.classList.add('hidden');
  els.tableBody.innerHTML = apps.map(appRow).join('');

  els.tableBody.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => startEdit(btn.dataset.edit)));
  els.tableBody.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => confirmDelete(btn.dataset.delete, btn.dataset.name)));
}

function appRow(app) {
  const grades   = (app.grades   || []).map(v => `<span class="table-chip">${escHtml(v)}</span>`).join('');
  const subjects = (app.subjects || []).map(v => `<span class="table-chip">${escHtml(v)}</span>`).join('');
  const keywords = (app.keywords || []).map(v => `<span class="table-chip">#${escHtml(v)}</span>`).join('');
  const osAi     = [...(app.os || []), ...(app.aiTools || [])].map(v => `<span class="table-chip">${escHtml(v)}</span>`).join('');

  return `<tr>
    <td><strong>${escHtml(app.name)}</strong></td>
    <td><div class="table-chips">${grades  || '—'}</div></td>
    <td><div class="table-chips">${subjects|| '—'}</div></td>
    <td><div class="table-chips">${keywords|| '—'}</div></td>
    <td><div class="table-chips">${osAi    || '—'}</div></td>
    <td><a href="${escHtml(app.url)}" target="_blank" class="table-url">${escHtml(app.url)}</a></td>
    <td><div class="table-actions-cell">
      <button class="btn btn-outline btn-icon" data-edit="${app.id}">수정</button>
      <button class="btn btn-danger-outline btn-icon" data-delete="${app.id}" data-name="${escHtml(app.name)}">삭제</button>
    </div></td>
  </tr>`;
}

/* ── 칩 UI 초기화 ── */
function initChips() {
  /* 모드 탭 */
  document.querySelectorAll('.mode-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const mode   = btn.dataset.mode;
      btn.closest('.mode-tabs').querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      if (target === 'grades')   chipState.gradeMode   = mode;
      if (target === 'subjects') chipState.subjectMode = mode;

      if (mode === 'single' && chipState[target].size > 1) {
        const first = [...chipState[target]][0];
        chipState[target].clear();
        chipState[target].add(first);
        syncChipUI(target);
      }
      updateSummary(target);
    });
  });

  /* 칩 토글 */
  document.querySelectorAll('.chips .chip[data-val]').forEach(chip => {
    chip.addEventListener('click', () => toggleChip(chip));
  });

  /* 커스텀 입력 추가 */
  document.querySelectorAll('.custom-chip-input').forEach(input => {
    const group = input.dataset.group;
    const addChip = () => {
      const val = input.value.trim();
      if (val) { addCustomChip(group, val); input.value = ''; }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addChip(); } });
  });

  document.querySelectorAll('[data-add-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.addGroup;
      const input = btn.previousElementSibling;
      const val = input.value.trim();
      if (val) { addCustomChip(group, val); input.value = ''; }
    });
  });
}

function toggleChip(chip) {
  const group   = chip.closest('[data-group]').dataset.group;
  const val     = chip.dataset.val;
  const isMulti = group === 'grades'   ? chipState.gradeMode   === 'multi'
                : group === 'subjects' ? chipState.subjectMode === 'multi'
                : true;

  const set = chipState[group];

  if (set.has(val)) {
    set.delete(val);
    chip.classList.remove('active');
  } else {
    if (!isMulti) {
      set.clear();
      chip.closest('[data-group]').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    }
    set.add(val);
    chip.classList.add('active');
  }
  updateSummary(group);
}

function addCustomChip(group, val) {
  const container = document.querySelector(`#chips-${group}`) ||
                    document.querySelector(`[data-group="${group}"]`);
  if (!container) return;

  const existing = container.querySelector(`.chip[data-val="${CSS.escape(val)}"]`);
  if (existing) {
    chipState[group].add(val);
    existing.classList.add('active');
    updateSummary(group);
    return;
  }

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip active';
  chip.dataset.val = val;
  chip.innerHTML = `${escHtml(val)} <span class="chip-remove" title="제거">×</span>`;

  chip.addEventListener('click', e => {
    if (e.target.classList.contains('chip-remove')) {
      chipState[group].delete(val);
      chip.remove();
      updateSummary(group);
    } else {
      toggleChip(chip);
    }
  });

  container.appendChild(chip);
  chipState[group].add(val);
  updateSummary(group);
}

function syncChipUI(group) {
  document.querySelectorAll(`[data-group="${group}"] .chip[data-val]`).forEach(chip => {
    chip.classList.toggle('active', chipState[group].has(chip.dataset.val));
  });
}

function updateSummary(group) {
  const el = $(`${group}-summary`);
  if (!el) return;
  const vals = [...chipState[group]];
  el.textContent = vals.length ? vals.join(', ') : '없음';
}

function resetChips() {
  ['grades', 'subjects', 'os', 'aiTools'].forEach(g => {
    chipState[g].clear();
    document.querySelectorAll(`[data-group="${g}"] .chip`).forEach(c => c.classList.remove('active'));
    updateSummary(g);
  });
  /* 커스텀 칩 제거 */
  ['chips-subjects', 'chips-os', 'chips-aiTools'].forEach(id => {
    const container = $(id);
    if (container) container.querySelectorAll('.chip[data-val]').forEach(c => {
      if (!c.dataset.preset) c.remove();
    });
  });
  /* 모드 탭 초기화 */
  document.querySelectorAll('.mode-tab[data-mode="single"]').forEach(t => t.classList.add('active'));
  document.querySelectorAll('.mode-tab[data-mode="multi"]').forEach(t => t.classList.remove('active'));
  chipState.gradeMode = 'single';
  chipState.subjectMode = 'single';
}

function loadChips(app) {
  resetChips();
  (app.grades   || []).forEach(v => { chipState.grades.add(v);   syncOrAdd('grades',   v); });
  (app.subjects || []).forEach(v => { chipState.subjects.add(v); syncOrAdd('subjects', v); });
  (app.os       || []).forEach(v => { chipState.os.add(v);       syncOrAdd('os',       v); });
  (app.aiTools  || []).forEach(v => { chipState.aiTools.add(v);  syncOrAdd('aiTools',  v); });
  ['grades','subjects','os','aiTools'].forEach(updateSummary);

  if ((app.grades   || []).length > 1) activateMode('grades',   'multi');
  if ((app.subjects || []).length > 1) activateMode('subjects', 'multi');
}

function syncOrAdd(group, val) {
  const preset = document.querySelector(`[data-group="${group}"] .chip[data-val="${CSS.escape(val)}"]`);
  if (preset) preset.classList.add('active');
  else addCustomChip(group, val);
}

function activateMode(target, mode) {
  const tabs = document.getElementById(`${target === 'grades' ? 'grade' : 'subject'}-mode-tabs`);
  if (!tabs) return;
  tabs.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  if (target === 'grades')   chipState.gradeMode   = mode;
  if (target === 'subjects') chipState.subjectMode = mode;
}

/* ── 폼 제출 ── */
els.appForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = els.inputName.value.trim();
  const url  = els.inputUrl.value.trim();
  if (!name) { showFormError('앱 이름을 입력하세요.'); return; }
  if (!url)  { showFormError('URL을 입력하세요.'); return; }
  if (!isValidUrl(url)) { showFormError('올바른 URL 형식이 아닙니다. (https://… 로 시작)'); return; }
  showFormError('');

  const keywords = [els.kw1, els.kw2, els.kw3]
    .map(i => i.value.trim()).filter(Boolean);

  const appData = {
    name,
    url,
    description: els.inputDesc.value.trim(),
    thumbnail:   els.inputThumb.value.trim(),
    grades:   [...chipState.grades],
    subjects: [...chipState.subjects],
    keywords,
    os:       [...chipState.os],
    aiTools:  [...chipState.aiTools],
    updatedAt: nowDate(),
  };

  const apps = loadApps().map(migrate);
  const id = els.editId.value;

  if (id) {
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) apps[idx] = { ...apps[idx], ...appData };
    showToast('앱이 수정되었습니다.', 'success');
  } else {
    apps.push({ id: createId(), createdAt: nowDate(), ...appData });
    showToast('앱이 추가되었습니다.', 'success');
  }

  saveApps(apps);
  resetForm();
  renderTable();
});

function startEdit(id) {
  const app = loadApps().map(migrate).find(a => a.id === id);
  if (!app) return;

  els.editId.value      = app.id;
  els.inputName.value   = app.name;
  els.inputUrl.value    = app.url;
  els.inputDesc.value   = app.description || '';
  els.inputThumb.value  = app.thumbnail   || '';
  const kws = app.keywords || [];
  els.kw1.value = kws[0] || '';
  els.kw2.value = kws[1] || '';
  els.kw3.value = kws[2] || '';

  loadChips(app);

  els.formTitle.textContent = '앱 수정';
  els.submitBtn.textContent = '수정 완료';
  els.cancelBtn.classList.remove('hidden');
  showFormError('');
  els.appForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

els.cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  els.appForm.reset();
  els.editId.value = '';
  els.formTitle.textContent = '새 앱 추가';
  els.submitBtn.textContent = '추가하기';
  els.cancelBtn.classList.add('hidden');
  showFormError('');
  resetChips();
  els.kw1.value = els.kw2.value = els.kw3.value = '';
}

function showFormError(msg) { els.formError.textContent = msg; }

/* ── 삭제 모달 ── */
let pendingDeleteId = null;

function confirmDelete(id, name) {
  pendingDeleteId = id;
  els.modalMessage.textContent = `"${name}" 앱을 삭제하시겠습니까?`;
  els.modalOverlay.classList.remove('hidden');
}

els.modalConfirm.addEventListener('click', () => {
  const apps = loadApps().filter(a => a.id !== pendingDeleteId);
  saveApps(apps);
  pendingDeleteId = null;
  els.modalOverlay.classList.add('hidden');
  renderTable();
  showToast('삭제되었습니다.', 'success');
});

els.modalCancel.addEventListener('click', () => {
  pendingDeleteId = null;
  els.modalOverlay.classList.add('hidden');
});
els.modalOverlay.addEventListener('click', e => {
  if (e.target === els.modalOverlay) { pendingDeleteId = null; els.modalOverlay.classList.add('hidden'); }
});

/* ── 전체 초기화 ── */
els.clearBtn.addEventListener('click', () => {
  if (!confirm('전체 앱을 삭제하시겠습니까?')) return;
  saveApps([]);
  renderTable();
  showToast('초기화 완료', 'success');
});

/* ── 학교급 필터 ── */
document.querySelectorAll('.level-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeLevelFilter = btn.dataset.level;
    renderCards();
  });
});

/* ── 검색 ── */
els.searchInput.addEventListener('input', renderCards);

/* ── CSV 내보내기 ── */
els.exportCsvBtn.addEventListener('click', () => {
  const apps = loadApps().map(migrate);
  if (!apps.length) { showToast('내보낼 앱이 없습니다.', 'error'); return; }
  const header = ['id','name','url','description','grades','subjects','keywords','os','aiTools','thumbnail','createdAt','updatedAt'];
  const rows = apps.map(a =>
    header.map(k => {
      const v = Array.isArray(a[k]) ? a[k].join('|') : (a[k] || '');
      return `"${String(v).replace(/"/g,'""')}"`;
    }).join(',')
  );
  download('webapp_portal.csv', '﻿' + header.join(',') + '\n' + rows.join('\n'), 'text/csv;charset=utf-8;');
  showToast('CSV 다운로드 완료', 'success');
});

/* ── JSON 내보내기 ── */
els.exportJsonBtn.addEventListener('click', () => {
  const apps = loadApps();
  if (!apps.length) { showToast('내보낼 앱이 없습니다.', 'error'); return; }
  download('webapp_portal.json', JSON.stringify(apps, null, 2), 'application/json');
  showToast('JSON 다운로드 완료', 'success');
});

/* ── JSON 가져오기 ── */
els.importFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error();
      const valid = imported.filter(a => a.name && a.url);
      const existing = loadApps();
      saveApps([...existing, ...valid.filter(n => !existing.some(e => e.id === n.id))]);
      renderTable();
      showToast(`${valid.length}개 가져왔습니다.`, 'success');
    } catch { showToast('가져오기 실패: 올바른 JSON 파일을 선택하세요.', 'error'); }
    els.importFile.value = '';
  };
  reader.readAsText(file, 'utf-8');
});

/* ── 유틸 ── */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function isValidUrl(str) {
  try { return ['http:','https:'].includes(new URL(str).protocol); }
  catch { return false; }
}
function download(filename, content, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}

let toastTimer;
function showToast(msg, type = '') {
  els.toast.textContent = msg;
  els.toast.className = `toast${type ? ' ' + type : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.className = 'toast hidden'; }, 2500);
}

/* ── 샘플 데이터 ── */
function seedSampleData() {
  if (loadApps().length > 0) return;
  saveApps([{
    id: createId(),
    name: '숨은 원인을 찾아라',
    url: 'https://evalue-gamma.vercel.app/',
    description: '인과관계와 상관관계를 탐구하는 학습 도구',
    grades: ['초5', '초6'],
    subjects: ['수학', '과학'],
    keywords: ['인과관계', '상관관계', '데이터분석'],
    os: ['ChromeBook', 'Windows'],
    aiTools: [],
    thumbnail: '',
    createdAt: nowDate(),
    updatedAt: nowDate(),
  }]);
}

/* ── 앱 초기화 ── */
seedSampleData();
initChips();
route();
