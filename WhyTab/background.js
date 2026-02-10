console.log("🔥 Background running");

// ================= MESSAGE HANDLER =================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ===== SET / UPDATE REMINDER =====
  if (message.type === "SET_REMINDER") {
    const tab = message.tab;
    const alarmName = "reminder_" + tab.id;

    chrome.alarms.clear(alarmName, () => {
      chrome.alarms.create(alarmName, {
        delayInMinutes: Number(tab.remindIn)
      });

      chrome.storage.local.set({
        [alarmName]: tab
      });
    });
  }

  // ===== DELETE TAB BY ID =====
 if (message.type === "DELETE_BY_ID") {
  const id = message.id;
  const alarmName = "reminder_" + id;

  // 🔥 Clear reminder
  chrome.alarms.clear(alarmName);
  chrome.storage.local.remove(alarmName);

  // 🔥 Close actual browser tab (if still open)
  chrome.tabs.remove(id, () => {
    // ignore error if tab already closed
  });

  // 🔥 Remove from savedTabs
  chrome.storage.local.get("savedTabs", (data) => {
    const tabs = data.savedTabs || [];
    const updated = tabs.filter(t => t.id !== id);

    chrome.storage.local.set({ savedTabs: updated }, () => {
      sendResponse({ success: true });
    });
  });

  return true;
}

});

// ================= ALARM FIRES =================
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(alarm.name, (data) => {
    const tab = data[alarm.name];
    if (!tab) return;

    chrome.notifications.create({
  type: "basic",
  iconUrl: "icons/icon128.png",
  title: "⏰ WhyTab Reminder",
  message: `You said this tab was for "${tab.reason}". Still relevant?`,
  priority: 2
});

    // Cleanup after fire
    chrome.storage.local.remove(alarm.name);
  });
});
