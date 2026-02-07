const darkToggle = document.getElementById("darkToggle");
const aiToggle = document.getElementById("aiToggle");

// Load settings
chrome.storage.local.get(["theme", "aiEnabled"], (data) => {
  darkToggle.checked = data.theme === "dark";
  aiToggle.checked = data.aiEnabled !== false; // default ON
});

// Dark mode toggle
darkToggle.onchange = () => {
  chrome.storage.local.set({
    theme: darkToggle.checked ? "dark" : "light"
  });
};

// AI summary toggle
aiToggle.onchange = () => {
  chrome.storage.local.set({
    aiEnabled: aiToggle.checked
  });
};
