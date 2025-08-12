// Smart Meeting Room Dashboard - Main JavaScript
class SmartDashboard {
    constructor() {
        this.currentUser = null;
        this.permissions = {};
        this.isConnected = false;
        this.sensorsChart = null;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.sensorData = [];
        this.controlsData = [];
        this.alertsData = [];
        this.reservationsData = [];
        
        this.init();
    }

    init() {
        // Initialize uibuilder
        uibuilder.start();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Show login modal
        this.showLogin();
        
        // Set up periodic data refresh
        setInterval(() => {
            if (this.currentUser) {
                this.refreshData();
            }
        }, 30000); // Refresh every 30 seconds
    }

    setupEventListeners() {
        // uibuilder message handlers
        uibuilder.onChange('msg', (msg) => {
            this.handleMessage(msg);
        });

        uibuilder.onChange('ioConnected', (connected) => {
            this.isConnected = connected;
            this.updateConnectionStatus();
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('reservationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createReservation();
        });

        document.getElementById('thresholdsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveThresholds();
        });

        // Real-time updates
        this.setupRealTimeUpdates();
    }

    setupRealTimeUpdates() {
        // Listen for real-time sensor updates
        setInterval(() => {
            if (this.currentUser && this.isConnected) {
                this.sendMessage('get-sensors');
            }
        }, 5000); // Update sensors every 5 seconds
    }

    handleMessage(msg) {
        console.log('Received message:', msg);

        switch (msg.payload.type) {
            case 'login-response':
                this.handleLoginResponse(msg.payload);
                break;
            case 'sensors-data':
                this.updateSensorsData(msg.payload.data);
                break;
            case 'controls-data':
                this.updateControlsData(msg.payload.data);
                break;
            case 'alerts-data':
                this.updateAlertsData(msg.payload.data);
                break;
            case 'reservations-data':
                this.updateReservationsData(msg.payload.data);
                break;
            case 'operation-result':
                this.showNotification(msg.payload.message, msg.payload.success ? 'success' : 'error');
                break;
            case 'real-time-update':
                this.handleRealTimeUpdate(msg.payload);
                break;
            default:
                if (msg.payload.error) {
                    this.showNotification(msg.payload.error, 'error');
                }
        }
    }

    handleLoginResponse(payload) {
        if (payload.success) {
            this.currentUser = payload.user;
            this.permissions = payload.permissions;
            this.hideLogin();
            this.showMainApp();
            this.updateUserInterface();
            this.loadInitialData();
            this.showNotification(`Bienvenue ${this.currentUser.prenom} ${this.currentUser.nom}!`, 'success');
        } else {
            this.showLoginError(payload.error);
        }
    }

