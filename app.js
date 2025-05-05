// Initial data structure with a system that supports all processes
const initialData = {
    processes: [
        { id: 'p1', name: 'Customer Onboarding', systems: ['s1', 's3', 's5'], vendors: ['v2'] },
        { id: 'p2', name: 'Order Processing', systems: ['s1', 's2', 's5'], vendors: ['v1'] },
        { id: 'p3', name: 'Inventory Management', systems: ['s2', 's5'], vendors: ['v3'] },
        { id: 'p4', name: 'Financial Reporting', systems: ['s2', 's4', 's5'], vendors: ['v1', 'v2'] }
    ],
    systems: [
        { id: 's1', name: 'CRM System' },
        { id: 's2', name: 'ERP Platform' },
        { id: 's3', name: 'Customer Portal' },
        { id: 's4', name: 'Business Intelligence Tool' },
        { id: 's5', name: 'Enterprise Core System' } // This system supports all processes
    ],
    vendors: [
        { id: 'v1', name: 'Cloud Provider' },
        { id: 'v2', name: 'Payment Gateway' },
        { id: 'v3', name: 'Logistics Partner' }
    ]
};

// Global variables
let data = initialData;
let adminMode = false;
let currentItemType = null;
let currentItemId = null;
let selectedItemId = null;
let selectedItemType = null;

// Track current view state for drill up/down
let currentViewState = {
    id: null,
    type: null,
    parentId: null,
    parentType: null
};

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // Load data from localStorage if available
    loadDataFromLocalStorage();
    
    // Render the lists
    renderLists();
    
    // Set up event listeners
    setupEventListeners();
    
    // Add drill-up button
    addDrillUpButton();
    
    // Add detail box
    addDetailBox();
    
    // Initialize visualization
    initializeVisualization();
});

// Load data from localStorage
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('businessProcessData');
    if (savedData) {
        data = JSON.parse(savedData);
        console.log("Loaded data from localStorage");
    } else {
        console.log("Using initial data");
    }
}

// Save data to localStorage
function saveDataToLocalStorage() {
    localStorage.setItem('businessProcessData', JSON.stringify(data));
    console.log("Saved data to localStorage");
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
    if (!listElement) {
        console.error(`List element for ${type} not found`);
        return;
    }
    
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
    const adminToggle = document.getElementById('admin-toggle');
    if (adminToggle) {
        adminToggle.addEventListener('click', toggleAdminMode);
    }
    
    // Add buttons
    const addProcess = document.getElementById('add-process');
    const addSystem = document.getElementById('add-system');
    const addVendor = document.getElementById('add-vendor');
    
    if (addProcess) addProcess.addEventListener('click', () => openAddModal('process'));
    if (addSystem) addSystem.addEventListener('click', () => openAddModal('system'));
    if (addVendor) addVendor.addEventListener('click', () => openAddModal('vendor'));
    
    // Modal close button
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Modal background click to close
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Form submission
    const itemForm = document.getElementById('item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveItem();
        });
    }
    
    // Delete button
    const deleteBtn = document.getElementById('delete-item');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteItem);
    }
    
    // Hide detail box when clicking outside items
    window.addEventListener('click', function(event) {
        const detailBox = document.getElementById('detail-box');
        if (!detailBox) return;
        
        if (!event.target.closest('.item') && 
            !event.target.closest('#detail-box') && 
            !event.target.closest('.node') && 
            !event.target.closest('#drill-up-btn')) {
            detailBox.style.display = 'none';
        }
    });
}

// Toggle admin mode
function toggleAdminMode() {
    adminMode = !adminMode;
    const adminToggle = document.getElementById('admin-toggle');
    
    if (adminMode) {
        adminToggle.textContent = 'Exit Admin Mode';
        adminToggle.classList.add('active');
        
        const addProcess = document.getElementById('add-process');
        const addSystem = document.getElementById('add-system');
        const addVendor = document.getElementById('add-vendor');
        
        if (addProcess) addProcess.style.display = 'flex';
        if (addSystem) addSystem.style.display = 'flex';
        if (addVendor) addVendor.style.display = 'flex';
    } else {
        adminToggle.textContent = 'Admin Mode';
        adminToggle.classList.remove('active');
        
        const addProcess = document.getElementById('add-process');
        const addSystem = document.getElementById('add-system');
        const addVendor = document.getElementById('add-vendor');
        
        if (addProcess) addProcess.style.display = 'none';
        if (addSystem) addSystem.style.display = 'none';
        if (addVendor) addVendor.style.display = 'none';
    }
    
    // Re-render lists to show/hide edit buttons
    renderLists();
}

