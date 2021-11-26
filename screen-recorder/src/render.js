const { desktopCapturer, ipcRenderer } = require("electron");

const { writeFile } = require("fs");

const { Menu, dialog } = require("@electron/remote");

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];
let inputSources;
// Buttons
const videoElement = document.querySelector("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
stopBtn.disabled = true;

startBtn.onclick = (e) => {
  stopBtn.disabled = false;
  startBtn.disabled = true;
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerHTML = "<i class='fas fa-record-vinyl'></i>";
};

stopBtn.onclick = (e) => {
  stopBtn.disabled = true;
  startBtn.disabled = false;
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerHTML = "<i class='fas fa-play-circle'></i>";
};

const captureBtn = document.querySelector("#captureBtn");

captureBtn.onclick = (e) => {
  console.log(inputSources[0].thumbnail.toDataURL());
};

const videoSelectBtn = document.getElementById("videoSelectBtn");
videoSelectBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
  try {
    inputSources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
      inputSources
        .map((source) => {
          console.log(source);
          return {
            id: source.display_id,
            label: source.name,
            click: () => selectSource(source),
          };
        })
        .filter(({ id }) => Boolean(id))
    );

    videoOptionsMenu.popup();
  } catch (err) {
    console.log(err);
  }
}

// Change the videoSource window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraintAudio = {
    audio: true,
  };

  const constraintVideo = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
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
