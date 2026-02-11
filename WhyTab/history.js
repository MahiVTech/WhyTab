// ================= ELEMENTS =================
const historyList = document.getElementById("historyList");
const insightsBox = document.getElementById("insightsBox");
const chartsBox = document.getElementById("chartsBox");
const themeToggle = document.getElementById("themeToggle");
const exportBtn = document.getElementById("exportReport");

// ================= THEME =================
chrome.storage.local.get("theme", (d) => {
  if (d.theme === "dark") {
    document.body.classList.add("dark");
    if (themeToggle) themeToggle.textContent = "☀️ Light Mode";
  }
});

if (themeToggle) {
  themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    chrome.storage.local.set({ theme: isDark ? "dark" : "light" });
    themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  };
}


// ================= AI SUMMARY =================
function generateAISummary(tab) {
  const title = tab.title.toLowerCase();
  const url = tab.url.toLowerCase();

  if (url.includes("youtube") || url.includes("hotstar") || title.includes("watch"))
    return "Looks like entertainment or a video page.";

  if (
    title.includes("assignment") ||
    title.includes("project") ||
    title.includes("hackathon") ||
    title.includes("unstop")
  )
    return "Seems related to academic work or projects.";

  if (
    title.includes("buy") ||
    title.includes("price") ||
    url.includes("amazon") ||
    url.includes("flipkart")
  )
    return "Looks related to shopping or purchase decisions.";

  if (title.includes("news"))
    return "Appears to be a news or information page.";

  return "General browsing or research content.";
}
function aiConfidence(tab) {
  let score = 0;
  const title = tab.title.toLowerCase();

  if (title.includes(tab.reason.toLowerCase())) score += 2;
  if (tab.remindIn) score += 1;
  if (title.length > 15) score += 1;

  if (score >= 3) return "High";
  if (score === 2) return "Medium";
  return "Low";
}

// ================= REMINDER HELPERS =================
function formatReminder(remindIn) {
  if (!remindIn) return null;
  const m = Number(remindIn);

  if (m < 60) return `in ${m} minutes`;
  if (m === 60) return `in 1 hour`;
  if (m < 1440) return `in ${Math.round(m / 60)} hours`;
  if (m === 1440) return `tomorrow`;
  return `in ${Math.round(m / 1440)} days`;
}

function updateReminder(tab, minutes) {
  const alarmName = "reminder_" + tab.id;

  chrome.alarms.clear(alarmName);
  chrome.storage.local.remove(alarmName); // 🔥 ADD THIS

  tab.remindIn = minutes;

  chrome.runtime.sendMessage({
    type: "SET_REMINDER",
    tab
  });


  chrome.storage.local.get("savedTabs", (d) => {
    const tabs = d.savedTabs || [];
    const idx = tabs.findIndex(t => t.id === tab.id);
    if (idx !== -1) {
      tabs[idx].remindIn = minutes;
      chrome.storage.local.set({ savedTabs: tabs }, () => {
        render(tabs);
      });
    }
  });
}

function calculateStats(tabs) {
  let night = 0;
  let day = 0;
  const reasons = {};

  tabs.forEach(t => {
    reasons[t.reason] = (reasons[t.reason] || 0) + 1;
    const h = new Date(t.time).getHours();
    if (h >= 22 || h < 6) night++;
    else day++;
  });

  const topReason = Object.keys(reasons)
    .sort((a, b) => reasons[b] - reasons[a])[0] || "—";

  return {
    total: tabs.length,
    night,
    day,
    topReason
  };
}

