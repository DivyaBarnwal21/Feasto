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
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.remove('active');
        setTimeout(() => {
            toggle.style.display = 'flex';
        }, 300);
    });

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
        
        if (query.includes('hello') || query.includes('hi')) {
            return "Hi there! Looking for something delicious today?";
        } else if (query.includes('menu') || query.includes('food') || query.includes('eat')) {
            return "You can check out our full menu by clicking the 'Menu' link in the navigation bar. We have amazing pizzas, burgers, and more!";
        } else if (query.includes('order') || query.includes('track')) {
            return "To place an order, just add items to your cart and proceed to checkout. For tracking, please contact our support.";
        } else if (query.includes('contact') || query.includes('support') || query.includes('phone')) {
            return "You can reach us at support@feasto.com or call us at +1 234 567 890.";
        } else if (query.includes('price') || query.includes('cost')) {
            return "Our prices are very competitive! Most items are between $5 and $20. Check the menu for details.";
        } else if (query.includes('location') || query.includes('address')) {
            return "We are located at 123 Foodie Street, Flavor Town. Come visit us!";
        } else {
            return "I'm not sure I understand. Can you try asking about our menu, orders, or contact info?";
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
});
