// ========== API CONFIG ==========
const API_URL = '/api'; // Relative path to API endpoints

// ========== DATA STRUCTURE ==========
let data = {
    processes: [],
    systems: [],
    vendors: []
};

let adminMode = false;
let currentItemType = null;
let currentItemId = null;
let selectedItemId = null;
let selectedItemType = null;
let currentViewState = { id: null, type: null, parentId: null, parentType: null };
let currentTransform = d3.zoomIdentity;
let zoomObj = null;
let svgObj = null;

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', async () => {
    await loadDataFromDatabase();
    renderLists();
    setupEventListeners();
    addDrillUpButton();
    addDetailBox();
    resetVisualization();
    setupToggleVisibility();
});

// ========== DATA PERSISTENCE ==========

async function loadDataFromDatabase() {
    try {
        const response = await fetch(`${API_URL}/get_data.php`);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        data = result;
        console.log("Loaded data from database");
    } catch (error) {
        console.error("Error loading data:", error);
        alert("Could not connect to the database. Using default data instead.");
    }
}

async function saveDataToDatabase() {
    try {
        const response = await fetch(`${API_URL}/save_data.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save data');
        }
        
        console.log("Saved data to database");
    } catch (error) {
        console.error("Error saving data:", error);
        alert("Failed to save data to the database. Please try again.");
    }
}

// ========== SIDEBAR RENDERING ==========

function renderLists() {
    renderList('process', data.processes);
    renderList('system', data.systems);
    renderList('vendor', data.vendors);
}

function renderList(type, items) {
    const listElement = document.getElementById(`${type}-list`);
    if (!listElement) return;
    listElement.innerHTML = '';
    
    if (!items || items.length === 0) {
        listElement.innerHTML = `<div class="empty-list">No ${type}s found</div>`;
        return;
    }
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `item ${type}`;
        itemElement.dataset.id = item.id;
        itemElement.dataset.type = type;
        if (selectedItemId === item.id && selectedItemType === type) itemElement.classList.add('active');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;
        itemElement.appendChild(nameSpan);
        if (adminMode) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-btn';
            editButton.textContent = 'Edit';
            editButton.onclick = function(e) {
                e.stopPropagation();
                openEditModal(type, item.id);
            };
            itemElement.appendChild(editButton);
        }
        itemElement.addEventListener('click', () => selectItem(item.id, type));
        listElement.appendChild(itemElement);
    });
}

// ========== EVENT HANDLERS & ADMIN MODE ==========

function setupEventListeners() {
    const adminToggle = document.getElementById('admin-toggle');
    if (adminToggle) adminToggle.addEventListener('click', toggleAdminMode);
    window.addEventListener('click', (event) => {
        const detailBox = document.getElementById('detail-box');
        if (!detailBox) return;
        if (!event.target.closest('.item') && 
            !event.target.closest('#detail-box') && 
            !event.target.closest('.node') && 
            !event.target.closest('#drill-up-btn')) {
            detailBox.style.display = 'none';
        }
    });
    // Modal events
    const closeBtn = document.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const modal = document.getElementById('modal');
    if (modal) modal.addEventListener('click', function(e) { if (e.target === this) closeModal(); });
    const itemForm = document.getElementById('item-form');
    if (itemForm) itemForm.addEventListener('submit', function(e) { e.preventDefault(); saveItem(); });
    const deleteBtn = document.getElementById('delete-item');
    if (deleteBtn) deleteBtn.addEventListener('click', deleteItem);
}

function toggleAdminMode() {
    adminMode = !adminMode;
    const adminToggle = document.getElementById('admin-toggle');
    adminToggle.textContent = adminMode ? 'Exit Admin Mode' : 'Admin Mode';
    adminToggle.classList.toggle('active', adminMode);
    
    // Add buttons for adding items
    const processHeader = document.querySelector('.section-header:nth-child(1)');
    const systemHeader = document.querySelector('.section-header:nth-child(3)');
    const vendorHeader = document.querySelector('.section-header:nth-child(5)');
    
    // Remove existing add buttons
    document.querySelectorAll('.add-btn').forEach(btn => btn.remove());
    
    if (adminMode) {
        // Add buttons for adding items
        if (processHeader) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-btn';
            addBtn.textContent = '+';
            addBtn.onclick = () => openAddModal('process');
            processHeader.appendChild(addBtn);
        }
        
        if (systemHeader) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-btn';
            addBtn.textContent = '+';
            addBtn.onclick = () => openAddModal('system');
            systemHeader.appendChild(addBtn);
        }
        
        if (vendorHeader) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-btn';
            addBtn.textContent = '+';
            addBtn.onclick = () => openAddModal('vendor');
            vendorHeader.appendChild(addBtn);
        }
    }
    
    renderLists();
}

function selectItem(id, type) {
    selectedItemId = id;
    selectedItemType = type;
    const previousState = {...currentViewState};
    currentViewState = { id, type, parentId: previousState.id, parentType: previousState.type };
    document.querySelectorAll('.item').forEach(item => item.classList.remove('active'));
    const selectedElement = document.querySelector(`.item[data-id="${id}"][data-type="${type}"]`);
    if (selectedElement) selectedElement.classList.add('active');
    updateVisualization(id, type);
    showDetailBox(id, type);
    const drillUpBtn = document.getElementById('drill-up-btn');
    if (drillUpBtn && currentViewState.id !== null) drillUpBtn.style.display = 'block';
}

// ========== DRILL-UP & DETAIL BOX ==========

function addDrillUpButton() {
    const header = document.querySelector('header');
    if (!header) return;
    const button = document.createElement('button');
    button.id = 'drill-up-btn';
    button.className = 'control-btn';
    button.textContent = '↑ Up';
    button.style.display = 'none';
    button.onclick = drillUp;
    header.appendChild(button);
}

function drillUp() {
    if (currentViewState.parentId) {
        updateVisualization(currentViewState.parentId, currentViewState.parentType);
        showDetailBox(currentViewState.parentId, currentViewState.parentType);
        selectedItemId = currentViewState.parentId;
        selectedItemType = currentViewState.parentType;
        document.querySelectorAll('.item').forEach(item => item.classList.remove('active'));
        const selectedElement = document.querySelector(`.item[data-id="${selectedItemId}"][data-type="${selectedItemType}"]`);
        if (selectedElement) selectedElement.classList.add('active');
        currentViewState = { id: currentViewState.parentId, type: currentViewState.parentType, parentId: null, parentType: null };
    } else {
        resetVisualization();
    }
}

function addDetailBox() {
    const visualizationContainer = document.querySelector('.visualization-container');
    if (!visualizationContainer) return;
    const detailBox = document.createElement('div');
    detailBox.id = 'detail-box';
    detailBox.style.display = 'none';
    visualizationContainer.appendChild(detailBox);
}

function showDetailBox(itemId, itemType) {
    const detailBox = document.getElementById('detail-box');
    if (!detailBox) return;
    
    let html = '';
    
    if (itemType === 'process') {
        const process = data.processes.find(p => p.id === itemId);
        if (!process) return;
        
        html += `<h3>Process: ${process.name}</h3>`;
        
        // Show sub-processes
        html += '<div class="detail-section"><strong>Sub-Processes:</strong>';
        if (process.subProcesses && process.subProcesses.length > 0) {
            html += '<ul>';
            process.subProcesses.forEach(sub => {
                html += `<li>${sub.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No sub-processes defined.</p>';
        }
        html += '</div>';
        
        // Get all systems for this process (through sub-processes)
        const systemIds = new Set();
        (process.subProcesses || []).forEach(sub => {
            (sub.systems || []).forEach(sysId => systemIds.add(sysId));
        });
        const systems = data.systems.filter(s => systemIds.has(s.id));
        
        html += '<div class="detail-section"><strong>Systems:</strong>';
        if (systems.length > 0) {
            html += '<ul>';
            systems.forEach(system => {
                html += `<li>${system.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No systems linked to this process.</p>';
        }
        html += '</div>';
        
        // Get all vendors for this process (through sub-processes)
        const vendorIds = new Set();
        (process.subProcesses || []).forEach(sub => {
            (sub.vendors || []).forEach(venId => vendorIds.add(venId));
        });
        const vendors = data.vendors.filter(v => vendorIds.has(v.id));
        
        html += '<div class="detail-section"><strong>Vendors:</strong>';
        if (vendors.length > 0) {
            html += '<ul>';
            vendors.forEach(vendor => {
                html += `<li>${vendor.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No vendors linked to this process.</p>';
        }
        html += '</div>';
    } 
    else if (itemType === 'sub-process') {
        // Find the sub-process and its parent process
        let subProcess = null;
        let parentProcess = null;
        
        for (const process of data.processes) {
            if (process.subProcesses) {
                const sub = process.subProcesses.find(s => s.id === itemId);
                if (sub) {
                    subProcess = sub;
                    parentProcess = process;
                    break;
                }
            }
        }
        
        if (!subProcess || !parentProcess) return;
        
        html += `<h3>Sub-Process: ${subProcess.name}</h3>`;
        html += `<div class="detail-section"><strong>Parent Process:</strong> ${parentProcess.name}</div>`;
        
        // Get systems for this sub-process
        const systems = data.systems.filter(s => (subProcess.systems || []).includes(s.id));
        html += '<div class="detail-section"><strong>Systems:</strong>';
        if (systems.length > 0) {
            html += '<ul>';
            systems.forEach(system => {
                html += `<li>${system.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No systems linked to this sub-process.</p>';
        }
        html += '</div>';
        
        // Get vendors for this sub-process
        const vendors = data.vendors.filter(v => (subProcess.vendors || []).includes(v.id));
        html += '<div class="detail-section"><strong>Vendors:</strong>';
        if (vendors.length > 0) {
            html += '<ul>';
            vendors.forEach(vendor => {
                html += `<li>${vendor.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No vendors linked to this sub-process.</p>';
        }
        html += '</div>';
    }
    else if (itemType === 'system') {
        const system = data.systems.find(s => s.id === itemId);
        if (!system) return;
        
        html += `<h3>System: ${system.name}</h3>`;
        
        // Find sub-processes that use this system
        const relatedSubProcesses = [];
        data.processes.forEach(process => {
            if (process.subProcesses) {
                process.subProcesses.forEach(sub => {
                    if ((sub.systems || []).includes(system.id)) {
                        relatedSubProcesses.push({
                            subProcess: sub,
                            process: process
                        });
                    }
                });
            }
        });
        
        html += '<div class="detail-section"><strong>Used in Sub-Processes:</strong>';
        if (relatedSubProcesses.length > 0) {
            html += '<ul>';
            relatedSubProcesses.forEach(relation => {
                html += `<li>${relation.subProcess.name} (${relation.process.name})</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>Not used in any sub-processes.</p>';
        }
        html += '</div>';
        
        // Get vendors related to this system (through sub-processes)
        const vendorIds = new Set();
        relatedSubProcesses.forEach(relation => {
            (relation.subProcess.vendors || []).forEach(vendorId => {
                vendorIds.add(vendorId);
            });
        });
        
        const vendors = data.vendors.filter(v => vendorIds.has(v.id));
        html += '<div class="detail-section"><strong>Related Vendors:</strong>';
        if (vendors.length > 0) {
            html += '<ul>';
            vendors.forEach(vendor => {
                html += `<li>${vendor.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No vendors related to this system.</p>';
        }
        html += '</div>';
    }
    else if (itemType === 'vendor') {
        const vendor = data.vendors.find(v => v.id === itemId);
        if (!vendor) return;
        
        html += `<h3>Vendor: ${vendor.name}</h3>`;
        
        // Find sub-processes that use this vendor
        const relatedSubProcesses = [];
        data.processes.forEach(process => {
            if (process.subProcesses) {
                process.subProcesses.forEach(sub => {
                    if ((sub.vendors || []).includes(vendor.id)) {
                        relatedSubProcesses.push({
                            subProcess: sub,
                            process: process
                        });
                    }
                });
            }
        });
        
        html += '<div class="detail-section"><strong>Used in Sub-Processes:</strong>';
        if (relatedSubProcesses.length > 0) {
            html += '<ul>';
            relatedSubProcesses.forEach(relation => {
                html += `<li>${relation.subProcess.name} (${relation.process.name})</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>Not used in any sub-processes.</p>';
        }
        html += '</div>';
        
        // Get systems related to this vendor (through sub-processes)
        const systemIds = new Set();
        relatedSubProcesses.forEach(relation => {
            (relation.subProcess.systems || []).forEach(systemId => {
                systemIds.add(systemId);
            });
        });
        
        const systems = data.systems.filter(s => systemIds.has(s.id));
        html += '<div class="detail-section"><strong>Related Systems:</strong>';
        if (systems.length > 0) {
            html += '<ul>';
            systems.forEach(system => {
                html += `<li>${system.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No systems related to this vendor.</p>';
        }
        html += '</div>';
    } 
    else {
        // Hide detail box for other types
        detailBox.style.display = 'none';
        return;
    }
    
    // Add CSS to the detail box
    html += `
    <style>
        #detail-box h3 {
            margin-top: 0;
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .detail-section {
            margin-bottom: 16px;
        }
        .detail-section strong {
            color: #34495e;
        }
        .detail-section ul {
            margin-top: 6px;
            padding-left: 20px;
        }
        .detail-section li {
            margin-bottom: 4px;
        }
    </style>
    `;
    
    detailBox.innerHTML = html;
    detailBox.style.display = 'block';
}

// ========== VISUALIZATION ==========

function initializeVisualization() { resetVisualization(); }

function resetVisualization() {
    // Always show "All Process" (rank 0) as root
    selectedItemId = null;
    selectedItemType = null;
    currentViewState = { id: null, type: null, parentId: null, parentType: null };
    document.querySelectorAll('.item').forEach(item => item.classList.remove('active'));
    updateVisualization('all', 'all-process', true);
    const detailBox = document.getElementById('detail-box');
    if (detailBox) detailBox.style.display = 'none';
    const drillUpBtn = document.getElementById('drill-up-btn');
    if (drillUpBtn) drillUpBtn.style.display = 'none';
}

function updateVisualization(id, type, resetZoom = false) {
    const visualizationElement = document.getElementById('visualization');
    if (!visualizationElement) return;
    visualizationElement.innerHTML = '';
    const width = visualizationElement.clientWidth || 800;
    const height = visualizationElement.clientHeight || 600;
    svgObj = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid #eee');
    const g = svgObj.append('g');
    zoomObj = d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            currentTransform = event.transform;
        });
    svgObj.call(zoomObj);
    addZoomButtons();
    setupZoomButtons(svgObj, zoomObj);
    createHierarchyLayout(g, id, type, width, height);
    setupToggleVisibility();
    if (resetZoom) {
        currentTransform = d3.zoomIdentity;
        svgObj.transition().duration(500).call(zoomObj.transform, currentTransform);
    }
}

function createHierarchyLayout(g, focusId, focusType, width, height) {
    let nodes = [], links = [];
    // Always treat null, 'all', or 'all-process' as the "All Process" overview
    const isAllProcessView =
        focusId === null ||
        focusId === 'all' ||
        focusType === null ||
        focusType === 'all-process';

    if (isAllProcessView) {
        nodes.push({ id: 'all', name: 'All Process', type: 'all-process', level: 0 });
        data.processes.forEach(process => {
            nodes.push({ id: process.id, name: process.name, type: 'process', level: 1 });
            links.push({ source: 'all', target: process.id });
            (process.subProcesses || []).forEach(sub => {
                nodes.push({ id: sub.id, name: sub.name, type: 'sub-process', level: 2 });
                links.push({ source: process.id, target: sub.id });
                (sub.systems || []).forEach(systemId => {
                    if (!nodes.find(n => n.id === systemId)) {
                        const sys = data.systems.find(s => s.id === systemId);
                        if (sys) nodes.push({ id: sys.id, name: sys.name, type: 'system', level: 3 });
                    }
                    links.push({ source: sub.id, target: systemId });
                });
                (sub.vendors || []).forEach(vendorId => {
                    if (!nodes.find(n => n.id === vendorId)) {
                        const ven = data.vendors.find(v => v.id === vendorId);
                        if (ven) nodes.push({ id: ven.id, name: ven.name, type: 'vendor', level: 4 });
                    }
                    links.push({ source: sub.id, target: vendorId });
                });
            });
        });
    } else if (focusType === 'process') {
        // Focus on a specific process
        const process = data.processes.find(p => p.id === focusId);
        if (process) {
            nodes.push({ id: process.id, name: process.name, type: 'process', level: 1 });
            
            // Add all sub-processes for this process
            (process.subProcesses || []).forEach(sub => {
                nodes.push({ id: sub.id, name: sub.name, type: 'sub-process', level: 2 });
                links.push({ source: process.id, target: sub.id });
                
                // Add all systems for this sub-process
                (sub.systems || []).forEach(systemId => {
                    if (!nodes.find(n => n.id === systemId)) {
                        const sys = data.systems.find(s => s.id === systemId);
                        if (sys) nodes.push({ id: sys.id, name: sys.name, type: 'system', level: 3 });
                    }
                    links.push({ source: sub.id, target: systemId });
                });
                
                // Add all vendors for this sub-process
                (sub.vendors || []).forEach(vendorId => {
                    if (!nodes.find(n => n.id === vendorId)) {
                        const ven = data.vendors.find(v => v.id === vendorId);
                        if (ven) nodes.push({ id: ven.id, name: ven.name, type: 'vendor', level: 4 });
                    }
                    links.push({ source: sub.id, target: vendorId });
                });
            });
        }
    } else if (focusType === 'sub-process') {
        // Focus on a specific sub-process
        let subProcess = null;
        let parentProcess = null;
        
        // Find the sub-process and its parent
        for (const process of data.processes) {
            if (process.subProcesses) {
                const sub = process.subProcesses.find(s => s.id === focusId);
                if (sub) {
                    subProcess = sub;
                    parentProcess = process;
                    break;
                }
            }
        }
        
        if (subProcess && parentProcess) {
            // Add parent process
            nodes.push({ id: parentProcess.id, name: parentProcess.name, type: 'process', level: 1 });
            
            // Add this sub-process
            nodes.push({ id: subProcess.id, name: subProcess.name, type: 'sub-process', level: 2 });
            links.push({ source: parentProcess.id, target: subProcess.id });
            
            // Add all systems for this sub-process
            (subProcess.systems || []).forEach(systemId => {
                if (!nodes.find(n => n.id === systemId)) {
                    const sys = data.systems.find(s => s.id === systemId);
                    if (sys) nodes.push({ id: sys.id, name: sys.name, type: 'system', level: 3 });
                }
                links.push({ source: subProcess.id, target: systemId });
            });
            
            // Add all vendors for this sub-process
            (subProcess.vendors || []).forEach(vendorId => {
                if (!nodes.find(n => n.id === vendorId)) {
                    const ven = data.vendors.find(v => v.id === vendorId);
                    if (ven) nodes.push({ id: ven.id, name: ven.name, type: 'vendor', level: 4 });
                }
                links.push({ source: subProcess.id, target: vendorId });
            });
        }
    } else if (focusType === 'system') {
        // Focus on a specific system
        const system = data.systems.find(s => s.id === focusId);
        if (system) {
            nodes.push({ id: system.id, name: system.name, type: 'system', level: 3 });
            
            // Find all sub-processes that use this system
            const relatedSubProcesses = [];
            data.processes.forEach(process => {
                if (process.subProcesses) {
                    process.subProcesses.forEach(sub => {
                        if ((sub.systems || []).includes(system.id)) {
                            relatedSubProcesses.push({
                                subProcess: sub,
                                process: process
                            });
                        }
                    });
                }
            });
            
            // Add related processes and sub-processes
            relatedSubProcesses.forEach(relation => {
                // Add process if not already added
                if (!nodes.find(n => n.id === relation.process.id)) {
                    nodes.push({ id: relation.process.id, name: relation.process.name, type: 'process', level: 1 });
                }
                
                // Add sub-process
                nodes.push({ id: relation.subProcess.id, name: relation.subProcess.name, type: 'sub-process', level: 2 });
                
                // Add links
                links.push({ source: relation.process.id, target: relation.subProcess.id });
                links.push({ source: relation.subProcess.id, target: system.id });
                
                // Add vendors related to this sub-process
                (relation.subProcess.vendors || []).forEach(vendorId => {
                    if (!nodes.find(n => n.id === vendorId)) {
                        const ven = data.vendors.find(v => v.id === vendorId);
                        if (ven) nodes.push({ id: ven.id, name: ven.name, type: 'vendor', level: 4 });
                    }
                    links.push({ source: relation.subProcess.id, target: vendorId });
                });
            });
        }
    } else if (focusType === 'vendor') {
        // Focus on a specific vendor
        const vendor = data.vendors.find(v => v.id === focusId);
        if (vendor) {
            nodes.push({ id: vendor.id, name: vendor.name, type: 'vendor', level: 4 });
            
            // Find all sub-processes that use this vendor
            const relatedSubProcesses = [];
            data.processes.forEach(process => {
                if (process.subProcesses) {
                    process.subProcesses.forEach(sub => {
                        if ((sub.vendors || []).includes(vendor.id)) {
                            relatedSubProcesses.push({
                                subProcess: sub,
                                process: process
                            });
                        }
                    });
                }
            });
            
            // Add related processes, sub-processes, and systems
            relatedSubProcesses.forEach(relation => {
                // Add process if not already added
                if (!nodes.find(n => n.id === relation.process.id)) {
                    nodes.push({ id: relation.process.id, name: relation.process.name, type: 'process', level: 1 });
                }
                
                // Add sub-process
                nodes.push({ id: relation.subProcess.id, name: relation.subProcess.name, type: 'sub-process', level: 2 });
                
                // Add links
                links.push({ source: relation.process.id, target: relation.subProcess.id });
                links.push({ source: relation.subProcess.id, target: vendor.id });
                
                // Add systems related to this sub-process
                (relation.subProcess.systems || []).forEach(systemId => {
                    if (!nodes.find(n => n.id === systemId)) {
                        const sys = data.systems.find(s => s.id === systemId);
                        if (sys) nodes.push({ id: sys.id, name: sys.name, type: 'system', level: 3 });
                    }
                    links.push({ source: relation.subProcess.id, target: systemId });
                });
            });
        }
    }

    // Fixed positioning by type
    const processNodes = nodes.filter(n => n.type === 'process');
    const subProcessNodes = nodes.filter(n => n.type === 'sub-process');
    const systemNodes = nodes.filter(n => n.type === 'system');
    const vendorNodes = nodes.filter(n => n.type === 'vendor');
    const allProcessNode = nodes.find(n => n.type === 'all-process');
    if (allProcessNode) { allProcessNode.fx = width / 2; allProcessNode.fy = 50; }
    const processSpacing = 200, totalProcessWidth = (processNodes.length - 1) * processSpacing, processStartX = (width - totalProcessWidth) / 2;
    processNodes.forEach((node, i) => { node.fx = processStartX + i * processSpacing; node.fy = 150; });
    const subSpacing = 150, totalSubWidth = (subProcessNodes.length - 1) * subSpacing, subStartX = (width - totalSubWidth) / 2;
    subProcessNodes.forEach((node, i) => { node.fx = subStartX + i * subSpacing; node.fy = 250; });
    const systemSpacing = 130, totalSysWidth = (systemNodes.length - 1) * systemSpacing, sysStartX = (width - totalSysWidth) / 2;
    systemNodes.forEach((node, i) => { node.fx = sysStartX + i * systemSpacing; node.fy = 350; });
    const vendorSpacing = 110, totalVenWidth = (vendorNodes.length - 1) * vendorSpacing, venStartX = (width - totalVenWidth) / 2;
    vendorNodes.forEach((node, i) => { node.fx = venStartX + i * vendorSpacing; node.fy = 450; });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("collide", d3.forceCollide().radius(60))
        .force("center", d3.forceCenter(width / 2, height / 2)); // Center simulation

    const link = g.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1.5)
        .attr("fill", "none");
    const node = g.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", d => `node ${d.type}-node`)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", function(event, d) { event.stopPropagation(); handleNodeClick(event, d); });

    node.each(function(d) {
        const element = d3.select(this);
        if (d.type === 'all-process') {
            element.append("rect")
                .attr("width", 180)
                .attr("height", 70)
                .attr("x", -90)
                .attr("y", -35)
                .attr("rx", 10)
                .attr("ry", 10)
                .attr("fill", "#ff9800")
                .attr("stroke", "#e65100")
                .attr("stroke-width", 2);
        } else if (d.type === 'process') {
            element.append("rect")
                .attr("width", 160)
                .attr("height", 60)
                .attr("x", -80)
                .attr("y", -30)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("class", "process-node");
        } else if (d.type === 'sub-process') {
            element.append("rect")
                .attr("width", 140)
                .attr("height", 40)
                .attr("x", -70)
                .attr("y", -20)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("fill", "#85c1e9")
                .attr("stroke", "#2980b9")
                .attr("stroke-width", 1.5);
        } else if (d.type === 'system') {
            element.append("rect")
                .attr("width", 140)
                .attr("height", 40)
                .attr("x", -70)
                .attr("y", -20)
                .attr("rx", 20)
                .attr("ry", 20)
                .attr("class", "system-node");
        } else if (d.type === 'vendor') {
            element.append("circle")
                .attr("r", 15)
                .attr("class", "vendor-node");
        }
        element.append("text")
            .attr("dy", d.type === 'vendor' ? 30 : 5)
            .attr("text-anchor", "middle")
            .attr("class", "node-label")
            .attr("fill", d.type === 'all-process' ? "white" : "black")
            .attr("font-weight", d.type === 'all-process' ? "bold" : "normal")
            .text(d.name);
    });
    simulation.on("tick", () => {
        link.attr("d", d => {
            const dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy) * 2;
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = d.x; d.fy = d.y; }
}

// ========== ZOOM BUTTONS & TOGGLES ==========

function addZoomButtons() {
    // Buttons already in HTML (right menu bar)
}
function setupZoomButtons(svg, zoom) {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const resetBtn = document.getElementById('reset-btn');
    if (zoomInBtn) {
        zoomInBtn.onclick = () => {
            currentTransform = currentTransform.scale(1.2);
            svg.transition().duration(500).call(zoom.transform, currentTransform);
        };
    }
    if (zoomOutBtn) {
        zoomOutBtn.onclick = () => {
            currentTransform = currentTransform.scale(0.8);
            svg.transition().duration(500).call(zoom.transform, currentTransform);
        };
    }
    if (resetBtn) {
        resetBtn.onclick = () => {
            resetVisualization();
        };
    }
}
function setupToggleVisibility() {
    const toggleSystems = document.getElementById('toggle-systems');
    const toggleVendors = document.getElementById('toggle-vendors');
    if (toggleSystems) {
        toggleSystems.onchange = function() {
            document.querySelectorAll('.system-node').forEach(el => {
                el.style.display = this.checked ? '' : 'none';
            });
            document.querySelectorAll('.link').forEach(link => {
                if (link.__data__ && typeof link.__data__.target === 'object' && link.__data__.target.type === 'system') {
                    link.style.display = this.checked ? '' : 'none';
                }
            });
        };
    }
    if (toggleVendors) {
        toggleVendors.onchange = function() {
            document.querySelectorAll('.vendor-node').forEach(el => {
                el.style.display = this.checked ? '' : 'none';
            });
            document.querySelectorAll('.link').forEach(link => {
                if (link.__data__ && typeof link.__data__.target === 'object' && link.__data__.target.type === 'vendor') {
                    link.style.display = this.checked ? '' : 'none';
                }
            });
        };
    }
}

// ========== NODE CLICK HANDLING & POPUP ==========

function handleNodeClick(event, d) {
    event.stopPropagation();
    if (d.type === 'all-process' || d.id === 'all') {
        resetVisualization();
        return;
    }
    if (d.type !== 'all-process') {
        showPopupForNode(d, event);
    }
    updateVisualization(d.id, d.type);
    const drillUpBtn = document.getElementById('drill-up-btn
