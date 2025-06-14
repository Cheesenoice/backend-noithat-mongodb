const Product = require("../../../model/product.model");
const genAI = require("../../../model/gemini.model");
const { jsonrepair } = require("jsonrepair");

// Helper function to clean JSON strings
const cleanJsonString = (text) => {
  if (!text) return text;

  // First, remove any markdown code block markers
  text = text
    .replace(/```json\s*/gi, "")
    .replace(/```/gi, "")
    .trim();

  // Remove any non-JSON text before and after the JSON object/array
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    text = jsonMatch[0];
  }

  return text
    .replace(/[\n\r\t]/g, " ") // Replace newlines and tabs with spaces
    .replace(/\s{2,}/g, " ") // Collapse multiple spaces
    .replace(/,\s*]/g, "]") // Remove trailing commas before closing brackets
    .replace(/,\s*}/g, "}") // Remove trailing commas before closing braces
    .replace(/([{,]\s*)([^"\s:]+)(:)/g, '$1"$2"$3') // Quote unquoted keys
    .replace(/([^\\])"/g, '$1\\"') // Escape unescaped quotes
    .replace(/\\(?=\\)/g, "") // Remove double backslashes
    .replace(/([^\\])\\([^"\\])/g, "$1\\\\$2") // Fix single backslashes
    .replace(/([^\\])\\([^"\\])/g, "$1\\\\$2"); // Fix single backslashes again
};

// Helper function to validate and fix JSON
const validateAndFixJson = (text) => {
  try {
    // First try to parse as is
    return { isValid: true, data: JSON.parse(text) };
  } catch (error) {
    try {
      // Try to clean and parse
      const cleaned = cleanJsonString(text);
      return { isValid: true, data: JSON.parse(cleaned) };
    } catch (error) {
      try {
        // Try to repair using jsonrepair
        const repaired = jsonrepair(text);
        return { isValid: true, data: JSON.parse(repaired) };
      } catch (error) {
        return { isValid: false, error: error.message };
      }
    }
  }
};

// Helper function to ensure valid JSON response
const ensureValidJsonResponse = (data) => {
  if (typeof data === "string") {
    const result = validateAndFixJson(data);
    if (result.isValid) {
      return result.data;
    }
    return null;
  }
  return data;
};

// Helper function to format product data
const formatProductData = (product) => ({
  title: product.title || "",
  description: product.description || "Không có mô tả",
  slug: product.slug || "",
  price: product.price || 0,
  thumbnail: product.thumbnail || "Không có hình ảnh",
  color: product.color || "Không xác định",
  featured: product.featured || false,
  category: product.category || "",
  tags: Array.isArray(product.tags) ? product.tags : [],
});

// Helper function to check if string is valid JSON
const isValidJson = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Helper function to parse AI response
const parseAIResponse = async (text) => {
  let cleanText = text.trim();
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText
      .replace(/```json\s*/i, "")
      .replace(/```$/, "")
      .trim();
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/```/g, "").trim();
  }
  cleanText = cleanJsonString(cleanText);

  if (isValidJson(cleanText)) {
    return { isJson: true, data: JSON.parse(cleanText) };
  }

  try {
    const repairedJson = jsonrepair(cleanText);
    if (isValidJson(repairedJson)) {
      return { isJson: true, data: JSON.parse(repairedJson) };
    }
  } catch (repairError) {
    console.error("Error repairing JSON:", repairError);
  }
  return { isJson: false, data: cleanText };
};

module.exports.aiSearch = async (req, res) => {
  try {
    const { keyword } = req.body;
    const roomImage = req.file?.buffer;

    // Validate image size and type
    if (roomImage) {
      if (req.file.buffer.length > 5 * 1024 * 1024) {
        return res
          .status(400)
          .json({ message: "Ảnh quá lớn, vui lòng tải ảnh dưới 5MB." });
      }
      if (!req.file.mimetype.startsWith("image/")) {
        return res
          .status(400)
          .json({ message: "Vui lòng tải lên file ảnh hợp lệ." });
      }
    }

    // Validate keyword
    if (!keyword) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập từ khóa hoặc câu hỏi!" });
    }
    if (keyword.length > 500) {
      return res
        .status(400)
        .json({ message: "Từ khóa quá dài, vui lòng nhập dưới 500 ký tự." });
    }

    // Fetch active products with necessary fields
    const products = await Product.find({
      deleted: false,
      status: "active",
    }).select(
      "title slug description category price thumbnail color featured tags"
    );

    // Trường hợp gửi cả ảnh và từ khóa
    if (roomImage && keyword) {
      const base64Image = roomImage.toString("base64");
      const safeKeyword = keyword.replace(/["\\]/g, "\\$&"); // Escape special characters
      const prompt = `
        Bạn là một chuyên gia thiết kế nội thất.
        Người dùng đã cung cấp từ khóa: "${safeKeyword}" và một ảnh căn phòng (định dạng base64).
        Dưới đây là danh sách sản phẩm nội thất hiện có:
        ${JSON.stringify(
          products.map((p) => ({
            title: p.title,
            slug: p.slug,
            price: p.price,
            thumbnail: p.thumbnail,
            color: p.color,
            category: p.category,
          }))
        )}

        Hãy thực hiện các bước sau:
        - Phân tích ảnh căn phòng và từ khóa để đề xuất các sản phẩm nội thất phù hợp.
        - Chỉ gợi ý các sản phẩm **có trong danh sách trên**, không tạo sản phẩm mới.
        - Đề xuất ít nhất 5 sản phẩm thuộc các danh mục khác nhau (bàn, ghế, sofa, tủ, giường, v.v.) nếu có.
        - Mô tả vị trí bố trí hợp lý cho từng sản phẩm trong phòng, đảm bảo phù hợp với từ khóa.
        - Đảm bảo thông tin (tên, màu sắc, giá, slug, thumbnail) khớp với danh sách sản phẩm.

        Đầu ra **phải là JSON hợp lệ** theo định dạng:
        {
          "insertedProducts": [
            {
              "title": "Tên sản phẩm từ danh sách",
              "slug": "Slug sản phẩm",
              "position": "Vị trí đề xuất trong phòng",
              "thumbnail": "URL hình từ danh sách",
              "color": "Màu sắc từ danh sách",
              "price": Giá từ danh sách,
              "notes": "Ghi chú bằng tiếng Việt về lý do chọn sản phẩm và vị trí, liên quan đến từ khóa"
            }
          ]
        }
        Đảm bảo JSON theo chuẩn RFC 8259, không bao gồm ký tự xuống dòng, dấu phẩy thừa, hoặc ký tự không hợp lệ.
      `;

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
      const rawText = response.text().trim();
      // console.log("Raw AI response (image + keyword):", rawText);

      const parsedResponse = await parseAIResponse(rawText);
      if (
        !parsedResponse.isJson ||
        !Array.isArray(parsedResponse.data?.insertedProducts)
      ) {
        return res.status(500).json({
          status: false,
          message: "Phản hồi từ Gemini không hợp lệ.",
        });
      }

      // Validate suggestions against database products
      const validProducts = products.map((p) => p.title);
      const insertedProducts = parsedResponse.data.insertedProducts.filter(
        (item) => validProducts.includes(item.title)
      );
      console.log("Filtered inserted products:", insertedProducts);

      if (insertedProducts.length === 0) {
        return res.json({
          status: true,
          message: "Không tìm thấy sản phẩm phù hợp trong cơ sở dữ liệu.",
          suggestions: [],
        });
      }

      return res.json({
        status: true,
        message: "Gemini đã phân tích ảnh và từ khóa để đề xuất nội thất.",
        analysis: keyword,
        suggestions: insertedProducts,
      });
    }

    // Trường hợp chỉ gửi từ khóa
    const safeKeyword = keyword.replace(/["\\]/g, "\\$&"); // Escape special characters
    const prompt = `
      Bạn là một trợ lý hỗ trợ khách hàng chuyên nghiệp của cửa hàng nội thất.
      - Đây là từ khóa hoặc câu hỏi người dùng đưa ra: "${safeKeyword}".
      - Dưới đây là danh sách các sản phẩm hiện có trong cửa hàng:
        ${JSON.stringify(
          products.map((p) => ({
            title: p.title,
            slug: p.slug,
            description: p.description,
            price: p.price,
            thumbnail: p.thumbnail,
            color: p.color,
            category: p.category,
            featured: p.featured,
            tags: p.tags,
          }))
        )}

      Hãy thực hiện một trong các yêu cầu sau:
      1. Nếu từ khóa có vẻ là yêu cầu tìm kiếm sản phẩm (ví dụ: tên sản phẩm, loại sản phẩm như "bàn", "ghế"), hãy đề xuất ít nhất 5 sản phẩm phù hợp nhất từ danh sách trên, ưu tiên đa dạng danh mục (bàn, ghế, sofa, tủ, giường, v.v.) dưới dạng JSON hợp lệ theo mẫu:
        [
          {
            "title": "Tên sản phẩm",
            "description": "Mô tả ngắn",
            "slug": "Slug sản phẩm",
            "price": Giá sản phẩm,
            "thumbnail": "Link hình ảnh",
            "color": "Màu sắc",
            "featured": Sản phẩm nổi bật
          }
        ]
      2. Nếu từ khóa là câu hỏi không liên quan đến sản phẩm (ví dụ: chính sách bảo hành, đổi trả, khuyến mãi, các câu hỏi chung, hoặc yêu cầu không liên quan đến nội thất như "tôi muốn mua điện thoại"), trả lời rõ ràng và thân thiện dưới dạng JSON hợp lệ:
        {
          "reply": "Câu trả lời bằng tiếng Việt, chuyên nghiệp và thân thiện"
        }
        - Nếu câu hỏi không liên quan đến cửa hàng nội thất, từ chối lịch sự và giải thích lý do (ví dụ: "Rất tiếc, chúng tôi là cửa hàng nội thất và không cung cấp thông tin về [chủ đề]. Bạn có muốn tìm hiểu về nội thất không?").
        - Nếu không rõ yêu cầu, đề nghị người dùng cung cấp thêm thông tin trong câu trả lời.
      3. Đầu ra **phải luôn là JSON hợp lệ** tuân theo chuẩn RFC 8259, không chứa ký tự xuống dòng, dấu phẩy thừa, hoặc ký tự không hợp lệ.
      4. Không trả về văn bản thuần túy hoặc các định dạng khác ngoài JSON.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text().trim();
    // console.log("Raw AI response (keyword):", rawText);

    const parsedResponse = await parseAIResponse(rawText);

    // Trường hợp phản hồi là JSON (đề xuất sản phẩm)
    if (parsedResponse.isJson && Array.isArray(parsedResponse.data)) {
      const validatedData = ensureValidJsonResponse(parsedResponse.data);
      return res.json({
        status: true,
        message: "Đây là các sản phẩm Gemini đề xuất",
        analysis: keyword,
        suggestions: Array.isArray(validatedData)
          ? validatedData
          : [validatedData],
      });
    }

    // Trường hợp không phải JSON hoặc JSON không phải mảng (câu hỏi không liên quan đến sản phẩm)
    const isProductSearch = products.some(
      (product) =>
        product.title?.toLowerCase()?.includes(keyword.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(keyword.toLowerCase())) ||
        (product.category &&
          product.category?.toLowerCase()?.includes(keyword.toLowerCase())) ||
        (product.tags &&
          product.tags.some((tag) =>
            tag.toLowerCase().includes(keyword.toLowerCase())
          ))
    );

    if (isProductSearch) {
      const aiSuggestions = products
        .filter(
          (product) =>
            product.title?.toLowerCase()?.includes(keyword.toLowerCase()) ||
            (product.description &&
              product.description
                .toLowerCase()
                ?.includes(keyword.toLowerCase())) ||
            (product.category &&
              product.category
                ?.toLowerCase()
                ?.includes(keyword.toLowerCase())) ||
            (product.tags &&
              product.tags.some((tag) =>
                tag.toLowerCase().includes(keyword.toLowerCase())
              ))
        )
        .slice(0, 10)
        .map(formatProductData);

      console.log("Đã lọc thủ công:", "aiSuggestions");

      return res.json({
        status: true,
        message: "Đây là các sản phẩm phù hợp với từ khóa",
        analysis: keyword,
        suggestions: aiSuggestions,
      });
    }

    // Trường hợp câu hỏi không liên quan đến sản phẩm
    return res.json({
      status: true,
      message: "Câu trả lời từ Gemini cho câu hỏi không liên quan đến sản phẩm",
      analysis: keyword,
      reply:
        parsedResponse.data?.reply || "Không có phản hồi hợp lệ từ Gemini.",
    });
  } catch (error) {
    console.error("❌ Lỗi AI:", error);
    return res.status(500).json({
      status: false,
      message: "Có lỗi xảy ra khi xử lý AI",
      error: error.message,
    });
  }
};
