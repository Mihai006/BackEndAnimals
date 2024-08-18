create database Animals;

use Animals;

create table users(
id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
email varchar(255) UNIQUE,
username varchar(255),
password varchar(255)
);

select * from users;


CREATE TABLE animals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    breed VARCHAR(255) NOT NULL,
    animal_type ENUM('cat', 'fish', 'dog') NOT NULL,
    image_url VARCHAR(255) NOT NULL
);

show tables;

select * from animals;
