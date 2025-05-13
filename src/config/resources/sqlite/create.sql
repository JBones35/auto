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

-- https://docs.python.org/dev/library/sqlite3.html#sqlite3-cli
-- sqlite3 buch.sqlite

-- https://sqlite.org/lang_createtable.html
-- https://sqlite.org/stricttables.html ab 3.37.0
-- https://sqlite.org/syntax/column-constraint.html
-- https://sqlite.org/autoinc.html
-- https://sqlite.org/stricttables.html: INT, INTEGER, REAL, TEXT
-- https://sqlite.org/lang_createindex.html
-- https://stackoverflow.com/questions/37619526/how-can-i-change-the-default-sqlite-timezone

CREATE TABLE IF NOT EXISTS auto (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    version        INTEGER NOT NULL DEFAULT 0,
    fahrgestellnummer           TEXT NOT NULL UNIQUE,
    modell         TEXT NOT NULL,
    marke          TEXT NOT NULL,
    baujahr        INTEGER,
    art            TEXT,
    preis          REAL,
    sicherheitsmerkmale  TEXT,
    erzeugt        TEXT NOT NULL,
    aktualisiert   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS auto_fahrgestellnummer_idx ON auto(fahrgestellnummer);

CREATE TABLE IF NOT EXISTS motor (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    ps          INTEGER,
    zylinder    INTEGER,
    drehzahl    REAL,
    auto_id     INTEGER NOT NULL UNIQUE REFERENCES auto
);


CREATE TABLE IF NOT EXISTS reperatur (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    kosten          REAL,
    mechaniker      TEXT NOT NULL,
    datum           TEXT,
    auto_id         INTEGER NOT NULL REFERENCES auto
);
CREATE INDEX IF NOT EXISTS abbildung_auto_id_idx ON abbildung(auto_id);
