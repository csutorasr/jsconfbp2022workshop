import "./style.css";
import * as faceapi from 'face-api.js';
await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
import { DroneDriver } from "./drone-driver/drone-driver";
const droneDriver = new DroneDriver();
droneDriver.init();