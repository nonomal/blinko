import { UPLOAD_FILE_PATH } from '@/lib/constant';
import sqlite3 from 'sqlite3';
import { prisma } from '../prisma';
import { adminCaller } from '../routers/_app';
import fs from 'fs/promises'
import { FileService } from './utils';
type Memo = {
  id: string,
  created_ts: number,
  updated_ts: number,
  content: string,
}
export type ProgressResult = {
  type: 'success' | 'skip' | 'error';
  content?: string;
  error?: unknown;
}


export class Memos {
  private db: sqlite3.Database
  async initDB(filePath: string) {
    const dbPath = await FileService.getFile(filePath);
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('can not connect to memos db', err.message);
      }
    });
    return dbPath;
  }
  closeDB() {
    this.db.close()
  }

  async *importMemosDB(): AsyncGenerator<ProgressResult & { progress?: { current: number, total: number } }, void, unknown> {
    const rows: Memo[] = await new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM memo`, (err, rows: Memo[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });

    const total = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const blinkoNote = await prisma.notes.findFirst({ where: { content: row?.content } });
        if (blinkoNote) {
          yield { type: 'skip', content: row?.content, progress: { current: i + 1, total } };
          continue;
        }

        const note = await adminCaller.notes.upsert({
          content: row?.content,
        });

        if (note) {
          await prisma.notes.update({
            where: { id: note.id },
            data: {
              createdAt: new Date(row!.created_ts * 1000),
              updatedAt: new Date(row!.updated_ts * 1000),
            }
          });
          yield {
            type: 'success',
            content: note.content.slice(0, 30),
            progress: { current: i + 1, total }
          };
        }
      } catch (error) {
        console.error('import memos error->', error);
        yield {
          type: 'error',
          content: row?.content.slice(0, 30),
          error,
          progress: { current: i + 1, total }
        };
      }
    }
  }

  async *importFiles(): AsyncGenerator<ProgressResult & { progress?: { current: number, total: number } }, void, unknown> {
    const resources = await new Promise<Array<{
      memo_id: number,
      filename: string,
      blob: string,
      size: number,
    }>>((resolve, reject) => {
      const results: any[] = [];
      this.db.each(
        `SELECT * FROM resource`,
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          results.push(row);
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    });

    const total = resources.length;
    for (let i = 0; i < resources.length; i++) {
      const row = resources[i];
      const memo: Memo = await new Promise<Memo>((resolve, reject) => {
        this.db.get(`SELECT * FROM memo WHERE id = ${row?.memo_id}`, (err, memo: Memo) => {
          if (err) reject(err);
          else resolve(memo);
        });
      });

      if (!memo) continue;

      const node = await prisma.notes.findFirst({ where: { content: memo.content } });
      if (!node) continue;

      try {
        const attachment = await prisma.attachments.findFirst({ where: { name: row?.filename } });
        if (attachment) {
          yield { type: 'skip', content: row?.filename, progress: { current: i + 1, total } };
          continue;
        }

        const fileName = row?.filename ?? '';
        const filePath = UPLOAD_FILE_PATH + '/' + fileName;
        let newFileName = fileName.split('/').pop() || '';
        const hasSameFile = await fs.access(filePath).then(() => true).catch(() => false);
        if (row?.blob) {
          if (hasSameFile) {
            const extension = fileName.split('.').pop() || '';
            const originalName = fileName.split('.').slice(0, -1).join('.');
            newFileName = `${originalName}_${Date.now()}.${extension}`;
            await fs.writeFile(UPLOAD_FILE_PATH + '/' + newFileName, row!.blob);
          } else {
            await fs.writeFile(filePath, row!.blob);
          }
        }

        await prisma.attachments.create({
          data: {
            name: row?.filename,
            path: '/api/file/' + newFileName,
            size: row?.size,
            noteId: node.id,
          }
        });
        yield {
          type: 'success',
          content: row?.filename,
          progress: { current: i + 1, total }
        };
      } catch (error) {
        console.error('import files error->', error);
        yield {
          type: 'error',
          content: row?.filename,
          error,
          progress: { current: i + 1, total }
        };
      }
    }
  }
}
