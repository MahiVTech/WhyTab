# WhyTab 🧠⏰  
**Intent-Based Tab Management Chrome Extension**

WhyTab is a productivity-focused Chrome extension that captures the intent behind opened tabs, enables smart reminder scheduling, and generates behavioral insights using local AI-based logic.

Most users open 20+ tabs and forget why they opened them. WhyTab solves that problem by enforcing intentional browsing.

---

## 🚀 Core Features

- 🤔 Capture intent when opening a new tab
- ⏰ Smart reminders using Chrome Alarms API
- 🧠 Rule-based local AI engine for tab classification
- 📜 Persistent tab history tracking
- 📊 Behavioral analytics dashboard (Day vs Night usage)
- 🥧 Dynamic usage breakdown (pie chart rendering)
- 🌙 Dark / Light theme toggle
- 📤 Weekly report export
- ⚙️ User-controlled AI settings

---

## 🏗️ Architecture

WhyTab follows a modular Chrome Extension architecture (Manifest V3):

- **Popup UI** → Intent capture layer
- **Background Service Worker** → Alarm scheduling & notifications
- **Chrome Storage API** → Persistent state management
- **History Dashboard** → Dynamic UI rendering & analytics
- **Local AI Rule Engine** → Intent classification & insights generation

---

## 🛠️ Tech Stack

- JavaScript (ES6)
- Chrome Extension API (Manifest V3)
- Chrome Storage API
- Chrome Alarms API
- Chrome Notifications API
- Dynamic DOM rendering
- Git version control

---

## 📸 Screenshots

### 🧩 Popup UI
![Popup](./screenshots/popup.png)

### 📊 History Dashboard
![Dashboard](./screenshots/history.png)

### 🧠 Insights View
![Insights](./screenshots/history2.png)

---

## 🔧 Installation (Developer Mode)

1. Clone the repository:

2. Open Chrome and navigate to:

3. Enable **Developer Mode**

4. Click **Load Unpacked**

5. Select the project folder

---

## 🧠 Key Engineering Learnings

- Managing async Chrome APIs
- Alarm lifecycle handling in service workers
- State persistence with chrome.storage
- Preventing duplicate UI re-renders
- Handling popup lifecycle limitations
- Structuring a real-world browser extension

---

## 📌 Future Improvements

- Cloud synchronization
- AI-generated weekly summaries
- Tag-based tab categorization
- Cross-device reminder sync
- Chrome Web Store deployment

---

## 👩‍💻 Author

**Mahi Varshney**  
B.Tech CS-AI Student  
Focused on building practical productivity and AI-powered tools.

---

Built to reduce tab chaos and promote intentional browsing.
