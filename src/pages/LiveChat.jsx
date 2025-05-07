import ChatWindow from "../components/ChatWindow";

function MessagesPage() {
    const conversationId = "abc123_xyz789"; // Example conversationId - in real use you will get this dynamically

    return (
        <div>
            <h2>Live Chat</h2>
            <ChatWindow conversationId={conversationId} />
        </div>
    );
}
