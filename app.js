// Business Process Manager Class for efficient relationship management
class BusinessProcessManager {
    constructor(initialData = null) {
        this.processes = [];
        this.systems = [];
        this.vendors = [];
        
        // Relationship maps for quick lookups
        this._processToSystems = new Map(); // process ID -> set of system IDs
        this._processToVendors = new Map(); // process ID -> set of vendor IDs
        this._systemToProcesses = new Map(); // system ID -> set of process IDs
        this._vendorToProcesses = new Map(); // vendor ID -> set of process IDs
        
        if (initialData) {
            this.loadData(initialData);
        }
    }
    
    // Load data from the old format
    loadData(data) {
        // Clear existing data
        this.processes = [];
        this.systems = [];
        this.vendors = [];
        this._processToSystems.clear();
        this._processToVendors.clear();
        this._systemToProcesses.clear();
        this._vendorToProcesses.clear();
        
        // Load systems
        if (data.systems) {
            data.systems.forEach(system => {
                this.addSystem(system.id, system.name);
            });
        }
        
        // Load vendors
        if (data.vendors) {
            data.vendors.forEach(vendor => {
                this.addVendor(vendor.id, vendor.name);
            });
        }
        
        // Load processes and their relationships
        if (data.processes) {
            data.processes.forEach(process => {
                this.addProcess(process.id, process.name);
                
                // Add system relationships
                if (process.systems) {
                    process.systems.forEach(systemId => {
                        this.linkProcessToSystem(process.id, systemId);
                    });
                }
                
                // Add vendor relationships
                if (process.vendors) {
                    process.vendors.forEach(vendorId => {
                        this.linkProcessToVendor(process.id, vendorId);
                    });
                }
            });
        }
    }
    
    // Export data to the old format for compatibility
    exportData() {
        return {
            processes: this.processes.map(process => ({
                id: process.id,
                name: process.name,
                systems: Array.from(this._processToSystems.get(process.id) || []),
                vendors: Array.from(this._processToVendors.get(process.id) || [])
            })),
            systems: this.systems.map(system => ({
                id: system.id,
                name: system.name
            })),
            vendors: this.vendors.map(vendor => ({
                id: vendor.id,
                name: vendor.name
            }))
        };
    }
    
    // Add a new process
    addProcess(id, name) {
        if (!this.getProcess(id)) {
            this.processes.push({ id, name });
            this._processToSystems.set(id, new Set());
            this._processToVendors.set(id, new Set());
            return true;
        }
        return false;
    }
    
    // Add a new system
    addSystem(id, name) {
        if (!this.getSystem(id)) {
            this.systems.push({ id, name });
            this._systemToProcesses.set(id, new Set());
            return true;
        }
        return false;
    }
    
    // Add a new vendor
    addVendor(id, name) {
        if (!this.getVendor(id)) {
            this.vendors.push({ id, name });
            this._vendorToProcesses.set(id, new Set());
            return true;
        }
        return false;
    }
    
    // Link a process to a system
    linkProcessToSystem(processId, systemId) {
        const process = this.getProcess(processId);
        const system = this.getSystem(systemId);
        
        if (process && system) {
            this._processToSystems.get(processId).add(systemId);
            this._systemToProcesses.get(systemId).add(processId);
            return true;
        }
        return false;
    }
    
    // Link a process to a vendor
    linkProcessToVendor(processId, vendorId) {
        const process = this.getProcess(processId);
        const vendor = this.getVendor(vendorId);
        
        if (process && vendor) {
            this._processToVendors.get(processId).add(vendorId);
            this._vendorToProcesses.get(vendorId).add(processId);
            return true;
        }
        return false;
    }
    
    // Unlink a process from a system
    unlinkProcessFromSystem(processId, systemId) {
        if (this._processToSystems.has(processId) && this._systemToProcesses.has(systemId)) {
            this._processToSystems.get(processId).delete(systemId);
            this._systemToProcesses.get(systemId).delete(processId);
            return true;
        }
        return false;
    }
    
    // Unlink a process from a vendor
    unlinkProcessFromVendor(processId, vendorId) {
        if (this._processToVendors.has(processId) && this._vendorToProcesses.has(vendorId)) {
            this._processToVendors.get(processId).delete(vendorId);
            this._vendorToProcesses.get(vendorId).delete(processId);
            return true;
        }
        return false;
    }
    
