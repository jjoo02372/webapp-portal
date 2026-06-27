/* ===== 학습 웹앱 포털 - 메인 앱 ===== */

const STORAGE_KEY = 'webapp_portal_apps';

/* ── 데이터 레이어 ── */
function loadApps() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveApps(apps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function now() {
  return new Date().toISOString().slice(0, 10);
}

/* ── DOM 참조 ── */
const $ = id => document.getElementById(id);

const els = {
  viewPortal:     $('view-portal'),
  viewManage:     $('view-manage'),
  navPortal:      $('nav-portal'),
  navManage:      $('nav-manage'),
  cardGrid:       $('card-grid'),
  emptyState:     $('empty-state'),
  appCount:       $('app-count'),
  searchInput:    $('search-input'),
  filterSubject:  $('filter-subject'),
  filterTag:      $('filter-tag'),
  appForm:        $('app-form'),
  formTitle:      $('form-title'),
  editId:         $('edit-id'),
  inputName:      $('input-name'),
  inputUrl:       $('input-url'),
  inputSubject:   $('input-subject'),
  inputUnit:      $('input-unit'),
  inputDesc:      $('input-description'),
  inputTags:      $('input-tags'),
  inputThumb:     $('input-thumbnail'),
  submitBtn:      $('submit-btn'),
  cancelBtn:      $('cancel-btn'),
  formError:      $('form-error'),
  tableBody:      $('app-table-body'),
  tableEmpty:     $('table-empty'),
  manageCount:    $('manage-count'),
  exportCsvBtn:   $('export-csv-btn'),
  exportJsonBtn:  $('export-json-btn'),
  importFile:     $('import-file'),
  clearBtn:       $('clear-btn'),
  modalOverlay:   $('modal-overlay'),
  modalMessage:   $('modal-message'),
  modalConfirm:   $('modal-confirm'),
  modalCancel:    $('modal-cancel'),
  toast:          $('toast'),
};

/* ── 라우팅 ── */
function route() {
  const hash = location.hash || '#portal';
  const isManage = hash === '#manage';
  els.viewPortal.classList.toggle('hidden', isManage);
  els.viewManage.classList.toggle('hidden', !isManage);
  els.navPortal.classList.toggle('active', !isManage);
  els.navManage.classList.toggle('active', isManage);

  if (isManage) {
    renderTable();
  } else {
    renderCards();
  }
}

window.addEventListener('hashchange', route);

/* ── 포털 뷰: 카드 렌더링 ── */
function renderCards() {
  const apps = loadApps();
  const q     = els.searchInput.value.trim().toLowerCase();
  const subj  = els.filterSubject.value;
  const tag   = els.filterTag.value;

  const filtered = apps.filter(a => {
    const matchQ    = !q || a.name.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q);
    const matchSubj = !subj || a.subject === subj;
    const matchTag  = !tag  || (a.tags || []).includes(tag);
    return matchQ && matchSubj && matchTag;
  });

  els.appCount.textContent = filtered.length;

  if (filtered.length === 0) {
    els.cardGrid.innerHTML = '';
    els.emptyState.classList.add('show');
  } else {
    els.emptyState.classList.remove('show');
    els.cardGrid.innerHTML = filtered.map(appCard).join('');
  }

  rebuildFilters(apps);
}

