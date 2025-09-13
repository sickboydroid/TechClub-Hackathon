import "../styles/home.css";
import QrScanner from "qr-scanner";

const STATUS_OUT = 1;
const STATUS_IN = 0;
// TODO: get real enrollment number and status from server
const enroll_num = "1231241";
const status = 0;
let scanner = null;

function showDoneOverlay(message) {
  const overlay = document.getElementById("overlay");
  const overlayText = document.querySelector(".overlay-text .status");
  overlayText.textContent = message;
  overlay.style.display = "flex";

  setTimeout(() => {
    location.reload();
  }, 3000);
}

function showMessage(text, type = "error") {
  const messageBox = document.getElementById("message");
  messageBox.textContent = text;
  messageBox.style.display = "block";

  if (type === "error") {
    messageBox.style.background = "#fee2e2";
    messageBox.style.color = "#b91c1c";
    messageBox.style.border = "1px solid #fca5a5";
  } else if (type == "success") {
    messageBox.style.background = "#dcfce7";
    messageBox.style.color = "#166534";
    messageBox.style.border = "1px solid #86efac";
  }
}

function onQrScanned(qrId) {
  const purposeInput = document.getElementById("purpose").value.trim();

  const payload = {
    enroll_num,
    id: qrId,
  };

  if (status == STATUS_IN && !purposeInput) {
    showMessage("⚠️ Please enter a purpose before scanning.", "error");
    return;
  } else {
    payload.purpose = purposeInput;
  }
  scanner.pause();
  console.log("submitting", payload);
  if (status == STATUS_IN) showDoneOverlay("exit");
  else showDoneOverlay("entry");
}

function main() {
  const videoElem = document.getElementById("qr-video");
  const statusTitle = document.querySelector(".title .status");
  if (status == STATUS_OUT) {
    document.querySelector(".purpose").style.display = "none";
    statusTitle.textContent = "Exit";
  }
  scanner = new QrScanner(
    videoElem,
    result => {
      console.log(result.data);
      onQrScanned(result.data);
    },
    { highlightScanRegion: true, highlightCodeOutline: true }
  );
  scanner.start();
}

main();