    // Update a process
    updateProcess(id, name, systemIds, vendorIds) {
        const process = this.getProcess(id);
        if (!process) return false;
        
        // Update name
        process.name = name;
        
        // Update system relationships
        const currentSystems = this._processToSystems.get(id);
        const newSystems = new Set(systemIds);
        
        // Remove old relationships
        for (const sysId of currentSystems) {
            if (!newSystems.has(sysId)) {
                this.unlinkProcessFromSystem(id, sysId);
            }
        }
        
        // Add new relationships
        for (const sysId of newSystems) {
            if (!currentSystems.has(sysId)) {
                this.linkProcessToSystem(id, sysId);
            }
        }
        
        // Update vendor relationships
        const currentVendors = this._processToVendors.get(id);
        const newVendors = new Set(vendorIds);
        
        // Remove old relationships
        for (const vendorId of currentVendors) {
            if (!newVendors.has(vendorId)) {
                this.unlinkProcessFromVendor(id, vendorId);
            }
        }
        
        // Add new relationships
        for (const vendorId of newVendors) {
            if (!currentVendors.has(vendorId)) {
                this.linkProcessToVendor(id, vendorId);
            }
        }
        
        return true;
    }
    
    // Update a system
    updateSystem(id, name) {
        const system = this.getSystem(id);
        if (system) {
            system.name = name;
            return true;
        }
        return false;
    }
    
    // Update a vendor
    updateVendor(id, name) {
        const vendor = this.getVendor(id);
        if (vendor) {
            vendor.name = name;
            return true;
        }
        return false;
    }
    
    // Delete a process
    deleteProcess(id) {
        const index = this.processes.findIndex(p => p.id === id);
        if (index === -1) return false;
        
        // Remove all relationships
        const systemIds = this._processToSystems.get(id);
        if (systemIds) {
            for (const sysId of systemIds) {
                this._systemToProcesses.get(sysId).delete(id);
            }
        }
        
        const vendorIds = this._processToVendors.get(id);
        if (vendorIds) {
            for (const vendorId of vendorIds) {
                this._vendorToProcesses.get(vendorId).delete(id);
            }
        }
        
        // Remove from maps
        this._processToSystems.delete(id);
        this._processToVendors.delete(id);
        
        // Remove from array
        this.processes.splice(index, 1);
        return true;
    }
    
    // Delete a system
    deleteSystem(id) {
        const index = this.systems.findIndex(s => s.id === id);
        if (index === -1) return false;
        
        // Remove all relationships
        const processIds = this._systemToProcesses.get(id);
        if (processIds) {
            for (const processId of processIds) {
                this._processToSystems.get(processId).delete(id);
            }
        }
        
        // Remove from maps
        this._systemToProcesses.delete(id);
        
        // Remove from array
        this.systems.splice(index, 1);
        return true;
    }
    
    // Delete a vendor
    deleteVendor(id) {
        const index = this.vendors.findIndex(v => v.id === id);
        if (index === -1) return false;
        
        // Remove all relationships
        const processIds = this._vendorToProcesses.get(id);
        if (processIds) {
            for (const processId of processIds) {
                this._processToVendors.get(processId).delete(id);
            }
        }
        
        // Remove from maps
        this._vendorToProcesses.delete(id);
        
        // Remove from array
        this.vendors.splice(index, 1);
        return true;
    }
    
    // Get a process by ID
    getProcess(id) {
        return this.processes.find(p => p.id === id);
    }
    
    // Get a system by ID
    getSystem(id) {
        return this.systems.find(s => s.id === id);
    }
    
    // Get a vendor by ID
    getVendor(id) {
        return this.vendors.find(v => v.id === id);
    }
    
    // Get all systems for a process
    getSystemsForProcess(processId) {
        const systemIds = this._processToSystems.get(processId);
        if (!systemIds) return [];
        
        return this.systems.filter(system => systemIds.has(system.id));
    }
    
    // Get all vendors for a process
    getVendorsForProcess(processId) {
        const vendorIds = this._processToVendors.get(processId);
        if (!vendorIds) return [];
        
        return this.vendors.filter(vendor => vendorIds.has(vendor.id));
    }
    
