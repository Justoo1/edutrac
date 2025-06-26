// Main JavaScript for Toxicology PDF Extractor

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Initialize file upload functionality
    initializeFileUpload();
    
    // Initialize data tables
    initializeDataTables();
    
    // Initialize real-time updates
    initializeRealtimeUpdates();
});

/**
 * Initialize file upload functionality with drag and drop
 */
function initializeFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadForm = document.getElementById('upload-form');
    
    if (!uploadArea || !fileInput) return;

    // Click to upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFile();
        });
    }
}

/**
 * Handle file selection and validation
 */
function handleFileSelect(file) {
    const uploadArea = document.getElementById('upload-area');
    const fileInfo = document.getElementById('file-info');
    const submitBtn = document.getElementById('submit-btn');
    
    // Validate file type
    if (!file.type.includes('pdf')) {
        showAlert('danger', 'Please select a PDF file.');
        return;
    }
    
    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        showAlert('danger', 'File size must be less than 100MB.');
        return;
    }
    
    // Update UI
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-file-pdf text-danger me-2"></i>
                <div>
                    <strong>${file.name}</strong><br>
                    <small class="text-muted">${formatFileSize(file.size)} • ${file.type}</small>
                </div>
            </div>
        `;
        fileInfo.style.display = 'block';
    }
    
    if (submitBtn) {
        submitBtn.disabled = false;
    }
    
    uploadArea.classList.add('file-selected');
}

/**
 * Submit file for processing
 */
function submitFile() {
    const form = document.getElementById('upload-form');
    const submitBtn = document.getElementById('submit-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    
    if (!form || !submitBtn) return;
    
    const formData = new FormData(form);
    
    // Update UI
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
    submitBtn.disabled = true;
    
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
    
    // Submit via AJAX
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Redirect to document detail page
            window.location.href = data.redirect_url;
        } else {
            showAlert('danger', data.message || 'An error occurred during upload.');
            resetUploadForm();
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showAlert('danger', 'An error occurred during upload. Please try again.');
        resetUploadForm();
    });
}

/**
 * Reset upload form to initial state
 */
function resetUploadForm() {
    const submitBtn = document.getElementById('submit-btn');
    const progressContainer = document.getElementById('progress-container');
    const fileInfo = document.getElementById('file-info');
    const uploadArea = document.getElementById('upload-area');
    
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Process PDF';
        submitBtn.disabled = true;
    }
    
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
    
    if (fileInfo) {
        fileInfo.style.display = 'none';
    }
    
    if (uploadArea) {
        uploadArea.classList.remove('file-selected');
    }
}

/**
 * Initialize data tables with sorting and filtering
 */
function initializeDataTables() {
    const tables = document.querySelectorAll('.data-table');
    
    tables.forEach(table => {
        // Add sorting functionality
        const headers = table.querySelectorAll('th[data-sortable]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                sortTable(table, header);
            });
        });
        
        // Add search functionality
        const searchInput = table.parentElement.querySelector('.table-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterTable(table, this.value);
            });
        }
    });
}

/**
 * Sort table by column
 */
function sortTable(table, header) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const columnIndex = Array.from(header.parentElement.children).indexOf(header);
    const isAsc = header.classList.contains('sort-asc');
    
    // Remove existing sort classes
    header.parentElement.querySelectorAll('th').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add new sort class
    header.classList.add(isAsc ? 'sort-desc' : 'sort-asc');
    
    // Sort rows
    rows.sort((a, b) => {
        const aVal = a.children[columnIndex].textContent.trim();
        const bVal = b.children[columnIndex].textContent.trim();
        
        if (isAsc) {
            return bVal.localeCompare(aVal, undefined, {numeric: true});
        } else {
            return aVal.localeCompare(bVal, undefined, {numeric: true});
        }
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Filter table rows based on search term
 */
function filterTable(table, searchTerm) {
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const match = text.includes(searchTerm.toLowerCase());
        row.style.display = match ? '' : 'none';
    });
}

/**
 * Initialize real-time updates using WebSocket or polling
 */
function initializeRealtimeUpdates() {
    // Check if we're on a page that needs real-time updates
    const needsUpdates = document.querySelector('[data-realtime]');
    if (!needsUpdates) return;
    
    // Use polling for simplicity (WebSocket can be added later)
    setInterval(function() {
        updateProcessingStatus();
    }, 5000); // Poll every 5 seconds
}

/**
 * Update processing status for documents
 */
function updateProcessingStatus() {
    const statusElements = document.querySelectorAll('[data-status-id]');
    if (statusElements.length === 0) return;
    
    const ids = Array.from(statusElements).map(el => el.dataset.statusId);
    
    fetch('/api/pdf/status/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ids: ids})
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            data.statuses.forEach(status => {
                updateStatusElement(status.id, status);
            });
        }
    })
    .catch(error => {
        console.error('Status update error:', error);
    });
}

/**
 * Update individual status element
 */
function updateStatusElement(id, status) {
    const element = document.querySelector(`[data-status-id="${id}"]`);
    if (!element) return;
    
    const badge = element.querySelector('.status-badge');
    const progress = element.querySelector('.progress-bar');
    
    if (badge) {
        badge.className = `status-badge status-${status.status}`;
        badge.textContent = status.status_display;
    }
    
    if (progress && status.progress !== undefined) {
        progress.style.width = `${status.progress}%`;
        progress.setAttribute('aria-valuenow', status.progress);
    }
    
    // If processing is complete, reload the page to show results
    if (status.status === 'completed' && window.location.pathname.includes('/document/')) {
        setTimeout(() => window.location.reload(), 1000);
    }
}

/**
 * Show alert message
 */
function showAlert(type, message) {
    const alertContainer = document.getElementById('alert-container') || document.querySelector('main');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.insertBefore(alert, alertContainer.firstChild);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
}

/**
 * Get icon for alert type
 */
function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get CSRF token from cookies
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('success', 'Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showAlert('danger', 'Failed to copy to clipboard.');
    });
}

/**
 * Download file
 */
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Confirm action with modal
 */
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Export functions for use in other scripts
window.ToxicologyApp = {
    showAlert,
    copyToClipboard,
    downloadFile,
    confirmAction,
    formatFileSize
};
