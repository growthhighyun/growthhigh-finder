export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { company, position, name, email, filters, resultCount, reportHtml } = req.body;

    if (!company || !name || !email) {
      return res.status(400).json({ error: "필수 항목을 입력해주세요." });
    }

    const rawDbId = process.env.NOTION_DB_ID || "";
    const dbId = rawDbId.split("?")[0].trim();

    // ─── 1. Notion DB 저장 ───
    let notionSaved = false;
    try {
      const notionRes = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties: {
            "회사명": { title: [{ text: { content: company } }] },
            "성명": { rich_text: [{ text: { content: name } }] },
            "이메일": { email: email },
            "직책": { rich_text: [{ text: { content: position || "-" } }] },
            "업종": { rich_text: [{ text: { content: filters?.industry || "전체" } }] },
            "업력": { rich_text: [{ text: { content: filters?.age || "전체" } }] },
            "희망지원": { rich_text: [{ text: { content: filters?.supports || "-" } }] },
            "매칭건수": { number: resultCount || 0 },
            "제출일시": { date: { start: new Date().toISOString() } },
          },
        }),
      });
      notionSaved = notionRes.ok;
      if (!notionRes.ok) {
        const err = await notionRes.json();
        console.error("Notion API 오류:", err);
      }
    } catch (e) {
      console.error("Notion 저장 실패:", e.message);
    }

    const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const RESEND_KEY = process.env.RESEND_API_KEY;

    // ─── 2. 고객에게 리포트 이메일 발송 ───
    let customerEmailSent = false;
    if (RESEND_KEY) {
      try {
        const customerRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Growth High <noreply@growthhigh.co.kr>",
            to: email,
            subject: `[Growth High] ${company}님의 2026 정부지원사업 맞춤 리포트`,
            html: `
              <div style="font-family:'Pretendard',sans-serif;max-width:640px;margin:0 auto;background:#0F172A;color:#E2E8F0;border-radius:12px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1E1B4B,#312E81);padding:32px;text-align:center;">
                  <h1 style="margin:0;font-size:22px;color:#E0E7FF;">2026 정부지원사업 맞춤 리포트</h1>
                  <p style="margin:8px 0 0;font-size:14px;color:#A5B4FC;">Growth'High Programs</p>
                </div>
                <div style="padding:32px;">
                  <p style="font-size:15px;line-height:1.8;color:#CBD5E1;">
                    안녕하세요, <strong style="color:#F1F5F9;">${name}</strong>님!<br/><br/>
                    <strong style="color:#A5B4FC;">${company}</strong>에 맞는 정부지원사업 분석 결과를 안내드립니다.
                  </p>
                  <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:20px;margin:20px 0;">
                    <table style="width:100%;font-size:14px;color:#CBD5E1;">
                      <tr><td style="padding:6px 0;color:#94A3B8;">분석 조건</td><td style="padding:6px 0;text-align:right;">업종: ${filters?.industry || "전체"} / 업력: ${filters?.age || "전체"}</td></tr>
                      <tr><td style="padding:6px 0;color:#94A3B8;">희망 지원유형</td><td style="padding:6px 0;text-align:right;">${filters?.supports || "전체"}</td></tr>
                      <tr><td style="padding:6px 0;color:#94A3B8;"><strong>매칭된 사업 수</strong></td><td style="padding:6px 0;text-align:right;font-size:20px;font-weight:800;color:#60A5FA;">${resultCount || 0}건</td></tr>
                    </table>
                  </div>
                  <p style="font-size:14px;line-height:1.8;color:#94A3B8;">
                    상세 리포트는 아래 링크에서 다시 확인하실 수 있습니다.<br/>
                    더 자세한 맞춤 분석이 필요하시면 무료 상담을 신청해주세요.
                  </p>
                  <div style="text-align:center;margin:28px 0;">
                    <a href="https://www.growthhigh.co.kr/32" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#F1F5F9;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;">무료 상담 신청하기</a>
                  </div>
                </div>
                <div style="background:#06080F;padding:20px;text-align:center;font-size:11px;color:#475569;">
                  ⓒ Growth High Corp. | official@growthhigh.co.kr
                </div>
              </div>
            `,
          }),
        });
        customerEmailSent = customerRes.ok;
        if (!customerRes.ok) {
          const err = await customerRes.json();
          console.error("고객 이메일 발송 실패:", err);
        }
      } catch (e) {
        console.error("고객 이메일 오류:", e.message);
      }
    }

    // ─── 3. 내부 담당자에게 알림 이메일 ───
    let notifyEmailSent = false;
    if (RESEND_KEY) {
      try {
        const notifyRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Growth High <noreply@growthhigh.co.kr>",
            to: process.env.NOTIFY_EMAIL || "official@growthhigh.co.kr",
            subject: `[새 리드] ${company} - ${name}님이 맞춤 리포트를 요청했습니다`,
            html: `
              <div style="font-family:'Pretendard',sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#1E1B4B;color:white;padding:24px;border-radius:12px 12px 0 0;">
                  <h2 style="margin:0 0 4px;">새로운 리드가 들어왔습니다!</h2>
                  <p style="margin:0;opacity:0.7;font-size:14px;">${timestamp}</p>
                </div>
                <div style="background:#F8FAFC;padding:24px;border:1px solid #E2E8F0;border-radius:0 0 12px 12px;">
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px 0;color:#64748B;width:100px;">회사명</td><td style="padding:8px 0;font-weight:600;">${company}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748B;">직책</td><td style="padding:8px 0;">${position || "-"}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748B;">성명</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
                    <tr><td style="padding:8px 0;color:#64748B;">이메일</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
                    <tr><td colspan="2" style="padding:12px 0 4px;border-top:1px solid #E2E8F0;color:#64748B;font-size:13px;">검색 조건</td></tr>
                    <tr><td style="padding:4px 0;color:#64748B;">업종</td><td style="padding:4px 0;">${filters?.industry || "전체"}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748B;">업력</td><td style="padding:4px 0;">${filters?.age || "전체"}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748B;">희망지원</td><td style="padding:4px 0;">${filters?.supports || "-"}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748B;">매칭 결과</td><td style="padding:4px 0;font-weight:600;">${resultCount || 0}건</td></tr>
                  </table>
                  <div style="margin-top:16px;padding:12px;background:#DBEAFE;border-radius:8px;font-size:13px;color:#1E40AF;">
                    빠른 연락이 전환율을 높입니다. 가능하면 1시간 이내에 연락하세요!
                  </div>
                </div>
              </div>
            `,
          }),
        });
        notifyEmailSent = notifyRes.ok;
        if (!notifyRes.ok) {
          const err = await notifyRes.json();
          console.error("알림 이메일 발송 실패:", err);
        }
      } catch (e) {
        console.error("알림 이메일 오류:", e.message);
      }
    }

    return res.status(200).json({ success: true, notionSaved, customerEmailSent, notifyEmailSent });

  } catch (error) {
    console.error("리드 저장 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
