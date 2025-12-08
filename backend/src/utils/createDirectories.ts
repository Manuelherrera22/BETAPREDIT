import fs from 'fs';
import path from 'path';

export function createDirectories() {
  const directories = [
    path.join(process.cwd(), 'logs'),
  ];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

