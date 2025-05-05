// Initial data structure
let data = {
    processes: [
        { id: 'p1', name: 'Customer Onboarding', systems: ['s1', 's3'], vendors: ['v2'] },
        { id: 'p2', name: 'Order Processing', systems: ['s1', 's2'], vendors: ['v1'] },
        { id: 'p3', name: 'Inventory Management', systems: ['s2'], vendors: ['v3'] },
        { id: 'p4', name: 'Financial Reporting', systems: ['s2', 's4'], vendors: ['v1', 'v2'] }
    ],
    systems: [
        { id: 's1', name: 'CRM System' },
        { id: 's2', name: 'ERP Platform' },
        { id: 's3', name: 'Customer Portal' },
        { id: 's4', name: 'Business Intelligence Tool' }
    ],
    vendors: [
        { id: 'v1', name: 'Cloud Provider' },
        { id: 'v2', name: 'Payment Gateway' },
        { id: 'v3', name: 'Logistics Partner' }
    ]
};

// Global variables
let adminMode = false;
let currentItemType = null;
let currentItemId = null;
let selectedItemId = null;
let selectedItemType = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage if available
    loadDataFromLocalStorage();
    
    // Render the lists
    renderLists();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize visualization
    initializeVisualization();
});

// Load data from localStorage
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('businessProcessData');
    if (savedData) {
        data = JSON.parse(savedData);
    }
}

// Save data to localStorage
function saveDataToLocalStorage() {
    localStorage.setItem('businessProcessData', JSON.stringify(data));
}

// Render the process, system, and vendor lists
function renderLists() {
    renderList('process', data.processes);
    renderList('system', data.systems);
    renderList('vendor', data.vendors);
}

// Render a specific list (process, system, or vendor)
function renderList(type, items) {
    const listElement = document.getElementById(`${type}-list`);
    listElement.innerHTML = '';
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `item ${type}`;
        itemElement.dataset.id = item.id;
        itemElement.dataset.type = type;
        
        // Check if this item is selected
        if (selectedItemId === item.id && selectedItemType === type) {
            itemElement.classList.add('active');
        }
        
        // Create item content
        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.name;
        itemElement.appendChild(nameSpan);
        
        // Add edit button (visible in admin mode)
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
        
        // Add click event to select the item
        itemElement.addEventListener('click', function() {
            selectItem(item.id, type);
        });
        
        listElement.appendChild(itemElement);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Admin mode toggle
    document.getElementById('admin-toggle').addEventListener('click', toggleAdminMode);
    
    // Add buttons
    document.getElementById('add-process').addEventListener('click', () => openAddModal('process'));
    document.getElementById('add-system').addEventListener('click', () => openAddModal('system'));
    document.getElementById('add-vendor').addEventListener('click', () => openAddModal('vendor'));
    
    // Modal close button
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Modal background click to close
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Form submission
    document.getElementById('item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveItem();
    });
    
    // Delete button
    document.getElementById('delete-item').addEventListener('click', deleteItem);
}

// Toggle admin mode
function toggleAdminMode() {
    adminMode = !adminMode;
    const adminToggle = document.getElementById('admin-toggle');
    
    if (adminMode) {
        adminToggle.textContent = 'Exit Admin Mode';
        adminToggle.classList.add('active');
        document.getElementById('add-process').style.display = 'flex';
        document.getElementById('add-system').style.display = 'flex';
        document.getElementById('add-vendor').style.display = 'flex';
    } else {
        adminToggle.textContent = 'Admin Mode';
        adminToggle.classList.remove('active');
        document.getElementById('add-process').style.display = 'none';
        document.getElementById('add-system').style.display = 'none';
        document.getElementById('add-vendor').style.display = 'none';
    }
    
    // Re-render lists to show/hide edit buttons
    renderLists();
}

// Select an item (process, system, or vendor)
function selectItem(id, type) {
    selectedItemId = id;
    selectedItemType = type;
    
    // Update active class in lists
    document.querySelectorAll('.item').forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedElement = document.querySelector(`.item[data-id="${id}"][data-type="${type}"]`);
    if (selectedElement) {
        selectedElement.classList.add('active');
    }
    
    // Update visualization
    updateVisualization(id, type);
}

