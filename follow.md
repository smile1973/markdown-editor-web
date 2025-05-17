

### 開發文檔：Markdown 編輯器新功能

**總體目標：** 增強使用者帳戶管理、筆記組織與搜尋能力。

---

```markdown
**步驟 1：使用者設定頁面入口** (✅ 已完成)

*   **開發內容：**
    *   在應用程式的主要導覽區域（例如 `src/components/UserPage.vue` 的側邊欄或頂部導覽列）添加一個清晰可辨的按鈕或連結，標示為「使用者設定」或類似文字。
    *   此按鈕應導向至一個新的路由，例如 `/settings`。
```
*   **稽核目標：** (✅ 已完成)
    1.  「使用者設定」按鈕在介面上清晰可見且位置合理。
    2.  點擊按鈕後，瀏覽器 URL 變更為 `/settings`（或您定義的路由），即使該頁面內容目前為空。
    3.  建立對應的前端路由設定於 `src/router/index.js`。
    4.  建立一個基本的 `UserSettingsPage.vue` 組件作為該路由的目標。

---

```markdown
**步驟 2：使用者設定頁面基礎架構** (✅ 已完成)

*   **開發內容：**
    *   在 `src/components/` (或 `src/views/`) 目錄下建立 `UserSettingsPage.vue` 檔案。
    *   設計頁面基本佈局，劃分出未來將放置「安全問題設定」、「使用者資料修改」等功能的區域。
```
*   **稽核目標：** (✅ 已完成)
    1.  透過 `/settings` 路由可以成功訪問 `UserSettingsPage.vue`。
    2.  頁面應有標題，例如「使用者設定」。
    3.  頁面初步劃分出不同設定區塊的佔位符或標題。

---

```markdown
**步驟 3：安全問題設定功能** (✅ 已完成)

*   **開發內容 (後端)：**
    1.  **修改 User Model：** 在 `server/dataset/user_table.js` 的 `userSchema` 中增加 `securityQuestion` (String) 和 `securityAnswer` (String) 欄位。`securityAnswer` 應考慮加密儲存（例如使用 `bcryptjs`，可參考 `server/package.json` 中已有此套件，但目前註冊/登入似乎未使用加密，這是一個改進點）。
    2.  **新增 API 端點：**
        *   在 `server/dataset/router.js` 中定義新的 POST 端點，例如 `/api/setSecurityQuestion`。
        *   在 `server/dataset/operates/` 目錄下建立新的控制器檔案 (例如 `userSettingsController.js`)，包含處理設定/更新安全問題及答案的邏輯。此邏輯需驗證使用者身份 (通常透過 JWT 或 session，但目前專案似乎直接依賴前端傳送 `userId`)，然後更新資料庫中對應使用者的安全問題和答案。
*   **開發內容 (前端)：**
    1.  **設定表單：** 在 `UserSettingsPage.vue` 中，新增一個表單區塊，包含：
        *   一個下拉選單或輸入框供使用者選擇/輸入安全問題。
        *   一個輸入框供使用者輸入安全問題的答案。
        *   一個「儲存」按鈕。
    2.  **API 請求：** 點擊「儲存」按鈕時，收集表單數據並向後端 `/api/setSecurityQuestion` 發送請求。
```
*   **稽核目標：** (✅ 已完成)
    1.  使用者可以在設定頁面成功選擇/輸入並儲存其安全問題和答案。
    2.  安全問題和（加密後的）答案被正確儲存在資料庫中對應使用者的記錄下。
    3.  儲存成功或失敗時，前端應有適當的提示訊息。
    4.  如果使用者已設定過安全問題，再次進入此頁面時應能看到先前設定的（或提示已設定）。

---

