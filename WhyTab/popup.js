
console.log("✅ popup.js loaded");
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Popup loaded");
});

const buttons = document.querySelectorAll(".reason-btn");
const reminderSelect = document.getElementById("reminderTime");
const customReminder = document.getElementById("customReminder");
document.querySelectorAll(".reason-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    console.log("🟢 Button clicked:", btn.innerText);
  });
});

buttons.forEach(btn => {
  btn.onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    let remindIn = null;

    if (customReminder.value && Number(customReminder.value) > 0) {
      remindIn = Number(customReminder.value);
    } else if (reminderSelect.value) {
      remindIn = Number(reminderSelect.value);
    }

    const entry = {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      reason: btn.textContent,
      time: new Date().toISOString(),
      remindIn
    };

    chrome.storage.local.get("savedTabs", (data) => {
      const tabs = data.savedTabs || [];
      tabs.push(entry);
      chrome.storage.local.set({ savedTabs: tabs });
    });

    if (remindIn) {
      chrome.runtime.sendMessage({
        type: "SET_REMINDER",
        tab: entry
      });
    }

    window.close();
  };
});
