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
        const { ingredients } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ error: '재료를 찾을 수 없습니다. (Ingredients not found)' });
        }

        // Gemini 모델 설정
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        // 5. Gemini API에 보낼 프롬프트 생성
        const prompt = `
            다음 재료들을 활용해서 만들 수 있는 요리를 추천해줘: ${ingredients.join(', ')}.

            **[최우선 조건]**
            1. 추천 요리는 한국인이 일상적으로 가장 자주 먹고 익숙한 **전통 한식** 한 가지만이어야 합니다.
            2. 퓨전 요리, 창작 요리, 이국적인 요리 (예: 망고 김치 비빔면 등)는 **절대** 추천하지 않습니다.
            3. 모든 재료를 다 사용할 필요는 없으며, 가장 적절한 한식 레시피를 기준으로 추천해 주세요.
            4. **[랜덤성조건]** 재료가 같더라도 매번 답변이 다를 수 있도록, 가장 적절한 한식 후보들 중 하나를 무작위로 선택하여 추천해 주세요.

            **[출력 형식 조건]**
            1. 응답은 반드시 'dishName', 'recipe', 'cookingTime' 세 개의 키를 가진 JSON 객체 형식으로만 제공해야 합니다.
            2. 다른 설명이나 추가 텍스트 없이 **순수한 JSON 객체**만 반환해야 합니다.
            3. 요리 레시피는 오직 하나만 제공해야 합니다.

            예시: {"dishName": "요리 이름", "recipe": "만드는 방법...", "cookingTime": "예상 시간"}
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

// 8. 서버 실행
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
