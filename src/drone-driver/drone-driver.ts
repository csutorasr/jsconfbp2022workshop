// @ts-ignore
import { Player } from "./Player";

export interface StickData {
  yaw: number;
  throttle: number;
  roll: number;
  pitch: number;
}

const toUint8Array = function (parStr: string) {
  var raw = parStr;
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  var i;
  for (i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
};

export class DroneDriver {
  ws_video!: WebSocket;
  ws_telemetry!: WebSocket;
  telemetry_obj = document.getElementById("telemetryFeed") as HTMLElement;
  h264_player!: { canvas: HTMLCanvasElement; decode: any };
  kMap: Record<string, boolean> = {};
  stickData = {
    roll: 0,
    pitch: 0,
    throttle: 0,
    yaw: 0,
  };

  initVideoFeedReceive() {
    this.ws_video.send("f");
  }

  initTelemetryFeedReceive() {
    this.ws_telemetry.send("t");
  }

  processFrame(imgString: any) {
    if (imgString.data != "false") {
      this.h264_player.decode(toUint8Array(imgString.data));
    } else {
      console.log(imgString);
    }
  }

  processTelemetry(data: any) {
    // this.telemetry_obj.innerHTML = data.data;
    const dataParsed = JSON.parse(data.data);
    (document.getElementById('battery-percentage') as HTMLDivElement).innerHTML = dataParsed.state.battery.percentage;
    (document.getElementById('battery-voltage') as HTMLDivElement).innerHTML = dataParsed.state.battery.voltage;
    (document.getElementById('wifi') as HTMLDivElement).innerHTML = dataParsed.wifi;
  }

  connect() {
    try {
      this.ws_video = new WebSocket("ws://127.0.0.1:8081/");
      this.ws_video.onmessage = (data) => {
        this.processFrame(data);
      };
      this.ws_video.onopen = () => {
        this.initVideoFeedReceive();
      };
      this.ws_video.onerror = () => {
        this.ws_video.close();
      };
    } catch (e) {
      console.log("Error", "Video", "reconnect");
    }

    try {
      this.ws_telemetry = new WebSocket("ws://127.0.0.1:8082/");
      this.ws_telemetry.onmessage = (data) => {
        this.processTelemetry(data);
      };
      this.ws_telemetry.onopen = () => {
        this.initTelemetryFeedReceive();
      };
      this.ws_telemetry.onerror = () => {
        this.ws_telemetry.close();
      };
    } catch (e) {
      console.log("Error", "Telemetry", "reconnect");
    }
  }

  private initCanvas() {
    this.h264_player = new Player({
      useWorker: true,
      webgl: "auto",
      size: { width: 960, height: 720 },
    });
    (document.getElementById("videoFeed") as HTMLDivElement).appendChild(this.h264_player.canvas);
  }

  private initKeyboard() {
    document.body.onkeydown = document.body.onkeyup = (e) => {
      e.preventDefault();
      this.kMap[e.code] = e.type == "keydown" ? true : false;
      this.keyboardEvent();
    };
  }

  speed = 0.5;
  keyboardEvent() {
    if (
      this.kMap.Space === true &&
      (this.kMap.ShiftLeft === true || this.kMap.ShiftRight === true)
    ) {
      this.kMap.Space = false;
      this.sendCmd("takeoff", 0);
    } else if (this.kMap.Space === true) {
      this.sendCmd("land", 0);
    }
    if (
      this.kMap.KeyW === true ||
      this.kMap.KeyA === true ||
      this.kMap.KeyS === true ||
      this.kMap.KeyD === true ||
      this.kMap.ArrowUp === true ||
      this.kMap.ArrowDown === true ||
      this.kMap.ArrowLeft === true ||
      this.kMap.ArrowRight === true
    ) {
      this.sendStickData({
        yaw:
          this.speed *
          (this.kMap.KeyA === true ? -1 : this.kMap.KeyD === true ? 1 : 0),
        throttle:
          this.speed *
          (this.kMap.KeyS === true ? -1 : this.kMap.KeyW === true ? 1 : 0),
        roll:
          this.speed *
          (this.kMap.ArrowLeft === true
            ? -1
            : this.kMap.ArrowRight === true
            ? 1
            : 0),
        pitch:
          this.speed *
          (this.kMap.ArrowDown === true
            ? -1
            : this.kMap.ArrowUp === true
            ? 1
            : 0),
      });
    } else {
      this.sendStickData({
        yaw: 0,
        throttle: 0,
        roll: 0,
        pitch: 0,
      });
    }
    return false;
  }

  public sendStickData(data: StickData) {
    this.showStickData(data);
    this.sendCmd("stick", data);
  }

  private showStickData(data: StickData) {
    for (const attribute of Object.keys(data)) {
      this.showStickDataAttribute((data as any)[attribute], attribute);
    }
  }

  private showStickDataAttribute(value: number, attribute: string) {
    const minusRange = document.getElementById(`${attribute}-minus`);
    const plusRange = document.getElementById(`${attribute}-plus`);
    (minusRange as HTMLProgressElement).value = 0;
    (plusRange as HTMLProgressElement).value = 0;
    if (value < 0) {
      (minusRange as HTMLProgressElement).value = Math.abs(value);
    } else {
      (plusRange as HTMLProgressElement).value = Math.abs(value);
    }
  }

  private initUI() {
    const select = document.getElementById("settings-ev") as HTMLSelectElement;
    // settings: exposure value
    select.onchange = () => {
      this.sendCmd("ev", select.value);
    };
  }

  private initPing() {
    // ping backend every 0.5 seconds
    setInterval(() => {
      this.sendCmd("ping", 0);
    }, 500);
  }

  sendCmd(_cmd: string, _value: unknown) {
    if (this.ws_telemetry) {
      this.ws_telemetry.send(
        JSON.stringify({ cmd: { cmd: _cmd, value: _value } })
      );
    }
  }

  init() {
    this.initUI();
    this.initKeyboard();
    this.initCanvas();
    this.initPing();
    this.connect();
  }
}
