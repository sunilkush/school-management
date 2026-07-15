import multer from "multer";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
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
