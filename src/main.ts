import "./style.css";

import { Controller } from "./controller";
import { FaceDetector } from "./face-detector";

const drone = false;

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

const callback = async () => {
  const detection = await faceDetector.detectFace(
    drone ? controller.h264_player.canvas : video
  );
  if (detection) {
    box.style.display = "block";
    box.style.top = `${detection.box.y}px`;
    box.style.left = `${detection.box.x}px`;
    box.style.width = `${detection.box.width}px`;
    box.style.height = `${detection.box.height}px`;
  } else {
    box.style.display = "none";
  }
  requestAnimationFrame(callback);
};

if (drone) {
requestAnimationFrame(callback);
} else {
    video.onplay = callback;
}
