DROP TABLE IF EXISTS stunts;

CREATE TABLE stunts(id INT, full_name VARCHAR(100), description VARCHAR(2000), count INT, PRIMARY KEY(id));

INSERT INTO stunts(id, full_name, description, count) VALUES (1, 'Prep', 'flyer is standing in the air, feet at shoulder-level', 0);
INSERT INTO stunts(id, full_name, description, count) VALUES (2, 'Extension', 'same thing as prep but feet is way above the heads of the bases', 0);
INSERT INTO stunts(id, full_name, description, count) VALUES (3, 'Cradle', 'throwing flyer up in the air and catching them in a cradle position', 0);
