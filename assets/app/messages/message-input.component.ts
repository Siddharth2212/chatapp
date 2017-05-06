import { Component, OnInit } from "@angular/core";
import { NgForm } from "@angular/forms";

import { MessageService } from "./message.service";
import { Message } from "./message.model";
import * as io from 'socket.io-client';
import {AuthService} from "../auth/auth.service";


@Component({
    selector: 'app-message-input',
    templateUrl: './message-input.component.html'
})
export class MessageInputComponent implements OnInit {
    message: Message;
    socket = null;

    constructor(private messageService: MessageService, private authService: AuthService) {}

    onSubmit(form: NgForm) {
        if (this.message) {
            // Edit
            this.message.content = form.value.content;
            this.messageService.updateMessage(this.message)
                .subscribe(
                    result => console.log(result)
                );
            this.message = null;
        } else {
            // Create
            const message = new Message(form.value.content, this.authService.getLoggedInUser()[0].firstname, null, this.authService.getLoggedInUser()[0].userid);
            this.messageService.addMessage(message)
                .subscribe(
                    data => console.log(data),
                    error => console.error(error)
                );
            this.socket.emit('newMessage', message);
        }
        form.resetForm();
    }

    onClear(form: NgForm) {
        this.message = null;
        form.resetForm();
    }

    ngOnInit() {
        this.socket = io('http://localhost:3000');
        this.messageService.messageIsEdit.subscribe(
            (message: Message) => this.message = message
        );
        this.socket.on('chatMessage', function(data) {
            console.log('HELLOOOO___');
            console.log(data);
        }.bind(this));
    }
}