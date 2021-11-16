import React from "react";
import styled from "styled-components";
import Recorder from "./Recorder";
import ScreenRecording from "./ScreenRecording";
const Home = () => {
  return (
    <Container>
      <h2 className="text-info text-center mt-4">Screen Recorder </h2>
      {/* <Recorder /> */}
      <ScreenRecording
        screen={true}
        audio={false}
        video={false}
        downloadRecordingPath="Screen_Recording_Demo"
        downloadRecordingType="mp4"
        emailToSupport="support@xyz.com"
      ></ScreenRecording>
    </Container>
  );
};
const Container = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

export default Home;
