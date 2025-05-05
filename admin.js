// Data structure for processes, systems, and providers
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

// Global variables
let adminMode = false;
let currentItemType = null;
let currentItemId = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    renderElements();
    setupEventListeners();
    setupAdminControls();
    setupModal();
    
    // Save data to localStorage if not already there
    if (!localStorage.getItem('processData')) {
        saveDataToLocalStorage();
    } else {
        loadDataFromLocalStorage();
        renderElements();
    }
});

// Load data from localStorage
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('processData');
    if (savedData) {
        data = JSON.parse(savedData);
    }
}

// Save data to localStorage
function saveDataToLocalStorage() {
    localStorage.setItem('processData', JSON.stringify(data));
}

// Render all elements in their respective containers
function renderElements() {
    const processesContainer = document.getElementById('processes-container');
    const systemsContainer = document.getElementById('systems-container');
    const providersContainer = document.getElementById('providers-container');
    
    // Clear containers
    processesContainer.innerHTML = '';
    systemsContainer.innerHTML = '';
    providersContainer.innerHTML = '';
    
    // Render processes
    data.processes.forEach(process => {
        const element = document.createElement('div');
        element.className = 'item process';
        element.dataset.id = process.id;
        element.dataset.type = 'process';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = process.name;
        element.appendChild(nameSpan);
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Edit';
        editButton.onclick = function(e) {
            e.stopPropagation();
            openEditModal('process', process.id);
        };
        element.appendChild(editButton);
        
        processesContainer.appendChild(element);
    });
    
    // Render systems
    data.systems.forEach(system => {
        const element = document.createElement('div');
        element.className = 'item system';
        element.dataset.id = system.id;
        element.dataset.type = 'system';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = system.name;
        element.appendChild(nameSpan);
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Edit';
        editButton.onclick = function(e) {
            e.stopPropagation();
            openEditModal('system', system.id);
        };
        element.appendChild(editButton);
        
        systemsContainer.appendChild(element);
    });
    
    // Render providers
    data.providers.forEach(provider => {
        const element = document.createElement('div');
        element.className = 'item provider';
        element.dataset.id = provider.id;
        element.dataset.type = 'provider';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = provider.name;
        element.appendChild(nameSpan);
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Edit';
        editButton.onclick = function(e) {
            e.stopPropagation();
            openEditModal('provider', provider.id);
        };
        element.appendChild(editButton);
        
        providersContainer.appendChild(element);
    });
}

// Set up event listeners for item clicks
function setupEventListeners() {
    document.addEventListener('click', function(event) {
        const item = event.target.closest('.item');
        if (!item) return;
        
        if (adminMode) return; // Disable highlighting in admin mode
        
        // Reset all items
        document.querySelectorAll('.item').forEach(el => {
            el.classList.remove('active', 'highlighted');
        });
        
        // Set clicked item as active
        item.classList.add('active');
        
        const itemId = item.dataset.id;
        const itemType = item.dataset.type;
        
        // Highlight related items based on type
        highlightRelatedItems(itemId, itemType);
    });
}

// Highlight items related to the selected item
function highlightRelatedItems(itemId, itemType) {
    if (itemType === 'process') {
        // Find the process
        const process = data.processes.find(p => p.id === itemId);
        
        // Highlight related systems
        process.systems.forEach(systemId => {
            const systemElement = document.querySelector(`.system[data-id="${systemId}"]`);
            if (systemElement) {
                systemElement.classList.add('highlighted');
            }
        });
        
        // Highlight related providers
        process.providers.forEach(providerId => {
            const providerElement = document.querySelector(`.provider[data-id="${providerId}"]`);
            if (providerElement) {
                providerElement.classList.add('highlighted');
            }
        });
    } else if (itemType === 'system') {
        // Find processes related to this system
        data.processes.forEach(process => {
            if (process.systems.includes(itemId)) {
                const processElement = document.querySelector(`.process[data-id="${process.id}"]`);
                if (processElement) {
                    processElement.classList.add('highlighted');
                }
                
                // Also highlight providers related to these processes
                process.providers.forEach(providerId => {
                    const providerElement = document.querySelector(`.provider[data-id="${providerId}"]`);
                    if (providerElement) {
                        providerElement.classList.add('highlighted');
                    }
                });
            }
        });
    } else if (itemType === 'provider') {
        // Find processes related to this provider
        data.processes.forEach(process => {
            if (process.providers.includes(itemId)) {
                const processElement = document.querySelector(`.process[data-id="${process.id}"]`);
                if (processElement) {
                    processElement.classList.add('highlighted');
                }
                
                // Also highlight systems related to these processes
                process.systems.forEach(systemId => {
                    const systemElement = document.querySelector(`.system[data-id="${systemId}"]`);
                    if (systemElement) {
                        systemElement.classList.add('highlighted');
                    }
                });
            }
        });
    }
}

// Setup admin controls
function setupAdminControls() {
    const adminToggle = document.getElementById('admin-toggle');
    const addProcessBtn = document.getElementById('add-process');
    const addSystemBtn = document.getElementById('add-system');
    const addProviderBtn = document.getElementById('add-provider');
    
    adminToggle.addEventListener('click', function() {
        adminMode = !adminMode;
        
        if (adminMode) {
            document.body.classList.add('admin-mode');
            adminToggle.classList.add('active');
            adminToggle.textContent = 'Exit Admin Mode';
            addProcessBtn.style.display = 'block';
            addSystemBtn.style.display = 'block';
            addProviderBtn.style.display = 'block';
        } else {
            document.body.classList.remove('admin-mode');
            adminToggle.classList.remove('active');
            adminToggle.textContent = 'Admin Mode';
            addProcessBtn.style.display = 'none';
            addSystemBtn.style.display = 'none';
            addProviderBtn.style.display = 'none';
        }
    });
    
    // Add new item buttons
    addProcessBtn.addEventListener('click', function() {
        openAddModal('process');
    });
    
    addSystemBtn.addEventListener('click', function() {
        openAddModal('system');
    });
    
    addProviderBtn.addEventListener('click', function() {
        openAddModal('provider');
    });
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    const form = document.getElementById('item-form');
    
    // Close modal when clicking the X
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveItem();
    });
    
    // Delete button
    document.getElementById('delete-item').addEventListener('click', function() {
        deleteItem();
    });
}

