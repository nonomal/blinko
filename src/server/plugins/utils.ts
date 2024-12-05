import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getGlobalConfig } from "../routers/config";
import { UPLOAD_FILE_PATH } from "@/lib/constant";
import fs, { unlink, stat, writeFile } from 'fs/promises';
import path from 'path';
import { cache } from "@/lib/cache";
import sharp from "sharp";
import { prisma } from "../prisma";

export class FileService {
  public static async getS3Client() {
    const config = await getGlobalConfig();
    return cache.wrap(`${config.s3Endpoint}-${config.s3Region}-${config.s3Bucket}-${config.s3AccessKeyId}-${config.s3AccessKeySecret}`, async () => {
      const s3ClientInstance = new S3Client({
        endpoint: config.s3Endpoint,
        region: config.s3Region,
        credentials: {
          accessKeyId: config.s3AccessKeyId,
          secretAccessKey: config.s3AccessKeySecret,
        },
        forcePathStyle: true,
      });
      return { s3ClientInstance, config };
    }, { ttl: 60 * 60 * 86400 * 1000 })
  }

  private static async writeFileSafe(baseName: string, extension: string, buffer: Buffer) {
    let filename = encodeURIComponent(`${baseName}${extension}`);
    try {
      const exists = await stat(path.join(process.cwd(), `${UPLOAD_FILE_PATH}/` + filename));
      if (exists) {
        baseName = baseName + '_copy';
        return await this.writeFileSafe(baseName, extension, buffer);
      }
    } catch (error) {
      await writeFile(
        path.join(process.cwd(), `${UPLOAD_FILE_PATH}/` + filename),
        //@ts-ignore
        buffer
      );
      await this.createThumbnail(filename, extension);
      return filename;
    }
  }

  private static async createThumbnail(filename: string, extension: string) {
    try {
      if ('jpeg/jpg/png/bmp/tiff/tif/webp/svg'.includes(extension.replace('.', '')?.toLowerCase() ?? '')) {
        await sharp(`${UPLOAD_FILE_PATH}/` + filename)
          .resize(500, 500)
          .toFile(UPLOAD_FILE_PATH + '/thumbnail_' + filename);
      }
    } catch (error) {
      console.error("Error thumbnail occurred ", error);
    }
  }

  static async uploadFile(buffer: Buffer, originalName: string) {
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const config = await getGlobalConfig();
    if (config.objectStorage === 's3') {
      const { s3ClientInstance } = await this.getS3Client();
      const command = new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: baseName + extension,
        Body: buffer,
      });
      await s3ClientInstance.send(command);
      const s3Url = `/api/s3file/${baseName}${extension}`;
      return { filePath: s3Url, fileName: baseName + extension };
    } else {
      const filename = await this.writeFileSafe(baseName, extension, buffer);
      return { filePath: `/api/file/${filename}`, fileName: filename };
    }
  }

  static async deleteFile(api_attachment_path: string) {
    const config = await getGlobalConfig();
    if (config.objectStorage === 's3') {
      const { s3ClientInstance } = await this.getS3Client();
      const fileName = api_attachment_path.replace('/api/s3file/', "");
      const command = new DeleteObjectCommand({
        Bucket: config.s3Bucket,
        Key: fileName,
      });
      await s3ClientInstance.send(command);
    } else {
      const filepath = path.join(process.cwd(), `${UPLOAD_FILE_PATH}/` + api_attachment_path.replace('/api/file/', ""));
      const attachmentPath = await prisma.attachments.findFirst({ where: { path: api_attachment_path } })
      if (attachmentPath) {
        await prisma.attachments.delete({ where: { id: attachmentPath.id } })
      }
      if ('jpeg/jpg/png/bmp/tiff/tif/webp/svg'.includes(api_attachment_path.split('.')[1]?.replace('.', '')?.toLowerCase() ?? '')) {
        try {
          await unlink(path.join(process.cwd(), `${UPLOAD_FILE_PATH}/thumbnail_` + api_attachment_path.replace('/api/file/', "")));
        } catch (error) {
        }
      }
      await unlink(filepath);
    }
  }

  static async getFile(filePath: string) {
    const config = await getGlobalConfig();
    const tempPath = path.join(UPLOAD_FILE_PATH, path.basename(filePath.replace('/api/file/', '').replace('/api/s3file/', '')));
    if (config.objectStorage === 's3') {
      const { s3ClientInstance } = await this.getS3Client();
      const command = new GetObjectCommand({
        Bucket: config.s3Bucket,
        Key: filePath.replace('/api/file/', '').replace('/api/s3file/', ''),
      });

      const response = await s3ClientInstance.send(command);
      const chunks: any[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      //@ts-ignore
      await fs.writeFile(tempPath, Buffer.concat(chunks));
      return tempPath;
    }
    else {
      //like /blinko/files/xxxx.db
      return path.join(UPLOAD_FILE_PATH, filePath.replace('/api/file/', '').replace('/api/s3file/', ''));
    }
  }
}