```markdown
**步驟 4：忘記密碼功能** (✅ 已完成)

*   **開發內容 (後端)：**
    1.  **新增 API 端點：**
        *   在 `server/dataset/router.js` 中定義新的 POST 端點，例如 `/api/recoverPassword`。
        *   在 `userSettingsController.js` (或新建的 `authController.js` 的擴展) 中添加處理邏輯：
            *   接收 `username` 和 `securityAnswer`。
            *   根據 `username` 查找使用者，並驗證其 `securityAnswer` 是否與資料庫中儲存的（解密/比對後的）相符。
            *   若驗證成功，返回該使用者的密碼（**注意：直接返回明文密碼安全性較低，更好的做法是強制重設密碼或發送一次性重設連結，但根據需求描述是「得到自己的密碼」**）。
*   **開發內容 (前端)：**
    1.  **登入頁面修改：** 在 `src/components/LoginPage.vue` 表單下方，新增一個「忘記密碼？」的文字連結。
    2.  **忘記密碼介面：** 點擊「忘記密碼？」後：
        *   可以導向一個新頁面 (例如 `/forgot-password`) 或彈出一個模態框。
        *   此介面需要使用者輸入其「帳號名稱」和之前設定的「安全問題答案」。
        *   提供「提交」按鈕。
    3.  **API 請求與結果顯示：** 點擊「提交」後，向後端 `/api/recoverPassword` 發送請求。
        *   若成功，則在介面上顯示使用者的密碼，或提示已發送至某處。
        *   若失敗（帳號不存在、安全問題答案錯誤），則顯示相應的錯誤訊息。
```
*   **稽核目標：** (✅ 已完成)
    1.  `LoginPage.vue` 上出現「忘記密碼？」連結。
    2.  點擊連結後，能正確顯示輸入帳號和安全問題答案的介面。
    3.  使用者輸入正確的帳號和安全問題答案後，能成功看到其密碼（或提示）。
    4.  輸入錯誤的帳號或答案時，會收到清晰的錯誤提示。
    5.  未設定安全問題的使用者嘗試此功能時，應有適當提示。

---

```markdown
**步驟 5：使用者資料修改功能 (User name / 頭像 / 密碼)** (✅ 已完成)

*   **開發內容 (後端)：**
    1.  **修改 User Model (頭像)：** 若要儲存頭像路徑，`userSchema` 中需新增 `avatarUrl` (String) 欄位。
    2.  **新增/修改 API 端點：**
        *   **修改 User name：** 可擴展現有更新使用者資料的 API (若有) 或新建 `/api/updateUsername` (POST/PUT)，接收 `userId` 和新 `name`。
        *   **修改頭像：** 新建 `/api/updateAvatar` (POST)。此 API 應：
            *   接收 `userId` 和圖片檔案。
            *   使用 `multer` (已在 `server/dataset/operates/uploadImage.js` 中使用) 處理圖片上傳，將圖片儲存至 `server/uploads/avatars/` (建議分子目錄，例如以 `userId` 命名)。
            *   將儲存的圖片相對路徑 (例如 `/uploads/avatars/userId_filename.jpg`) 更新到使用者的 `avatarUrl` 欄位。
        *   **修改密碼：** 新建 `/api/updatePassword` (POST)，接收 `userId`、`oldPassword`、`newPassword`。後端需先驗證 `oldPassword` 是否正確，然後才能更新為 `newPassword` (新密碼應加密儲存)。
*   **開發內容 (前端)：**
    1.  **使用者設定頁面擴充：** 在 `UserSettingsPage.vue` 中：
        *   **User name 修改：** 提供輸入框顯示目前 User name，允許編輯，並有「儲存」按鈕。
        *   **頭像修改：**
            *   顯示目前的頭像（如果 `avatarUrl` 存在）。
            *   提供「上傳新頭像」的按鈕 (`<input type="file">`)。
            *   選擇圖片後，預覽新頭像，並提供「確認上傳」按鈕。
        *   **密碼修改：** 提供三個輸入框：「目前密碼」、「新密碼」、「確認新密碼」，以及「更改密碼」按鈕。
    2.  **頭像顯示位置決定：** 根據需求「要決定圖像顯示的位置」，選擇一或多處顯示使用者頭像，例如：
        *   `UserPage.vue` 的側邊欄頂部使用者名稱旁。
        *   `HomeView.vue` (編輯器頁面) 的頂部導覽列。
        *   `UserSettingsPage.vue`。
        *   修改對應組件以載入並顯示 `user.avatarUrl`。
```
*   **稽核目標：** (✅ 已完成)
    1.  使用者可以成功修改其 User name，變更儲存至資料庫並在介面上（如 `UserPage.vue` 的標題）即時更新。
    2.  使用者可以成功上傳新頭像，圖片儲存於伺服器，`avatarUrl` 更新至資料庫，新頭像在所有指定位置正確顯示。
    3.  使用者輸入正確的舊密碼後，可以成功修改為新密碼（新密碼應符合強度要求，前端可做初步驗證）。
    4.  所有修改操作（名稱、頭像、密碼）成功或失敗時，均有清晰的前端提示。
    5.  密碼修改時，若舊密碼錯誤，或新密碼兩次輸入不一致，應有錯誤提示。

