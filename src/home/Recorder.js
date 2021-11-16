import React from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import styled from "styled-components";
const Recorder = () => {
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    pauseRecording,
  } = useReactMediaRecorder({ video: true, screen: true, audio: true });

  return (
    <RecordButtons>
      <div className="video_container">
        <video src={mediaBlobUrl} controls autoPlay loop />
      </div>
      <button className="btn btn-danger m-2" onClick={stopRecording}>
        Stop
      </button>
      <button onClick={startRecording} className="btn btn-success m-2">
        Start
      </button>
      <button className="btn btn-warning m-2" onClick={pauseRecording}>
        Pause
      </button>
    </RecordButtons>
  );
};

const RecordButtons = styled.div`
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60%;
`;
export default Recorder;