    login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        this.sendMessage('login', { email, password });
    }

    logout() {
        this.currentUser = null;
        this.permissions = {};
        this.hideMainApp();
        this.showLogin();
        this.showNotification('Déconnexion réussie', 'info');
    }

    showLogin() {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    }

    hideLogin() {
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        if (loginModal) {
            loginModal.hide();
        }
    }

    showMainApp() {
        document.getElementById('mainApp').classList.remove('d-none');
    }

    hideMainApp() {
        document.getElementById('mainApp').classList.add('d-none');
    }

    showLoginError(error) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = error;
        errorDiv.classList.remove('d-none');
    }

    updateUserInterface() {
        // Update user info in navbar
        document.getElementById('userName').textContent = `${this.currentUser.prenom} ${this.currentUser.nom}`;
        document.getElementById('userRole').textContent = this.currentUser.role;

        // Show/hide menu items based on role
        this.updateMenuVisibility();
    }

    updateMenuVisibility() {
        const adminOnlyItems = document.querySelectorAll('.admin-only');
        const adminTechItems = document.querySelectorAll('.admin-tech-only');

        adminOnlyItems.forEach(item => {
            if (this.currentUser.role === 'administrateur') {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        });

        adminTechItems.forEach(item => {
            if (this.currentUser.role === 'administrateur' || this.currentUser.role === 'technicien') {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        });
    }

    loadInitialData() {
        this.sendMessage('get-sensors');
        this.sendMessage('get-controls');
        this.sendMessage('get-alerts');
        this.sendMessage('get-reservations');
    }

    refreshData() {
        this.loadInitialData();
        this.showNotification('Données actualisées', 'info');
    }

    sendMessage(topic, payload = {}) {
        uibuilder.send({
            topic: topic,
            payload: payload
        });
    }

    updateSensorsData(data) {
        this.sensorData = data;
        this.updateDashboardCards();
        this.updateSensorsGrid();
        this.updateSensorsChart();
    }

    updateControlsData(data) {
        this.controlsData = data;
        this.updateEquipmentStatus();
        this.updateControlsGrid();
    }

    updateAlertsData(data) {
        this.alertsData = data;
        this.updateAlertsBadge();
        this.updateAlertsList();
    }

    updateReservationsData(data) {
        this.reservationsData = data;
        this.updateCalendar();
    }

    updateDashboardCards() {
        const tempSensor = this.sensorData.find(s => s.type === 'temperature');
        const humiditySensor = this.sensorData.find(s => s.type === 'humidity');
        const co2Sensor = this.sensorData.find(s => s.type === 'co2');
        const presenceSensor = this.sensorData.find(s => s.type === 'presence');

        if (tempSensor) {
            document.getElementById('tempValue').textContent = `${tempSensor.value}${tempSensor.unit}`;
        }
        if (humiditySensor) {
            document.getElementById('humidityValue').textContent = `${humiditySensor.value}${humiditySensor.unit}`;
        }
        if (co2Sensor) {
            document.getElementById('co2Value').textContent = `${co2Sensor.value} ${co2Sensor.unit}`;
        }
        if (presenceSensor) {
            document.getElementById('presenceValue').textContent = `${presenceSensor.value} ${presenceSensor.unit}`;
        }
    }

    updateSensorsGrid() {
        const grid = document.getElementById('sensorsGrid');
        grid.innerHTML = '';

        this.sensorData.forEach(sensor => {
            const sensorCard = this.createSensorCard(sensor);
            grid.appendChild(sensorCard);
        });
    }

    createSensorCard(sensor) {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';

        const statusClass = sensor.status || 'normal';
        const iconClass = this.getSensorIcon(sensor.type);

        col.innerHTML = `
            <div class="card sensor-card status-card ${statusClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title">
                                <i class="${iconClass} me-2"></i>
                                ${sensor.name}
                            </h5>
                            <p class="sensor-value">${sensor.value} <span class="sensor-unit">${sensor.unit}</span></p>
                            <small class="text-muted">${sensor.location}</small>
                        </div>
                        <div class="sensor-status ${statusClass}"></div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>
                            ${new Date(sensor.timestamp).toLocaleString()}
                        </small>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    getSensorIcon(type) {
        const icons = {
            'temperature': 'fas fa-thermometer-half',
            'humidity': 'fas fa-tint',
            'co2': 'fas fa-wind',
            'noise': 'fas fa-volume-up',
            'presence': 'fas fa-users'
        };
        return icons[type] || 'fas fa-sensor';
    }

    updateControlsGrid() {
        const grid = document.getElementById('controlsGrid');
        grid.innerHTML = '';

        this.controlsData.forEach(control => {
            const controlCard = this.createControlCard(control);
            grid.appendChild(controlCard);
        });
    }

    createControlCard(control) {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';

        const canControl = this.hasPermission('controls', 'write');
        const iconClass = this.getControlIcon(control.name);

        col.innerHTML = `
            <div class="card control-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="card-title">
                                <i class="${iconClass} me-2"></i>
                                ${control.name}
                            </h5>
                            <p class="card-text">${control.description}</p>
                        </div>
                        <div class="control-switch">
                            <input type="checkbox" ${control.status ? 'checked' : ''} 
                                   ${canControl ? '' : 'disabled'}
                                   onchange="dashboard.toggleControl(${control.id}, this.checked)">
                            <span class="slider"></span>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            État: <span class="badge ${control.status ? 'bg-success' : 'bg-secondary'}">
                                ${control.status ? 'Activé' : 'Désactivé'}
                            </span>
                        </small>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    getControlIcon(name) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('lumière') || lowerName.includes('éclairage')) {
            return 'fas fa-lightbulb';
        } else if (lowerName.includes('porte')) {
            return 'fas fa-door-open';
        } else if (lowerName.includes('climatisation') || lowerName.includes('hvac')) {
            return 'fas fa-snowflake';
        }
        return 'fas fa-toggle-on';
    }

    toggleControl(controlId, newStatus) {
        if (!this.hasPermission('controls', 'write')) {
            this.showNotification('Permission refusée', 'error');
            return;
        }

        this.sendMessage('control-action', {
            actionneur_id: controlId,
            nouvel_etat: newStatus ? 'on' : 'off'
        });
    }

    updateEquipmentStatus() {
        const statusDiv = document.getElementById('equipmentStatus');
        statusDiv.innerHTML = '';

        this.controlsData.forEach(control => {
            const statusItem = document.createElement('div');
            statusItem.className = 'd-flex justify-content-between align-items-center mb-2';
            statusItem.innerHTML = `
                <span>${control.name}</span>
                <span class="badge ${control.status ? 'bg-success' : 'bg-secondary'}">
                    ${control.status ? 'ON' : 'OFF'}
                </span>
            `;
            statusDiv.appendChild(statusItem);
        });
    }

    updateAlertsBadge() {
        const unacknowledgedAlerts = this.alertsData.filter(alert => !alert.acknowledged);
        const badge = document.getElementById('alertBadge');
        
        if (unacknowledgedAlerts.length > 0) {
            badge.textContent = unacknowledgedAlerts.length;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }

    updateAlertsList() {
        const alertsList = document.getElementById('alertsList');
        alertsList.innerHTML = '';

        this.alertsData.forEach(alert => {
            const alertCard = this.createAlertCard(alert);
            alertsList.appendChild(alertCard);
        });
    }

    createAlertCard(alert) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-card card ${alert.type}`;

        const canAcknowledge = this.hasPermission('alerts', 'acknowledge') && !alert.acknowledged;

        alertDiv.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            ${alert.name}
                        </h6>
                        <p class="card-text">${alert.description}</p>
                        <small class="alert-timestamp">
                            <i class="fas fa-clock me-1"></i>
                            ${new Date(alert.timestamp).toLocaleString()}
                        </small>
                    </div>
                    <div>
                        ${alert.acknowledged ? 
                            '<span class="badge bg-success">Acquittée</span>' :
                            canAcknowledge ? 
                                `<button class="btn btn-sm btn-outline-primary" onclick="dashboard.acknowledgeAlert(${alert.id})">
                                    Acquitter
                                </button>` : 
                                '<span class="badge bg-warning">En attente</span>'
                        }
                    </div>
                </div>
            </div>
        `;

        return alertDiv;
    }

    acknowledgeAlert(alertId) {
        if (!this.hasPermission('alerts', 'acknowledge')) {
            this.showNotification('Permission refusée', 'error');
            return;
        }

        this.sendMessage('acknowledge-alert', { alert_id: alertId });
    }

    updateSensorsChart() {
        const ctx = document.getElementById('sensorsChart').getContext('2d');
        
        if (this.sensorsChart) {
            this.sensorsChart.destroy();
        }

        const datasets = this.sensorData.map(sensor => ({
            label: sensor.name,
            data: [sensor.value], // In real implementation, this would be historical data
            borderColor: this.getChartColor(sensor.type),
            backgroundColor: this.getChartColor(sensor.type, 0.1),
            tension: 0.4
        }));

        this.sensorsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [new Date().toLocaleTimeString()],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    getChartColor(type, alpha = 1) {
        const colors = {
            'temperature': `rgba(255, 99, 132, ${alpha})`,
            'humidity': `rgba(54, 162, 235, ${alpha})`,
            'co2': `rgba(255, 205, 86, ${alpha})`,
            'noise': `rgba(75, 192, 192, ${alpha})`,
            'presence': `rgba(153, 102, 255, ${alpha})`
        };
        return colors[type] || `rgba(201, 203, 207, ${alpha})`;
    }

    updateCalendar() {
        const calendarDiv = document.getElementById('calendar');
        // Simple calendar implementation - in production, use a proper calendar library
        calendarDiv.innerHTML = '<p>Calendrier des réservations (à implémenter avec une bibliothèque de calendrier)</p>';
        
        // Display reservations list
        const reservationsList = document.createElement('div');
        reservationsList.innerHTML = '<h6>Réservations à venir:</h6>';
        
        this.reservationsData.forEach(reservation => {
            const item = document.createElement('div');
            item.className = 'card mb-2';
            item.innerHTML = `
                <div class="card-body">
                    <h6 class="card-title">${reservation.description}</h6>
                    <p class="card-text">
                        <i class="fas fa-calendar me-2"></i>${reservation.date}
                        <i class="fas fa-clock ms-3 me-2"></i>${reservation.startTime} - ${reservation.endTime}
                    </p>
                </div>
            `;
            reservationsList.appendChild(item);
        });
        
        calendarDiv.appendChild(reservationsList);
    }

    createReservation() {
        if (!this.hasPermission('reservations', 'write')) {
            this.showNotification('Permission refusée', 'error');
            return;
        }

        const date = document.getElementById('reservationDate').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const description = document.getElementById('reservationDescription').value;

        this.sendMessage('create-reservation', {
            date_reservation: date,
            heure_debut: startTime,
            heure_fin: endTime,
            description: description
        });

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
        modal.hide();

        // Reset form
        document.getElementById('reservationForm').reset();
    }

    saveThresholds() {
        if (!this.hasPermission('system', 'manage')) {
            this.showNotification('Permission refusée', 'error');
            return;
        }

        const tempThreshold = document.getElementById('tempThreshold').value;
        const co2Threshold = document.getElementById('co2Threshold').value;
        const humidityThreshold = document.getElementById('humidityThreshold').value;

        // Save thresholds (implement based on your backend)
        this.showNotification('Seuils sauvegardés', 'success');
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Show selected section
        document.getElementById(sectionId).classList.remove('d-none');

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.target.classList.add('active');

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    loadSectionData(sectionId) {
        switch (sectionId) {
            case 'sensors':
                this.sendMessage('get-sensors');
                break;
            case 'controls':
                this.sendMessage('get-controls');
                break;
            case 'alerts':
                this.sendMessage('get-alerts');
                break;
            case 'reservations':
                this.sendMessage('get-reservations');
                break;
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    updateConnectionStatus() {
        let statusDiv = document.querySelector('.connection-status');
        
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.className = 'connection-status';
            document.body.appendChild(statusDiv);
        }

        if (this.isConnected) {
            statusDiv.className = 'connection-status connected';
            statusDiv.innerHTML = '<i class="fas fa-wifi me-2"></i>Connecté';
        } else {
            statusDiv.className = 'connection-status disconnected';
            statusDiv.innerHTML = '<i class="fas fa-wifi me-2"></i>Déconnecté';
        }
    }

    handleRealTimeUpdate(payload) {
        // Handle real-time updates from sensors
        this.refreshData();
    }

    hasPermission(resource, action) {
        return this.permissions[resource] && this.permissions[resource].includes(action);
    }

    showNotification(message, type = 'info') {
        // Create toast notification
        const toastContainer = document.querySelector('.toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionId) {
    dashboard.showSection(sectionId);
}

function refreshData() {
    dashboard.refreshData();
}

function toggleTheme() {
    dashboard.toggleTheme();
}

function logout() {
    dashboard.logout();
}

function createReservation() {
    dashboard.createReservation();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new SmartDashboard();
});