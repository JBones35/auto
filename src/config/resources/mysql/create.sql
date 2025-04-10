-- Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
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

-- https://www.atlassian.com/data/databases/understanding-strorage-sizes-for-mysql-text-data-types
-- https://dev.mysql.com/doc/refman/9.2/en/blob.html

-- https://dev.mysql.com/doc/refman/9.2/en/create-table.html
-- https://dev.mysql.com/doc/refman/9.2/en/information-schema-innodb-tablespaces-table.html
-- https://dev.mysql.com/doc/refman/9.2/en/innodb-row-format.html
-- https://dev.mysql.com/doc/refman/9.2/en/data-types.html
-- https://dev.mysql.com/doc/refman/9.2/en/integer-types.html
-- BOOLEAN = TINYINT(1) mit TRUE, true, FALSE, false
-- https://dev.mysql.com/doc/refman/9.2/en/boolean-literals.html
-- https://dev.mysql.com/doc/refman/9.2/en/date-and-time-types.html
-- TIMESTAMP nur zwischen '1970-01-01 00:00:01' und '2038-01-19 03:14:07'
-- https://dev.mysql.com/doc/refman/9.2/en/date-and-time-types.html
-- https://dev.mysql.com/doc/refman/9.2/en/create-table-check-constraints.html
-- https://dev.mysql.com/blog-archive/mysql-8-0-16-introducing-check-constraint
-- UNIQUE: impliziter Index als B+ Baum

CREATE TABLE IF NOT EXISTS auto (
    id            INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    version       INT NOT NULL DEFAULT 0,
    fahrgestellnummer  CHAR(35) UNIQUE NOT NULL,
    marke         VARCHAR(40) NOT NULL,
    modell        VARCHAR(40) NOT NULL,
    baujahr       INT,
    art           ENUM('PKW', 'LKW'),
    preis         DECIMAL(8,2) NOT NULL,
    sicherheitsmerkmale VARCHAR(128),
    erzeugt       DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    aktualisiert  DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
) TABLESPACE autospace ROW_FORMAT=COMPACT;
ALTER TABLE auto AUTO_INCREMENT=1000;

CREATE TABLE IF NOT EXISTS motor (
    id          INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(40) NOT NULL,
    ps         INT,
    zylinder   INT,
    drehzahl   DECIMAL(20,2),
    auto_id     INT UNIQUE NOT NULL references auto(id)
) TABLESPACE autospace ROW_FORMAT=COMPACT;
ALTER TABLE titel AUTO_INCREMENT=1000;

CREATE TABLE IF NOT EXISTS reperatur (
    id              INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    kosten          DECIMAL(8,2) DEFAULT 0,
    mechaniker      VARCHAR(16) NOT NULL,
    datum           DATE DEFAULT (CURRENT_TIMESTAMP)
    auto_id         INT NOT NULL references auto(id),

    INDEX reperatur_auto_id_idx(auto_id)
) TABLESPACE autospace ROW_FORMAT=COMPACT;
ALTER TABLE reperatur AUTO_INCREMENT=1000;

CREATE TABLE IF NOT EXISTS auto_file (
    id              INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    data            LONGBLOB NOT NULL,
    filename        VARCHAR(128) NOT NULL,
    mimetype        VARCHAR(32) NOT NULL,
    auto_id         INT UNIQUE NOT NULL references auto(id)
) TABLESPACE autospace ROW_FORMAT=COMPACT;
ALTER TABLE auto_file AUTO_INCREMENT=1000;
