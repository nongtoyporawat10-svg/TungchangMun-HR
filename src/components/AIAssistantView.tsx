import React, { useState } from 'react';
import { LeaveRecord, Employee } from '../types';
import { Sparkles, Send, Bot, User, Loader2, Lightbulb } from 'lucide-react';
import Markdown from 'react-markdown';

interface AIAssistantViewProps {
  leaveRecords: LeaveRecord[];
  employees: Employee[];
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ leaveRecords, employees }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>(
    'ยินดีต้อนรับสู่ระบบผู้ช่วยอัจฉริยะ (AI Policy & Leave Analyst) เทศบาลตำบลทุ่งช้าง คุณสามารถสอบถามเกี่ยวกับการวิเคราะห์สถิติการลา แนวโน้มการปฏิบัติงาน หรือข้อเสนอแนะในการบริหารงานบุคคลได้ทันที'
  );

  const samplePrompts = [
    'วิเคราะห์สถิติการลาประจำปีงบประมาณ 2569 และจุดที่ควรเฝ้าระวัง',
    'ในช่วงเดือนกรกฎาคม มีพนักงานลาพักผ่อนมากน้อยแค่ไหน จะกระทบการบริการประชาชนหรือไม่?',
    'ขอคำแนะนำในการบริหารกำลังพลของกองช่างในช่วงที่มีผู้ลาป่วยติดต่อกัน',
    'สรุปภาพรวมการลาของพนักงานสำนักปลัดเทศบาล'
  ];

  const handleAskAI = async (customQ?: string) => {
    const qToSend = customQ || question;
    if (!qToSend.trim()) return;

    setLoading(true);
    setAnalysisResult('');
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveRecords, employees, question: qToSend })
      });
      const data = await res.json();
      if (data.error) {
        setAnalysisResult(`เกิดข้อผิดพลาด: ${data.error}`);
      } else {
        setAnalysisResult(data.analysis);
      }
    } catch (err: any) {
      setAnalysisResult(`ไม่สามารถเชื่อมต่อกับ AI Service ได้: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-950/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">ผู้ช่วยวิเคราะห์วันลาและระเบียบ (AI Advisor)</h2>
            <p className="text-xs sm:text-sm text-teal-200/80 mt-0.5">ขับเคลื่อนด้วย Gemini AI สำหรับผู้บริหารและงานทรัพยากรบุคคล เทศบาลตำบลทุ่งช้าง</p>
          </div>
        </div>
      </div>

      {/* Suggested prompts */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
        <h3 className="text-sm font-bold text-slate-900 mb-3.5 flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>คำถามแนะนำยอดนิยม</span>
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(prompt);
                handleAskAI(prompt);
              }}
              disabled={loading}
              className="text-xs bg-slate-50 hover:bg-teal-50/80 hover:text-teal-900 hover:border-teal-300 border border-slate-200/80 text-slate-700 px-4 py-2.5 rounded-2xl transition-all font-medium text-left shadow-2xs active:scale-98"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80">
        <div className="flex gap-3">
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="พิมพ์คำถามหรือหัวข้อที่ต้องการให้ AI วิเคราะห์เกี่ยวกับวันลาและกำลังพล..."
            className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 resize-none"
          />
          <button
            onClick={() => handleAskAI()}
            disabled={loading || !question.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-200 disabled:to-slate-300 text-white px-6 rounded-2xl font-bold flex items-center justify-center transition-all shadow-md shadow-teal-950/20 active:scale-95 disabled:shadow-none min-w-[56px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Response Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 bg-slate-900 text-teal-400 rounded-2xl flex items-center justify-center font-bold shadow-2xs border border-slate-800">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">ผลการวิเคราะห์จาก AI ประจำเทศบาลตำบลทุ่งช้าง</h4>
            <p className="text-xs text-slate-400">อิงตามข้อมูลสถิติปัจจุบันและระเบียบราชการ</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
              <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
            </div>
            <p className="text-sm text-slate-700 font-semibold">กำลังประมวลผลข้อมูลและวิเคราะห์โดย Gemini AI...</p>
            <p className="text-xs text-slate-400">กรุณารอสักครู่</p>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800">
            <Markdown>{analysisResult}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
};
