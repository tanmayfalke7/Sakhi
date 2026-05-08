const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Tanmaychasql@123',
  database: process.env.DB_NAME || 'sakhi_db',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
};

let pool;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

const query = async (sql, params = []) => {
  const [rows] = await getPool().execute(sql, params);
  return rows;
};

const initializeSchema = async () => {
  const server = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
  });

  await server.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await server.end();

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('patient', 'doctor') NOT NULL DEFAULT 'patient',
      phone VARCHAR(40) NOT NULL DEFAULT '',
      avatar_url VARCHAR(500) NOT NULL DEFAULT '',
      profile JSON NULL,
      last_login_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email),
      KEY users_role_idx (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      assessment_type ENUM('pcos', 'thyroid') NOT NULL,
      input_payload JSON NOT NULL,
      risk_percentage DECIMAL(5,2) NOT NULL,
      risk_level ENUM('Low', 'Moderate', 'High') NOT NULL,
      recommendation TEXT NOT NULL,
      model_version VARCHAR(100) NOT NULL DEFAULT 'python-service-v1',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY predictions_user_idx (user_id),
      KEY predictions_assessment_idx (assessment_type),
      CONSTRAINT predictions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      patient_id INT UNSIGNED NOT NULL,
      doctor_id INT UNSIGNED NOT NULL,
      appointment_date DATETIME NOT NULL,
      slot_label VARCHAR(40) NOT NULL,
      consultation_mode ENUM('online', 'clinic') NOT NULL DEFAULT 'online',
      concern VARCHAR(255) NOT NULL,
      patient_notes TEXT NULL,
      status ENUM('requested', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'requested',
      doctor_remarks TEXT NULL,
      completed_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY appointments_patient_idx (patient_id),
      KEY appointments_doctor_idx (doctor_id),
      KEY appointments_date_idx (appointment_date),
      KEY appointments_status_idx (status),
      CONSTRAINT appointments_patient_fk FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT appointments_doctor_fk FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      author_id INT UNSIGNED NOT NULL,
      content TEXT NOT NULL,
      image_url VARCHAR(500) NOT NULL DEFAULT '',
      status ENUM('active', 'removed') NOT NULL DEFAULT 'active',
      moderation_reason VARCHAR(255) NOT NULL DEFAULT '',
      moderated_by INT UNSIGNED NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY community_posts_author_idx (author_id),
      KEY community_posts_status_idx (status),
      CONSTRAINT community_posts_author_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT community_posts_moderator_fk FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS community_post_likes (
      post_id INT UNSIGNED NOT NULL,
      user_id INT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (post_id, user_id),
      CONSTRAINT community_likes_post_fk FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
      CONSTRAINT community_likes_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doctor_notes (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      doctor_id INT UNSIGNED NOT NULL,
      patient_id INT UNSIGNED NOT NULL,
      appointment_id INT UNSIGNED NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      follow_up_date DATE NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY doctor_notes_doctor_idx (doctor_id),
      KEY doctor_notes_patient_idx (patient_id),
      CONSTRAINT doctor_notes_doctor_fk FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT doctor_notes_patient_fk FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT doctor_notes_appointment_fk FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      type ENUM('prediction', 'appointment', 'community', 'system') NOT NULL DEFAULT 'system',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY notifications_user_idx (user_id),
      CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const connectDB = async () => {
  await initializeSchema();
  await query('SELECT 1');
  console.log(`MySQL connected: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
  return getPool();
};

module.exports = connectDB;
module.exports.getPool = getPool;
module.exports.query = query;
