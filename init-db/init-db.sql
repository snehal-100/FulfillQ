-- Create tables if not exists to make sure seeding works regardless of Hibernate startup order
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    address VARCHAR(500) NOT NULL,
    capacity INT NOT NULL,
    manager_id INT
);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    description TEXT,
    image_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    available_stock INT NOT NULL,
    reserved_stock INT NOT NULL,
    version INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_warehouse_product UNIQUE(warehouse_id, product_id)
);

-- Insert Seed Data (Using INSERT IGNORE to prevent duplicate seed issues on restart)
INSERT IGNORE INTO users (id, name, email, password, role) VALUES
(1, 'Admin User', 'admin@fulfilliq.com', '$2a$10$tMhI02bY2Z0ZzM53.VlYfOveZ.Tj6BwZ8m5cI4QxK2hX1V.bEpy1C', 'ADMIN'), -- password: adminpassword (BCrypt hashed)
(2, 'Delhi Manager', 'manager@fulfilliq.com', '$2a$10$tMhI02bY2Z0ZzM53.VlYfOveZ.Tj6BwZ8m5cI4QxK2hX1V.bEpy1C', 'WAREHOUSE_MANAGER'), -- password: managerpassword
(3, 'Retail Customer', 'customer@fulfilliq.com', '$2a$10$tMhI02bY2Z0ZzM53.VlYfOveZ.Tj6BwZ8m5cI4QxK2hX1V.bEpy1C', 'CUSTOMER'); -- password: customerpassword

INSERT IGNORE INTO warehouses (id, name, latitude, longitude, address, capacity, manager_id) VALUES
(1, 'Delhi Hub', 28.6304, 77.2177, 'Connaught Place, New Delhi', 10000, 2),
(2, 'Mumbai Terminal', 19.0760, 72.8777, 'Andheri East, Mumbai', 15000, null),
(3, 'Bangalore Terminal', 12.9716, 77.5946, 'Koramangala, Bangalore', 12000, null),
(4, 'Hyderabad Hub', 17.3850, 78.4867, 'Hi-Tech City, Hyderabad', 14000, null),
(5, 'Kolkata Terminal', 22.5726, 88.3639, 'Salt Lake Sector V, Kolkata', 11000, null),
(6, 'Chennai Hub', 13.0827, 80.2707, 'Guindy Industrial Estate, Chennai', 13000, null),
(7, 'Pune Terminal', 18.5204, 73.8567, 'Hinjewadi Tech Park, Pune', 9000, null);

INSERT IGNORE INTO products (id, sku, name, price, brand, category, description, image_url) VALUES
(1, 'ZEN-LAP-016', 'ZenTech Laptop Pro 16', 109999.00, 'ZenTech', 'Electronics', 'High-performance laptop featuring 32GB RAM and 1TB NVMe SSD.', 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=500&q=80'),
(2, 'WEAR-ULT-001', 'Smartwatch Ultra Pro', 24999.00, 'Wearables', 'Gadgets', 'Advanced health tracking, built-in GPS, and 5-day battery life.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'),
(3, 'AUDIO-NCH-022', 'Studio Noise-Cancelling Headphones', 15999.00, 'AudioTech', 'Audio', 'Active noise cancellation with 40-hour wireless playtime.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'),
(4, 'KEY-ERG-099', 'Ergonomic Mechanical Keyboard', 9999.00, 'Keyboards', 'Peripherals', 'Split layout mechanical keyboard with quiet linear switches.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80'),
(5, 'DISP-UW-034', 'UltraWide Curved Monitor 34"', 39999.00, 'DisplayTech', 'Electronics', '34-inch curved monitor with 144Hz refresh rate.', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80'),
(6, 'HOME-AP-005', 'Smart Air Purifier X5', 19499.00, 'HomePure', 'Home Appliances', 'True HEPA filter covering 500 sq ft with smart IoT speed control.', 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=500&q=80'),
(7, 'HOME-VC-012', 'Cordless Vacuum Cleaner V12', 28999.00, 'CleanSweep', 'Home Appliances', 'Lightweight cordless stick vacuum with 150AW powerful suction.', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&q=80'),
(8, 'PER-MSE-502', 'Wireless Gaming Mouse G502', 6499.00, 'LogiPlay', 'Peripherals', '25K DPI sub-micron tracking, custom RGB, and 11 programmable buttons.', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80'),
(9, 'AUD-EBD-009', 'ANC Wireless Earbuds Lite', 4999.00, 'AudioTech', 'Audio', 'Compact IPX5 sweatproof earbuds with smart touch controls.', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80'),
(10, 'GAD-PBK-020', 'Portable Power Bank 20000mAh', 2499.00, 'PowerUp', 'Gadgets', '22.5W fast charge power bank with dual USB-C output ports.', 'https://images.unsplash.com/photo-1609592424109-dd8251e604f3?w=500&q=80');

INSERT IGNORE INTO warehouse_inventory (id, warehouse_id, product_id, available_stock, reserved_stock, version) VALUES
(1, 1, 1, 15, 0, 0), -- Delhi Hub: 15 Laptops
(2, 2, 1, 10, 0, 0), -- Mumbai: 10 Laptops
(3, 3, 1, 0, 0, 0),  -- Bangalore: 0 Laptops
(4, 4, 1, 8, 0, 0),  -- Hyderabad: 8 Laptops
(5, 5, 1, 3, 0, 0),  -- Kolkata: 3 Laptops
(6, 6, 1, 15, 0, 0), -- Chennai: 15 Laptops
(7, 7, 1, 2, 0, 0),  -- Pune: 2 Laptops

(8, 1, 2, 80, 0, 0), -- Delhi Hub: 80 Smartwatches
(9, 2, 2, 35, 0, 0), -- Mumbai: 35 Smartwatches
(10, 3, 2, 0, 0, 0), -- Bangalore: 0 Smartwatches

(11, 4, 3, 45, 0, 0), -- Hyderabad: 45 Headphones
(12, 5, 3, 50, 0, 0), -- Kolkata: 50 Headphones

(13, 6, 5, 20, 0, 0), -- Chennai: 20 Monitors
(14, 7, 6, 30, 0, 0), -- Pune: 30 Air Purifiers
(15, 1, 7, 12, 0, 0); -- Delhi: 12 Vacuums