function appCard(app) {
  const tags = (app.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
  const thumb = app.thumbnail
    ? `<div class="card-thumbnail"><img src="${escHtml(app.thumbnail)}" alt="" onerror="this.parentElement.innerHTML='📱'"></div>`
    : `<div class="card-thumbnail">📱</div>`;

  return `
  <article class="app-card">
    ${thumb}
    <div class="card-body">
      <div class="card-meta">
        ${app.subject ? `<span class="badge-subject">${escHtml(app.subject)}</span>` : ''}
        ${app.unit    ? `<span class="badge-unit">${escHtml(app.unit)}</span>`       : ''}
      </div>
      <h3 class="card-title">${escHtml(app.name)}</h3>
      ${app.description ? `<p class="card-desc">${escHtml(app.description)}</p>` : ''}
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
    </div>
    <div class="card-footer">
      <a href="${escHtml(app.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">열기 →</a>
    </div>
  </article>`;
}

function rebuildFilters(apps) {
  const subjects = [...new Set(apps.map(a => a.subject).filter(Boolean))].sort();
  const tags     = [...new Set(apps.flatMap(a => a.tags || []))].sort();

  const curSubj = els.filterSubject.value;
  const curTag  = els.filterTag.value;

  els.filterSubject.innerHTML =
    '<option value="">전체 과목</option>' +
    subjects.map(s => `<option value="${escHtml(s)}" ${s === curSubj ? 'selected' : ''}>${escHtml(s)}</option>`).join('');

  els.filterTag.innerHTML =
    '<option value="">전체 태그</option>' +
    tags.map(t => `<option value="${escHtml(t)}" ${t === curTag ? 'selected' : ''}>${escHtml(t)}</option>`).join('');
}

/* ── 관리 뷰: 테이블 렌더링 ── */
function renderTable() {
  const apps = loadApps();
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
  const tags = (app.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
  return `
  <tr>
    <td><strong>${escHtml(app.name)}</strong></td>
    <td>${escHtml(app.subject || '—')}</td>
    <td>${escHtml(app.unit    || '—')}</td>
    <td><div class="table-tags">${tags || '—'}</div></td>
    <td><a href="${escHtml(app.url)}" target="_blank" class="table-url" title="${escHtml(app.url)}">${escHtml(app.url)}</a></td>
    <td>
      <div class="table-actions-cell">
        <button class="btn btn-outline btn-icon" data-edit="${app.id}">수정</button>
        <button class="btn btn-danger-outline btn-icon" data-delete="${app.id}" data-name="${escHtml(app.name)}">삭제</button>
      </div>
    </td>
  </tr>`;
}

/* ── 폼: 추가 / 수정 ── */
els.appForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = els.inputName.value.trim();
  const url  = els.inputUrl.value.trim();

  if (!name) { showFormError('앱 이름을 입력하세요.'); return; }
  if (!url)  { showFormError('URL을 입력하세요.'); return; }
  if (!isValidUrl(url)) { showFormError('올바른 URL 형식이 아닙니다. (https://… 로 시작해야 합니다)'); return; }

  showFormError('');

  const apps = loadApps();
  const id = els.editId.value;

  const appData = {
    name,
    url,
    subject:     els.inputSubject.value.trim(),
    unit:        els.inputUnit.value.trim(),
    description: els.inputDesc.value.trim(),
    tags:        els.inputTags.value.split(',').map(t => t.trim()).filter(Boolean),
    thumbnail:   els.inputThumb.value.trim(),
    updatedAt:   now(),
  };

  if (id) {
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) apps[idx] = { ...apps[idx], ...appData };
    showToast('앱이 수정되었습니다.', 'success');
  } else {
    apps.push({ id: createId(), createdAt: now(), ...appData });
    showToast('앱이 추가되었습니다.', 'success');
  }

  saveApps(apps);
  resetForm();
  renderTable();
});

function startEdit(id) {
  const app = loadApps().find(a => a.id === id);
  if (!app) return;

  els.editId.value        = app.id;
  els.inputName.value     = app.name;
  els.inputUrl.value      = app.url;
  els.inputSubject.value  = app.subject     || '';
  els.inputUnit.value     = app.unit        || '';
  els.inputDesc.value     = app.description || '';
  els.inputTags.value     = (app.tags || []).join(', ');
  els.inputThumb.value    = app.thumbnail   || '';

  els.formTitle.textContent = '앱 수정';
  els.submitBtn.textContent = '수정 완료';
  els.cancelBtn.classList.remove('hidden');
  els.formError.textContent = '';

  els.appForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

els.cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  els.appForm.reset();
  els.editId.value = '';
  els.formTitle.textContent = '새 앱 추가';
  els.submitBtn.textContent = '추가하기';
  els.cancelBtn.classList.add('hidden');
  els.formError.textContent = '';
}