---

```markdown
**步驟 6：筆記搜尋功能**

*   **開發內容 (後端)：**
    1.  **修改 API `getUserNotes`：** 在 `server/dataset/operates/getUserNotes.js` 中：
        *   使其能接收一個額外的 `searchTerm` (String) 參數從 `req.body` 或 `req.query`。
        *   如果 `searchTerm` 存在，修改 `Note.find()` 的查詢條件，使用 `$or` 和 `$regex` (配合 `options: 'i'` 實現不區分大小寫) 來搜尋 `name` 欄位和 `content` 欄位包含 `searchTerm` 的筆記。例如：
            ```javascript
            let query = { user: userId };
            if (folderId !== 'null') {
              query.folder = folderId;
            }
            if (searchTerm) {
              query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { content: { $regex: searchTerm, $options: 'i' } }
              ];
            }
            notes = await Note.find(query);
            ```
*   **開發內容 (前端)：**
    1.  **新增搜尋框：** 在 `src/components/UserPage.vue` 的筆記列表顯示區域上方（主內容區，而非側邊欄），添加一個搜尋輸入框 (`<input type="text">`) 和一個「搜尋」按鈕（或實現即時搜尋）。
    2.  **觸發搜尋：**
        *   當使用者在搜尋框輸入文字後點擊「搜尋」按鈕（或輸入時即時觸發，使用 `@input` 或 `watch`），獲取搜尋框內的 `searchTerm`。
        *   修改 `fetchUserNotes` 方法（或複製一個新的方法如 `searchUserNotes`），使其在請求 `/api/getUserNotes` 時能將 `searchTerm` 一同發送給後端。
        *   更新 `this.notes` 為 API 返回的搜尋結果。
```
*   **稽核目標：**
    1.  `UserPage.vue` 上出現筆記搜尋框。
    2.  輸入關鍵字並執行搜尋後，筆記列表（`this.notes`）只顯示標題或內容中包含該關鍵字的筆記。
    3.  搜尋應不區分大小寫。
    4.  清空搜尋框或搜尋空字串時，應顯示所有筆記（根據目前所在資料夾）。
    5.  搜尋結果應正確反映目前所在資料夾的筆記（即搜尋應在當前資料夾範圍內或全域，根據設計決定）。

---

