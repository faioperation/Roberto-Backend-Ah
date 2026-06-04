import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = "uploads/whatsapp/";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "wa-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp4",
        "audio/aac",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "video/mp4",
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type."), false);
    }
};

export const whatsappUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});
