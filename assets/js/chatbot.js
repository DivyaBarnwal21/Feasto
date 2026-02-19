/**
 * Feasto Chatbot Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inject Chatbot HTML
    const chatbotHTML = `
        <div class="chatbot-container">
            <div class="chatbot-toggle" id="chatbot-toggle">
                <ion-icon name="chatbubbles-outline"></ion-icon>
            </div>
            <div class="chatbot-window" id="chatbot-window">
                <div class="chat-header">
                    <h3><ion-icon name="restaurant-outline"></ion-icon> Feasto Assistant</h3>
                    <div class="close-chat" id="close-chat">
                        <ion-icon name="close-outline"></ion-icon>
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="message bot">
                        Hello! Welcome to Feasto. How can I help you today?
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Type a message...">
                    <button id="send-chat">
                        <ion-icon name="send-outline"></ion-icon>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const toggle = document.getElementById('chatbot-toggle');
    const windowEl = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('close-chat');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat');
    const messages = document.getElementById('chat-messages');

    // Toggle Window
    toggle.addEventListener('click', () => {
        windowEl.classList.add('active');
        toggle.style.display = 'none';
        
        // Show support options if first time
        if (messages.children.length === 1) {
            setTimeout(showSupportOptions, 1000);
        }
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.remove('active');
        setTimeout(() => {
            toggle.style.display = 'flex';
        }, 3000);
    });

    function showSupportOptions() {
        addMessage("How can I help you today? Select a category or type your query:", "bot");
        const options = ["Payment Issue", "Wrong Order", "Wrong Item", "Refund Request", "Late Delivery"];
        const quickReplyDiv = document.createElement('div');
        quickReplyDiv.className = 'quick-replies';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn';
            btn.textContent = opt;
            btn.onclick = () => {
                addMessage(opt, 'user');
                setTimeout(() => {
                    const resp = getBotResponse(opt);
                    addMessage(resp, 'bot');
                }, 500);
            };
            quickReplyDiv.appendChild(btn);
        });
        messages.appendChild(quickReplyDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    // Send Message
    function sendMessage() {
        const text = input.value.trim();
        if(!text) return;

        addMessage(text, 'user');
        input.value = '';

        // Bot Response
        setTimeout(() => {
            const response = getBotResponse(text);
            addMessage(response, 'bot');
        }, 500);
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    function getBotResponse(query) {
        query = query.toLowerCase();
        
        // Customer Support Queries
        if (query.includes('payment') || query.includes('money') || query.includes('pay')) {
            return "For payment issues, please ensure your card details are correct. If you were charged twice, please send your transaction ID to accounts@feasto.com.";
        } else if (query.includes('wrong order') || query.includes('wrong item') || query.includes('missing')) {
            return "We're sorry to hear that! Please provide your Order ID and a photo of the received items to support@feasto.com, and we will resolve it immediately.";
        } else if (query.includes('refund')) {
            return "Refunds usually take 5-7 business days to process. If you haven't received it yet, please contact your bank or reach out to us at support@feasto.com.";
        } else if (query.includes('late') || query.includes('delay')) {
            return "We apologize for the delay. Traffic or high demand can sometimes slow us down. You can check your delivery status in your profile or call our delivery partner.";
        }
        
        // General Queries
        if (query.includes('hello') || query.includes('hi')) {
            return "Hi there! I am Feasto Assistant. How can I help you with your order or payment today?";
        } else if (query.includes('menu') || query.includes('food') || query.includes('eat')) {
            return "You can check out our full menu by clicking the 'Menu' link in the navigation bar.";
        } else if (query.includes('order') || query.includes('track')) {
            return "To place an order, just add items to your cart. For tracking, please check your email for the live tracking link.";
        } else if (query.includes('contact') || query.includes('support') || query.includes('phone')) {
            return "You can reach our human support team at support@feasto.com or call us at +1 234 567 890.";
        } else {
            return "I'm specialized in helping with orders and payments. For other queries, please contact support@feasto.com.";
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
});