```markdown
**步驟 7：筆記排序功能（依時間、名稱）**

*   **開發內容 (後端)：**
    1.  **修改 API `getUserNotes`：** 在 `server/dataset/operates/getUserNotes.js` 中：
        *   使其能接收 `sortBy` (String, e.g., 'createdAt', 'name') 和 `sortOrder` (String, e.g., 'asc', 'desc') 參數。
        *   在 `Note.find()` 後面鏈接 `.sort()` 方法。例如：
            ```javascript
            let sortOptions = {};
            if (sortBy && sortOrder) {
              sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
            } else {
              sortOptions['createdAt'] = -1; // 默認按創建時間降序
            }
            notes = await Note.find(query).sort(sortOptions);
            ```
*   **開發內容 (前端)：**
    1.  **新增排序控制項：** 在 `src/components/UserPage.vue` 的筆記列表上方（搜尋框旁或下方），添加排序選項，例如：
        *   兩個下拉選單：一個選擇排序欄位（時間、名稱），一個選擇排序順序（升序、降序）。
        *   或幾個按鈕：「按名稱升序」、「按名稱降序」、「按時間升序」、「按時間降序」。
    2.  **觸發排序：**
        *   當使用者選擇了排序選項後，獲取 `sortBy` 和 `sortOrder` 的值。
        *   修改 `fetchUserNotes` 方法，使其在請求 `/api/getUserNotes` 時能將這些排序參數一同發送給後端。
        *   更新 `this.notes` 為 API 返回的排序後結果。
    3.  **維持排序狀態：** 可以在 `data` 中儲存當前的排序選項，以便在介面上反饋，並在下次載入時可能可以恢復。
```
*   **稽核目標：**
    1.  `UserPage.vue` 上出現筆記排序的控制項。
    2.  選擇「按時間排序」（升序/降序）後，筆記列表按其 `createdAt` 欄位正確排序。
    3.  選擇「按名稱排序」（升序/降序）後，筆記列表按其 `name` 欄位正確排序。
    4.  當前生效的排序方式應在介面上有所體現（例如，下拉選單顯示當前選項，或按鈕高亮）。

---

```markdown
**步驟 8：筆記標籤功能**

*   **開發內容 (後端)：**
    1.  **修改 Note Model：** 在 `server/dataset/note_table.js` 的 `noteSchema` 中增加 `tags` 欄位：`tags: { type: [String], default: [] }`。
    2.  **修改 `createNote` 和 `updateNote` API：**
        *   `server/dataset/operates/createNote.js`: 使其能從 `req.body` 接收 `tags` 陣列並儲存。
        *   `server/dataset/operates/updateNote.js`: 使其能從 `req.body` 接收 `tags` 陣列並更新。
    3.  **修改 `getUserNotes` API (用於篩選)：**
        *   使其能接收一個 `filterByTags` (陣列或逗號分隔的字串) 參數。
        *   如果 `filterByTags` 存在，修改 `Note.find()` 的查詢條件，使用 `$all` (如果需要筆記包含所有指定標籤) 或 `$in` (如果筆記包含任一指定標籤) 來篩選 `tags` 欄位。例如，若 `filterByTags` 是陣列 `['tag1', 'tag2']`:
            ```javascript
            if (filterByTags && filterByTags.length > 0) {
              query.tags = { $all: filterByTags }; // 或 $in
            }
            ```
*   **開發內容 (前端)：**
    1.  **筆記編輯頁面 (`HomeView.vue` / `MarkdownEditor.vue`)：**
        *   在標題下方或某個固定區域，新增一個標籤管理區。
        *   可以顯示目前筆記的標籤列表。
        *   提供一個輸入框，讓使用者可以輸入新標籤，按 Enter 或特定按鈕添加標籤。
        *   每個已添加的標籤旁可以有 "x" 按鈕以移除該標籤。
        *   當筆記儲存時 (手動或自動)，將 `tags` 陣列隨筆記內容一同發送給後端 `updateNote` API。
    2.  **筆記列表頁面 (`UserPage.vue`)：**
        *   **顯示標籤：** 在每個筆記項下方或旁邊，顯示該筆記的標籤。
        *   **按標籤篩選：**
            *   在側邊欄或主內容區的篩選區域，列出所有使用者使用過的標籤（需要一個新的 API `/api/getAllUserTags` 來獲取去重後的標籤列表）。
            *   使用者可以點擊一個或多個標籤進行篩選。
            *   選擇標籤後，呼叫 `getUserNotes` API，傳入 `filterByTags` 參數，更新筆記列表。
```
*   **稽核目標：**
    1.  在筆記編輯頁面，使用者可以為筆記新增、查看、移除標籤。
    2.  標籤資訊隨筆記內容一同正確儲存到資料庫。
    3.  在筆記列表頁面，每篇筆記能正確顯示其關聯的標籤。
    4.  使用者可以點選標籤，筆記列表會篩選出包含該標籤（或選中的所有標籤）的筆記。
    5.  應有清除標籤篩選的功能。

