import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3";

export const ultrasoundUpload = multer({
  storage: multerS3({
    s3,
    bucket: "digital-maternity-ultrasound",
    acl: "public-read",
    metadata: (_: any, file: any, cb: any) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (_: any, file: any, cb: any) => {
      const unique = Date.now().toString();
      cb(null, `ultrasounds/${unique}-${file.originalname}`);
    },
  }),
});
