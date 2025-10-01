document.addEventListener("DOMContentLoaded", () => {
  // --- Element Selections ---
  const body = document.body;
  const darkThemeToggle = document.getElementById("dark-theme-toggle");
  const sidebarToggle = document.getElementById("side-bar-toggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarCloseButton = document.getElementById("sidebar-close-button");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const promptInput = document.getElementById("prompt-input");
  const sendButton = document.getElementById("send-button");
  const chatContainer = document.getElementById("chat-container");
  const newChatButton = document.getElementById("new-chat-button");

  // --- Dark Theme Logic ---
  darkThemeToggle.addEventListener("click", () => {
    body.classList.toggle("dark-theme");
  });

  // --- Sidebar Logic ---
  const toggleSidebar = () => {
    body.classList.toggle("sidebar-open");
  };
  sidebarToggle.addEventListener("click", toggleSidebar);
  sidebarCloseButton.addEventListener("click", toggleSidebar);
  sidebarOverlay.addEventListener("click", toggleSidebar);

  // --- Auto-resize Textarea ---
  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = `${promptInput.scrollHeight}px`;
  });

  // --- New Chat Button Logic ---
  newChatButton.addEventListener("click", () => {
    chatContainer.innerHTML = `
            <div class="placeholder">
              <p>New chat started. Ask me anything!</p>
            </div>`;
    toggleSidebar();
  });

  // --- Core Chat Functionality ---
  const handleSendClick = async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    const placeholder = chatContainer.querySelector(".placeholder");
    if (placeholder) placeholder.remove();

    appendUserMessage(prompt);
    promptInput.value = "";
    promptInput.style.height = "auto";

    showTypingIndicator();

    const response = await callLlama(prompt);

    const typingIndicator = chatContainer.querySelector(".typing-indicator");
    if (typingIndicator) typingIndicator.remove();

    if (typeof response === "object" && response.response) {
      streamAIResponse(response.response);
    } else {
      streamAIResponse(`Error: ${response}`);
    }
  };

  const appendUserMessage = (message) => {
    const userAvatarSVG = `
            <div class="avatar-container">
                <svg class="avatar-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" fill="currentColor"/><path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" fill="currentColor"/></svg>
            </div>`;

    const messageHTML = `
            <div class="message-bubble user-message">
                ${userAvatarSVG}
                <div class="message-content">
                    <p>${message.replace(/\n/g, "<br>")}</p>
                </div>
            </div>`;
    chatContainer.insertAdjacentHTML("beforeend", messageHTML);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  const streamAIResponse = (message) => {
    // Create the AI message bubble structure
    const aiMessageContainer = document.createElement("div");
    aiMessageContainer.className = "message-bubble ai-message";
    aiMessageContainer.innerHTML = `
            <div class="avatar-container">
                <img src="static/image/llama.jpg" alt="AI avatar" class="avatar">
            </div>
            <div class="message-content">
                <p></p>
            </div>`;

    chatContainer.appendChild(aiMessageContainer);
    const contentParagraph = aiMessageContainer.querySelector("p");

    let index = 0;
    const typingSpeed = 20; // milliseconds per character

    // Disable input while AI is typing
    promptInput.disabled = true;
    sendButton.disabled = true;

    const intervalId = setInterval(() => {
      if (index < message.length) {
        contentParagraph.textContent += message.charAt(index);
        index++;
        chatContainer.scrollTop = chatContainer.scrollHeight;
      } else {
        clearInterval(intervalId);
        // Re-enable input
        promptInput.disabled = false;
        sendButton.disabled = false;
        promptInput.focus();
      }
    }, typingSpeed);
  };

  const showTypingIndicator = () => {
    const typingHTML = `
            <div class="message-bubble ai-message typing-indicator">
                <div class="avatar-container">
                    <img src="static/image/llama.jpg" alt="ai avatar" class="avatar">
                </div>
                <div class="message-content">
                    <span></span><span></span><span></span>
                </div>
            </div>`;
    chatContainer.insertAdjacentHTML("beforeend", typingHTML);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  async function callLlama(prompt, stream = false) {
    const url = "http://localhost:11434/api/generate";
    const data = { model: "llama3.2", prompt: prompt, stream: stream };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.ok
        ? await response.json()
        : `Error: ${response.status} - ${response.statusText}`;
    } catch (error) {
      console.error("Fetch API error:", error);
      return `Network Error: Could not connect to the API.`;
    }
  }

  sendButton.addEventListener("click", handleSendClick);
  promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendClick();
    }
  });
});
