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

// ================= RENDER =================
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
    chartsBox.innerHTML = "";
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

  insightsBox.innerHTML = insightsHTML;

  // ---------- CHARTS ----------
  chartsBox.innerHTML = `<h4>Reason Distribution</h4>`;
  Object.keys(reasons).forEach(r => {
    const w = (reasons[r] / tabs.length) * 100;
    chartsBox.innerHTML += `
      <div style="margin-bottom:8px">
        <small>${r} (${reasons[r]})</small>
        <div style="background:#e5e7eb;border-radius:6px">
          <div style="width:${w}%;height:8px;background:#4f46e5;border-radius:6px"></div>
        </div>
      </div>
    `;
  });

  // ---------- HISTORY LIST ----------
  chrome.storage.local.get("aiEnabled", (s) => {
    const showAI = s.aiEnabled !== false;
   

    tabs.slice().reverse().forEach(tab => {
      const div = document.createElement("div");
      div.className = "history-card";

      const reminderText = formatReminder(tab.remindIn);

     div.innerHTML = `
  <h4>${tab.title}</h4>

  ${showAI ? `<p class="meta">🧠 AI Summary: ${generateAISummary(tab)}</p>` : ""}

  <p class="meta">🧠 AI Confidence: <b>${aiConfidence(tab)}</b></p>

  ${reminderText ? `
    <p class="meta">⏰ Reminder: ${reminderText}</p>
    <button class="edit-reminder">✏️ Edit Reminder</button>
  ` : ""}

  <p class="meta">Opened: ${new Date(tab.time).toLocaleString()}</p>
  <a href="${tab.url}" target="_blank">🔗 Open Tab</a><br>
  <button class="done-btn">❌ Done</button>
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
