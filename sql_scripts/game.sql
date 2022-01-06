DROP TABLE IF EXISTS questions;

CREATE TABLE questions(`id` INT NOT NULL, `question` VARCHAR(250) NULL, `answer` VARCHAR(250) NULL, PRIMARY KEY (`id`));
  
INSERT INTO questions(id, question, answer) VALUES (1, 'Where is Austin?', 'TX');

INSERT INTO questions(id, question, answer) VALUES (2, 'Which states border Washington D.C.?', 'VA, MD');

INSERT INTO questions(id, question, answer) VALUES (3, 'Which states start with A?', 'AK, AL, AZ, AR');
