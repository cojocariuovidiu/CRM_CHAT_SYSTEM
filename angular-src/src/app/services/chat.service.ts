import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http, Headers, Response, RequestOptions } from "@angular/http";
import 'rxjs/add/operator/map';

import * as io from 'socket.io-client';
import { Message } from "../models/message.model";
import { AuthService } from "./auth.service";
import { environment } from '../../environments/environment';

const BASE_URL = environment.backendUrl;

@Injectable()
export class ChatService {
  private socket: any;
  private serverUrl: string = BASE_URL;
  private apiUrl: string = `${BASE_URL}/messages`;
  private adminUrl: string = `${BASE_URL}/admins`;
  private staffUrl: string = `${BASE_URL}/staffs`;

  private usersUrl: string = `${BASE_URL}/users`;

  constructor(private authService: AuthService, private http: Http) { }

  connect(username: string, callback: Function = () => { }): void {
    this.socket = io(this.serverUrl, { transports: ['xhr-polling', 'websocket'], rejectUnauthorized: false, upgrade: false });

    this.socket.on("connect", () => {
      if (!this.checkStaff()) {
        this.sendUser(username);
        callback();
      }
      else {
        this.sendStaff(username);
        callback();
      }
    });
  }

  checkStaff() {
    return this.authService.checkStaff();
  }

  isConnected(): boolean {
    if (this.socket != null) {
      return true;
    } else {
      return false;
    }
  }

  sendUser(username: string): void {
    this.socket.emit("username", { username: username });
  }

  sendStaff(staffname: string): void {
    this.socket.emit("staffname", { staffname: staffname });
  }


  disconnect(): void {
    this.socket.disconnect();
  }

  getConversation(name1: string, name2: string): any {
    let url = this.apiUrl; //message API
    if (name2 != "chat-room") {
      let route = "/" + name1 + "/" + name2;
      url += route;
    }

    let authToken = this.authService.getUserData().token;

    let headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": authToken
    });
    let options = new RequestOptions({ headers: headers });

    let observableReq = this.http.get(url, options)
      .map(this.extractData);

    return observableReq;
  }


  getUserList(): any {
    let url = this.usersUrl;

    let authToken = this.authService.getUserData().token;

    // prepare the request
    let headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": authToken
    });
    let options = new RequestOptions({ headers: headers });

    // POST
    let observableReq = this.http.get(url, options)
      .map(this.extractData);

    return observableReq;
  }

  getStaffList(): any {
    let url = this.staffUrl;

    let authToken = this.authService.getUserData().token;

    // prepare the request
    let headers = new Headers({
      "Content-Type": "application/json",
      "Authorization": authToken
    });

    let options = new RequestOptions({ headers: headers });

    let observableReq = this.http.get(url, options)
      .map(this.extractData);
    return observableReq;
  }

  receiveMessage(): any {
    let observable = new Observable(observer => {
      this.socket.on("message", (data: Message) => {
        observer.next(data);
      });
    });

    return observable;
  }

  receiveActiveList(): any {
    let observable = new Observable(observer => {
      this.socket.on("active", (data) => {
        if(data.username!=undefined)
        observer.next(data);
      });
    });

    return observable;
  }
  
  receiveActiveStaffList(): any{
    let observable = new Observable(observer => {
      this.socket.on("active", (data) => {
        if(data.staffname!=undefined)
        observer.next(data);
      });
    });
    return observable;
  }
  
  sendMessage(message: Message, chatWith: string): void {
    this.socket.emit("message", { message: message, to: chatWith });
  }

  getActiveList(): void {
    this.socket.emit("getactive");
  }

  extractData(res: Response): any {
    let body = res.json();
    return body || {};
  }

}
