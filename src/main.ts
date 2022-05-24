import "./style.css";

import { Controller } from "./controller";
import { FaceDetector } from "./face-detector";

const controller = new Controller();

controller.init();

const faceDetector = new FaceDetector();

const box = document.getElementById('box') as HTMLDivElement;

const callback = async () => {
    const detection = await faceDetector.detectFace(controller.h264_player.canvas);
    if (detection) {
        box.style.display = 'block';
        box.style.top = `${detection.box.y}px`;
        box.style.left = `${detection.box.x}px`;
        box.style.width = `${detection.box.width}px`;
        box.style.height = `${detection.box.height}px`;
    } else {
        box.style.display = 'none';
    }
    requestAnimationFrame(callback);
};
requestAnimationFrame(callback);