// Open modal for adding a new item
function openAddModal(type) {
    currentItemType = type;
    currentItemId = null;
    
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = `Add New ${capitalize(type)}`;
    
    document.getElementById('item-name').value = '';
    document.getElementById('delete-item').style.display = 'none';
    
    // Show/hide process-specific fields
    if (type === 'process') {
        document.getElementById('process-specific-fields').style.display = 'block';
        populateCheckboxes();
    } else {
        document.getElementById('process-specific-fields').style.display = 'none';
    }
    
    document.getElementById('modal').style.display = 'block';
}

// Open modal for editing an existing item
function openEditModal(type, id) {
    currentItemType = type;
    currentItemId = id;
    
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = `Edit ${capitalize(type)}`;
    
    let item;
    if (type === 'process') {
        item = data.processes.find(p => p.id === id);
        document.getElementById('item-name').value = item.name;
        document.getElementById('process-specific-fields').style.display = 'block';
        populateCheckboxes(item);
    } else if (type === 'system') {
        item = data.systems.find(s => s.id === id);
        document.getElementById('item-name').value = item.name;
        document.getElementById('process-specific-fields').style.display = 'none';
    } else if (type === 'vendor') {
        item = data.vendors.find(v => v.id === id);
        document.getElementById('item-name').value = item.name;
        document.getElementById('process-specific-fields').style.display = 'none';
    }
    
    document.getElementById('delete-item').style.display = 'block';
    document.getElementById('modal').style.display = 'block';
}

// Close the modal
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Populate checkboxes for systems and vendors
function populateCheckboxes(process = null) {
    const systemsCheckboxes = document.getElementById('systems-checkboxes');
    const vendorsCheckboxes = document.getElementById('vendors-checkboxes');
    
    systemsCheckboxes.innerHTML = '';
    vendorsCheckboxes.innerHTML = '';
    
    // Add system checkboxes
    data.systems.forEach(system => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `system-${system.id}`;
        checkbox.value = system.id;
        
        // Check if this system is related to the process
        if (process && process.systems.includes(system.id)) {
            checkbox.checked = true;
        }
        
        const label = document.createElement('label');
        label.htmlFor = `system-${system.id}`;
        label.textContent = system.name;
        
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        systemsCheckboxes.appendChild(checkboxItem);
    });
    
    // Add vendor checkboxes
    data.vendors.forEach(vendor => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `vendor-${vendor.id}`;
        checkbox.value = vendor.id;
        
        // Check if this vendor is related to the process
        if (process && process.vendors.includes(vendor.id)) {
            checkbox.checked = true;
        }
        
        const label = document.createElement('label');
        label.htmlFor = `vendor-${vendor.id}`;
        label.textContent = vendor.name;
        
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        vendorsCheckboxes.appendChild(checkboxItem);
    });
}

// Save the current item
function saveItem() {
    const name = document.getElementById('item-name').value.trim();
    
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    if (currentItemType === 'process') {
        // Get selected systems
        const selectedSystems = Array.from(document.querySelectorAll('#systems-checkboxes input:checked'))
            .map(checkbox => checkbox.value);
        
        // Get selected vendors
        const selectedVendors = Array.from(document.querySelectorAll('#vendors-checkboxes input:checked'))
            .map(checkbox => checkbox.value);
        
        if (currentItemId) {
            // Update existing process
            const processIndex = data.processes.findIndex(p => p.id === currentItemId);
            data.processes[processIndex] = {
                id: currentItemId,
                name: name,
                systems: selectedSystems,
                vendors: selectedVendors
            };
        } else {
            // Add new process
            const newId = generateId('process');
            data.processes.push({
                id: newId,
                name: name,
                systems: selectedSystems,
                vendors: selectedVendors
            });
        }
    } else if (currentItemType === 'system') {
        if (currentItemId) {
            // Update existing system
            const systemIndex = data.systems.findIndex(s => s.id === currentItemId);
            data.systems[systemIndex] = {
                id: currentItemId,
                name: name
            };
        } else {
            // Add new system
            const newId = generateId('system');
            data.systems.push({
                id: newId,
                name: name
            });
        }
    } else if (currentItemType === 'vendor') {
        if (currentItemId) {
            // Update existing vendor
            const vendorIndex = data.vendors.findIndex(v => v.id === currentItemId);
            data.vendors[vendorIndex] = {
                id: currentItemId,
                name: name
            };
        } else {
            // Add new vendor
            const newId = generateId('vendor');
            data.vendors.push({
                id: newId,
                name: name
            });
        }
    }
    
    // Save data and update UI
    saveDataToLocalStorage();
    renderLists();
    closeModal();
    
    // Update visualization if needed
    if (selectedItemId) {
        updateVisualization(selectedItemId, selectedItemType);
    }
}

