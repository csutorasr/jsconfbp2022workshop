import * as faceapi from "face-api.js";

export class FaceDetector {
  private loaded = faceapi.loadSsdMobilenetv1Model("/");

  public async detectFace(canvas: HTMLCanvasElement | HTMLVideoElement) {
    await this.loaded;
    const detection = await faceapi.detectSingleFace(canvas);
    return detection;
  }
}
