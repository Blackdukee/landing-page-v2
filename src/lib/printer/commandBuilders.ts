/**
 * TSPL Command Builder
 * Used for Thermal Barcode / Price Tag Label printing on Xprinter XP-Q371U and compatible models.
 */
export class TSPLBuilder {
  private commands: string[] = [];

  constructor(widthMm = 50, heightMm = 30) {
    this.commands.push(`SIZE ${widthMm} mm, ${heightMm} mm`);
    this.commands.push(`GAP 2 mm, 0 mm`);
    this.commands.push(`DIRECTION 1`);
    this.commands.push(`CLS`);
  }

  addText(x: number, y: number, text: string, font = 'TSS24.BF2', xMulti = 1, yMulti = 1) {
    const clean = text.replace(/"/g, '\\"');
    this.commands.push(`TEXT ${x},${y},"${font}",0,${xMulti},${yMulti},"${clean}"`);
    return this;
  }

  addBarcode(x: number, y: number, code: string, height = 40, type = '128') {
    this.commands.push(`BARCODE ${x},${y},"${type}",${height},1,0,2,2,"${code}"`);
    return this;
  }

  addQrCode(x: number, y: number, content: string, cellWidth = 4) {
    this.commands.push(`QRCODE ${x},${y},L,${cellWidth},A,0,"${content}"`);
    return this;
  }

  build(copies = 1): Uint8Array {
    this.commands.push(`PRINT ${copies},1`);
    this.commands.push('');
    const fullString = this.commands.join('\r\n');
    return new TextEncoder().encode(fullString);
  }
}

/**
 * ESC/POS Command Builder
 * Used for Continuous Thermal Receipt printing with cutter support.
 */
export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    // ESC @ (Initialize printer)
    this.buffer.push(0x1b, 0x40);
  }

  align(alignment: 'left' | 'center' | 'right') {
    const n = alignment === 'left' ? 0 : alignment === 'center' ? 1 : 2;
    this.buffer.push(0x1b, 0x61, n);
    return this;
  }

  bold(enable: boolean) {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  text(str: string) {
    const bytes = new TextEncoder().encode(str);
    bytes.forEach((b) => this.buffer.push(b));
    return this;
  }

  lineFeed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  cut() {
    // GS V 0 (Full Cut)
    this.buffer.push(0x1d, 0x56, 0x00);
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
