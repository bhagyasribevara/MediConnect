-- MediConnect Initial Database Schema (Refactored for isolated authentication)

CREATE TABLE IF NOT EXISTS districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('Hospital', 'PHC', 'CHC') NOT NULL,
    district_id INT NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15), -- For Mobile Number
    failed_login_attempts INT DEFAULT 0,
    lockout_until DATETIME DEFAULT NULL,
    reset_otp VARCHAR(6) DEFAULT NULL,
    reset_otp_expires DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE,
    emergency_contact VARCHAR(15),
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')
);

CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    failed_login_attempts INT DEFAULT 0,
    lockout_until DATETIME DEFAULT NULL,
    reset_otp VARCHAR(6) DEFAULT NULL,
    reset_otp_expires DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE,
    hospital_id INT DEFAULT NULL, -- Nullable to allow self-signup
    specialization VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    is_on_leave BOOLEAN DEFAULT FALSE,
    profile_photo VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    role_level ENUM('Hospital', 'District', 'Super') NOT NULL,
    hospital_id INT DEFAULT NULL,
    district_id INT DEFAULT NULL,
    failed_login_attempts INT DEFAULT 0,
    lockout_until DATETIME DEFAULT NULL,
    reset_otp VARCHAR(6) DEFAULT NULL,
    reset_otp_expires DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    soft_delete BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

CREATE TABLE IF NOT EXISTS district_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    district_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES admins(id),
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    hospital_id INT NOT NULL,
    slot_time DATETIME NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'NoShow') DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- ICU beds for emergency (pregnancy, etc.)
CREATE TABLE IF NOT EXISTS beds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    type ENUM('General', 'ICU', 'Maternity_ICU', 'NICU') NOT NULL,
    status ENUM('Available', 'Occupied', 'Maintenance') DEFAULT 'Available',
    current_patient_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (current_patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS bed_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    bed_id INT NOT NULL,
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    release_time DATETIME DEFAULT NULL,
    reason VARCHAR(255),
    status ENUM('Active', 'Released', 'Cancelled') DEFAULT 'Active',
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (bed_id) REFERENCES beds(id)
);

-- AI/ML Tables — Prediction Logs, Model Metadata, Training Logs
CREATE TABLE IF NOT EXISTS prediction_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    input_summary TEXT,
    prediction VARCHAR(255),
    confidence FLOAT DEFAULT 0.0,
    dashboard VARCHAR(100),
    user_id INT DEFAULT NULL, -- generic id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL UNIQUE,
    model_type VARCHAR(100),
    accuracy FLOAT DEFAULT 0.0,
    precision_score FLOAT DEFAULT 0.0,
    recall_score FLOAT DEFAULT 0.0,
    f1_score FLOAT DEFAULT 0.0,
    dataset_rows INT DEFAULT 0,
    training_duration FLOAT DEFAULT 0.0,
    version INT DEFAULT 1,
    file_path VARCHAR(255),
    last_trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS training_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    accuracy FLOAT DEFAULT NULL,
    duration_seconds FLOAT DEFAULT NULL,
    dataset_rows INT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'LOW',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    dashboard VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    model_name VARCHAR(100),
    confidence FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
