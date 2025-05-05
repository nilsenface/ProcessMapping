let data = {
  processes: [
    { id: 'p1', name: 'Order Processing', systems: ['s1', 's3'], providers: ['tp2'] },
    { id: 'p2', name: 'Inventory Management', systems: ['s1', 's2'], providers: ['tp1'] },
    { id: 'p3', name: 'Customer Support', systems: ['s3'], providers: ['tp3'] },
    { id: 'p4', name: 'Financial Reporting', systems: ['s2', 's4'], providers: ['tp1', 'tp2'] },
    { id: 'p5', name: 'Marketing Campaigns', systems: ['s3', 's4'], providers: ['tp2', 'tp3'] }
  ],
  systems: [
    { id: 's1', name: 'ERP System' },
    { id: 's2', name: 'Financial Software' },
    { id: 's3', name: 'CRM Platform' },
    { id: 's4', name: 'Analytics Dashboard' }
  ],
  providers: [
    { id: 'tp1', name: 'Cloud Storage Provider' },
    { id: 'tp2', name: 'Payment Gateway' },
    { id: 'tp3', name: 'Customer Communication Platform' }
  ]
};

let adminMode = false;
let currentItemType = null;
let currentItemId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDataFromLocalStorage();
  renderElements();
  setupAdminControls();
  setupModal();
  setupHighlighting();
});

function loadDataFromLocalStorage() {
  const saved = localStorage.getItem('processData');
  if (saved) data = JSON.parse(saved);
}
function saveDataToLocalStorage() {
  localStorage.setItem('processData', JSON.stringify(data));
}

function renderElements() {
  ['processes', 'systems', 'providers'].forEach(type => {
    const container = document.getElementById(`${type}-container`);
    container.innerHTML = '';
    data[type].forEach(item => {
      const div = document.createElement('div');
      div.className = `item ${type.slice(0, -1)}`;
      div.dataset.id = item.id;
      div.dataset.type = type.slice(0, -1);

      div.innerHTML = `<span>${item.name}</span>
        <button class="edit-btn" style="display:${adminMode ? 'inline' : 'none'};">Edit</button>`;
      container.appendChild(div);

      // Edit button
      div.querySelector('.edit-btn').onclick = e => {
        e.stopPropagation();
        openEditModal(type.slice(0, -1), item.id);
      };
    });
  });
}

function setupHighlighting() {
  document.addEventListener('click', e => {
    const item = e.target.closest('.item');
    if (!item || adminMode) return;

    document.querySelectorAll('.item').forEach(el => el.classList.remove('active', 'highlighted'));
    item.classList.add('active');
    highlightRelated(item.dataset.id, item.dataset.type);
  });
}

function highlightRelated(itemId, itemType) {
  if (itemType === 'process') {
    const p = data.processes.find(x => x.id === itemId);
    p.systems.forEach(sid => {
      const el = document.querySelector(`.system[data-id="${sid}"]`);
      if (el) el.classList.add('highlighted');
    });
    p.providers.forEach(pid => {
      const el = document.querySelector(`.provider[data-id="${pid}"]`);
      if (el) el.classList.add('highlighted');
    });
  } else if (itemType === 'system') {
    data.processes.forEach(p => {
      if (p.systems.includes(itemId)) {
        const el = document.querySelector(`.process[data-id="${p.id}"]`);
        if (el) el.classList.add('highlighted');
        p.providers.forEach(pid => {
          const pel = document.querySelector(`.provider[data-id="${pid}"]`);
          if (pel) pel.classList.add('highlighted');
        });
      }
    });
  } else if (itemType === 'provider') {
    data.processes.forEach(p => {
      if (p.providers.includes(itemId)) {
        const el = document.querySelector(`.process[data-id="${p.id}"]`);
        if (el) el.classList.add('highlighted');
        p.systems.forEach(sid => {
          const sel = document.querySelector(`.system[data-id="${sid}"]`);
          if (sel) sel.classList.add('highlighted');
        });
      }
    });
  }
}

function setupAdminControls() {
  const adminBtn = document.getElementById('admin-toggle');
  const addBtns = [
    document.getElementById('add-process'),
    document.getElementById('add-system'),
    document.getElementById('add-provider')
  ];
  adminBtn.onclick = () => {
    adminMode = !adminMode;
    document.body.classList.toggle('admin-mode', adminMode);
    adminBtn.classList.toggle('active', adminMode);
    adminBtn.textContent = adminMode ? 'Exit Admin Mode' : 'Admin Mode';
    addBtns.forEach(btn => btn.style.display = adminMode ? 'inline' : 'none');
    renderElements();
  };
  addBtns[0].onclick = () => openAddModal('process');
  addBtns[1].onclick = () => openAddModal('system');
  addBtns[2].onclick = () => openAddModal('provider');
}

