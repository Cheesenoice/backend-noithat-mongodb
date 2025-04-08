const Product = require("../../../model/product.model");
const genAI = require("../../../model/gemini.model");

module.exports.aiSearch = async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword) {
      return res.status(400).json({ message: "Vui lòng nhập từ khóa hoặc câu hỏi!" });
    }

    // Lấy danh sách sản phẩm để AI tham chiếu nếu cần
    const products = await Product.find({ deleted: false, status: "active" }).limit(10);

    const prompt = `
      Bạn là một trợ lý hỗ trợ khách hàng chuyên nghiệp.
      
      - Đây là từ khóa hoặc câu hỏi người dùng đưa ra: "${keyword}"
      - Dưới đây là danh sách sản phẩm hiện có trong cửa hàng: ${JSON.stringify(products)}.

      Hãy làm một trong các yêu cầu sau:
      1. Nếu từ khóa có vẻ là yêu cầu tìm kiếm sản phẩm (ví dụ: tên sản phẩm, loại sản phẩm), hãy đề xuất các sản phẩm phù hợp nhất từ danh sách trên dưới dạng JSON theo mẫu:
        [
          {
            "title": "Tên sản phẩm",
            "description": "Mô tả ngắn",
            "price": "Giá sản phẩm",
            "thumbNail": "Link hình ảnh",
            "color": "màu sắc,
            "featured: "sản phảm nổi bật"
          }
        ]
      2. Nếu người dùng hỏi về thông tin (chính sách bảo hành, đổi trả, khuyến mãi,...), hãy trả lời rõ ràng và thân thiện bằng văn bản thuần túy.
      3. Nếu không rõ yêu cầu, hãy hỏi thêm chi tiết từ người dùng bằng văn bản thuần túy.
    `;

    // Gọi Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-001" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let cleanText = text.trim();

    // Làm sạch nếu AI trả về kiểu ```json ... ``` hoặc ``` ... ```
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/```json\s*/i, '').replace(/```$/, '').trim();
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/```/g, '').trim();
    }
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
      // Lấy phần văn bản ngoài JSON nếu có
      const replyText = cleanText.replace(jsonMatch[0], '').trim() || "Đây là các sản phẩm được đề xuất.";
      return res.json({
        status: true,
        message: "Đây là các sản phẩm Gemini đề xuất",
        analysis: keyword,
        suggestions: aiSuggestions,
        additionalReply: replyText // Trả thêm phần văn bản nếu có
      });
    } 
    // Nếu không phải JSON
    else {
      // Kiểm tra xem keyword có vẻ là tìm kiếm sản phẩm không
      const isProductSearch = products.some(product => 
        product.title.toLowerCase().includes(keyword.toLowerCase()) || 
        (product.description && product.description.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (isProductSearch) {
        // Lọc thủ công các sản phẩm phù hợp nếu AI không trả JSON
        aiSuggestions = products
          .filter(product => 
            product.title.toLowerCase().includes(keyword.toLowerCase()) || 
            (product.description && product.description.toLowerCase().includes(keyword.toLowerCase()))
          )
          .map(product => ({
            title: product.title,
            description: product.description || "Không có mô tả",
            price: product.price,
            thumbNail: product.thumbNail || "Không có hình ảnh"
          }));

        return res.json({
          status: true,
          message: "Đây là các sản phẩm phù hợp với từ khóa",
          analysis: keyword,
          suggestions: aiSuggestions.length > 0 ? aiSuggestions : []
        });
      } else {
        // Trả về câu trả lời thông tin hoặc câu hỏi lại
        return res.json({
          status: true,
          message: "Đây là câu trả lời từ Gemini",
          analysis: keyword,
          reply: cleanText
        });
      }
    }

  } catch (error) {
    console.error("❌ Lỗi khi tương tác với Gemini:", error);
    res.status(500).json({
      status: false,
      message: "Đã có lỗi xảy ra khi tương tác với AI",
      error: error.message
    });
  }
};