// Delete the current item
function deleteItem() {
    if (!currentItemId) return;
    
    if (!confirm(`Are you sure you want to delete this ${currentItemType}?`)) {
        return;
    }
    
    if (currentItemType === 'process') {
        // Remove the process
        data.processes = data.processes.filter(p => p.id !== currentItemId);
    } else if (currentItemType === 'system') {
        // Remove the system
        data.systems = data.systems.filter(s => s.id !== currentItemId);
        
        // Remove references to this system from processes
        data.processes.forEach(process => {
            process.systems = process.systems.filter(id => id !== currentItemId);
        });
    } else if (currentItemType === 'vendor') {
        // Remove the vendor
        data.vendors = data.vendors.filter(v => v.id !== currentItemId);
        
        // Remove references to this vendor from processes
        data.processes.forEach(process => {
            process.vendors = process.vendors.filter(id => id !== currentItemId);
        });
    }
    
    // Save data and update UI
    saveDataToLocalStorage();
    renderLists();
    closeModal();
    
    // Reset selection if the deleted item was selected
    if (selectedItemId === currentItemId && selectedItemType === currentItemType) {
        selectedItemId = null;
        selectedItemType = null;
        initializeVisualization(); // Reset visualization
    } else if (selectedItemId) {
        // Update visualization if another item is selected
        updateVisualization(selectedItemId, selectedItemType);
    }
}

// Generate a unique ID
function generateId(type) {
    const prefix = type === 'process' ? 'p' : type === 'system' ? 's' : 'v';
    const items = type === 'process' ? data.processes : type === 'system' ? data.systems : data.vendors;
    
    // Find the highest existing ID number
    let maxNum = 0;
    items.forEach(item => {
        const idNum = parseInt(item.id.substring(1));
        if (idNum > maxNum) {
            maxNum = idNum;
        }
    });
    
    // Return a new ID with the next number
    return `${prefix}${maxNum + 1}`;
}

// Capitalize the first letter of a string
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// D3.js Visualization
let svg, simulation, link, node;

