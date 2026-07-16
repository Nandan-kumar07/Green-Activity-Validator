/** Read DateTimeOriginal (EXIF tag 0x9003) from a JPEG without adding a dependency. */
export function getPhotoTakenAt(buffer: Buffer): Date | null {
  if (buffer.length < 12 || buffer.readUInt16BE(0) !== 0xffd8) return null;

  for (let offset = 2; offset + 4 < buffer.length;) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > buffer.length) return null;

    if (marker === 0xe1 && buffer.subarray(offset + 4, offset + 10).toString("ascii") === "Exif\0\0") {
      return readExifDate(buffer.subarray(offset + 10, offset + 2 + length));
    }
    offset += length + 2;
  }
  return null;
}

function readExifDate(tiff: Buffer): Date | null {
  if (tiff.length < 8) return null;
  const littleEndian = tiff.subarray(0, 2).toString("ascii") === "II";
  if (!littleEndian && tiff.subarray(0, 2).toString("ascii") !== "MM") return null;
  const u16 = (offset: number) => littleEndian ? tiff.readUInt16LE(offset) : tiff.readUInt16BE(offset);
  const u32 = (offset: number) => littleEndian ? tiff.readUInt32LE(offset) : tiff.readUInt32BE(offset);
  if (u16(2) !== 42) return null;

  const getEntries = (offset: number): Array<{ tag: number; type: number; count: number; value: number }> => {
    if (offset + 2 > tiff.length) return [];
    const count = u16(offset);
    if (offset + 2 + count * 12 > tiff.length) return [];
    return Array.from({ length: count }, (_, index) => {
      const entry = offset + 2 + index * 12;
      return { tag: u16(entry), type: u16(entry + 2), count: u32(entry + 4), value: u32(entry + 8) };
    });
  };

  const ifd0 = getEntries(u32(4));
  const exifPointer = ifd0.find((entry) => entry.tag === 0x8769)?.value;
  if (exifPointer === undefined) return null;
  const original = getEntries(exifPointer).find((entry) => entry.tag === 0x9003 && entry.type === 2);
  if (!original || original.value + original.count > tiff.length) return null;

  const raw = tiff.subarray(original.value, original.value + original.count).toString("ascii").replace(/\0.*$/, "");
  const match = raw.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const result = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, +second));
  return Number.isNaN(result.getTime()) ? null : result;
}
