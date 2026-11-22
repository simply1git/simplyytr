import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyMediaRequest } from '../../lib/mediaAuth';

export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.json': 'application/json',
  '.ass': 'text/plain',
};

// GET /api/media/[filename]
// Securely streams verified rendered artifacts from storage/processed
// Requires authentication header/cookie OR valid time-limited signed query token
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;

    // 1. Strict regex validation: alphanumeric + underscores/hyphens + allowed extension
    const validFilenameRegex = /^[a-zA-Z0-9_-]+\.(mp4|jpg|jpeg|png|webp|mp3|wav|json|ass)$/;
    if (!filename || !validFilenameRegex.test(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename format. Traversal characters not permitted.' },
        { status: 400 }
      );
    }

    // 2. Authentication and Authorization Guard
    const authCheck = verifyMediaRequest(request, filename);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid signed token or authentication required.' },
        { status: 401 }
      );
    }

    // 3. Resolve allowed storage directories
    const candidatePaths = [
      path.resolve(process.cwd(), 'storage/processed', filename),
      path.resolve(process.cwd(), '../../storage/processed', filename),
      path.resolve(process.cwd(), '../storage/processed', filename),
    ];

    let targetPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }

    if (!targetPath) {
      return NextResponse.json({ error: 'Media artifact not found.' }, { status: 404 });
    }

    // 4. Validate symlink and canonical path confinement
    try {
      const realTarget = fs.realpathSync(targetPath);
      const normalizedTarget = path.normalize(realTarget).toLowerCase();
      const allowedBase = path.normalize(path.resolve(process.cwd(), 'storage/processed')).toLowerCase();
      const parentAllowed = path.normalize(path.resolve(process.cwd(), '../../storage/processed')).toLowerCase();

      if (!normalizedTarget.startsWith(allowedBase) && !normalizedTarget.startsWith(parentAllowed)) {
        return NextResponse.json(
          { error: 'Access denied: target outside allowed media directory.' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json({ error: 'Failed to verify file confinement.' }, { status: 403 });
    }

    const stat = fs.statSync(targetPath);
    const fileSize = stat.size;
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const rangeHeader = request.headers.get('range');

    // 5. Handle empty files safely
    if (fileSize === 0) {
      if (rangeHeader) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': 'bytes */0',
            'Accept-Ranges': 'bytes',
          },
        });
      }
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Content-Length': '0',
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        },
      });
    }

    // 6. Handle Standards-Compliant HTTP Range Requests (RFC 9110)
    if (rangeHeader) {
      if (!rangeHeader.startsWith('bytes=')) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      const rangeSpec = rangeHeader.slice(6).trim();
      const match = rangeSpec.match(/^(\d*)-(\d*)$/);
      if (!match) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      const [, startStr, endStr] = match;
      let start: number;
      let end: number;

      if (startStr === '' && endStr === '') {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      } else if (startStr === '') {
        // Suffix range: "bytes=-500"
        const suffixLen = parseInt(endStr, 10);
        if (suffixLen <= 0) {
          return new NextResponse(null, {
            status: 416,
            headers: {
              'Content-Range': `bytes */${fileSize}`,
              'Accept-Ranges': 'bytes',
            },
          });
        }
        start = Math.max(0, fileSize - suffixLen);
        end = fileSize - 1;
      } else if (endStr === '') {
        // Open-ended range: "bytes=500-"
        start = parseInt(startStr, 10);
        end = fileSize - 1;
      } else {
        // Explicit range: "bytes=0-499"
        start = parseInt(startStr, 10);
        end = parseInt(endStr, 10);
      }

      // Unsatisfiable bounds check per RFC 9110 Section 14.1.2:
      if (isNaN(start) || isNaN(end) || start < 0 || start >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${fileSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      // Bound end offset to file boundary
      end = Math.min(end, fileSize - 1);
      const chunkSize = end - start + 1;

      const fileStream = fs.createReadStream(targetPath, { start, end });
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(stream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
          'Content-Disposition': 'inline',
        },
      });
    }

    // 7. Full File Request (HTTP 200)
    const fileStream = fs.createReadStream(targetPath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Length': String(fileSize),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-transform, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    // Avoid leaking filesystem paths in error responses
    return NextResponse.json({ error: 'Internal server error processing media request.' }, { status: 500 });
  }
}
