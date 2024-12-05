import { UPLOAD_FILE_PATH } from "@/lib/constant";
import { prisma } from "@/server/prisma";
import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getGlobalConfig } from "@/server/routers/config";
import { FileService } from "@/server/plugins/utils";


//attachment_path like /api/file/123.png
export const POST = async (req: Request, res: NextResponse) => {
  try {
    const { attachment_path } = await req.json();
    await FileService.deleteFile(attachment_path);
    return NextResponse.json({ Message: "Success", status: 200 });
  } catch (error) {
    return NextResponse.json({ Message: "Success", status: 200 });
  }
};