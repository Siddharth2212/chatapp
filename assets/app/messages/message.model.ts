export class Message {
    content: string;
    username: string;
    recipientId: string;
    messageId?: string;
    userId?: string;

    constructor(content: string, username: string, recipientId: string, messageId?: string, userId?: string) {
        this.content = content;
        this.username = username;
        this.recipientId = recipientId;
        this.messageId = messageId;
        this.userId = userId;
    }
}