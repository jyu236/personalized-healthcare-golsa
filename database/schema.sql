-- Patients table
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    age INT,
    gender VARCHAR(10),
    height FLOAT,
    weight FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical history table
CREATE TABLE medical_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    condition_name VARCHAR(200),
    diagnosis_date DATE,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Patient conditions table
CREATE TABLE patient_conditions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    condition_type VARCHAR(100),
    severity VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Recommendations table
CREATE TABLE recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    condition_type VARCHAR(100),
    title VARCHAR(200),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 