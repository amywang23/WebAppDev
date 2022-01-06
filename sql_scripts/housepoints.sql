DROP TABLE IF EXISTS points;
DROP TABLE IF EXISTS vusers;
DROP TABLE IF EXISTS vhouses;

CREATE TABLE vhouses(`house_id` INT NOT NULL, `house_name` VARCHAR(135) NULL, PRIMARY KEY (`house_id`));
  
CREATE TABLE vusers(`user_id` INT NOT NULL AUTO_INCREMENT, `user_name` VARCHAR(45) NULL, `house_id` INT NULL, PRIMARY KEY (`user_id`));

CREATE TABLE points(`point_id` INT NOT NULL AUTO_INCREMENT, `from_username` VARCHAR(45) NULL, `to_vuserid` INT NULL, `amount` INT NULL, PRIMARY KEY (`point_id`));
  
INSERT INTO vhouses(house_id, house_name) VALUES (1, 'Dauntless');
INSERT INTO vhouses(house_id, house_name) VALUES (2, 'Amity');
INSERT INTO vhouses(house_id, house_name) VALUES (3, 'Abnegation');
INSERT INTO vhouses(house_id, house_name) VALUES (4, 'Candor');
INSERT INTO vhouses(house_id, house_name) VALUES (5, 'Erudite');
