import "./style.css";

import { Controller, StickData } from "./controller";
import { FaceDetector } from "./face-detector";

const drone = true;

const controller = new Controller();
const faceDetector = new FaceDetector();

const video = document.createElement("video");
if (drone) {
  controller.init();
} else {
  const videoFeed = document.getElementById("videoFeed");
  videoFeed?.appendChild(video);

  if (navigator.mediaDevices.getUserMedia) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.autoplay = true;
  }
}

const box = document.getElementById("box") as HTMLDivElement;

let faceNotFoundCounter = 0;

const callback = async () => {
  const detection = await faceDetector.detectFace(
    drone ? controller.h264_player.canvas : video
  );
  const stickData: StickData = {
    pitch: 0,
    roll: 0,
    throttle: 0,
    yaw: 0,
  };
  if (detection) {
    faceNotFoundCounter = 0;
    box.style.display = "block";
    box.style.top = `${detection.box.y}px`;
    box.style.left = `${detection.box.x}px`;
    box.style.width = `${detection.box.width}px`;
    box.style.height = `${detection.box.height}px`;

    if (detection.relativeBox.area > 0.1) {
      stickData.pitch -= Math.min(detection.relativeBox.area * 4, 0.5);
    } else if (detection.relativeBox.area < 0.03) {
      stickData.pitch += 0.2;
    }
    if (detection.relativeBox.bottom > 0.9) {
      stickData.throttle -= detection.relativeBox.bottom / 4;
    }
    if (detection.relativeBox.top < 0.2) {
      stickData.throttle += (1 - detection.relativeBox.top) / 3;
    }
    if (detection.relativeBox.left < 0.3) {
      stickData.yaw -= (1 - detection.relativeBox.left) / 2; 
      stickData.roll -= (1 - detection.relativeBox.left) / 6; 
    }
    if (detection.relativeBox.right > 0.7) {
      stickData.yaw += detection.relativeBox.right / 2;
      stickData.roll += detection.relativeBox.right / 6;
    }
    controller.sendStickData(stickData);
  } else {
    faceNotFoundCounter++
    if (faceNotFoundCounter > 100) {
      stickData.yaw += 0.2;
    }
    if (faceNotFoundCounter++ > 5) {
      box.style.display = "none";
      controller.sendStickData(stickData);
    }
  }
  setTimeout(callback);
};

if (drone) {
  setTimeout(callback);
} else {
  video.onplay = callback;
}
