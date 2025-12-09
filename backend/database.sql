CREATE DATABASE lovable_db;

-- Connect to the database
\c lovable_db;

-- Create Users table (Essential for self-hosted auth)
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create your specific project tables (Example)
CREATE TABLE todos(
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);