// Initialize the visualization
function initializeVisualization() {
    // Clear previous visualization
    d3.select('#visualization').html('');
    
    // Set up SVG
    const container = document.getElementById('visualization');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on('zoom', function(event) {
            svg.attr('transform', event.transform);
        }))
        .append('g');
    
    // Create initial visualization with all processes
    const graphData = createGraphData();
    
    // Create links
    link = svg.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter()
        .append('line')
        .attr('class', 'link');
    
    // Create nodes
    node = svg.append('g')
        .selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', d => `node ${d.type}-node`)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add circles to nodes
    node.append('circle')
        .attr('r', d => d.type === 'process' ? 20 : 15)
        .attr('fill', d => {
            if (d.type === 'process') return '#3498db';
            if (d.type === 'system') return '#2ecc71';
            return '#f39c12';
        });
    
    // Add labels to nodes
    node.append('text')
        .attr('dy', 30)
        .attr('text-anchor', 'middle')
        .text(d => d.name)
        .style('fill', '#333')
        .style('font-size', '12px');
    
    // Set up force simulation
    simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);
    
    // Tick function to update positions
    function ticked() {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Update the visualization based on selected item
function updateVisualization(id, type) {
    // Clear previous visualization
    d3.select('#visualization').html('');
    
    // Re-initialize with filtered data
    const container = document.getElementById('visualization');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on('zoom', function(event) {
            svg.attr('transform', event.transform);
        }))
        .append('g');
    
    // Create graph data based on selection
    const graphData = createGraphData(id, type);
    
    // Create links
    link = svg.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter()
        .append('line')
        .attr('class', 'link');
    
    // Create nodes
    node = svg.append('g')
        .selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', d => `node ${d.type}-node`)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    // Add circles to nodes
    node.append('circle')
        .attr('r', d => d.type === 'process' ? 20 : 15)
        .attr('fill', d => {
            if (d.type === 'process') return '#3498db';
            if (d.type === 'system') return '#2ecc71';
            return '#f39c12';
        });
    
    // Add labels to nodes
    node.append('text')
        .attr('dy', 30)
        .attr('text-anchor', 'middle')
        .text(d => d.name)
        .style('fill', '#333')
        .style('font-size', '12px');
    
    // Set up force simulation
    simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', ticked);
    
    // Tick function to update positions
    function ticked() {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// Create graph data for visualization
function createGraphData(id = null, type = null) {
    let nodes = [];
    let links = [];
    
    if (id && type) {
        // Visualization for a specific item
        if (type === 'process') {
            // Get the selected process
            const process = data.processes.find(p => p.id === id);
            if (!process) return { nodes, links };
            
            // Add the process node
            nodes.push({
                id: process.id,
                name: process.name,
                type: 'process'
            });
            
            // Add connected systems
            process.systems.forEach(systemId => {
                const system = data.systems.find(s => s.id === systemId);
                if (system) {
                    nodes.push({
                        id: system.id,
                        name: system.name,
                        type: 'system'
                    });
                    
                    links.push({
                        source: process.id,
                        target: system.id
                    });
                }
            });
            
            // Add connected vendors
            process.vendors.forEach(vendorId => {
                const vendor = data.vendors.find(v => v.id === vendorId);
                if (vendor) {
                    nodes.push({
                        id: vendor.id,
                        name: vendor.name,
                        type: 'vendor'
                    });
                    
                    links.push({
                        source: process.id,
                        target: vendor.id
                    });
                }
            });
        } else if (type === 'system') {
            // Get the selected system
            const system = data.systems.find(s => s.id === id);
            if (!system) return { nodes, links };
            
            // Add the system node
            nodes.push({
                id: system.id,
                name: system.name,
                type: 'system'
            });
            
            // Add connected processes
            data.processes.forEach(process => {
                if (process.systems.includes(system.id)) {
                    nodes.push({
                        id: process.id,
                        name: process.name,
                        type: 'process'
                    });
                    
                    links.push({
                        source: system.id,
                        target: process.id
                    });
                    
                    // Add vendors connected to these processes
                    process.vendors.forEach(vendorId => {
                        const vendor = data.vendors.find(v => v.id === vendorId);
                        if (vendor && !nodes.some(n => n.id === vendor.id)) {
                            nodes.push({
                                id: vendor.id,
                                name: vendor.name,
                                type: 'vendor'
                            });
                            
                            links.push({
                                source: process.id,
                                target: vendor.id
                            });
                        }
                    });
                }
            });
        } else if (type === 'vendor') {
            // Get the selected vendor
            const vendor = data.vendors.find(v => v.id === id);
            if (!vendor) return { nodes, links };
            
            // Add the vendor node
            nodes.push({
                id: vendor.id,
                name: vendor.name,
                type: 'vendor'
            });
            
            // Add connected processes
            data.processes.forEach(process => {
                if (process.vendors.includes(vendor.id)) {
                    nodes.push({
                        id: process.id,
                        name: process.name,
                        type: 'process'
                    });
                    
                    links.push({
                        source: vendor.id,
                        target: process.id
                    });
                    
                    // Add systems connected to these processes
                    process.systems.forEach(systemId => {
                        const system = data.systems.find(s => s.id === systemId);
                        if (system && !nodes.some(n => n.id === system.id)) {
                            nodes.push({
                                id: system.id,
                                name: system.name,
                                type: 'system'
                            });
                            
                            links.push({
                                source: process.id,
                                target: system.id
                            });
                        }
                    });
                }
            });
        }
    } else {
        // Default visualization with all processes
        // Add all processes
        data.processes.forEach(process => {
            nodes.push({
                id: process.id,
                name: process.name,
                type: 'process'
            });
        });
        
        // Add all systems
        data.systems.forEach(system => {
            nodes.push({
                id: system.id,
                name: system.name,
                type: 'system'
            });
        });
        
        // Add all vendors
        data.vendors.forEach(vendor => {
            nodes.push({
                id: vendor.id,
                name: vendor.name,
                type: 'vendor'
            });
        });
        
        // Create links between processes and systems/vendors
        data.processes.forEach(process => {
            // Links to systems
            process.systems.forEach(systemId => {
                links.push({
                    source: process.id,
                    target: systemId
                });
            });
            
            // Links to vendors
            process.vendors.forEach(vendorId => {
                links.push({
                    source: process.id,
                    target: vendorId
                });
            });
        });
    }
    
    return { nodes, links };
}
// Add a detail box element dynamically to the visualization container
const detailBox = document.createElement('div');
detailBox.id = 'detail-box';
detailBox.style.position = 'absolute';
detailBox.style.top = '20px';
detailBox.style.right = '20px';
detailBox.style.backgroundColor = 'white';
detailBox.style.border = '1px solid #ccc';
detailBox.style.borderRadius = '8px';
detailBox.style.padding = '15px';
detailBox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
detailBox.style.maxWidth = '300px';
detailBox.style.zIndex = '1000';
detailBox.style.display = 'none';
detailBox.style.overflowY = 'auto';
detailBox.style.maxHeight = '400px';
detailBox.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
detailBox.style.fontSize = '14px';
detailBox.style.color = '#333';

// Append detail box to visualization container
const visualizationContainer = document.getElementById('visualization');
visualizationContainer.style.position = 'relative';
visualizationContainer.appendChild(detailBox);

// Function to show detail box for a process or system
function showDetailBox(itemId, itemType) {
    let html = '';
    if (itemType === 'process') {
        const process = data.processes.find(p => p.id === itemId);
        if (!process) return;
        html += `<h3>Process: ${process.name}</h3>`;
        html += '<strong>Systems:</strong><ul>';
        process.systems.forEach(sysId => {
            const sys = data.systems.find(s => s.id === sysId);
            if (sys) html += `<li>${sys.name}</li>`;
        });
        html += '</ul>';
        html += '<strong>Vendors:</strong><ul>';
        process.vendors.forEach(vId => {
            const vendor = data.vendors.find(v => v.id === vId);
            if (vendor) html += `<li>${vendor.name}</li>`;
        });
        html += '</ul>';
    } else if (itemType === 'system') {
        const system = data.systems.find(s => s.id === itemId);
        if (!system) return;
        html += `<h3>System: ${system.name}</h3>`;
        // Find processes linked to this system
        const linkedProcesses = data.processes.filter(p => p.systems.includes(itemId));
        html += '<strong>Processes:</strong><ul>';
        linkedProcesses.forEach(proc => {
            html += `<li>${proc.name}</li>`;
        });
        html += '</ul>';
        // Find vendors linked to these processes
        let linkedVendorsSet = new Set();
        linkedProcesses.forEach(proc => {
            proc.vendors.forEach(vId => linkedVendorsSet.add(vId));
        });
        html += '<strong>Vendors:</strong><ul>';
        linkedVendorsSet.forEach(vId => {
            const vendor = data.vendors.find(v => v.id === vId);
            if (vendor) html += `<li>${vendor.name}</li>`;
        });
        html += '</ul>';
    } else {
        // Hide detail box for other types
        detailBox.style.display = 'none';
        return;
    }
    detailBox.innerHTML = html;
    detailBox.style.display = 'block';
}

// Modify selectItem function to show detail box when clicking process or system
const originalSelectItem = selectItem;
selectItem = function(id, type) {
    originalSelectItem(id, type);
    if (type === 'process' || type === 'system') {
        showDetailBox(id, type);
    } else {
        detailBox.style.display = 'none';
    }
};

// Hide detail box when clicking outside items
window.addEventListener('click', function(event) {
    if (!event.target.closest('.item') && !event.target.closest('#detail-box')) {
        detailBox.style.display = 'none';
    }
});
