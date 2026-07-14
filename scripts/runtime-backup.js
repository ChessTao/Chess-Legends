const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = path.resolve(__dirname, "..");
const runtimeDir = path.join(root, ".runtime");
const backupDir = path.join(runtimeDir, "backups");
const runtimeFiles = [
  "profiles.json",
  "sessions.json",
  "online-rooms.json",
  "server-errors.log"
];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosDate, dosTime };
}

function uint16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  entries.forEach((entry) => {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const data = entry.data;
    const compressed = zlib.deflateRawSync(data);
    const checksum = crc32(data);

    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(8),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(compressed.length),
      uint32(data.length),
      uint16(nameBuffer.length),
      uint16(0),
      nameBuffer
    ]);

    localParts.push(localHeader, compressed);

    centralParts.push(Buffer.concat([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(8),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(compressed.length),
      uint32(data.length),
      uint16(nameBuffer.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBuffer
    ]));

    offset += localHeader.length + compressed.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(entries.length),
    uint16(entries.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0)
  ]);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

if (!fs.existsSync(runtimeDir)) {
  console.error(".runtime does not exist yet. Start the server once before creating a backup.");
  process.exit(1);
}

const entries = runtimeFiles
  .map((fileName) => {
    const filePath = path.join(runtimeDir, fileName);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return {
      name: fileName,
      data: fs.readFileSync(filePath)
    };
  })
  .filter(Boolean);

if (!entries.length) {
  console.error("No runtime files found to back up.");
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });

const backupPath = path.join(backupDir, `runtime-backup-${timestamp()}.zip`);
fs.writeFileSync(backupPath, createZip(entries));

console.log(`Created ${path.relative(root, backupPath)}`);
entries.forEach((entry) => {
  console.log(`- ${entry.name} (${entry.data.length} bytes)`);
});
