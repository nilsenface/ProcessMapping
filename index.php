<?php require_once 'includes/header.php'; ?>

<div class="container">
    <aside class="sidebar">
        <div class="section-header">
            <h2>Business Processes</h2>
        </div>
        <div id="process-list" class="item-list"></div>
        <div class="section-header">
            <h2>Systems</h2>
        </div>
        <div id="system-list" class="item-list"></div>
        <div class="section-header">
            <h2>Vendors</h2>
        </div>
        <div id="vendor-list" class="item-list"></div>
    </aside>
    <section class="visualization-container">
        <div id="visualization"></div>
    </section>
    <aside class="right-menu">
        <button id="admin-toggle" class="control-btn">Admin Mode</button>
        <button id="zoom-in-btn" class="control-btn">+</button>
        <button id="zoom-out-btn" class="control-btn">-</button>
        <button id="reset-btn" class="control-btn">Reset</button>
        <div class="toggle-group">
            <label><input type="checkbox" id="toggle-systems" checked> Show Systems</label>
            <label><input type="checkbox" id="toggle-vendors" checked> Show Vendors</label>
        </div>
    </aside>
</div>

<!-- Modal for add/edit -->
<div id="modal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h3 id="modal-title">Add/Edit Item</h3>
        <form id="item-form">
            <div class="form-group">
                <label for="item-name">Name:</label>
                <input type="text" id="item-name" required>
            </div>
            <div id="process-specific-fields" style="display:none;">
                <div class="form-group">
                    <label>Systems:</label>
                    <div id="systems-checkboxes" class="checkbox-group"></div>
                </div>
                <div class="form-group">
                    <label>Vendors:</label>
                    <div id="vendors-checkboxes" class="checkbox-group"></div>
                </div>
            </div>
            <div class="form-actions">
                <button type="submit" id="save-item">Save</button>
                <button type="button" id="delete-item" style="display:none;">Delete</button>
            </div>
        </form>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>
