const { desktopCapturer } = require("electron");

const { writeFile } = require("fs");

const { dialog } = require("@electron/remote");

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];
let inputSources;
let windowScreenSource;
let isStartButton = true;
let isMicMuted = false;
// Buttons
const videoElement = document.querySelector("video");
const startBtn = document.querySelector(".startBtn");
const stopBtn = document.querySelector(".stopBtn");
const captureButton = document.querySelector(".captureButton");
const micBtn = document.querySelector(".micBtn");

captureButton.disabled = true;

stopBtn.disabled = true;
startBtn.disabled = true;

micBtn.onclick = (e) => {
  isMicMuted = !isMicMuted;

  isMicMuted
    ? (micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>')
    : (micBtn.innerHTML = '<i class="fas fa-microphone"></i>');
};

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

    inputSources.forEach((source) => {
      if (source.name === "Entire Screen") {
        windowScreenSource = source;
      }
    });
  } catch (err) {
    console.log(err);
  }
}
getVideoSources();

// Change the videoSource window to record

async function getAudioStream() {
  const constraintAudio = {
    audio: true,
  };
  const audioStream = await navigator.mediaDevices.getUserMedia(
    constraintAudio
  );
  return audioStream;
}

async function getVideoStream() {
  const constraintVideo = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: windowScreenSource.id,
      },
    },
  };

  const videoStream = await navigator.mediaDevices.getUserMedia(
    constraintVideo
  );

  return videoStream;
}
async function selectSource() {
  captureButton.disabled = false;
  micBtn.disabled = true;
  videoSelectBtn.disabled = true;
  startBtn.disabled = false;

  const audioStream = await getAudioStream();

  const videoStream = await getVideoStream();
  let stream;
  if (isMicMuted) {
    stream = new MediaStream(videoStream.getVideoTracks());
  } else {
    stream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);
  }

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
  videoSelectBtn.disabled = false;
  micBtn.disabled = false;
  captureBtn.disabled = true;
  startBtn.disabled = true;
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`,
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log("video saved successfully!"));
  }
}
