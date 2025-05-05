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
    if (!listElement) return;
    
    listElement.innerHTML = '';
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = `item ${type}`;
        itemElement.dataset.id = item.id;
        itemElement.dataset.type = type;
        
        // Check if this item is selected
        if (selectedItemId === item.
