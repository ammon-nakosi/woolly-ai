import * as path from 'path';
import * as os from 'os';

export function getLibraryPath(): string {
  return path.join(os.homedir(), '.counsel', 'library');
}

export function getCounselPath(): string {
  return path.join(os.homedir(), '.counsel');
}