---

```markdown
**步驟 9：筆記管理（移動、重命名、刪除、分享筆記等）**

*   **移動筆記：**
    *   **後端：** 修改 `server/dataset/operates/updateNote.js`，使其可以接收新的 `folderId` 參數。當此參數存在時，更新筆記的 `folder` 欄位。
    *   **前端 (`UserPage.vue`)：**
        1.  在筆記項目的「更多選項」(⋯) 菜單中（目前已有 `renameNote`, `deleteNote`），新增「移動到...」選項。
        2.  點擊「移動到...」後，彈出一個模態框或下拉選單，顯示使用者所有資料夾的層級結構（可參考 `FolderItem.vue` 的遞迴邏輯來構建選擇器）。
        3.  使用者選擇目標資料夾後，獲取目標 `folderId`。
        4.  呼叫後端 `updateNote` API，傳遞 `noteId` 和新的 `folderId`。
        5.  成功後，刷新當前資料夾的筆記列表 (`fetchUserNotes`) 和側邊欄的資料夾結構 (`fetchUserFolders`)，因為筆記數量可能變化。

*   **重命名筆記：** (此功能已部分存在，需稽核)

*   **刪除筆記：** (此功能已部分存在，需稽核)

*   **分享筆記 (初步實現 - 公開唯讀連結)：**
    *   **後端：**
        1.  **修改 Note Model：** 在 `noteSchema` 中增加 `isPublic: { type: Boolean, default: false }` 和 `publicShareId: { type: String, unique: true, sparse: true }` (`sparse:true` 允許 `null` 值不參與唯一性索引)。
        2.  **新增 API 端點 `/api/shareNote` (POST)：**
            *   接收 `noteId` 和一個 `makePublic` (Boolean) 的狀態。
            *   如果 `makePublic` 為 `true`：
                *   檢查 `publicShareId` 是否已存在，若無則生成一個唯一的 ID (可使用 `uuid` 套件)。
                *   設定 `isPublic = true` 和 `publicShareId`。
                *   返回 `publicShareId`。
            *   如果 `makePublic` 為 `false`：
                *   設定 `isPublic = false` (可選擇清除 `publicShareId` 或保留)。
            *   更新資料庫。
        3.  **新增公開路由 `/public/note/:publicShareId` (GET)：**
            *   此路由不應有身份驗證。
            *   根據 `:publicShareId` 查找 `isPublic: true` 的筆記。
            *   若找到，返回筆記的 `name` 和 `content` (或其他需要的公開資訊)。
    *   **前端：**
        1.  **`UserPage.vue` 選項菜單：** 新增「分享」選項。
        2.  **分享模態框/邏輯：** 
            *   點擊「分享」後，檢查筆記目前的 `isPublic` 狀態 (需要 `getNote` API 返回此欄位，或 `getUserNotes` 返回)。
            *   提供一個開關來設定「公開分享」。
            *   若設為公開，呼叫 `/api/shareNote` 使其公開，並顯示生成的分享連結 (例如 `yourdomain.com/view/note/:publicShareId`)。
            *   若從公開轉為私有，也呼叫 API 更新。
        3.  **新增公開筆記檢視頁面 (`PublicNoteView.vue`)：**
            *   在 `src/router/index.js` 中定義新路由，例如 `path: '/view/note/:publicShareId', name: 'publicNoteView', component: PublicNoteView`。
            *   此組件在 `mounted` 時獲取路由參數 `:publicShareId`，呼叫後端 `/public/note/:publicShareId` API 獲取筆記內容。
            *   將獲取的 Markdown 內容渲染為 HTML (可參考 `MarkdownEditor.vue` 的 `marked.parse` 邏輯)。此頁面應為唯讀。
```
*   **稽核目標 (移動筆記)：**
    1.  使用者可以透過選項菜單將指定筆記移動到任一其他資料夾（或根目錄，即 `folderId` 為 `null` 或特定標識）。
    2.  移動成功後，筆記從原資料夾消失，出現在新資料夾中。