// ================= RENDER =================
function generateAICoachCards(tabs) {
  const cards = [];

  if (tabs.length >= 8) {
    cards.push({
      title: "🧠 Tab Overload",
      text: "You’re opening many tabs. Consider closing or finishing a few before adding more."
    });
  }

  const reasonCount = {};
  tabs.forEach(t => {
    reasonCount[t.reason] = (reasonCount[t.reason] || 0) + 1;
  });

  if (reasonCount["Entertainment"] > tabs.length / 2) {
    cards.push({
      title: "👀 Distraction Alert",
      text: "Entertainment dominates your tabs. Maybe set a reminder or take a short break intentionally."
    });
  }

  if (reasonCount["Assignment"] || reasonCount["Research"]) {
    cards.push({
      title: "🔥 Focus Detected",
      text: "You’re actively working on meaningful tasks. This is a strong productivity pattern."
    });
  }

  if (cards.length === 0) {
    cards.push({
      title: "🌱 Balanced Usage",
      text: "Your tab usage looks balanced. Keep being intentional."
    });
  }

  return cards;
}


function aiCoachMessage(tabs) {
  const count = {};
  tabs.forEach(t => count[t.reason] = (count[t.reason] || 0) + 1);

  if (count["Entertainment"] > tabs.length / 2)
    return "👀 Too much entertainment lately. Be honest with yourself.";

  if (count["Assignment"] || count["Research"])
    return "👏 You’re focused. Keep this momentum.";

  return "🧠 Mixed usage. Try setting clearer intent.";
}
function render(tabs) {
  console.log("🧪 RENDER TABS:", tabs);

  // 🔑 CLEAR EVERYTHING FIRST (NO DUPLICATES)
  historyList.innerHTML = "";

  // ---------- INSIGHTS ----------


  let insightsHTML = `<h3>🧠 Insights</h3>`;

  if (tabs.length === 0) {
    insightsHTML += `<p>✨ No pending tabs. Clean slate.</p>`;
    insightsBox.innerHTML = insightsHTML;
    const aiCoachBox = document.getElementById("aiCoachBox");
aiCoachBox.innerHTML = "";

const coachCards = generateAICoachCards(tabs);

coachCards.forEach(card => {
  const div = document.createElement("div");
  div.className = "ai-coach-card";

  div.innerHTML = `
    <div class="ai-coach-title">${card.title}</div>
    <div class="ai-coach-text">${card.text}</div>
  `;

  aiCoachBox.appendChild(div);
});

    historyList.innerHTML = "<p>No tabs saved yet 👀</p>";
    return;
  }

  const reasons = {};
  let night = 0, day = 0;

  tabs.forEach(t => {
    reasons[t.reason] = (reasons[t.reason] || 0) + 1;
    const h = new Date(t.time).getHours();
    if (h >= 22 || h < 6) night++;
    else day++;
  });

  const topReason = Object.keys(reasons)
    .sort((a, b) => reasons[b] - reasons[a])[0];

  insightsHTML += `<p>🎯 You mostly open tabs for <b>${topReason}</b>.</p>`;
  insightsHTML += night > day
    ? `<p>🌙 You open many tabs at night.</p>`
    : `<p>☀️ You open most tabs during the day.</p>`;
insightsHTML += `<p>${aiCoachMessage(tabs)}</p>`;

  // ================= INSIGHTS CARDS =================

const coachMessage =
  reasons["Entertainment"] > tabs.length / 2
    ? "👀 Too much entertainment lately. Be honest with yourself."
    : reasons["Assignment"] || reasons["Research"]
    ? "👏 You’re focused. Keep this momentum."
    : "🧠 Mixed usage. Try setting clearer intent.";

insightsBox.innerHTML = `
  <div class="insights-grid">

    <div class="insight-card">
      <h4>🧠 AI Coach</h4>
      <p>${coachMessage}</p>
    </div>
    

    <div class="insight-card">
      <h4>🎯 Focus</h4>
      <p>Main reason: <b>${topReason}</b></p>
    </div>

    <div class="insight-card">
      <h4>⏰ Habit</h4>
      <p>${night > day ? "Mostly active at night 🌙" : "Mostly active during the day ☀️"}</p>
    </div>

  </div>
`;
// ---------- STATS CARDS ----------
const statsBox = document.getElementById("statsBox");
statsBox.innerHTML = "";

const stats = calculateStats(tabs);

const statItems = [
  { label: "Total Tabs", value: stats.total },
  { label: "Day Tabs ☀️", value: stats.day },
  { label: "Night Tabs 🌙", value: stats.night },
  { label: "Top Reason", value: stats.topReason }
];

statItems.forEach(item => {
  const div = document.createElement("div");
  div.className = "stat-card";

  div.innerHTML = `
    <div class="stat-title">${item.label}</div>
    <div class="stat-value">${item.value}</div>
  `;

  statsBox.appendChild(div);
});


  // ---------- CHARTS ----------
  // ---------- PINTEREST-STYLE CHART ----------
// ---------- PIE CHART ----------
const pie = document.getElementById("pieChart");
const legend = document.getElementById("pieLegend");

const total = tabs.length;
let currentAngle = 0;
let gradientParts = [];
let colors = [
  "#a78bfa", // lavender
  "#60a5fa", // soft blue
  "#34d399", // mint
  "#fbbf24", // warm yellow
  "#f472b6"  // soft pink
];
let i = 0;

legend.innerHTML = "";

Object.keys(reasons).forEach(reason => {
  const value = reasons[reason];
  const percent = Math.round((value / total) * 100);
  const angle = (value / total) * 360;

  gradientParts.push(
    `${colors[i % colors.length]} ${currentAngle}deg ${currentAngle + angle}deg`
  );

  legend.innerHTML += `
    <div>
      <span class="pie-dot" style="background:${colors[i % colors.length]}"></span>
     ${reason} — <b>${percent}%</b>

    </div>
  `;

  currentAngle += angle;
  i++;
});

pie.style.background = `conic-gradient(${gradientParts.join(",")})`;



  // ---------- HISTORY LIST ----------
  chrome.storage.local.get("aiEnabled", (s) => {
    const showAI = s.aiEnabled !== false;
   

    tabs.slice().reverse().forEach(tab => {
      const div = document.createElement("div");
      div.className = "history-card";

      const reminderText = formatReminder(tab.remindIn);

     div.innerHTML = `
  <h4>${tab.title}</h4>

  ${showAI ? `<p class="meta">🧠 ${generateAISummary(tab)}</p>` : ""}

  <p class="meta">🧠 Confidence: <b>${aiConfidence(tab)}</b></p>

  ${reminderText ? `<p class="meta">⏰ ${reminderText}</p>` : ""}

  <p class="meta">Opened: ${new Date(tab.time).toLocaleString()}</p>

  <div class="card-actions">
    <a href="${tab.url}" target="_blank">🔗 Open</a>
    <button class="done-btn">❌ Done</button>
  </div>
`;



      // Delete
   div.querySelector(".done-btn").onclick = () => {
  console.log("🗑️ Delete clicked for ID:", tab.id);

  chrome.runtime.sendMessage(
    { type: "DELETE_BY_ID", id: tab.id },
    () => {
      chrome.storage.local.get("savedTabs", d => {
        render(d.savedTabs || []);
      });
    }
  );
};


      // Edit reminder
      const editBtn = div.querySelector(".edit-reminder");
      if (editBtn) {
        editBtn.onclick = () => {
          const val = Number(prompt("Remind me again in how many minutes?"));
          if (val > 0) updateReminder(tab, val);
        };
      }

      historyList.appendChild(div);
    });
  });
}

// ================= EXPORT =================
if (exportBtn) {
  exportBtn.onclick = () => {
    chrome.storage.local.get("savedTabs", (d) => {
      const tabs = d.savedTabs || [];
      if (!tabs.length) {
        alert("No data to export.");
        return;
      }

      const report = `
WhyTab – Weekly Report
Generated: ${new Date().toLocaleString()}
Total Tabs: ${tabs.length}
`;

      const blob = new Blob([report], { type: "text/plain" });
      chrome.downloads.download({
        url: URL.createObjectURL(blob),
        filename: "WhyTab_Report.txt",
        saveAs: true
      });
    });
  };
}

// ================= INITIAL LOAD =================
chrome.storage.local.get("savedTabs", (d) => {
  render(d.savedTabs || []);
});
