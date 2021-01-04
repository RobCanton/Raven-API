import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import { AlertService, Alert } from '../../helpers/alert.service';

@Injectable()
export class FirebaseService {


  constructor(@Inject('CONFIG_OPTIONS') private options) {

    firebase.initializeApp({
      credential: firebase.credential.cert(options.security_params),
      databaseURL: options.databaseURL,
      storageBucket: options.storageBucket
    });

  }

  async authenticate(token: string) {
    return firebase.auth().verifyIdToken(token);
  }

  async sendNotification(token: string, title: string, body: string) {
    return new Promise((resolve, reject) => {
      let payload = {
        "notification": {
          "title": title,
          "body": body,
          "badge": `0`,
          "sound" : "alert.caf",
        }
      }

      const sendPushNotification = firebase.messaging().sendToDevice(token, payload);
      return sendPushNotification.then ( () => {
        return resolve(true);
      }).catch(e => {
        return reject(e);
      })
    });
  }

  async writeAlert(alertID:string, alert: Alert, value:number, timestamp:number) {
    var alertData = {
      id: alertID,
      symbol: alert.s,
      type: alert.t,
      condition: alert.c,
      value: Number(alert.v),
      reset: alert.r,
      enabled: alert.e,
      dateCreated: alert.d
    };

    var notificationData = {
      uid: alert.u,
      alert: alertData,
      timestamp: timestamp,
      value: value
    }

    let notificationsRef = firebase.firestore().collection('notifications');
    const res = await notificationsRef.add(notificationData);
    console.log("Added doc with ID: ", res.id);
    //let database = firebase.database().ref(`app/user/notifications/${alert.u}`);
    //let triggerKey = database.push().key;
    //await database.child(triggerKey).set(notificationData);
    return;
  }

  database() {
    return firebase.database();
  }

  firestore() {
    return firebase.firestore();
  }

}
