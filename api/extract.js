import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res){
  if(req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const form = formidable({ multiples: true, allowEmptyFiles: false });

  const { files } = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
  });

  const list = Array.isArray(files.docs) ? files.docs : [files.docs].filter(Boolean);
  const docs = [];

  for(const f of list){
    const buf = fs.readFileSync(f.filepath);
    const parsed = await pdf(buf);

    docs.push({
      filename: f.originalFilename || "document.pdf",
      text: (parsed.text || "").slice(0, 250000)
    });
  }

  return res.status(200).json({ docs });
}