*   **稽核目標 (重命名筆記)：**
    1.  此功能已在 `UserPage.vue` 的 `renameNote` 方法中實現。確認其能正常工作，並在重命名後即時更新列表中的筆記名稱。
*   **稽核目標 (刪除筆記)：**
    1.  此功能已在 `UserPage.vue` 的 `deleteNote` 方法中實現。確認其能正常工作，並在刪除後即時從列表中移除筆記。同時，與此筆記相關的 `TaskWithNote` 記錄也應被刪除 (目前 `server/dataset/operates/deleteNote.js` 已處理)。
*   **稽核目標 (分享筆記)：**
    1.  使用者可以將筆記設為公開或取消公開。
    2.  設為公開的筆記會獲得一個唯一的分享連結。
    3.  任何人（即使未登入）透過此分享連結可以查閱筆記的內容（唯讀）。
    4.  取消公開後，原分享連結失效或無法訪問。

---

```markdown
**步驟 10：星號按鈕與篩選功能**

*   **開發內容 (後端)：**
    1.  **修改 Note Model：** 在 `noteSchema` 中增加 `isStarred: { type: Boolean, default: false }`。
    2.  **新增/修改 API 端點：**
        *   可在 `server/dataset/operates/updateNote.js` 中擴展，使其能接收 `isStarred` 布林值並更新。或者新建一個專用 API `/api/toggleStarNote` (POST) 來切換星標狀態。
    3.  **修改 `getUserNotes` API (用於篩選)：**
        *   使其能接收一個 `filterStarred` (Boolean) 參數。
        *   如果 `filterStarred` 為 `true`，則在查詢條件中加入 `isStarred: true`。
*   **開發內容 (前端 `UserPage.vue`)：**
    1.  **星號按鈕：**
        *   在筆記列表的每一項旁邊（例如，筆記名稱前或「更多選項」旁）添加一個星號圖示按鈕 (⭐️/☆)。
        *   按鈕的初始狀態應反映筆記的 `isStarred` 屬性 (需要 `getUserNotes` 和 `getNote` API 返回此欄位)。
        *   點擊星號按鈕時，呼叫後端 API (例如 `updateNote` 或 `toggleStarNote`) 來更新該筆記的 `isStarred` 狀態。
        *   成功後，即時更新前端按鈕的顯示狀態。
    2.  **篩選已加星號的筆記：**
        *   在側邊欄或主內容區的篩選區域（可與標籤篩選、排序等放在一起），添加一個「只顯示已加星號」的切換按鈕或複選框。
        *   當啟用此篩選時，呼叫 `getUserNotes` API，傳入 `filterStarred: true` 參數，更新筆記列表。
```
*   **稽核目標：**
    1.  每篇筆記旁都有一個功能正常的星號按鈕。
    2.  點擊星號按鈕可以為筆記加上或移除星號，狀態變化正確儲存至資料庫並即時反映在前端按鈕上。
    3.  使用者可以透過篩選選項，僅查看所有已加星號的筆記。
    4.  星號篩選應能與其他篩選（如資料夾、搜尋、標籤）協同工作或根據設計互斥。

---
