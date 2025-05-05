// Enhanced data structure with relationship management
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
    
    // Generate graph data for visualization
    generateGraphData(focusId = null, focusType = null) {
        const nodes = [];
        const links = [];
        const addedNodes = new Set();
        
        // Helper to add a node if not already added
        const addNode = (id, name, type) => {
            if (!addedNodes.has(id)) {
                nodes.push({ id, name, type });
                addedNodes.add(id);
            }
        };
        
        if (focusId && focusType) {
            // Focused view on a specific item
            if (focusType === 'process') {
                const process = this.getProcess(focusId);
                if (!process) return { nodes, links };
                
                // Add the process node
                addNode(process.id, process.name, 'process');
                
                // Add systems and links
                const systems = this.getSystemsForProcess(process.id);
                systems.forEach(system => {
                    addNode(system.id, system.name, 'system');
                    links.push({ source: process.id, target: system.id });
                });
                
                // Add vendors and links
                const vendors = this.getVendorsForProcess(process.id);
                vendors.forEach(vendor => {
                    addNode(vendor.id, vendor.name, 'vendor');
                    links.push({ source: process.id, target: vendor.id });
                });
            } 
            else if (focusType === 'system') {
                const system = this.getSystem(focusId);
                if (!system) return { nodes, links };
                
                // Add the system node
                addNode(system.id, system.name, 'system');
                
                // Add processes and links
                const processes = this.getProcessesForSystem(system.id);
                processes.forEach(process => {
                    addNode(process.id, process.name, 'process');
                    links.push({ source: system.id, target: process.id });
                    
                    // Add vendors connected to these processes
                    const vendors = this.getVendorsForProcess(process.id);
                    vendors.forEach(vendor => {
                        addNode(vendor.id, vendor.name, 'vendor');
                        links.push({ source: process.id, target: vendor.id });
                    });
                });
            } 
            else if (focusType === 'vendor') {
                const vendor = this.getVendor(focusId);
                if (!vendor) return { nodes, links };
                
                // Add the vendor node
                addNode(vendor.id, vendor.name, 'vendor');
                
                // Add processes and links
                const processes = this.getProcessesForVendor(vendor.id);
                processes.forEach(process => {
                    addNode(process.id, process.name, 'process');
                    links.push({ source: vendor.id, target: process.id });
                    
                    // Add systems connected to these processes
                    const systems = this.getSystemsForProcess(process.id);
                    systems.forEach(system => {
                        addNode(system.id, system.name, 'system');
                        links.push({ source: process.id, target: system.id });
                    });
                });
            }
        } 
        else {
            // Default view with all items
            // Add all processes
            this.processes.forEach(process => {
                addNode(process.id, process.name, 'process');
            });
            
            // Add all systems
            this.systems.forEach(system => {
                addNode(system.id, system.name, 'system');
            });
            
            // Add all vendors
            this.vendors.forEach(vendor => {
                addNode(vendor.id, vendor.name, 'vendor');
            });
            
            // Add all links
            this.processes.forEach(process => {
                const systemIds = this._processToSystems.get(process.id);
                if (systemIds) {
                    systemIds.forEach(systemId => {
                        links.push({ source: process.id, target: systemId });
                    });
                }
                
                const vendorIds = this._processToVendors.get(process.id);
                if (vendorIds) {
                    vendorIds.forEach(vendorId => {
                        links.push({ source: process.id, target: vendorId });
                    });
                }
            });
        }
        
        return { nodes, links };
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

// Initialize the business process manager with existing data
const bpm = new BusinessProcessManager(data);

// Replace the data variable with the business process manager
data = bpm;

// Update functions to use the new business process manager

// Function to save item (modified)
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
    }
}

// Function to delete item (modified)
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
        initializeVisualization(); // Reset visualization
    } else if (selectedItemId) {
        // Update visualization if another item is selected
        updateVisualization(selectedItemId, selectedItemType);
    }
}

// Function to save data to localStorage (modified)
function saveDataToLocalStorage() {
    localStorage.setItem('businessProcessData', JSON.stringify(bpm.exportData()));
}

// Function to load data from localStorage (modified)
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('businessProcessData');
    if (savedData) {
        bpm.loadData(JSON.parse(savedData));
    }
}

// Function to populate checkboxes (modified)
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

// Function to render lists (modified)
function renderLists() {
    renderList('process', bpm.processes);
    renderList('system', bpm.systems);
    renderList('vendor', bpm.vendors);
}

// Function to create graph data (modified)
function createGraphData(id = null, type = null) {
    return bpm.generateGraphData(id, type);
}

// Function to show detail box (modified)
function showDetailBox(itemId, itemType) {
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

// Update the detail box to show for vendors too
const originalSelectItem = selectItem;
selectItem = function(id, type) {
    originalSelectItem(id, type);
    if (type === 'process' || type === 'system' || type === 'vendor') {
        showDetailBox(id, type);
    } else {
        detailBox.style.display = 'none';
    }
};
