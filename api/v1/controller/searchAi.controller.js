const Product = require("../../../model/product.model");
const genAI = require("../../../model/gemini.model");
const { jsonrepair } = require("jsonrepair"); // Đảm bảo đã cài đặt jsonrepair

// Helper function to clean JSON strings
const cleanJsonString = (text) => {
  return text
    .replace(/[\n\r\t]/g, " ") // Replace newlines and tabs with spaces
    .replace(/\s{2,}/g, " ") // Collapse multiple spaces
    .replace(/,\s*]/g, "]") // Remove trailing commas before closing brackets
    .replace(/,\s*}/g, "}") // Remove trailing commas before closing braces
    .replace(/([^\]\[,{])\s*([}\]])/g, "$1,$2") // Add missing commas between elements
    .replace(/([{,]\s*)([^"\s:]+)(:)/g, '$1"$2"$3') // Add double quotes around unquoted property names
    .replace(/(["'])\s*\1/g, "$1") // Fix duplicate quotes
    .replace(/\\(?=\\)/g, ""); // Escape unescaped backslashes
};

module.exports.aiSearch = async (req, res) => {
  try {
    const { keyword } = req.body;
    const roomImage = req.file?.buffer;
    const products = await Product.find({
      deleted: false,
      status: "active",
    }).limit(10);

    let cleanText; // Khai báo cleanText ở phạm vi rộng hơn

    // =====================
    // ✅ Trường hợp ảnh phòng
    // =====================
    if (roomImage) {
      const base64Image = roomImage.toString("base64");
      const prompt = `
        Bạn là một chuyên gia thiết kế nội thất.
        Dưới đây là danh sách sản phẩm nội thất hiện có trong kho:
        ${JSON.stringify(products)}

        Hãy phân tích ảnh căn phòng này (định dạng base64) và:
        - Chỉ gợi ý các sản phẩm **có trong danh sách trên**, không được tạo ra sản phẩm mới.
        - Mô tả vị trí bố trí hợp lý cho từng sản phẩm trong phòng.
        - Đảm bảo thông tin (tên, màu sắc, giá) khớp với danh sách sản phẩm.

        Đầu ra **phải là JSON hợp lệ** với định dạng:
        {
          "insertedProducts": [
            {
              "title": "Tên sản phẩm từ danh sách",
              "slug": "Slug sản phẩm",
              "position": "Vị trí đề xuất trong phòng",
              "thumbNail": "URL hình từ danh sách",
              "color": "Màu sắc từ danh sách",
              "price": Giá từ danh sách,
              "notes": "Ghi chú bằng tiếng Việt về lý do chọn sản phẩm và vị trí"
            }
          ]
        }
        Tất cả tên thuộc tính phải được bao quanh bởi dấu nháy kép (""). Không bao gồm ký tự xuống dòng, dấu phẩy thừa, ký tự không hợp lệ, hoặc bất kỳ nội dung không phải JSON. Đảm bảo JSON được định dạng chính xác theo chuẩn RFC 8259.
      `;

      // Gọi Gemini xử lý prompt + ảnh
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-lite",
      });
      let result;
      try {
        result = await model.generateContent([
          prompt,
          { inlineData: { mimeType: "image/png", data: base64Image } },
        ]);
      } catch (error) {
        console.error("Lỗi kết nối API Gemini:", error);
        return res.status(500).json({
          status: false,
          message: "Lỗi kết nối tới API Gemini. Vui lòng thử lại sau.",
          error: error.message,
        });
      }

      const response = await result.response;
      let text = response.text().trim();
      // Thêm xử lý để loại bỏ ```json ... ```
      if (text.startsWith("```json")) {
        text = text
          .replace(/```json\s*/i, "")
          .replace(/```$/, "")
          .trim();
      }
      cleanText = cleanJsonString(text);

      let insertedProducts = [];
      try {
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonString = jsonMatch[0];
          try {
            const repairedJson = jsonrepair(jsonString);
            const parsedJson = JSON.parse(repairedJson);
            insertedProducts = parsedJson?.insertedProducts || [];
          } catch (repairError) {
            console.error("Lỗi sau khi sửa JSON:", repairError);
            return res.status(500).json({
              status: false,
              message: "Lỗi phân tích dữ liệu JSON từ Gemini sau khi sửa.",
              error: repairError.message,
            });
          }

          // Validate suggestions against database products
          const validProducts = products.map((p) => p.title);
          insertedProducts = insertedProducts.filter((item) =>
            validProducts.includes(item.title)
          );
          if (insertedProducts.length === 0) {
            console.warn(
              "No valid products from database matched Gemini suggestions"
            );
          }
        } else {
          console.warn("No valid JSON object found in response");
          insertedProducts = [];
        }
      } catch (error) {
        console.error("Lỗi khi phân tích JSON:", error);
        console.error("Raw response text:", text);
        return res.status(500).json({
          status: false,
          message: "Lỗi phân tích dữ liệu JSON từ Gemini.",
          error: error.message,
        });
      }

      return res.json({
        status: true,
        message: "Gemini đã phân tích và đề xuất nội thất.",
        suggestions: insertedProducts,
      });
    }

    // =========================
    // ✅ Trường hợp văn bản keyword
    // =========================
    if (!keyword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập từ khóa hoặc câu hỏi!" });
    }

    // Lấy danh sách sản phẩm để AI tham chiếu nếu cần
    const prompt = `
          Bạn là một trợ lý hỗ trợ khách hàng chuyên nghiệp của cửa hàng nội thất.

          - Đây là từ khóa hoặc câu hỏi người dùng đưa ra: "${keyword}"
          - Dưới đây là danh sách sản phẩm hiện có trong cửa hàng: ${JSON.stringify(
            products
          )}.

          Hãy làm một trong các yêu cầu sau:
          1. Nếu từ khóa có vẻ là yêu cầu tìm kiếm sản phẩm (ví dụ: tên sản phẩm, loại sản phẩm), hãy đề xuất các sản phẩm phù hợp nhất từ danh sách trên dưới dạng JSON theo mẫu:
            [
              {
                "title": "Tên sản phẩm",
                "description": "Mô tả ngắn",
                "slug": "Slug sản phẩm",
                "price": "Giá sản phẩm",
                "thumbNail": "Link hình ảnh",
                "color": "màu sắc",
                "featured": "sản phẩm nổi bật"
              }
            ]
          2. Nếu người dùng hỏi về thông tin (chính sách bảo hành, đổi trả, khuyến mãi,...), hãy trả lời rõ ràng và thân thiện bằng văn bản thuần túy.
          3. Nếu không rõ yêu cầu, hãy hỏi thêm chi tiết từ người dùng bằng văn bản thuần túy.
          4. Nếu câu hỏi không liên quan đến sản phẩm hoặc cửa hàng, hãy:
              - Trả lời một cách chuyên nghiệp và đầy đủ
              - Giữ giọng điệu thân thiện và lịch sự
              - Cung cấp thông tin chính xác và hữu ích
              - Nếu câu hỏi quá phức tạp hoặc nhạy cảm, hãy lịch sự từ chối và giải thích lý do
        `;

    // Gọi Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Thêm xử lý để loại bỏ ```json ... ``` khỏi toàn bộ phản hồi
    if (text.startsWith("```json")) {
      text = text
        .replace(/```json\s*/i, "")
        .replace(/```$/, "")
        .trim();
    } else if (text.startsWith("```")) {
      text = text.replace(/```/g, "").trim();
    }
    cleanText = text; // Gán giá trị cho cleanText trong nhánh này
    let aiSuggestions = [];
    let isJsonResponse = false;

    // Trích xuất JSON từ chuỗi nếu có
    const jsonMatch = cleanText.match(/\[.*\]/s); // Tìm mảng JSON trong chuỗi
    if (jsonMatch) {
      try {
        aiSuggestions = JSON.parse(jsonMatch[0]);
        isJsonResponse = true;
      } catch (error) {
        console.error("Lỗi parse JSON từ chuỗi:", error);
      }
    }

    // Nếu có JSON (tức là đề xuất sản phẩm)
    if (isJsonResponse) {
      // Lấy phần văn bản ngoài JSON và loại bỏ ```json```
      let replyText = cleanText.replace(jsonMatch[0], "").trim();
      replyText = replyText
        .replace(/```json\s*/gi, "")
        .replace(/```/gi, "")
        .trim();

      // Tách câu hỏi cuối cùng dựa trên dấu chấm hỏi
      const sentences = replyText.split("?");
      const lastQuestion = sentences[sentences.length - 1]?.trim() + "?";

      return res.json({
        status: true,
        message: "Đây là các sản phẩm Gemini đề xuất",
        analysis: keyword,
        suggestions: aiSuggestions,
        additionalReply: lastQuestion.trim(), // Chỉ trả về câu hỏi cuối cùng
      });
    }
    // Nếu không phải JSON
    else {
      // Kiểm tra xem keyword có vẻ là tìm kiếm sản phẩm không
      const isProductSearch = products.some(
        (product) =>
          product.title.toLowerCase().includes(keyword.toLowerCase()) ||
          (product.description &&
            product.description.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (isProductSearch) {
        // Lọc thủ công các sản phẩm phù hợp nếu AI không trả JSON
        aiSuggestions = products
          .filter(
            (product) =>
              product.title.toLowerCase().includes(keyword.toLowerCase()) ||
              (product.description &&
                product.description
                  .toLowerCase()
                  .includes(keyword.toLowerCase()))
          )
          .map((product) => ({
            title: product.title,
            description: product.description || "Không có mô tả",
            price: product.price,
            thumbNail: product.thumbNail || "Không có hình ảnh",
          }));

        return res.json({
          status: true,
          message: "Đây là các sản phẩm phù hợp với từ khóa",
          analysis: keyword,
          suggestions: aiSuggestions.length > 0 ? aiSuggestions : [],
        });
      } else {
        // Trả về câu trả lời thông tin hoặc câu hỏi lại
        return res.json({
          status: true,
          message: "Đây là câu trả lời từ Gemini",
          analysis: keyword,
          reply: cleanText,
        });
      }
    }
  } catch (error) {
    console.error("❌ Lỗi AI Search:", error);
    return res.status(500).json({
      status: false,
      message: "Đã có lỗi xảy ra khi xử lý AI",
      error: error.message,
    });
  }
};
