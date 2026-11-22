import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ass": "text/plain; charset=utf-8",
  ".srt": "text/plain; charset=utf-8",
  ".json": "application/json",
};

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const PIPELINE_DIR = path.resolve(REPO_ROOT, "scratch", "shorts-pipeline");
const DEFAULT_LONG_CLIPS_DIR = path.resolve(PIPELINE_DIR, "output", "long_clips");
const DEFAULT_SHORTS_DIR = path.resolve(PIPELINE_DIR, "output_10outof10");
const EPISODES_DIR = path.resolve(PIPELINE_DIR, "episodes");

export async function HEAD(request: NextRequest) {
  return GET(request);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'long' | 'short'
    const file = searchParams.get("file");
    const episodeId = searchParams.get("episodeId");
    const isDownload = searchParams.get("download") === "true";

    if (!file || !type) {
      return NextResponse.json({ error: "Missing required parameters: type and file" }, { status: 400 });
    }

    // 1. Strict regex validation: safe characters only, no traversal
    const safeRegex = /^[a-zA-Z0-9_-]+\.(mp4|jpg|jpeg|png|webp|ass|srt|json)$/;
    if (!safeRegex.test(file)) {
      return NextResponse.json({ error: "Invalid filename format" }, { status: 400 });
    }

    // 2. Resolve target directory: check episode folder first, then default folders
    let candidateDirs: string[] = [];
    if (episodeId) {
      const epSub = type === "long" ? "long_clips" : "shorts";
      candidateDirs.push(path.resolve(EPISODES_DIR, episodeId, epSub));
    }
    candidateDirs.push(type === "long" ? DEFAULT_LONG_CLIPS_DIR : DEFAULT_SHORTS_DIR);

    let targetPath: string | null = null;
    let allowedBase: string | null = null;

    for (const dir of candidateDirs) {
      const cand = path.resolve(dir, file);
      if (fs.existsSync(cand)) {
        targetPath = cand;
        allowedBase = path.normalize(dir).toLowerCase();
        break;
      }
    }

    if (!targetPath || !allowedBase) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 });
    }

    // 3. Security check: file must reside strictly inside the allowed directory
    try {
      const realTarget = fs.realpathSync(targetPath);
      const normalizedTarget = path.normalize(realTarget).toLowerCase();
      if (!normalizedTarget.startsWith(allowedBase)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Media file access verification failed" }, { status: 404 });
    }

    const stat = fs.statSync(targetPath);
    const fileSize = stat.size;
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const disposition = isDownload ? `attachment; filename="${file}"` : "inline";

    const rangeHeader = request.headers.get("range");

    // 4. Handle RFC 9110 HTTP Range Requests (Essential for HTML5 <video> seeking)
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const parts = rangeHeader.slice(6).trim().split("-");
      let start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start)) {
        start = fileSize - end;
        end = fileSize - 1;
      }
      if (isNaN(end) || end >= fileSize) {
        end = fileSize - 1;
      }

      if (start > end || start < 0) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
            "Accept-Ranges": "bytes",
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(targetPath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(stream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Content-Disposition": disposition,
        },
      });
    }

    // 5. Full file response
    const fileStream = fs.createReadStream(targetPath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Length": String(fileSize),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Error streaming media" }, { status: 500 });
  }
}
