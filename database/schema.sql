SET FOREIGN_KEY_CHECKS = 0;--disabilito controlli sulle chiavi esterne
DROP TABLE IF EXISTS chirurghi;
DROP TABLE IF EXISTS specialistiche;
DROP TABLE IF EXISTS interventi;
DROP TABLE IF EXISTS tavoli;
SET FOREIGN_KEY_CHECKS = 1;--riabilito i controlli sulle chiavi esterne

CREATE TABLE chirurghi(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(30) NOT NULL,
    cognome VARCHAR(30) NOT NULL
);

CREATE TABLE specialistiche(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE interventi(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descrizione TEXT NOT NULL,
    chirurgo INT NOT NULL,
    specialistica INT NOT NULL,
    setting TEXT NOT NULL,
    anestesia  TEXT NOT NULL,
    campo_operatorio TEXT NOT NULL,
    monouso TEXT NOT NULL,
    strumentario TEXT NOT NULL,
    FOREIGN KEY (chirurgo) REFERENCES chirurghi(id) ON DELETE RESTRICT,
    FOREIGN KEY (specialistica) REFERENCES specialistiche(id) ON DELETE RESTRICT
);

CREATE TABLE tavoli(
    id INT AUTO_INCREMENT PRIMARY KEY,
    url_immagine VARCHAR(255) NOT NULL,
    intervento INT NOT NULL,
    FOREIGN KEY (intervento) REFERENCES interventi(id) ON DELETE CASCADE
);