function showFormError(msg) {
  els.formError.textContent = msg;
}

/* ── 삭제 확인 모달 ── */
let pendingDeleteId = null;

function confirmDelete(id, name) {
  pendingDeleteId = id;
  els.modalMessage.textContent = `"${name}" 앱을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
  els.modalOverlay.classList.remove('hidden');
}

els.modalConfirm.addEventListener('click', () => {
  if (!pendingDeleteId) return;
  const apps = loadApps().filter(a => a.id !== pendingDeleteId);
  saveApps(apps);
  pendingDeleteId = null;
  els.modalOverlay.classList.add('hidden');
  renderTable();
  showToast('앱이 삭제되었습니다.', 'success');
});

els.modalCancel.addEventListener('click', () => {
  pendingDeleteId = null;
  els.modalOverlay.classList.add('hidden');
});

els.modalOverlay.addEventListener('click', e => {
  if (e.target === els.modalOverlay) {
    pendingDeleteId = null;
    els.modalOverlay.classList.add('hidden');
  }
});

/* ── 전체 초기화 ── */
els.clearBtn.addEventListener('click', () => {
  if (!confirm('등록된 앱을 전부 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  saveApps([]);
  renderTable();
  showToast('전체 초기화 완료', 'success');
});

/* ── CSV 내보내기 ── */
els.exportCsvBtn.addEventListener('click', () => {
  const apps = loadApps();
  if (!apps.length) { showToast('내보낼 앱이 없습니다.', 'error'); return; }

  const header = ['id', 'name', 'url', 'subject', 'unit', 'description', 'tags', 'thumbnail', 'createdAt', 'updatedAt'];
  const rows = apps.map(a =>
    header.map(k => {
      const v = k === 'tags' ? (a.tags || []).join('|') : (a[k] || '');
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = '﻿' + header.join(',') + '\n' + rows.join('\n');
  download('webapp_portal.csv', csv, 'text/csv;charset=utf-8;');
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
      if (!Array.isArray(imported)) throw new Error('배열 형식이 아닙니다.');
      const valid = imported.filter(a => a.name && a.url);
      const existing = loadApps();
      const merged = [...existing, ...valid.filter(n => !existing.some(e => e.id === n.id))];
      saveApps(merged);
      renderTable();
      showToast(`${valid.length}개 앱을 가져왔습니다.`, 'success');
    } catch {
      showToast('가져오기 실패: 올바른 JSON 파일을 선택하세요.', 'error');
    }
    els.importFile.value = '';
  };
  reader.readAsText(file, 'utf-8');
});

/* ── 필터 이벤트 ── */
els.searchInput.addEventListener('input', renderCards);
els.filterSubject.addEventListener('change', renderCards);
els.filterTag.addEventListener('change', renderCards);

/* ── 유틸 ── */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidUrl(str) {
  try { return ['http:', 'https:'].includes(new URL(str).protocol); }
  catch { return false; }
}

function download(filename, content, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

let toastTimer;
function showToast(msg, type = '') {
  els.toast.textContent = msg;
  els.toast.className = `toast${type ? ' ' + type : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.className = 'toast hidden'; }, 2500);
}

/* ── 샘플 데이터 (처음 방문 시) ── */
function seedSampleData() {
  if (loadApps().length > 0) return;
  const samples = [
    {
      id: createId(), name: '숨은 원인을 찾아라', url: 'https://evalue-gamma.vercel.app/',
      subject: '수학', unit: '통계', description: '인과관계와 상관관계를 탐구하는 학습 도구',
      tags: ['인과관계', '상관관계', '데이터분석'], thumbnail: '', createdAt: now(), updatedAt: now(),
    },
  ];
  saveApps(samples);
}

/* ── 앱 초기화 ── */
seedSampleData();
route();
