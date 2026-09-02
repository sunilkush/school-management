import multer from "multer";
import path from "path";
import fs from "fs";

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Extension is checked independently of MIME type below — the mimetype multer sees comes from
// the multipart Content-Type header, which the client fully controls and can misreport (e.g. a
// ".html" file sent as "image/jpeg" would otherwise pass).
const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
];

// Uploads land here only briefly before being pushed to Cloudinary and unlinked (see
// utils/cloudinary.js). This must stay outside ./public — app.js serves that directory via
// express.static, so anything written under it is reachable by URL for as long as it sits on
// disk, upload-type validation notwithstanding.
const TEMP_UPLOAD_DIR = "./uploads_tmp";
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB per file
    files: 5,                    // max 5 files per request
  },
});

// Admission documents specifically: capped much smaller (50 KB) so scanned
// certificates/IDs stay cheap to store — separate instance so it doesn't
// shrink the 5 MB limit other upload flows (homework, study material, etc.) rely on.
export const uploadAdmissionDocs = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024,  // 50 KB per file
    files: 5,
  },
});

// Public admission portal (routes/publicAdmission.routes.js). Kept separate from
// uploadAdmissionDocs on purpose: 50 KB is a deliberate storage-cost choice for staff who can
// re-compress a scan before uploading, but a parent photographing a birth certificate on a phone
// has no way to hit it, so every upload would fail. 2 MB is the smallest limit a phone camera
// reliably fits under. Still well below the 5 MB general cap.
export const uploadPublicAdmissionDocs = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,  // 2 MB per file
    files: 5,
  },
});
