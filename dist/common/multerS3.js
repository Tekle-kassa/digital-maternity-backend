"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ultrasoundUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const s3_1 = __importDefault(require("../config/s3"));
exports.ultrasoundUpload = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: s3_1.default,
        bucket: "digital-maternity-ultrasound",
        acl: "public-read",
        metadata: (_, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (_, file, cb) => {
            const unique = Date.now().toString();
            cb(null, `ultrasounds/${unique}-${file.originalname}`);
        },
    }),
});
