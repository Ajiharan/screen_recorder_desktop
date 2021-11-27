const { desktopCapturer, ipcRenderer } = require("electron");

const { writeFile } = require("fs");

const { Menu, dialog } = require("@electron/remote");

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];
let inputSources;
let windowScreenSource;
// Buttons
const videoElement = document.querySelector("video");
const startBtn = document.querySelector(".startBtn");
const stopBtn = document.querySelector(".stopBtn");
const captureButton = document.querySelector(".captureButton");
const micBtn = document.querySelector(".micBtn");

captureButton.disabled = true;
micBtn.disabled = true;
stopBtn.disabled = true;
startBtn.disabled = true;

let isStartButton = true;

startBtn.onclick = (e) => {
  console.log("mediaRecorder.state", mediaRecorder.state);
  if (isStartButton) {
    isStartButton = false;
    stopBtn.disabled = false;
    mediaRecorder.start();

    // startBtn.classList.add("is-danger");
    startBtn.innerHTML = "<i class='fa fa-pause' aria-hidden='true'></i>";
  } else if (mediaRecorder.state === "paused") {
    stopBtn.disabled = false;
    mediaRecorder.resume();

    // startBtn.classList.add("is-danger");
    startBtn.innerHTML = "<i class='fa fa-pause' aria-hidden='true'></i>";
  } else {
    startBtn.innerHTML = "<i class='fas fa-play-circle'></i>";
    mediaRecorder.pause();
  }
};

stopBtn.onclick = (e) => {
  isStartButton = true;
  stopBtn.disabled = true;
  startBtn.disabled = false;
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerHTML = " <i class='fas fa-play-circle'></i>";
};

const captureBtn = document.querySelector(".captureButton");

captureBtn.onclick = (e) => {
  console.log(inputSources[0].thumbnail.toDataURL());
};

const videoSelectBtn = document.querySelector(".videoSelectBtn");
videoSelectBtn.onclick = selectSource;

async function getVideoSources() {
  try {
    inputSources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });

    inputSources.map((source) => {
      if (source.name === "Entire Screen") {
        windowScreenSource = source;
      }
      return {
        id: source.display_id,
        label: source.name,
        click: () => selectSource(source),
      };
    });
  } catch (err) {
    console.log(err);
  }
}
getVideoSources();

// Change the videoSource window to record
async function selectSource() {
  captureButton.disabled = false;
  micBtn.disabled = false;
  videoSelectBtn.disabled = true;
  startBtn.disabled = false;

  const constraintAudio = {
    audio: true,
  };

  const constraintVideo = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: windowScreenSource.id,
      },
    },
  };

  const audioStream = await navigator.mediaDevices.getUserMedia(
    constraintAudio
  );
  const videoStream = await navigator.mediaDevices.getUserMedia(
    constraintVideo
  );

  const stream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ]);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.muted = true;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Updates the UI
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log("video data available", e);
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/mp4; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.mp4`,
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log("video saved successfully!"));
  }
}
