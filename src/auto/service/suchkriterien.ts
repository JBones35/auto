import { AutoArt } from '../entity/auto.entity.js'; /**
 * Typdefinition für `find` in `auto-read.service` und `QueryBuilder.build()`.
 */
export interface Suchkriterien {
    readonly fahrgestellnummer?: string;
    readonly marke?: string;
    readonly modell?: string;
    readonly baujahr?: number;
    readonly art?: AutoArt;
    readonly preis?: number;
    readonly esb?: string;
    readonly abs?: string;
    readonly airbag?: string;
    readonly parkassistent?: string;
    readonly motor?: string;
}
