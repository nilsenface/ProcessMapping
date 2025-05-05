// Business Process Manager Class for efficient relationship manager
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
    if (!listElement) return;
    
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
        item = bpm.getProcess(id);
        if (nameInput) nameInput.value = item.name;
        if (processFields) processFields.style.display = 'block';
        populateCheckboxes(item);
    } else if (type === 'system') {
        item = bpm.getSystem(id);
        if (nameInput) nameInput.value = item.name;
        if (processFields) processFields.style.display = 'none';
    } else if (type === 'vendor') {
        item = bpm.getVendor(id);
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
    let nodes = [];
    let links = [];
    
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
    
    // Add processes to nodes
    processesToInclude.forEach(process => {
        if (!process) return; // Skip if process is undefined
        
        nodes.push({
            id: process.id,
            name: process.name,
            type: 'process',
            level: 1
        });
        
        // Add systems for this process
        const systems = bpm.getSystemsForProcess(process.id);
        systems.forEach(system => {
            // Check if system already exists in nodes
            const existingSystem = nodes.find(node => node.id === system.id);
            if (!existingSystem) {
                nodes.push({
                    id: system.id,
                    name: system.name,
                    type: 'system',
                    level: 2
                });
            }
            
            // Add link from process to system
            links.push({
                source: process.id,
                target: system.id
            });
            
            // Add vendors for this process
            const vendors = bpm.getVendorsForProcess(process.id);
            vendors.forEach(vendor => {
                // Check if vendor already exists in nodes
                const existingVendor = nodes.find(node => node.id === vendor.id);
                if (!existingVendor) {
                    nodes.push({
                        id: vendor.id,
                        name: vendor.name,
                        type: 'vendor',
                        level: 3
                    });
                }
                
                // Add link from system to vendor
                links.push({
                    source: system.id,
                    target: vendor.id
                });
            });
        });
    });
    
    return { nodes, links };
}

// Update visualization based on selected item
function updateVisualization(id, type) {
    // Clear previous visualization
    const visualizationElement = document.getElementById('visualization');
    if (!visualizationElement) return;
    
    visualizationElement.innerHTML = '';
    
    const width = visualizationElement.clientWidth || 800;
    const height = visualizationElement.clientHeight || 600;
    
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on('zoom', function(event) {
            g.attr('transform', event.transform);
        }));
    
    const g = svg.append('g')
        .attr('transform', `translate(${width/2},50)`);
    
    // Create hierarchical data
    const graphData = createHierarchicalData(id, type);
    
    // Create a stratify layout
    const stratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => {
            if (d.level === 1) return null; // Processes are top level
            // Find parent based on links
            const link = graphData.links.find(link => link.target === d.id);
            return link ? link.source : null;
        });
    
    // Apply stratify to create hierarchy
    let root;
    try {
        // Convert flat nodes to hierarchical structure
        const hierarchicalData = [];
        graphData.nodes.forEach(node => {
            hierarchicalData.push({
                id: node.id,
                name: node.name,
                type: node.type,
                level: node.level,
                parentId: node.level === 1 ? null : graphData.links.find(link => link.target === node.id)?.source
            });
        });
        
        // Create root for tree layout
        root = stratify(hierarchicalData);
    } catch (e) {
        console.error("Error creating hierarchy:", e);
        // Fallback to simple force-directed layout
        createForceDirectedLayout(g, graphData.nodes, graphData.links);
        return;
    }
    
    // Create tree layout
    const treeLayout = d3.tree()
        .size([width - 100, height - 150])
        .nodeSize([180, 100]);
    
    // Apply layout
    treeLayout(root);
    
    // Create links
    const link = g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));
    
    // Create nodes
    const node = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", d => `node ${d.data.type ? d.data.type + '-node' : ''}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .on("click", function(event, d) {
            event.stopPropagation();
            if (d.data.id) {
                handleNodeClick(event, d);
            }
        });
    
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

// Fallback to force-directed layout if tree layout fails
function createForceDirectedLayout(g, nodes, links) {
    // Create a simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(0, 0))
        .force("x", d3.forceX().strength(0.1))
        .force("y", d3.forceY().strength(0.1));
    
    // Create links
    const link = g.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link");
    
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
            handleNodeClick(event, { data: d });
        });
    
    // Create node shapes
    node.each(function(d) {
        const element = d3.select(this);
        
        if (d.type === 'process') {
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
            .text(d.name);
    });
    
    // Update positions on tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        
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
        d.fx = null;
        d.fy = null;
    }
}

// Handle node click for drill down
function handleNodeClick(event, d) {
    event.stopPropagation();
    
    // Skip if it doesn't have an ID
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
    const drillUpBtn = document.getElementById('drill-up-btn');
    if (drillUpBtn) {
        drillUpBtn.style.display = 'block';
    }
}

// Capitalize the first letter of a string
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
