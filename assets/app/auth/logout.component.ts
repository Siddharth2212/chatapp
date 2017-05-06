import { Component } from "@angular/core";
import { Router } from "@angular/router";
import * as io from 'socket.io-client';
import { AuthService } from "./auth.service";
import {MessageService} from "../messages/message.service";

@Component({
    selector: 'app-logout',
    template: `
        <div class="col-md-8 col-md-offset-2">
            <button class="btn btn-danger" (click)="onLogout()">Logout</button>
        </div>
    `
})
export class LogoutComponent {
    socket = null;

    constructor(private authService: AuthService, private router: Router, private messageService: MessageService) {}

    onLogout() {
        this.socket = io('http://localhost:3000');
        this.socket.emit("unjoin", localStorage.getItem('userId'));
        this.socket.emit("disconnect");
        this.messageService.removeChatter(localStorage.getItem('userId'))
            .subscribe(
                data => console.log(data),
                error => console.error(error)
            );
        this.authService.logout();
        this.router.navigate(['/auth', 'signin']);
    }
}