// Open modal for adding a new item
function openAddModal(type) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const nameInput = document.getElementById('item-name');
    const processFields = document.getElementById('process-specific-fields');
    const deleteBtn = document.getElementById('delete-item');
    
    currentItemType = type;
    currentItemId = null;
    
    // Reset form
    document.getElementById('item-form').reset();
    
    // Set modal title based on type
    modalTitle.textContent = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Show/hide process-specific fields
    if (type === 'process') {
        processFields.style.display = 'block';
        populateCheckboxes();
    } else {
        processFields.style.display = 'none';
    }
    
    // Hide delete button for new items
    deleteBtn.style.display = 'none';
    
    // Show modal
    modal.style.display = 'block';
    
    // Focus on name input
    nameInput.focus();
}

// Open modal for editing an existing item
function openEditModal(type, id) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const nameInput = document.getElementById('item-name');
    const processFields = document.getElementById('process-specific-fields');
    const deleteBtn = document.getElementById('delete-item');
    
    currentItemType = type;
    currentItemId = id;
    
    // Set modal title based on type
    modalTitle.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    // Fill form with existing data
    let item;
    if (type === 'process') {
        item = data.processes.find(p => p.id === id);
        nameInput.value = item.name;
        processFields.style.display = 'block';
        populateCheckboxes(item);
    } else if (type === 'system') {
        item = data.systems.find(s => s.id === id);
        nameInput.value = item.name;
        processFields.style.display = 'none';
    } else if (type === 'provider') {
        item = data.providers.find(p => p.id === id);
        nameInput.value = item.name;
        processFields.style.display = 'none';
    }
    
    // Show delete button for existing items
    deleteBtn.style.display = 'block';
    
    // Show modal
    modal.style.display = 'block';
    
    // Focus on name input
    nameInput.focus();
}

// Populate checkboxes for systems and providers
function populateCheckboxes(process = null) {
    const systemsCheckboxes = document.getElementById('systems-checkboxes');
    const providersCheckboxes = document.getElementById('providers-checkboxes');
    
    // Clear existing checkboxes
    systemsCheckboxes.innerHTML = '';
    providersCheckboxes.innerHTML = '';
    
    // Add system checkboxes
    data.systems.forEach(system => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `system-${system.id}`;
        checkbox.value = system.id;
        checkbox.name = 'systems';
        
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
    
    // Add provider checkboxes
    data.providers.forEach(provider => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `provider-${provider.id}`;
        checkbox.value = provider.id;
        checkbox.name = 'providers';
        
        // Check if this provider is related to the process
        if (process && process.providers.includes(provider.id)) {
            checkbox.checked = true;
        }
        
        const label = document.createElement('label');
        label.htmlFor = `provider-${provider.id}`;
        label.textContent = provider.name;
        
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        providersCheckboxes.appendChild(checkboxItem);
    });
}

// Generate a unique ID
function generateId(type) {
    const prefix = type === 'process' ? 'p' : type === 'system' ? 's' : 'tp';
    const items = type === 'process' ? data.processes : type === 'system' ? data.systems : data.providers;
    
    // Find the highest existing ID number
    let maxNum = 0;
    items.forEach(item => {
        const idNum = parseInt(item.id.substring(prefix.length));
        if (idNum > maxNum) {
            maxNum = idNum;
        }
    });
    
    // Return a new ID with the next number
    return `${prefix}${maxNum + 1}`;
}

// Save the current item
function saveItem() {
    const nameInput = document.getElementById('item-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    if (currentItemType === 'process') {
        // Get selected systems
        const selectedSystems = Array.from(document.querySelectorAll('input[name="systems"]:checked'))
            .map(checkbox => checkbox.value);
        
        // Get selected providers
        const selectedProviders = Array.from(document.querySelectorAll('input[name="providers"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (currentItemId) {
            // Update existing process
            const processIndex = data.processes.findIndex(p => p.id === currentItemId);
            data.processes[processIndex] = {
                id: currentItemId,
                name: name,
                systems: selectedSystems,
                providers: selectedProviders
            };
        } else {
            // Add new process
            const newId = generateId('process');
            data.processes.push({
                id: newId,
                name: name,
                systems: selectedSystems,
                providers: selectedProviders
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
    } else if (currentItemType === 'provider') {
        if (currentItemId) {
            // Update existing provider
            const providerIndex = data.providers.findIndex(p => p.id === currentItemId);
            data.providers[providerIndex] = {
                id: currentItemId,
                name: name
            };
        } else {
            // Add new provider
            const newId = generateId('provider');
            data.providers.push({
                id: newId,
                name: name
            });
        }
    }
    
    // Save data and close modal
    saveDataToLocalStorage();
    renderElements();
    document.getElementById('modal').style.display = 'none';
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
    } else if (currentItemType === 'provider') {
        // Remove the provider
        data.providers = data.providers.filter(p => p.id !== currentItemId);
        
        // Remove references to this provider from processes
        data.processes.forEach(process => {
            process.providers = process.providers.filter(id => id !== currentItemId);
        });
    }
    
    // Save data and close modal
    saveDataToLocalStorage();
    renderElements();
    document.getElementById('modal').style.display = 'none';
}