    // Get all processes for a system
    getProcessesForSystem(systemId) {
        const processIds = this._systemToProcesses.get(systemId);
        if (!processIds) return [];
        
        return this.processes.filter(process => processIds.has(process.id));
    }
    
    // Get all processes for a vendor
    getProcessesForVendor(vendorId) {
        const processIds = this._vendorToProcesses.get(vendorId);
        if (!processIds) return [];
        
        return this.processes.filter(process => processIds.has(process.id));
    }
    
    // Get all vendors related to a system (through processes)
    getVendorsForSystem(systemId) {
        const processes = this.getProcessesForSystem(systemId);
        const vendorSet = new Set();
        
        processes.forEach(process => {
            const vendorIds = this._processToVendors.get(process.id);
            if (vendorIds) {
                for (const vendorId of vendorIds) {
                    vendorSet.add(vendorId);
                }
            }
        });
        
        return this.vendors.filter(vendor => vendorSet.has(vendor.id));
    }
    
    // Get all systems related to a vendor (through processes)
    getSystemsForVendor(vendorId) {
        const processes = this.getProcessesForVendor(vendorId);
        const systemSet = new Set();
        
        processes.forEach(process => {
            const systemIds = this._processToSystems.get(process.id);
            if (systemIds) {
                for (const systemId of systemIds) {
                    systemSet.add(systemId);
                }
            }
        });
        
        return this.systems.filter(system => systemSet.has(system.id));
    }
    
    // Generate a unique ID for a new item
    generateId(type) {
        const prefix = type === 'process' ? 'p' : type === 'system' ? 's' : 'v';
        const items = type === 'process' ? this.processes : 
                     type === 'system' ? this.systems : this.vendors;
        
        let maxNum = 0;
        items.forEach(item => {
            const idNum = parseInt(item.id.substring(1));
            if (idNum > maxNum) {
                maxNum = idNum;
            }
        });
        
        return `${prefix}${maxNum + 1}`;
    }
}

// Initial data structure
const initialData = {
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

// Initialize the business process manager
const bpm = new BusinessProcessManager(initialData);

// Global variables
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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load data from localStorage if available
    loadDataFromLocalStorage();
    
    // Render the lists
    renderLists();
    
    // Set up event listeners
    setupEventListeners();
    
    // Add drill-up button
    addDrillUpButton();
    
    // Initialize visualization
    initializeVisualization();
    
    // Add detail box
    addDetailBox();
});

// Load data from localStorage
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('businessProcessData');
    if (savedData) {
        bpm.loadData(JSON.parse(savedData));
    }
}

// Save data to localStorage
function saveDataToLocalStorage() {
    localStorage.setItem('businessProcessData', JSON.stringify(bpm.exportData()));
}