function setupModal() {
  const modal = document.getElementById('modal');
  const closeBtn = document.querySelector('.close');
  const form = document.getElementById('item-form');
  closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
  form.onsubmit = e => { e.preventDefault(); saveItem(); };
  document.getElementById('delete-item').onclick = deleteItem;
}

function openAddModal(type) {
  showModal(type, null);
}
function openEditModal(type, id) {
  showModal(type, id);
}

function showModal(type, id) {
  currentItemType = type;
  currentItemId = id;
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const nameInput = document.getElementById('item-name');
  const processFields = document.getElementById('process-fields');
  const deleteBtn = document.getElementById('delete-item');
  document.getElementById('item-form').reset();

  title.textContent = id ? `Edit ${capitalize(type)}` : `Add ${capitalize(type)}`;
  processFields.style.display = (type === 'process') ? 'block' : 'none';
  deleteBtn.style.display = id ? 'inline-block' : 'none';

  if (type === 'process') populateCheckboxes(id);
  else processFields.style.display = 'none';

  if (id) {
    let item = getItem(type, id);
    nameInput.value = item.name;
  } else {
    nameInput.value = '';
  }
  modal.style.display = 'flex';
  nameInput.focus();
}

function populateCheckboxes(processId) {
  const sysBox = document.getElementById('systems-checkboxes');
  const provBox = document.getElementById('providers-checkboxes');
  sysBox.innerHTML = '';
  provBox.innerHTML = '';
  let selectedSys = [], selectedProv = [];
  if (processId) {
    const p = data.processes.find(x => x.id === processId);
    selectedSys = p.systems;
    selectedProv = p.providers;
  }
  data.systems.forEach(s => {
    const id = `sys-cb-${s.id}`;
    sysBox.innerHTML += `<label><input type="checkbox" id="${id}" value="${s.id}" ${selectedSys.includes(s.id) ? 'checked' : ''}/> ${s.name}</label>`;
  });
  data.providers.forEach(p => {
    const id = `prov-cb-${p.id}`;
    provBox.innerHTML += `<label><input type="checkbox" id="${id}" value="${p.id}" ${selectedProv.includes(p.id) ? 'checked' : ''}/> ${p.name}</label>`;
  });
}

function saveItem() {
  const name = document.getElementById('item-name').value.trim();
  if (!name) return alert('Please enter a name.');
  if (currentItemType === 'process') {
    const selectedSys = Array.from(document.querySelectorAll('#systems-checkboxes input:checked')).map(cb => cb.value);
    const selectedProv = Array.from(document.querySelectorAll('#providers-checkboxes input:checked')).map(cb => cb.value);
    if (currentItemId) {
      const idx = data.processes.findIndex(x => x.id === currentItemId);
      data.processes[idx] = { id: currentItemId, name, systems: selectedSys, providers: selectedProv };
    } else {
      const newId = generateId('process');
      data.processes.push({ id: newId, name, systems: selectedSys, providers: selectedProv });
    }
  } else if (currentItemType === 'system') {
    if (currentItemId) {
      const idx = data.systems.findIndex(x => x.id === currentItemId);
      data.systems[idx] = { id: currentItemId, name };
    } else {
      const newId = generateId('system');
      data.systems.push({ id: newId, name });
    }
  } else if (currentItemType === 'provider') {
    if (currentItemId) {
      const idx = data.providers.findIndex(x => x.id === currentItemId);
      data.providers[idx] = { id: currentItemId, name };
    } else {
      const newId = generateId('provider');
      data.providers.push({ id: newId, name });
    }
  }
  saveDataToLocalStorage();
  renderElements();
  document.getElementById('modal').style.display = 'none';
}

function deleteItem() {
  if (!currentItemId) return;
  if (!confirm('Are you sure you want to delete this item?')) return;
  if (currentItemType === 'process') {
    data.processes = data.processes.filter(x => x.id !== currentItemId);
  } else if (currentItemType === 'system') {
    data.systems = data.systems.filter(x => x.id !== currentItemId);
    data.processes.forEach(p => p.systems = p.systems.filter(id => id !== currentItemId));
  } else if (currentItemType === 'provider') {
    data.providers = data.providers.filter(x => x.id !== currentItemId);
    data.processes.forEach(p => p.providers = p.providers.filter(id => id !== currentItemId));
  }
  saveDataToLocalStorage();
  renderElements();
  document.getElementById('modal').style.display = 'none';
}

function getItem(type, id) {
  if (type === 'process') return data.processes.find(x => x.id === id);
  if (type === 'system') return data.systems.find(x => x.id === id);
  if (type === 'provider') return data.providers.find(x => x.id === id);
}
function generateId(type) {
  const prefix = type === 'process' ? 'p' : type === 'system' ? 's' : 'tp';
  const arr = type === 'process' ? data.processes : type === 'system' ? data.systems : data.providers;
  let max = 0;
  arr.forEach(item => {
    const num = parseInt(item.id.replace(prefix, ''));
    if (num > max) max = num;
  });
  return prefix + (max + 1);
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
