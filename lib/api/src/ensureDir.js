import { request } from '../tools/smb2-forge';

const ensureOneDir = async function(path, connection) {
  try {
    const fileOrDir = await request('open', { path }, connection);
    if (fileOrDir.FileAttributes.readIntBE(0, 1) === 0x00000010) {
      // See http://download.microsoft.com/DOWNLOAD/9/5/E/95EF66AF-9026-4BB0-A41D-A4F81802D92C/[MS-FSCC].pdf Section 2.6
      await request('close', fileOrDir, connection);
    } else {
      throw new Error(`${path} exists but is not a directory`);
    }
  } catch (err) {
    if (err.code === 'STATUS_OBJECT_NAME_NOT_FOUND') {
      try {
        await request('create_folder', { path }, connection);
      } catch (err) {
        if (err.code !== 'STATUS_OBJECT_NAME_COLLISION') {
          throw err;
        }
      }
    } else {
      throw err;
    }
  }
};

export default async function(path, cb) {
  const structure = path.split('\\');
  const base = [];
  try {
    while (structure.length) {
      base.push(structure.shift());
      const basePath = base.join('\\');
      if (!basePath.length) {
        continue;
      }
      await ensureOneDir(basePath, this);
    }
    cb(null);
  } catch (error) {
    cb(error);
  }
}