// Select an item (process, system, or vendor)
function selectItem(id, type) {
    selectedItemId = id;
    selectedItemType = type;
    
    // Store previous state for drill-up
    const previousState = {...currentViewState};
    
    // Update current view state
    currentViewState = {
        id: id,
        type: type,
        parentId: previousState.id,
        parentType: previousState.type
    };
    
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
    
    // Show detail box
    showDetailBox(id, type);
    
    // Show drill-up button if we're not at the top level
    const drillUpBtn = document.getElementById('drill-up-btn');
    if (drillUpBtn && currentViewState.id !== null) {
        drillUpBtn.style.display = 'block';
    }
}

// Add drill-up button to the header
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

// Drill up function
function drillUp() {
    if (currentViewState.parentId) {
        // Go to parent view
        updateVisualization(currentViewState.parentId, currentViewState.parentType);
        showDetailBox(currentViewState.parentId, currentViewState.parentType);
        
        // Update selection in the sidebar
        selectedItemId = currentViewState.parentId;
        selectedItemType = currentViewState.parentType;
        
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedElement = document.querySelector(`.item[data-id="${selectedItemId}"][data-type="${selectedItemType}"]`);
        if (selectedElement) {
            selectedElement.classList.add('active');
        }
        
        // Update current view state
        currentViewState = {
            id: currentViewState.parentId,
            type: currentViewState.parentType,
            parentId: null, // We'd need to track more history for multi-level drill-up
            parentType: null
        };
    } else {
        // Go to top level view - explicitly set to null to show all processes
        updateVisualization(null, null);
        
        // Clear selection
        selectedItemId = null;
        selectedItemType = null;
        
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Update current view state
        currentViewState = {
            id: null,
            type: null,
            parentId: null,
            parentType: null
        };
        
        // Hide detail box
        const detailBox = document.getElementById('detail-box');
        if (detailBox) {
            detailBox.style.display = 'none';
        }
        
        // Hide drill-up button at top level
        const drillUpBtn = document.getElementById('drill-up-btn');
        if (drillUpBtn) {
            drillUpBtn.style.display = 'none';
        }
    }
}

// Add detail box to the visualization container
function addDetailBox() {
    const visualizationContainer = document.querySelector('.visualization-container');
    if (!visualizationContainer) return;
    
    const detailBox = document.createElement('div');
    detailBox.id = 'detail-box';
    detailBox.style.display = 'none';
    
    visualizationContainer.appendChild(detailBox);
}

