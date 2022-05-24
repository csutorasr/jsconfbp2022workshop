import { Player } from "./Player";

var ws_video: WebSocket;
var ws_telemetry: WebSocket;
var telemetry_obj = document.getElementById("telemetryFeed");
var h264_player: any;
var kMap = {};
var stickData = {
  roll: 0,
  pitch: 0,
  throttle: 0,
  yaw: 0,
};

function initVideoFeedReceive() {
  ws_video.send("f");
}

function initTelemetryFeedReceive() {
  ws_telemetry.send("t");
}

var toUint8Array = function (parStr) {
  var raw = parStr;
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  var i;
  for (i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
};

function processFrame(imgString) {
  if (imgString.data != "false") {
    h264_player.decode(toUint8Array(imgString.data));
  } else {
    console.log(imgString);
  }
}

function processTelemetry(data) {
  console.log(data);
  telemetry_obj.innerHTML = data.data;
}

function connect() {
  try {
    ws_video = new WebSocket("ws://127.0.0.1:8081/");
    ws_video.onmessage = function (data) {
      processFrame(data);
    };
    ws_video.onopen = function () {
      initVideoFeedReceive();
    };
    ws_video.onerror = function () {
      ws_video.close();
    };
  } catch (e) {
    console.log("Error", "Video", "reconnect");
  }

  try {
    ws_telemetry = new WebSocket("ws://127.0.0.1:8082/");
    ws_telemetry.onmessage = function (data) {
      processTelemetry(data);
    };
    ws_telemetry.onopen = function () {
      initTelemetryFeedReceive();
    };
    ws_telemetry.onerror = function () {
      ws_telemetry.close();
    };
  } catch (e) {
    console.log("Error", "Telemetry", "reconnect");
  }
}

function initCanvas() {
  h264_player = new Player({
    useWorker: true,
    webgl: "auto",
    size: { width: 960, height: 720 },
  });
  document.getElementById("videoFeed").appendChild(h264_player.canvas);
}

function initKeyboard() {
  document.body.onkeydown = document.body.onkeyup = function (e) {
    e.preventDefault();
    kMap[e.code] = e.type == "keydown" ? true : false;
    keyboardEvent(e);
  };
}

var speed = 0.5;
function keyboardEvent(e) {
  if (
    kMap.Space === true &&
    (kMap.ShiftLeft === true || kMap.ShiftRight === true)
  ) {
    kMap.Space = false;
    sendCmd("takeoff", 0);
  } else if (kMap.Space === true) {
    sendCmd("land", 0);
  }
  if (
    kMap.KeyW === true ||
    kMap.KeyA === true ||
    kMap.KeyS === true ||
    kMap.KeyD === true ||
    kMap.ArrowUp === true ||
    kMap.ArrowDown === true ||
    kMap.ArrowLeft === true ||
    kMap.ArrowRight === true
  ) {
    stickData.yaw =
      speed * (kMap.KeyA === true ? -1 : kMap.KeyD === true ? 1 : 0);
    stickData.throttle =
      speed * (kMap.KeyS === true ? -1 : kMap.KeyW === true ? 1 : 0);
    stickData.roll =
      speed * (kMap.ArrowLeft === true ? -1 : kMap.ArrowRight === true ? 1 : 0);
    stickData.pitch =
      speed * (kMap.ArrowDown === true ? -1 : kMap.ArrowUp === true ? 1 : 0);

    console.log(stickData);
    sendCmd("stick", stickData);
  } else {
    stickData.yaw = 0;
    stickData.throttle = 0;
    stickData.roll = 0;
    stickData.pitch = 0;
    console.log(stickData);
    sendCmd("stick", stickData);
  }
  return false;
}

function initUI() {
  // settings: exposure value
  document.getElementById("settings-ev").onchange = function () {
    sendCmd("ev", document.getElementById("settings-ev").value);
  };
}

function initPing() {
  // ping backend every 0.5 seconds
  setInterval(function () {
    sendCmd("ping", 0);
  }, 500);
}

function sendCmd(_cmd, _value) {
  if (ws_telemetry) {
    ws_telemetry.send(JSON.stringify({ cmd: { cmd: _cmd, value: _value } }));
  }
}

initUI();
initKeyboard();
initCanvas();
initPing();
connect();
