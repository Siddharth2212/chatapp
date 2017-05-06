import { Component, OnInit } from "@angular/core";

import { Message } from "./message.model";
import { MessageService } from "./message.service";
import * as io from 'socket.io-client';
import {AuthService} from "../auth/auth.service";

@Component({
    selector: 'app-message-list',
    template: `
        <div class="col-md-8 col-md-offset-2">
            <ul>
                <li *ngFor="let person of people"><a href="#">{{person}}</a></li>
            </ul>
        </div>
        <div class="col-md-8 col-md-offset-2">
            <app-message
                   [message]="message"
                    *ngFor="let message of messages"></app-message>
        </div>
    `
})
export class MessageListComponent implements OnInit {
    messages: Message[];
    socket = null;
    people = [];

    constructor(private messageService: MessageService, private authService: AuthService) {}

    ngOnInit() {
        this.messageService.getChatters()
            .subscribe(
                (response: any) => {
                    var chatters = [];
                    for(var key in response[0].chatters){
                        chatters.push(key);
                    }
                    this.people = chatters;
                }
            );

        this.socket = io('http://localhost:3000');

        this.socket.on('chatMessage', function(data) {
            this.messages.push(new Message(data.content, data.username, ''));
        }.bind(this));

        this.socket.on('updatePeople', function(data2) {
            var chatters = [];
            for(var key in data2){
                chatters.push(key);
            }
            this.people = chatters;
            this.messageService.updateChatters(data2)
                .subscribe(
                    data => console.log(data),
                    error => console.error(error)
                );
        }.bind(this));

        this.messageService.getMessages()
            .subscribe(
                (messages: Message[]) => {
                    this.messages = messages;
                }
            );
    }
}