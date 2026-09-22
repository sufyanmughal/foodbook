/**
 * De 14 wettelijk erkende allergenen (§3.4).
 *
 * Vastgelegd bij de installatie en daarna zelden gewijzigd. De `wettelijkeCode` is bedoeld
 * voor audit-traceerbaarheid: hij komt op de allergenenlijst naast de Nederlandse naam.
 */
export const ALLERGENEN = [
  { naam: 'Glutenbevattende granen', wettelijkeCode: 'GLUTEN' },
  { naam: 'Schaaldieren', wettelijkeCode: 'SCHAALDIEREN' },
  { naam: 'Eieren', wettelijkeCode: 'EI' },
  { naam: 'Vis', wettelijkeCode: 'VIS' },
  { naam: 'Aardnoten (pinda)', wettelijkeCode: 'AARDNOTEN' },
  { naam: 'Soja', wettelijkeCode: 'SOJA' },
  { naam: 'Melk', wettelijkeCode: 'MELK' },
  { naam: 'Noten', wettelijkeCode: 'NOTEN' },
  { naam: 'Selderij', wettelijkeCode: 'SELDERIJ' },
  { naam: 'Mosterd', wettelijkeCode: 'MOSTERD' },
  { naam: 'Sesamzaad', wettelijkeCode: 'SESAMZAAD' },
  { naam: 'Zwaveldioxide en sulfieten', wettelijkeCode: 'SULFIET' },
  { naam: 'Lupine', wettelijkeCode: 'LUPINE' },
  { naam: 'Weekdieren', wettelijkeCode: 'WEEKDIEREN' },
] as const;

/**
 * Btw-tarieven (§3.5). Catering is doorgaans 9%; alcohol en enkele artikelen vallen onder 21%.
 * Btw staat per product, niet globaal, omdat één menukaart beide tarieven kan bevatten.
 */
export const BTW_TARIEVEN = [
  { naam: 'Laag (9%)', percentage: 9, standaard: true },
  { naam: 'Hoog (21%)', percentage: 21, standaard: false },
] as const;
