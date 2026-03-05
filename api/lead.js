export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { company, position, name, email, filters, resultCount } = req.body;

    if (!company || !name || !email) {
      return res.status(400).json({ error: "필수 항목을 입력해주세요." });
    }

    // DB ID에서 ?v= 이후 자동 제거
    const rawDbId = process.env.NOTION_DB_ID || "";
    const dbId = rawDbId.split("?")[0].trim();

    const response = await fetch("https://api.notion.com/v1/pages", {
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

    if (!response.ok) {
      const err = await response.json();
      console.error("Notion API 오류:", err);
      return res.status(500).json({ error: "Notion 저장 실패" });
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("리드 저장 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
