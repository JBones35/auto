-- Copyright (C) 2023 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- "Konzeption und Realisierung eines aktiven Datenbanksystems"
-- "Verteilte Komponenten und Datenbankanbindung"
-- "Design Patterns"
-- "Freiburger Chorauto"
-- "Maschinelle Lernverfahren zur Behandlung von Bonitätsrisiken im Mobilfunkgeschäft"
-- "Software Pioneers"

INSERT INTO auto(id, version, fahrgestellnummer, marke, modell, baujar, art, preis, sicherheitsmerkmale, erzeugt, aktualisiert) VALUES
    (1,0,'WVWZZZ1JZXW000001', 'vw', 'polo', 2020, 'PKW', 20000, 'ABS,ESB', DEFAULT, DEFAULT);
INSERT INTO auto(id, version, fahrgestellnummer, marke, modell, baujar, art, preis, sicherheitsmerkmale, erzeugt, aktualisiert) VALUES
    (10,0,'WVWZZZ1JZXW000002', 'bmw', '1er', 2020, 'PKW', 20000, 'PARKASSISTENT,ESB', DEFAULT, DEFAULT);
INSERT INTO auto(id, version, fahrgestellnummer, marke, modell, baujar, art, preis, sicherheitsmerkmale, erzeugt, aktualisiert) VALUES
    (30,0,'WVWZZZ1JZXW000003', 'mercedes', 'a-klasse', 2023, 'PKW', 2000020, 'AIRBAG,ESB', DEFAULT, DEFAULT);
INSERT INTO auto(id, version, fahrgestellnummer, marke, modell, baujar, art, preis, sicherheitsmerkmale, erzeugt, aktualisiert) VALUES
    (20,0,'WVWZZZ1JZXW000004', 'audi', 'a4', 2020, 'PKW', 20000, 'ABS,ESB', DEFAULT, DEFAULT);
INSERT INTO auto(id, version, fahrgestellnummer, marke, modell, baujar, art, preis, sicherheitsmerkmale, erzeugt, aktualisiert) VALUES
    (40,0,'WVWZZZ1JZXW000005', 'mazda', 'mx', 2025, 'PKW', 230000, 'ESB', DEFAULT, DEFAULT);
INSERT INTO auto(id, version, fahrgestellnummer, marke, modell, baujar, art, preis, sicherheitsmerkmale, erzeugt, aktualisiert) VALUES
    (50,0,'WVWZZZ1JZXW000006', 'tesla', 'cybertruck', 2025, 'LKW', 20000, 'ABS,ESB', DEFAULT, DEFAULT);
    
INSERT INTO motor(id, name, ps, zylinder, drehzahl, auto_id) VALUES
    (1,'Alpha', 100, 4, 13333, 1);
INSERT INTO motor(id, name, ps, zylinder, drehzahl, auto_id) VALUES
    (2,'Beta', 340, 6, 13333, 10);
INSERT INTO motor(id, name, ps, zylinder, drehzahl, auto_id) VALUES
    (3,'Gammy', 400, 9, 13333, 20);

INSERT INTO abbildung(id, beschriftung, content_type, auto_id) VALUES
    (1,'Abb. 1','img/png',1);
INSERT INTO abbildung(id, beschriftung, content_type, auto_id) VALUES
    (20,'Abb. 1','img/png',20);
INSERT INTO abbildung(id, beschriftung, content_type, auto_id) VALUES
    (21,'Abb. 2','img/png',20);
INSERT INTO abbildung(id, beschriftung, content_type, auto_id) VALUES
    (30,'Abb. 1','img/png',30);
INSERT INTO abbildung(id, beschriftung, content_type, auto_id) VALUES
    (31,'Abb. 2','img/png',30);
INSERT INTO abbildung(id, beschriftung, content_type, auto_id) VALUES
    (40,'Abb. 1','img/png',40);
INSERT INTO abbildung(id, beschriftung, content_type, auto_id) VALUES
    (50,'Abb. 1','img/png',50);
INSERT INTO abbildung(id, beschriftung, content_type, auto_id) VALUES
    (60,'Abb. 1','img/png',60);