// Render the process, system, and vendor lists
function renderLists() {
    renderList('process', bpm.processes);
    renderList('system', bpm.systems);
    renderList('vendor', bpm.vendors);
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
    
    // Hide detail box when clicking outside items
    window.addEventListener('click', function(event) {
        if (!event.target.closest('.item') && !event.target.closest('#detail-box') && 
            !event.target.closest('.node') && !event.target.closest('#drill-up-btn')) {
            const detailBox = document.getElementById('detail-box');
            if (detailBox) {
                detailBox.style.display = 'none';
            }
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
    if (currentViewState.id !== null) {
        document.getElementById('drill-up-btn').style.display = 'block';
    }
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
        item = bpm.getProcess(id);
        document.getElementById('item-name').value = item.name;
        document.getElementById('process-specific-fields').style.display = 'block';
        populateCheckboxes(item);
    } else if (type === 'system') {
        item = bpm.getSystem(id);
        document.getElementById('item-name').value = item.name;
        document.getElementById('process-specific-fields').style.display = 'none';
    } else if (type === 'vendor') {
        item = bpm.getVendor(id);
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
    bpm.systems.forEach(system => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `system-${system.id}`;
        checkbox.value = system.id;
        
        // Check if this system is related to the process
        if (process && bpm._processToSystems.get(process.id)?.has(system.id)) {
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
    bpm.vendors.forEach(vendor => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `vendor-${vendor.id}`;
        checkbox.value = vendor.id;
        
        // Check if this vendor is related to the process
        if (process && bpm._processToVendors.get(process.id)?.has(vendor.id)) {
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
            bpm.updateProcess(currentItemId, name, selectedSystems, selectedVendors);
        } else {
            // Add new process
            const newId = bpm.generateId('process');
            bpm.addProcess(newId, name);
            bpm.updateProcess(newId, name, selectedSystems, selectedVendors);
        }
    } else if (currentItemType === 'system') {
        if (currentItemId) {
            // Update existing system
            bpm.updateSystem(currentItemId, name);
        } else {
            // Add new system
            const newId = bpm.generateId('system');
            bpm.addSystem(newId, name);
        }
    } else if (currentItemType === 'vendor') {
        if (currentItemId) {
            // Update existing vendor
            bpm.updateVendor(currentItemId, name);
        } else {
            // Add new vendor
            const newId = bpm.generateId('vendor');
            bpm.addVendor(newId, name);
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
        bpm.deleteProcess(currentItemId);
    } else if (currentItemType === 'system') {
        bpm.deleteSystem(currentItemId);
    } else if (currentItemType === 'vendor') {
        bpm.deleteVendor(currentItemId);
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
        document.getElementById('drill-up-btn').style.display = 'none';
        initializeVisualization(); // Reset visualization
    } else if (selectedItemId) {
        // Update visualization if another item is selected
        updateVisualization(selectedItemId, selectedItemType);
    }
}

// Add drill-up button to the header
function addDrillUpButton() {
    const button = document.createElement('button');
    button.id = 'drill-up-btn';
    button.className = 'control-btn';
    button.textContent = '↑ Up';
    button.style.display = 'none';
    button.onclick = drillUp;
    
    document.querySelector('header').appendChild(button);
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
        // Go to top level view
        initializeVisualization();
        
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
        document.getElementById('detail-box').style.display = 'none';
        
        // Hide drill-up button at top level
        document.getElementById('drill-up-btn').style.display = 'none';
    }
}

// Add detail box to the visualization container
function addDetailBox() {
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
    
    const visualizationContainer = document.querySelector('.visualization-container');
    visualizationContainer.style.position = 'relative';
    visualizationContainer.appendChild(detailBox);
}

// Show detail box for a process, system, or vendor
function showDetailBox(itemId, itemType) {
    const detailBox = document.getElementById('detail-box');
    let html = '';
    
    if (itemType === 'process') {
        const process = bpm.getProcess(itemId);
        if (!process) return;
        
        html += `<h3>Process: ${process.name}</h3>`;
        
        // Get systems for this process
        const systems = bpm.getSystemsForProcess(itemId);
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
        const vendors = bpm.getVendorsForProcess(itemId);
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
        const system = bpm.getSystem(itemId);
        if (!system) return;
        
        html += `<h3>System: ${system.name}</h3>`;
        
        // Get processes for this system
        const processes = bpm.getProcessesForSystem(itemId);
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
        
        // Get vendors related to this system
        const vendors = bpm.getVendorsForSystem(itemId);
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
        const vendor = bpm.getVendor(itemId);
        if (!vendor) return;
        
        html += `<h3>Vendor: ${vendor.name}</h3>`;
        
        // Get processes for this vendor
        const processes = bpm.getProcessesForVendor(itemId);
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
        
        // Get systems related to this vendor
        const systems = bpm.getSystemsForVendor(itemId);
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

// Create hierarchical data structure for visualization
function createHierarchicalData(focusId = null, focusType = null) {
    // Create root node
    const root = {
        name: "All Processes",
        children: []
    };
    
    // Determine which processes to include
    let processesToInclude = [];
    if (focusId && focusType === 'process') {
        processesToInclude = [bpm.getProcess(focusId)];
    } else if (focusId && focusType === 'system') {
        processesToInclude = bpm.getProcessesForSystem(focusId);
    } else if (focusId && focusType === 'vendor') {
        processesToInclude = bpm.getProcessesForVendor(focusId);
    } else {
        processesToInclude = bpm.processes;
    }
    
    // Build the hierarchy
    processesToInclude.forEach(process => {
        const processNode = {
            name: process.name,
            id: process.id,
            type: 'process',
            children: []
        };
        
        // Add systems (rank 2)
        const systems = bpm.getSystemsForProcess(process.id);
        systems.forEach(system => {
            const systemNode = {
                name: system.name,
                id: system.id,
                type: 'system',
                children: []
            };
            
            // Add vendors (rank 3) - only those connected to this process
            const processVendors = bpm.getVendorsForProcess(process.id);
            processVendors.forEach(vendor => {
                systemNode.children.push({
                    name: vendor.name,
                    id: vendor.id,
                    type: 'vendor'
                });
            });
            
            processNode.children.push(systemNode);
        });
        
        root.children.push(processNode);
    });
    
    return d3.hierarchy(root);
}

// Update visualization based on selected item
function updateVisualization(id, type) {
    // Clear previous visualization
    d3.select('#visualization').html('');
    
    const container = document.getElementById('visualization');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on('zoom', function(event) {
            svg.attr('transform', event.transform);
        }))
        .append('g')
        .attr('transform', `translate(${width/2},50)`);
    
    // Create hierarchical data
    const root = createHierarchicalData(id, type);
    
    // Create tree layout
    const treeLayout = d3.tree()
        .size([width - 100, height - 150])
        .nodeSize([180, 100]);
    
    // Apply layout
    treeLayout(root);
    
    // Create links
    const link = svg.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));
    
    // Create nodes
    const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", d => `node ${d.data.type}-node`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .on("click", handleNodeClick);
    
    // Create nodes with different shapes based on type
    node.each(function(d) {
        const element = d3.select(this);
        
        if (d.data.type === 'process') {
            // Create rectangle for processes
            element.append("rect")
                .attr("width", 160)
                .attr("height", 60)
                .attr("x", -80)
                .attr("y", -30)
                .attr("rx", 5)
                .attr("ry", 5)
                .attr("class", "process-node");
        } else if (d.data.type === 'system') {
            // Create rounded rectangle for systems
            element.append("rect")
                .attr("width", 140)
                .attr("height", 40)
                .attr("x", -70)
                .attr("y", -20)
                .attr("rx", 20)
                .attr("ry", 20)
                .attr("class", "system-node");
        } else if (d.data.type === 'vendor') {
            // Create circle for vendors
            element.append("circle")
                .attr("r", 15)
                .attr("class", "vendor-node");
        } else {
            // Root node (if visible)
            element.append("circle")
                .attr("r", 10)
                .attr("fill", "#999");
        }
        
        // Add text labels
        if (d.data.name) {
            element.append("text")
                .attr("dy", d.data.type === 'vendor' ? 30 : 5)
                .attr("text-anchor", "middle")
                .attr("class", "node-label")
                .text(d.data.name);
        }
    });
}

// Handle node click for drill down
function handleNodeClick(event, d) {
    event.stopPropagation();
    
    // Skip if it's the root node or doesn't have an ID
    if (!d.data.id) return;
    
    // Store previous state for drill-up
    const previousState = {...currentViewState};
    
    // Update current view state
    currentViewState = {
        id: d.data.id,
        type: d.data.type,
        parentId: previousState.id,
        parentType: previousState.type
    };
    
    // Update selection in the sidebar
    selectedItemId = d.data.id;
    selectedItemType = d.data.type;
    
    document.querySelectorAll('.item').forEach(item => {
        item.classList.remove('active');
    });
    
    const selectedElement = document.querySelector(`.item[data-id="${selectedItemId}"][data-type="${selectedItemType}"]`);
    if (selectedElement) {
        selectedElement.classList.add('active');
    }
    
    // Update visualization with new focus
    updateVisualization(d.data.id, d.data.type);
    
    // Show detail box
    showDetailBox(d.data.id, d.data.type);
    
    // Show drill-up button
    document.getElementById('drill-up-btn').style.display = 'block';
}

// Capitalize the first letter of a string
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Add these CSS styles to your style.css file
/*
.process-node rect {
  fill: #3498db;
  stroke: #2980b9;
  stroke-width: 2px;
}

.system-node rect {
  fill: #2ecc71;
  stroke: #27ae60;
  stroke-width: 2px;
}

.vendor-node circle {
  fill: #f39c12;
  stroke: #e67e22;
  stroke-width: 2px;
}

.link {
  fill: none;
  stroke: #95a5a6;
  stroke-width: 1.5px;
}

.node-label {
  font-size: 12px;
  font-weight: bold;
  pointer-events: none;
}

#drill-up-btn {
  background-color: #34495e;
  margin-left: 10px;
}

#detail-box {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}
*/
