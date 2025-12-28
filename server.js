// 1. 라이브러리 임포트
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. 초기 설정
const app = express();
const port = process.env.PORT || 3001;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. 미들웨어 설정
app.use(cors());
app.use(express.json()); // express.json()은 JSON 요청 본문을 파싱합니다.

// 4. API 엔드포인트 정의 (POST /api/recipes)
app.post('/api/recipes', async (req, res) => {
    try {
        const { ingredients, exclude } = req.body;
        
        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ error: '재료를 찾을 수 없습니다. (Ingredients not found)' });
        }

        // Gemini 모델 설정
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        // 5. Gemini API에 보낼 프롬프트 생성
        const prompt = `
            다음 재료들을 활용해서 만들 수 있는 요리를 추천해줘: ${ingredients.join(', ')}.
            단, 다음 레시피는 이미 추천했기 때문에 제외해줘 : ${exclude.join(', ')}.

            **[최우선 조건]**
            1. 추천 요리는 한국인이 일상적으로 가장 자주 먹고 익숙한 **전통 한식** 한 가지만이어야 합니다.
            2. 퓨전 요리, 창작 요리, 이국적인 요리 (예: 망고 김치 비빔면 등)는 **절대** 추천하지 않습니다.
            3. 모든 재료를 다 사용할 필요는 없으며, 가장 적절한 한식 레시피를 기준으로 추천해 주세요.
            4. **[랜덤성조건]** 재료가 같더라도 매번 답변이 다를 수 있도록, 가장 적절한 한식 후보들 중 하나를 무작위로 선택하여 추천해 주세요.

            **[출력 형식 조건]**
            1. 응답은 반드시 'dishName', 'recipe', 'cookingTime', 'usedIngredients' 네 개의 키를 가진 JSON 객체 형식으로만 제공해야 합니다.
            2. 'usedIngredients'는 추천된 요리에 실제로 사용된 재료들을 배열 형태로 포함해야 합니다.
            3. 다른 설명이나 추가 텍스트 없이 **순수한 JSON 객체**만 반환해야 합니다.
            4. 요리 레시피는 오직 하나만 제공해야 합니다.

            예시: {"dishName": "김치찌개", "recipe": "만드는 방법...", "cookingTime": "약 30분", "usedIngredients": ["김치", "돼지고기", "두부"]}
        `;

        // 6. Gemini API 호출 및 결과 처리
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('Generated Recipe Response:', text);

        // 7. 결과 파싱 및 클라이언트에게 전송 (Markdown 코드 블록 대응)
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1) {
            throw new Error("응답에서 유효한 JSON 객체를 찾을 수 없습니다.");
        }

        const jsonString = text.substring(startIndex, endIndex + 1);
        const recipeJson = JSON.parse(jsonString);
        res.json(recipeJson);

    } catch (error) {
        console.error('Error generating recipe:', error);
        res.status(500).json({ error: '레시피를 생성하는 동안 오류가 발생했습니다.' });
    }
});


app.post('/api/genFoodImage', async (req, res) => {
  const { dishName } = req.body;

  if (!dishName) {
    return res.status(400).json({ error: 'dishName이 필요합니다.' });
  }

  try {
    // 1. Imagen 3 모델 가져오기
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

    // 2. 이미지 생성 요청
    // 맛있는 음식 사진을 위해 프롬프트를 조금 보강하면 더 결과가 좋습니다.
    const prompt = `아이폰 17 프로 맥스로 방금 찍은 듯한 ${dishName} 사진. 
    인스타 감성의 맛집 피드 느낌, 자연스러운 햇살 조명, 색감이 생생하고 디테일이 살아있는, 
    예쁜 접시에 담긴 먹음직스러운 모습, 4k 고화질 실사.
    
    이미지 생성 시 글자는 넣지마.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // 3. 생성된 이미지 데이터 처리
    // Imagen API는 보통 인라인 데이터(Base64)로 이미지를 반환합니다.
    const imagePart = response.candidates[0].content.parts.find(part => part.inlineData);
    
    if (!imagePart) {
      throw new Error("이미지 데이터가 응답에 포함되지 않았습니다.");
    }

    // 프론트엔드에서 바로 <img> 태그의 src로 쓸 수 있게 Base64 포맷으로 전달
    const base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

    res.json({
      success: true,
      imageUrl: base64Image // 프론트의 data.imageUrl과 매칭
    });

  } catch (error) {
    console.error('이미지 생성 오류:', error);
    res.status(500).json({ error: '이미지 생성 중 서버 오류가 발생했습니다.' });
  }
});

// 8. 서버 실행
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