// Show detail box for a process, system, or vendor
function showDetailBox(itemId, itemType) {
    const detailBox = document.getElementById('detail-box');
    if (!detailBox) return;
    
    let html = '';
    
    if (itemType === 'process') {
        const process = data.processes.find(p => p.id === itemId);
        if (!process) return;
        
        html += `<h3>Process: ${process.name}</h3>`;
        
        // Get systems for this process
        const systems = data.systems.filter(s => process.systems.includes(s.id));
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
        
        // Get vendors for this process
        const vendors = data.vendors.filter(v => process.vendors.includes(v.id));
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
    else if (itemType === 'system') {
        const system = data.systems.find(s => s.id === itemId);
        if (!system) return;
        
        html += `<h3>System: ${system.name}</h3>`;
        
        // Get processes for this system
        const processes = data.processes.filter(p => p.systems.includes(system.id));
        html += '<div class="detail-section"><strong>Processes:</strong>';
        if (processes.length > 0) {
            html += '<ul>';
            processes.forEach(process => {
                html += `<li>${process.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No processes linked to this system.</p>';
        }
        html += '</div>';
        
        // Get vendors related to this system (through processes)
        const relatedVendorIds = new Set();
        processes.forEach(process => {
            process.vendors.forEach(vendorId => {
                relatedVendorIds.add(vendorId);
            });
        });
        
        const vendors = data.vendors.filter(v => relatedVendorIds.has(v.id));
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
        
        // Get processes for this vendor
        const processes = data.processes.filter(p => p.vendors.includes(vendor.id));
        html += '<div class="detail-section"><strong>Processes:</strong>';
        if (processes.length > 0) {
            html += '<ul>';
            processes.forEach(process => {
                html += `<li>${process.name}</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No processes linked to this vendor.</p>';
        }
        html += '</div>';
        
        // Get systems related to this vendor (through processes)
        const relatedSystemIds = new Set();
        processes.forEach(process => {
            process.systems.forEach(systemId => {
                relatedSystemIds.add(systemId);
            });
        });
        
        const systems = data.systems.filter(s => relatedSystemIds.has(s.id));
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

// Initialize visualization
function initializeVisualization() {
    updateVisualization(null, null);
}

// Update visualization based on selected item
function updateVisualization(id, type) {
    console.log("Updating visualization", id, type);
    
    // Clear previous visualization
    const visualizationElement = document.getElementById('visualization');
    if (!visualizationElement) {
        console.error("Visualization container not found");
        return;
    }
    
    visualizationElement.innerHTML = '';
    
    // Get container dimensions
    const width = visualizationElement.clientWidth || 800;
    const height = visualizationElement.clientHeight || 600;
    
    console.log("Container dimensions:", width, height);
    
    // Create SVG
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('border', '1px solid #eee'); // Add border to see SVG boundaries
    
    // Create a group for zoom/pan
    const g = svg.append('g');
    
    // Add zoom behavior
    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        })
    );
    
    // Create hierarchical layout
    createForceDirectedLayout(g, id, type, width, height);
}

// Create force-directed layout with improved fixed positioning
function createForceDirectedLayout(g, focusId, focusType, width, height) {
    console.log("Creating hierarchical layout", focusId, focusType);
    
    // Prepare data based on focus
    let nodes = [];
    let links = [];
    
    // Add "All Process" node at rank 0 if showing all processes
    if (focusId === null || focusType === null) {
        nodes.push({
            id: 'all',
            name: 'All Process',
            type: 'all-process',
            level: 0
        });
    }
    
    // Determine which processes to include
    let processesToInclude = [];
    if (focusId === null || focusType === null) {
        // Show all processes for the initial view
        processesToInclude = data.processes;
        console.log("Showing all processes", processesToInclude.length);
    } else if (focusId === 'all') {
        // Show all processes when "All Process" is selected
        processesToInclude = data.processes;
    } else if (focusType === 'process') {
        processesToInclude = [data.processes.find(p => p.id === focusId)];
    } else if (focusType === 'system') {
        processesToInclude = data.processes.filter(p => p.systems.includes(focusId));
    } else if (focusType === 'vendor') {
        processesToInclude = data.processes.filter(p => p.vendors.includes(focusId));
    }
    
    console.log("Processes to include:", processesToInclude.length);
    
    // Add processes to nodes
    processesToInclude.forEach(process => {
        if (!process) return; // Skip if process is undefined
        
        nodes.push({
            id: process.id,
            name: process.name,
            type: 'process',
            level: 1
        });
        
        // Add link from "All Process" to this process if showing all processes
        if ((focusId === null || focusType === null || focusId === 'all') && nodes.find(n => n.id === 'all')) {
            links.push({
                source: 'all',
                target: process.id
            });
        }
        
        // Add systems for this process
        const systemsForProcess = process.systems.map(sId => data.systems.find(s => s.id === sId)).filter(s => s);
        
        systemsForProcess.forEach(system => {
            // Check if system already exists in nodes
            let existingSystem = nodes.find(node => node.id === system.id);
            
            if (!existingSystem) {
                existingSystem = {
                    id: system.id,
                    name: system.name,
                    type: 'system',
                    level: 2
                };
                
                nodes.push(existingSystem);
            }
            
            // Add link from process to system
            links.push({
                source: process.id,
                target: system.id
            });
            
            // Add vendors for this process
            const vendorsForProcess = process.vendors.map(vId => data.vendors.find(v => v.id === vId)).filter(v => v);
            
            vendorsForProcess.forEach(vendor => {
                // Check if vendor already exists in nodes
                let existingVendor = nodes.find(node => node.id === vendor.id);
                
                if (!existingVendor) {
                    existingVendor = {
                        id: vendor.id,
                        name: vendor.name,
                        type: 'vendor',
                        level: 3
                    };
                    
                    nodes.push(existingVendor);
                }
                
                // Add link from system to vendor
                links.push({
                    source: system.id,
                    target: vendor.id
                });
            });
        });
    });
    
    console.log("Nodes:", nodes.length, "Links:", links.length);
    
    if (nodes.length === 0) {
        console.log("No nodes to display");
        return;
    }
    
    // Separate nodes by type for fixed positioning
    const processNodes = nodes.filter(node => node.type === 'process');
    const systemNodes = nodes.filter(node => node.type === 'system');
    const vendorNodes = nodes.filter(node => node.type === 'vendor');
    const allProcessNode = nodes.find(node => node.type === 'all-process');
    
    // Fix "All Process" node at the top center
    if (allProcessNode) {
        allProcessNode.fx = width / 2;
        allProcessNode.fy = 50;
    }
    
    // Position processes evenly in a row (rank 1)
    processNodes.forEach((node, index) => {
        node.fx = width * (index + 1) / (processNodes.length + 1);
        node.fy = 150; // Fixed Y for processes
    });
    
    // Position systems evenly in a row (rank 2)
    systemNodes.forEach((node, index) => {
        node.fx = width * (index + 1) / (systemNodes.length + 1);
        node.fy = 300; // Fixed Y for systems
    });
    
    // Position vendors evenly in a row (rank 3)
    vendorNodes.forEach((node, index) => {
        node.fx = width * (index + 1) / (vendorNodes.length + 1);
        node.fy = 450; // Fixed Y for vendors
    });
    
    // Create a simulation with very weak forces (mostly for fine adjustments)
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-30)) // Weaker repulsion
        .force("collide", d3.forceCollide().radius(60)); // Prevent overlap
    
    // Create links
    const link = g.selectAll(".link")
        .data(links)
        .enter()
        .append("path") // Use paths instead of lines for curved links
        .attr("class", "link")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1.5)
        .attr("fill", "none");
    
    // Create nodes
    const node = g.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", d => `node ${d.type}-node`)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("click", function(event, d) {
            event.stopPropagation();
            handleNodeClick(event, d);
        });
    
    // Create node shapes
    node.each(function(d) {
        const element = d3.select(this);
        
        if (d.type === 'all-process') {
            // Create special shape for "All Process"
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
            // Create rectangle for processes
            element.append("rect")
                .attr("width", 160)
                .attr("height", 60)
                .attr("x", -80)
                .attr("y", -30)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("class", "process-node");
        } else if (d.type === 'system') {
            // Create rounded rectangle for systems
            element.append("rect")
                .attr("width", 140)
                .attr("height", 40)
                .attr("x", -70)
                .attr("y", -20)
                .attr("rx", 20)
                .attr("ry", 20)
                .attr("class", "system-node");
        } else if (d.type === 'vendor') {
            // Create circle for vendors
            element.append("circle")
                .attr("r", 15)
                .attr("class", "vendor-node");
        }
        
        // Add text labels
        element.append("text")
            .attr("dy", d.type === 'vendor' ? 30 : 5)
            .attr("text-anchor", "middle")
            .attr("class", "node-label")
            .attr("fill", d.type === 'all-process' ? "white" : "black")
            .attr("font-weight", d.type === 'all-process' ? "bold" : "normal")
            .text(d.name);
    });
    
    // Update positions on tick - use curved links
    simulation.on("tick", () => {
        link.attr("d", d => {
            // Create curved paths
            const dx = d.target.x - d.source.x,
                  dy = d.target.y - d.source.y,
                  dr = Math.sqrt(dx * dx + dy * dy) * 2; // Curve radius
            
            return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
        
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
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
        // Keep fixed positions for all nodes after dragging
        d.fx = d.x;
        d.fy = d.y;
    }
}

// Add popup for node when clicked
function showPopupForNode(d, event) {
    // Remove any existing popup
    d3.select('#node-popup').remove();
    
    // Create popup container
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
    
    // Add close button
    popup.append('div')
        .style('text-align', 'right')
        .style('margin-bottom', '5px')
        .append('span')
        .style('cursor', 'pointer')
        .style('font-weight', 'bold')
        .text('×')
        .on('click', () => {
            d3.select('#node-popup').remove();
        });
    
    // Add title
    popup.append('h3')
        .style('margin', '0 0 10px 0')
        .style('color', '#2c3e50')
        .style('border-bottom', '1px solid #eee')
        .style('padding-bottom', '5px')
        .text(`${capitalize(d.type)}: ${d.name}`);
    
    // Add content based on node type
    if (d.type === 'process') {
        const process = data.processes.find(p => p.id === d.id);
        if (!process) return;
        
        // Get systems for this process
        const systems = data.systems.filter(s => process.systems.includes(s.id));
        popup.append('div')
            .attr('class', 'popup-section')
            .html(`<strong>Systems:</strong> ${systems.length > 0 ? 
                systems.map(s => s.name).join(', ') : 
                'No systems linked'}`);
        
        // Get vendors for this process
        const vendors = data.vendors.filter(v => process.vendors.includes(v.id));
        popup.append('div')
            .attr('class', 'popup-section')
            .html(`<strong>Vendors:</strong> ${vendors.length > 0 ? 
                vendors.map(v => v.name).join(', ') : 
                'No vendors linked'}`);
    } 
    else if (d.type === 'system') {
        const system = data.systems.find(s => s.id === d.id);
        if (!system) return;
        
        // Get processes for this system
        const processes = data.processes.filter(p => p.systems.includes(system.id));
        popup.append('div')
            .attr('class', 'popup-section')
            .html(`<strong>Processes:</strong> ${processes.length > 0 ? 
                processes.map(p => p.name).join(', ') : 
                'No processes linked'}`);
        
        // Get vendors related to this system (through processes)
        const relatedVendorIds = new Set();
        processes.forEach(process => {
            process.vendors.forEach(vendorId => {
                relatedVendorIds.add(vendorId);
            });
        });
        
        const vendors = data.vendors.filter(v => relatedVendorIds.has(v.id));
        popup.append('div')
            .attr('class', 'popup-section')
            .html(`<strong>Related Vendors:</strong> ${vendors.length > 0 ? 
                vendors.map(v => v.name).join(', ') : 
                'No vendors related'}`);
    }
    else if (d.type === 'vendor') {
        const vendor = data.vendors.find(v => v.id === d.id);
        if (!vendor) return;
        
        // Get processes for this vendor
        const processes = data.processes.filter(p => p.vendors.includes(vendor.id));
        popup.append('div')
            .attr('class', 'popup-section')
            .html(`<strong>Processes:</strong> ${processes.length > 0 ? 
                processes.map(p => p.name).join(', ') : 
                'No processes linked'}`);
        
        // Get systems related to this vendor (through processes)
        const relatedSystemIds = new Set();
        processes.forEach(process => {
            process.systems.forEach(systemId => {
                relatedSystemIds.add(systemId);
            });
        });
        
        const systems = data.systems.filter(s => relatedSystemIds.has(s.id));
        popup.append('div')
            .attr('class', 'popup-section')
            .html(`<strong>Related Systems:</strong> ${systems.length > 0 ? 
                systems.map(s => s.name).join(', ') : 
                'No systems related'}`);
    }
    
    // Add click outside to close
    d3.select('body').on('click.popup', function(event) {
        if (event.target.id !== 'node-popup' && 
            !d3.select(event.target).classed('node') &&
            !document.getElementById('node-popup').contains(event.target)) {
            d3.select('#node-popup').remove();
            d3.select('body').on('click.popup', null); // Remove this event listener
        }
    });
}

// Handle node click for drill down
function handleNodeClick(event, d) {
    event.stopPropagation();
    console.log("Node clicked", d);
    
    // Show popup for this node (except for All Process)
    if (d.type !== 'all-process') {
        showPopupForNode(d, event);
    }
    
    // Store previous state for drill-up
    const previousState = {...currentViewState};
    
    // Update current view state
    currentViewState = {
        id: d.id,
        type: d.type,
        parentId: previousState.id,
        parentType: previousState.type
    };
    
    // Update selection in the sidebar (except for All Process)
    if (d.type !== 'all-process') {
        selectedItemId = d.id;
        selectedItemType = d.type;
        
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedElement = document.querySelector(`.item[data-id="${selectedItemId}"][data-type="${selectedItemType}"]`);
        if (selectedElement) {
            selectedElement.classList.add('active');
        }
        
        // Show detail box
        showDetailBox(d.id, d.type);
    } else {
        // For All Process, just clear the selection
        selectedItemId = null;
        selectedItemType = null;
        
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Hide detail box
        const detailBox = document.getElementById('detail-box');
        if (detailBox) {
            detailBox.style.display = 'none';
        }
    }
    
    // Update visualization with new focus
    updateVisualization(d.id, d.type);
    
    // Show drill-up button if we're not at the top level
    const drillUpBtn = document.getElementById('drill-up-btn');
    if (drillUpBtn) {
        drillUpBtn.style.display = d.type !== 'all-process' ? 'block' : 'none';
    }
}

// Open modal for adding a new item
function openAddModal(type) {
    currentItemType = type;
    currentItemId = null;
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Add New ${capitalize(type)}`;
    }
    
    const nameInput = document.getElementById('item-name');
    if (nameInput) {
        nameInput.value = '';
    }
    
    const deleteBtn = document.getElementById('delete-item');
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    
    // Show/hide process-specific fields
    const processFields = document.getElementById('process-specific-fields');
    if (processFields) {
        if (type === 'process') {
            processFields.style.display = 'block';
            populateCheckboxes();
        } else {
            processFields.style.display = 'none';
        }
    }
    
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Open modal for editing an existing item
function openEditModal(type, id) {
    currentItemType = type;
    currentItemId = id;
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Edit ${capitalize(type)}`;
    }
    
    let item;
    const nameInput = document.getElementById('item-name');
    const processFields = document.getElementById('process-specific-fields');
    
    if (type === 'process') {
        item = data.processes.find(p => p.id === id);
        if (nameInput) nameInput.value = item.name;
        if (processFields) processFields.style.display = 'block';
        populateCheckboxes(item);
    } else if (type === 'system') {
        item = data.systems.find(s => s.id === id);
        if (nameInput) nameInput.value = item.name;
        if (processFields) processFields.style.display = 'none';
    } else if (type === 'vendor') {
        item = data.vendors.find(v => v.id === id);
        if (nameInput) nameInput.value = item.name;
        if (processFields) processFields.style.display = 'none';
    }
    
    const deleteBtn = document.getElementById('delete-item');
    if (deleteBtn) {
        deleteBtn.style.display = 'block';
    }
    
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close the modal
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Populate checkboxes for systems and vendors
function populateCheckboxes(process = null) {
    const systemsCheckboxes = document.getElementById('systems-checkboxes');
    const vendorsCheckboxes = document.getElementById('vendors-checkboxes');
    
    if (!systemsCheckboxes || !vendorsCheckboxes) return;
    
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
    const nameInput = document.getElementById('item-name');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    
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
            if (processIndex !== -1) {
                data.processes[processIndex] = {
                    id: currentItemId,
                    name: name,
                    systems: selectedSystems,
                    vendors: selectedVendors
                };
            }
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
            if (systemIndex !== -1) {
                data.systems[systemIndex] = {
                    id: currentItemId,
                    name: name
                };
            }
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
            if (vendorIndex !== -1) {
                data.vendors[vendorIndex] = {
                    id: currentItemId,
                    name: name
                };
            }
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
    } else {
        initializeVisualization();
    }
}

// Delete the current item
function deleteItem() {
    if (!currentItemId) return;
    
    if (!confirm(`Are you sure you want to delete this ${currentItemType}?`)) {
        return;
    }
    
    if (currentItemType === 'process') {
        data.processes = data.processes.filter(p => p.id !== currentItemId);
    } else if (currentItemType === 'system') {
        data.systems = data.systems.filter(s => s.id !== currentItemId);
        
        // Remove references to this system from processes
        data.processes.forEach(process => {
            process.systems = process.systems.filter(id => id !== currentItemId);
        });
    } else if (currentItemType === 'vendor') {
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
        currentViewState = {
            id: null,
            type: null,
            parentId: null,
            parentType: null
        };
        
        const drillUpBtn = document.getElementById('drill-up-btn');
        if (drillUpBtn) {
            drillUpBtn.style.display = 'none';
        }
        
        initializeVisualization(); // Reset visualization
    } else if (selectedItemId) {
        // Update visualization if another item is selected
        updateVisualization(selectedItemId, selectedItemType);
    }
}

// Generate a unique ID for a new item
function generateId(type) {
    const prefix = type === 'process' ? 'p' : type === 'system' ? 's' : 'v';
    const items = type === 'process' ? data.processes : 
                 type === 'system' ? data.systems : data.vendors;
    
    let maxNum = 0;
    items.forEach(item => {
        const idNum = parseInt(item.id.substring(1));
        if (idNum > maxNum) {
            maxNum = idNum;
        }
    });
    
    return `${prefix}${maxNum + 1}`;
}

// Capitalize the first letter of a string
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
