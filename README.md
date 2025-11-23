# whatToEat API

재료를 기반으로 Gemini LLM을 통해 요리를 추천해주는 서비스입니다.

## 🚀 로컬에서 실행하기 (Running Locally)

1.  **API 키 설정**
    프로젝트 루트에 `.env` 파일을 생성하고, 발급받은 Gemini API 키를 추가합니다.
    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

2.  **의존성 설치**
    터미널을 열고 다음 명령어를 실행하여 필요한 라이브러리를 설치합니다.
    ```bash
    npm install
    ```

3.  **서버 시작**
    다음 명령어로 서버를 실행합니다.
    ```bash
    npm start
    ```
    서버는 기본적으로 `http://localhost:3001`에서 실행됩니다.

---

## 📖 API 정의서

### `POST /api/recipes`

주어진 재료 목록으로 만들 수 있는 요리의 이름, 레시피, 소요 시간을 반환합니다.

#### **Request Body**

-   **Content-Type:** `application/json`

| Key         | Type           | 설명           | 필수 | 
| :---------- | :------------- | :------------- | :--- | 
| ingredients | `Array<string>` | 요리 재료 목록 | Yes  | 

**Example:**

```json
{
  "ingredients": ["돼지고기", "숙성된 김치", "양파", "두부"]
}
```

#### **Success Response (200 OK)**

| Key         | Type     | 설명         | 
| :---------- | :------- | :----------- | 
| dishName    | `string` | 요리 이름    | 
| recipe      | `string` | 조리법       | 
| cookingTime | `string` | 예상 소요 시간 | 

**Example:**

```json
{
  "dishName": "돼지고기 김치찌개",
  "recipe": "1. 돼지고기를 냄비에 넣고 볶습니다. 2. 김치를 넣고 함께 볶다가 물을 붓고 끓입니다. 3. 양파와 두부를 넣고 더 끓여 완성합니다.",
  "cookingTime": "약 30분"
}
```

#### **Error Responses**

-   **400 Bad Request**
    `ingredients`가 요청에 포함되지 않았거나 비어있는 경우 반환됩니다.

    ```json
    {
      "error": "재료를 찾을 수 없습니다. (Ingredients not found)"
    }
    ```

-   **500 Internal Server Error**
    서버 내부나 Gemini API 연동 중 오류가 발생했을 때 반환됩니다.

    ```json
    {
      "error": "레시피를 생성하는 동안 오류가 발생했습니다."
    }
    ```

#### **cURL을 이용한 테스트 예시**

```bash
curl -X POST http://localhost:3001/api/recipes \
-H "Content-Type: application/json" \
-d '{ "ingredients": ["계란", "밥", "대파", "간장"] }'
```
