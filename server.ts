import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set higher body payload limits for base64 file/image uploads (PDFs, JPGs)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // API endpoint for AI Leave Analysis / Policy Advisor
  app.post("/api/ai-analyze", async (req, res) => {
    try {
      const { leaveRecords, employees, question } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY is not configured." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const prompt = `
คุณคือนักวิเคราะห์ทรัพยากรบุคคลและผู้เชี่ยวชาญระเบียบการลาขององค์กรปกครองส่วนท้องถิ่น (ตามระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ) ของเทศบาลตำบลทุ่งช้าง จ.น่าน
ข้อมูลพนักงาน (ตัวอย่าง): ${JSON.stringify(employees?.slice(0, 20) || [])}
ข้อมูลการลา (ตัวอย่าง): ${JSON.stringify(leaveRecords?.slice(0, 40) || [])}
คำถามหรือโจทย์จากผู้บริหาร: "${question || 'ช่วยวิเคราะห์สถิติการลาของบุคลากร และให้คำแนะนำในการบริหารกำลังคนและการอนุมัติวันลา'}"

โปรดตอบเป็นภาษาไทยอย่างเป็นทางการ ให้คำแนะนำที่เป็นประโยชน์ สรุปประเด็นสำคัญ และจัดรูปแบบให้อ่านง่ายสำหรับผู้บริหารเทศบาลตำบลทุ่งช้าง
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI analysis" });
    }
  });

  // API endpoint for AI Parsing PDF / JPG Leave Documents with Signature Verification
  app.post("/api/ai-parse-leave", async (req, res) => {
    try {
      const { fileData, mimeType, employees } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "GEMINI_API_KEY ยังไม่ได้ตั้งค่าใน Secrets" });
      }

      if (!fileData || !mimeType) {
        return res.status(400).json({ error: "กรุณาอัปโหลดไฟล์ PDF หรือ รูปภาพ (JPG/PNG)" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const empListStr = (employees || []).map((e: any) => `- ID: ${e.id}, ชื่อ: ${e.name}, ตำแหน่ง: ${e.position}, สังกัด: ${e.department}`).join("\n");

      const prompt = `
คุณคือ AI สำหรับอ่านถอดความและตรวจสอบเอกสารแบบใบลาทางการของเทศบาลตำบลทุ่งช้าง จ.น่าน

โปรดอ่านข้อมูลจากเอกสารนี้อย่างละเอียด และตรวจสอบลายมือชื่อในแต่ละช่องตามระเบียบงานสารบรรณ:

รายชื่อบุคลากรที่มีในฐานข้อมูลระบบ:
${empListStr}

ข้อกำหนดคำสั่งสกัดข้อมูลและตรวจสอบลายมือชื่อ:
1. employeeName: ชื่อ-นามสกุลของผู้ขอลาที่ปรากฏในเอกสาร
2. matchedEmployeeId: รหัส ID พนักงานจากฐานข้อมูลหากจับคู่ชื่อได้ตรงกัน (หากไม่พบให้เป็นค่าว่าง "")
3. department: ส่วนราชการ/กองของผู้ลา เลือกจาก: ["สำนักปลัดเทศบาล", "กองคลัง", "กองช่าง", "กองสาธารณสุขและสิ่งแวดล้อม", "กองการศึกษา", "กองยุทธศาสตร์และงบประมาณ", "หน่วยตรวจสอบภายใน"]
4. leaveType: ประเภทการลา เลือกเฉพาะจาก: ["ลาพักผ่อน", "ลาป่วย", "ลากิจส่วนตัว", "ลาคลอดบุตร", "ลาอุปสมบท", "ไปราชการ", "อื่นๆ"]
5. startDate: วันที่เริ่มลาในรูปแบบ YYYY-MM-DD (แปลงปี พ.ศ. เป็น ค.ศ. เช่น พ.ศ. 2569 -> 2026)
6. endDate: วันสุดท้ายที่ลาในรูปแบบ YYYY-MM-DD (แปลงปี พ.ศ. เป็น ค.ศ.)
7. totalDays: จำนวนวันลาทั้งหมด (ตัวเลข)
8. reason: เหตุผลการลา หรือรายละเอียดภารกิจ

การตรวจสอบลายมือชื่อในเอกสาร (สำคัญมาก):
- hasApplicantSignature: มีลายมือชื่อผู้ขอลา (ช่องลงชื่อผู้ขอลา) หรือไม่ (true/false)
- hasCheckerSignature: มีลายมือชื่อผู้ตรวจสอบสถิติวันลา (งานการเจ้าหน้าที่) หรือไม่ (true/false)
- hasDeptHeadSignature: มีลายมือชื่อผู้บังคับบัญชาเบื้องต้น/ผอ.กอง (ช่องความเห็นของผู้บังคับบัญชา) หรือไม่ (true/false)
- hasClerkSignature: มีลายมือชื่อปลัดเทศบาล (ช่องความเห็นของปลัดเทศบาล) หรือไม่ (true/false)
- hasMayorSignature: มีลายมือชื่อคำสั่งนายกเทศมนตรี (ช่องคำสั่ง อนุญาต/ไม่อนุมัติ) หรือไม่ (true/false)
- allSignaturesPresent: ลายเซ็นครบทุก 5 ช่องหรือไม่ (true หากมีครบทั้ง 5 ช่อง, false หากขาดช่องใดช่องหนึ่ง)
- missingSignatures: รายการชื่อช่องลายเซ็นที่ยังตรวจไม่พบ (Array of strings ภาษาไทย เช่น ["ลายมือชื่อนายกเทศมนตรี", "ลายมือชื่อปลัดเทศบาล"])
- confidenceScore: คะแนนความเชื่อมั่นในการอ่านข้อมูลเอกสาร (0 ถึง 100)
- summaryNote: สรุปผลการอ่านและการตรวจลายเซ็นอย่างชัดเจน เช่น "อ่านใบลาพักผ่อนของนายประเสริฐ ลายเซ็นครบทั้ง 5 ขั้นตอน พร้อมอนุมัติ" หรือ "ขาดลายเซ็นนายกเทศมนตรีในช่องคำสั่ง"
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileData,
            }
          },
          {
            text: prompt,
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              employeeName: { type: Type.STRING },
              matchedEmployeeId: { type: Type.STRING },
              department: { type: Type.STRING },
              leaveType: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              totalDays: { type: Type.NUMBER },
              reason: { type: Type.STRING },
              hasApplicantSignature: { type: Type.BOOLEAN },
              hasCheckerSignature: { type: Type.BOOLEAN },
              hasDeptHeadSignature: { type: Type.BOOLEAN },
              hasClerkSignature: { type: Type.BOOLEAN },
              hasMayorSignature: { type: Type.BOOLEAN },
              allSignaturesPresent: { type: Type.BOOLEAN },
              missingSignatures: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              confidenceScore: { type: Type.NUMBER },
              summaryNote: { type: Type.STRING },
            },
            required: [
              "employeeName", 
              "leaveType", 
              "startDate", 
              "endDate", 
              "reason",
              "hasApplicantSignature",
              "hasCheckerSignature",
              "hasDeptHeadSignature",
              "hasClerkSignature",
              "hasMayorSignature",
              "allSignaturesPresent"
            ],
          }
        }
      });

      let parsed = {};
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch (e) {
        console.error("JSON parse error:", response.text);
      }

      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error("AI Parse Leave Error:", error);
      res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในการใช้ AI อ่านเอกสารใบลา" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
