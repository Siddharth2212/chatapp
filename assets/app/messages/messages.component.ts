import { Component, OnInit } from "@angular/core";

import { Message } from "./message.model";
import { MessageService } from "./message.service";
import * as io from 'socket.io-client';
import {AuthService} from "../auth/auth.service";
import {NgForm} from "@angular/forms";
import {Router} from "@angular/router";

@Component({
    selector: 'app-messages',
    template: `
        <div class="row col-md-6" *ngIf="chatter!=='Content'">
            <div class="col-md-8 col-md-offset-2">
                <form (ngSubmit)="onSubmit(f)" #f="ngForm">
                    <div class="form-group">
                        <label for="content">{{chatter}}</label>
                        <input
                                type="text"
                                id="content"
                                class="form-control"
                                [ngModel]="message?.content"
                                name="content"
                                required>
                    </div>
                    <button type="button" class="btn btn-danger" (click)="onClear(f)">Clear</button>
                    <button class="btn btn-primary" type="submit">Save</button>
                </form>
            </div>
            <div class="col-md-8 col-md-offset-2">
                <app-message
                        [message]="message"
                        *ngFor="let message of messages"></app-message>
            </div>
        </div>
        <div class="row col-md-6">
            <div *ngIf="this.msgAlert==true" class="alert alert-success">
                <strong>Success!</strong>
            </div>
            <div class="col-md-8 col-md-offset-2 well">
                <h5>Online users {{arrayOfKeys.length}}</h5>
                <ul *ngIf="arrayOfKeys.length > 0" class="list-group">
                    <li class="list-group-item" (click)="chatWith(key, people[key].firstname, people[key].socketuserid)" *ngFor="let key of arrayOfKeys">{{people[key].firstname}}</li>
                </ul>
                <ul *ngIf="arrayOfKeys.length == 0" class="list-group">
                    <li class="list-group-item"> No user online </li>
                </ul>
            </div>
        </div>
    `
})
export class MessagesComponent {
    messages: Message[];
    socket = null;
    people = [];
    message: Message;
    arrayOfKeys = [];
    chatter = 'Content';
    loggedInUser = '';
    recipient = '';
    recipientSocketId = '';
    msgAlert = false;

    constructor(private messageService: MessageService, private authService: AuthService, private router: Router) {}

    //Update parameters on clicking an online user
    chatWith(id, firstname, socketuserid){
        this.recipient = id;
        this.recipientSocketId = socketuserid;
        this.chatter = firstname;
        this.messageService.getUserMessages(id, localStorage.getItem('userId'))
            .subscribe(
                (messages: Message[]) => {
                    this.messages = messages;
                }
            );
    }

    onSubmit(form: NgForm) {
        //Create a new message here
        if (!this.message) {
            // Create
            const message = new Message(form.value.content, localStorage.getItem('firstname'), this.recipient);
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
        console.log('checklogin');
        console.log(localStorage.getItem('userId'));
        if(localStorage.getItem('userId') == null){
            this.router.navigate(['auth']);
        }

        //Fetch all online users here
        this.messageService.getChatters()
            .subscribe(
                (response: any) => {
                    var chatters = [];
                    this.loggedInUser = localStorage.getItem('userId');
                    this.arrayOfKeys = Object.keys((response[0].chatters));
                    for(var i = 0; i<this.arrayOfKeys.length; i++){
                        if(this.arrayOfKeys[i] == this.loggedInUser){
                            var index = this.arrayOfKeys.indexOf(this.loggedInUser);
                            this.arrayOfKeys.splice(index, 1);
                        }
                    }
                    var obj = (response[0].chatters);
                    for(var key in obj){
                        chatters[key] = obj[key];
                    }
                    this.people = chatters;
                    console.log(chatters);
                }
            );

        this.socket = io('http://localhost:3000');

        this.messageService.messageIsEdit.subscribe(
            (message: Message) => this.message = message
        );


        //Listener to broadcast a new message
        this.socket.on('chatMessage', function(data) {
            console.log(data);
        }.bind(this));

        this.socket.on('chatMessage', function(data) {
            if(this.chatter == data.username){
                //Notifiying a new message
                alert('New message by '+ data.username);
                this.messages.push(new Message(data.content, data.username, this.recipient));
            }
        }.bind(this));

        //Listener to update online users when a new user comes online
        this.socket.on('updatePeople', function(data2) {
            var chatters = [];
            this.arrayOfKeys = Object.keys(data2);
            for(var i = 0; i<this.arrayOfKeys.length; i++){
                if(this.arrayOfKeys[i] == this.loggedInUser){
                    var index = this.arrayOfKeys.indexOf(this.loggedInUser);
                    this.arrayOfKeys.splice(index, 1);
                }
            }
            for(var key in data2){
                chatters[key] = data2[key];
            }

            this.messageService.updateChatters(data2)
                .subscribe(
                    data => console.log(data),
                    error => console.error(error)
                );

            this.people = chatters;
        }.bind(this));

        //Listener for user log out event
        this.socket.on('userDisconnected', function(user) {
            var index = this.arrayOfKeys.indexOf(user);
            this.arrayOfKeys.splice(index, 1);
        }.bind(this));

        //Get all messages here
        this.messageService.getMessages()
            .subscribe(
                (messages: Message[]) => {
                    this.messages = messages;
                }
            );
    }
}