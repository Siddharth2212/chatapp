import { Component } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import * as io from 'socket.io-client';
import { User } from "./user.model";
import { AuthService } from "./auth.service";
import {MessageService} from "../messages/message.service";

@Component({
    selector: 'app-signin',
    templateUrl: './signin.component.html'
})
export class SigninComponent {
    myForm: FormGroup;
    socket = null;
    loggedInUser = '';

    constructor(private authService: AuthService, private router: Router, private messageService: MessageService) {}

    onSubmit() {
        this.socket = io('http://localhost:3000');
        const user = new User(this.myForm.value.email, this.myForm.value.password);
        this.authService.signin(user)
            .subscribe(
                data => {
                    console.log({firstname: data.user.firstName, userid: data.userId});
                    this.socket.emit("join", {firstname: data.user.firstName, userid: data.userId});
                    this.authService.setLoggedInUser(data.userId, data.user.firstName)
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userId', data.userId);
                    localStorage.setItem('firstname', data.user.firstName);
                    this.router.navigateByUrl('/');
                },
                error => console.error(error)
            );
        this.myForm.reset();
    }

    ngOnInit() {
        this.myForm = new FormGroup({
            email: new FormControl(null, [
                Validators.required,
                Validators.pattern("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")
            ]),
            password: new FormControl(null, Validators.required)
        });
    }
}