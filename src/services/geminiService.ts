import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function explainBpsData(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Jelaskan data statistik BPS (Badan Pusat Statistik) Indonesia terkait pertanyaan berikut: ${query}. 
      Berikan penjelasan yang mudah dimengerti, sertakan angka-angka terbaru jika tersedia, dan sebutkan sumbernya. 
      Gunakan format Markdown yang rapi dengan tabel jika diperlukan.
      
      PENTING: Jika data tersebut bisa divisualisasikan (misalnya data deret waktu atau perbandingan kategori), sertakan blok kode JSON khusus di akhir jawaban Anda dengan format berikut:
      \`\`\`chart-data
      {
        "type": "line" | "bar" | "pie",
        "title": "Judul Grafik",
        "data": [
          { "label": "Jan", "value": 10 },
          { "label": "Feb", "value": 12 }
        ],
        "xAxis": "Bulan",
        "yAxis": "Persen"
      }
      \`\`\`
      Jangan sertakan blok ini jika data tidak cocok untuk grafik.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Anda adalah asisten ahli statistik yang mengkhususkan diri pada data Badan Pusat Statistik (BPS) Indonesia. Tugas Anda adalah menjelaskan data statistik secara akurat, objektif, dan mudah dipahami oleh masyarakat umum. Selalu gunakan data terbaru dari BPS dan sertakan konteks yang relevan.",
      },
    });

    return {
      text: response.text || "Maaf, saya tidak dapat menemukan informasi tersebut.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web?.title,
        uri: chunk.web?.uri
      })).filter(s => s.title && s.uri) || []
    };
  } catch (error) {
    console.error("Error fetching BPS data:", error);
    throw error;
  }
}
