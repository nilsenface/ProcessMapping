// ========== DATA STRUCTURE ==========

const initialData = {
    processes: [
        {
            id: 'p1',
            name: 'Customer Onboarding',
            subProcesses: [
                {
                    id: 'sp1',
                    name: 'Identity Verification',
                    systems: ['s1', 's3', 's5'],
                    vendors: ['v2']
                },
                {
                    id: 'sp2',
                    name: 'Account Setup',
                    systems: ['s1', 's5'],
                    vendors: []
                }
            ]
        },
        {
            id: 'p2',
            name: 'Order Processing',
            subProcesses: [
                {
                    id: 'sp3',
                    name: 'Order Validation',
                    systems: ['s2', 's5'],
                    vendors: ['v1']
                }
            ]
        },
        {
            id: 'p3',
            name: 'Inventory Management',
            subProcesses: []
        },
        {
            id: 'p4',
            name: 'Financial Reporting',
            subProcesses: []
        }
    ],
    systems: [
        { id: 's1', name: 'CRM System' },
        { id: 's2', name: 'ERP Platform' },
        { id: 's3', name: 'Customer Portal' },
        { id: 's4', name: 'Business Intelligence Tool' },
        { id: 's5', name: 'Enterprise Core System' }
    ],
    vendors: [
        { id: 'v1', name: 'Cloud Provider' },
        { id: 'v2', name: 'Payment Gateway' },
        { id: 'v3', name: 'Logistics Partner' }
    ]
};

let data = initialData;
let adminMode = false;
let currentItemType = null;
let currentItemId = null;
let selectedItemId = null;
let selectedItemType = null;
let currentViewState = { id: null, type: null, parentId: null, parentType: null };
let currentTransform = d3.zoomIdentity;

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromLocalStorage();
    renderLists();
    setupEventListeners();
    addDrillUpButton();
    addDetailBox();
    initializeVisualization();
    setupToggleVisibility();
});

// ========== DATA PERSISTENCE ==========

function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('businessProcessData');
    if (savedData) data = JSON.parse(savedData);
}
function saveDataToLocalStorage() {
    localStorage.setItem('businessProcessData', JSON.stringify(data));
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
        updateVisualization(null, null);
        selectedItemId = null;
        selectedItemType = null;
        document.querySelectorAll('.item').forEach(item => item.classList.remove('active'));
        currentViewState = { id: null, type: null, parentId: null, parentType: null };
        const detailBox = document.getElementById('detail-box');
        if (detailBox) detailBox.style.display = 'none';
        const drillUpBtn = document.getElementById('drill-up-btn');
        if (drillUpBtn) drillUpBtn.style.display = 'none';
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
    // (Omitted for brevity; use your existing showDetailBox logic)
}

// ========== VISUALIZATION ==========

function initializeVisualization() { updateVisualization(null, null); }

function updateVisualization(id, type) {
    const visualizationElement = document.getElementById('visualization');
    if (!visualizationElement) return;
    visualizationElement.innerHTML = '';
    const width = visualizationElement.clientWidth || 800;
    const height = visualizationElement.clientHeight || 600;
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid #eee');
    const g = svg.append('g');
    const zoom = d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            currentTransform = event.transform;
        });
    svg.call(zoom);
    addZoomButtons();
    setupZoomButtons(svg, zoom);
    createHierarchyLayout(g, id, type, width, height);
    setupToggleVisibility();
}

function createHierarchyLayout(g, focusId, focusType, width, height) {
    // --- Build nodes and links ---
    let nodes = [], links = [];
    if (focusId === null || focusType === null)
        nodes.push({ id: 'all', name: 'All Process', type: 'all-process', level: 0 });
    let processesToInclude = [];
    if (focusId === null || focusType === null) {
        processesToInclude = data.processes;
    } else if (focusId === 'all') {
        processesToInclude = data.processes;
    } else if (focusType === 'process') {
        processesToInclude = [data.processes.find(p => p.id === focusId)];
    } else if (focusType === 'sub-process') {
        processesToInclude = data.processes.filter(p =>
            p.subProcesses && p.subProcesses.some(sp => sp.id === focusId)
        );
    } else if (focusType === 'system' || focusType === 'vendor') {
        processesToInclude = data.processes.filter(p =>
            p.subProcesses && p.subProcesses.some(sp =>
                (focusType === 'system' && sp.systems.includes(focusId)) ||
                (focusType === 'vendor' && sp.vendors.includes(focusId))
            )
        );
    }
    processesToInclude.forEach(process => {
        nodes.push({ id: process.id, name: process.name, type: 'process', level: 1 });
        if ((focusId === null || focusType === null || focusId === 'all') && nodes.find(n => n.id === 'all')) {
            links.push({ source: 'all', target: process.id });
        }
        if (process.subProcesses) {
            process.subProcesses.forEach(sub => {
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
        }
    });

    // --- Fixed positioning by type ---
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

    // --- D3 simulation and rendering ---
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("collide", d3.forceCollide().radius(60));
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
            currentTransform = d3.zoomIdentity;
            svg.transition().duration(500).call(zoom.transform, currentTransform);
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
    if (d.type !== 'all-process') {
        showPopupForNode(d, event);
    }
    // (Selection logic omitted for brevity; see previous code)
    updateVisualization(d.id, d.type);
    const drillUpBtn = document.getElementById('drill-up-btn');
    if (drillUpBtn) {
        drillUpBtn.style.display = d.type !== 'all-process' ? 'block' : 'none';
    }
}
function showPopupForNode(d, event) {
    // Remove any existing popup
    d3.select('#node-popup').remove();
    const popup = d3.select('body')
        .append('div')
        .attr('id', 'node-popup')
        .style('position', 'absolute')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px')
        .style('background-color', 'white')
        .style('border', '1px solid #ccc')
        .style('border-radius', '5px')
        .style('padding', '10px')
        .style('box-shadow', '0 2px 10px rgba(0,0,0,0.2)')
        .style('z-index', '1000')
        .style('max-width', '300px');
    popup.append('div')
        .style('text-align', 'right')
        .style('margin-bottom', '5px')
        .append('span')
        .style('cursor', 'pointer')
        .style('font-weight', 'bold')
        .text('×')
        .on('click', () => { d3.select('#node-popup').remove(); });
    popup.append('h3')
        .style('margin', '0 0 10px 0')
        .style('color', '#2c3e50')
        .style('border-bottom', '1px solid #eee')
        .style('padding-bottom', '5px')
        .text(`${capitalize(d.type)}: ${d.name}`);
    // Add content based on node type (implement as needed)
}

// ========== MODAL, SAVE, DELETE, UTILITIES ==========

// ... (Add your add/edit/delete/modal code here, as in your previous app.js) ...

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
