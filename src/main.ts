import "./style.css";
import * as faceapi from 'face-api.js';
await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
import { DroneDriver } from "./drone-driver/drone-driver";

const droneDriver = new DroneDriver();
droneDriver.init();

// set video and canvas width to 100% so it will fit to the bootstrap grid
// video.setAttribute('style', 'width: 100%');
document.querySelector('canvas')!.setAttribute('style', 'width: 100%');