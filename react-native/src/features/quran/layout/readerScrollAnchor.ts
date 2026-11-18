/** Exact native row measurements; no average-height estimate becomes a reading position. */
export class ReaderScrollAnchor {
  private rows: (number | undefined)[] = [];
  private header: number | undefined;
  private footer: number | undefined;
  private viewport = 0;
  private content = 0;

  constructor(
    readonly index: number,
    readonly count: number,
    readonly generation: number,
    private readonly bottomPadding: number,
  ) {}

  measureRow(index: number, height: number) {
    if (index >= 0 && index < this.count && Number.isFinite(height) && height > 0)
      this.rows[index] = height;
  }

  measureHeader(height: number) {
    if (Number.isFinite(height) && height >= 0) this.header = height;
  }

  measureFooter(height: number) {
    if (Number.isFinite(height) && height >= 0) this.footer = height;
  }

  measureViewport(height: number) {
    if (Number.isFinite(height) && height > 0) this.viewport = height;
  }

  measureContent(height: number) {
    if (Number.isFinite(height) && height > 0) this.content = height;
  }

  rowHeight(index: number): number | undefined {
    return this.rows[index];
  }

  measuredPrefix(): number {
    let index = 0;
    while (index < this.count && this.rows[index] !== undefined) index++;
    return index;
  }

  offset(): number | null {
    if (this.index < 0 || this.index >= this.count || this.header === undefined || !this.viewport)
      return null;
    let offset = this.index === 0 ? 0 : this.header;
    for (let index = 0; index <= this.index; index++) {
      const height = this.rows[index];
      if (height === undefined) return null;
      if (index < this.index) offset += height;
    }
    // A last verse may physically fit only at the bottom of the viewport. Clamp
    // only when every row and the footer have actual measurements.
    const allMeasured =
      this.footer !== undefined &&
      Array.from({ length: this.count }, (_, index) => this.rows[index]).every(
        (height) => height !== undefined,
      );
    if (allMeasured) {
      const total =
        this.header +
        this.rows.reduce<number>((sum, height) => sum + (height ?? 0), 0) +
        this.footer! +
        this.bottomPadding;
      if (this.content + 2 < total) return null;
      return Math.min(offset, Math.max(0, total - this.viewport));
    }
    return this.content >= offset + this.viewport ? offset : null;
  }

  confirms(nativeOffset: number): boolean {
    const offset = this.offset();
    return offset !== null && Number.isFinite(nativeOffset) && Math.abs(nativeOffset - offset) <= 2;
  }
}
