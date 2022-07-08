"use strict";

import Player from "xgplayer-hls";

const fileInput  = document.querySelector("#file");

function init() {
  bindEvents();
}

function bindEvents() {
  fileInput.addEventListener("change", uploadFile);
}

// 上传文件, 上传文件后, 将url放到播放器中播放
// 正常成功后的数据返回格式:
// {
//   code    : 0,
//   data    : {
//     url   : 'https://xxx/xxx.mp4', // 上传的源文件的地址
//     hlsUrl: 'https://xxx/xx.m3u8', // 上传文件后的m3u8格式的文件地址
//   }
// }
async function uploadFile() {
  const file = this.files[0];
  if (!file) return;

  const allowTypes           = ["video/x-flv", "video/mp4"];
  const allowSize            = 300 * Math.pow(1024, 2); // 300M
  const { type, name, size } = file;
  if (!allowTypes.includes(type)) {
    console.info("当前文件类型不允许");
    return;
  }

  if (size > allowSize) {
    console.info("当前文件过大,无法上传");
    return;
  }

  const fd      = new FormData();
  fd.append("video_file", file);

  const url     = "http://localhost:8000/upload_video";
  const options = {
    method: "POST",
    body  : fd,
    mode  : "cors",
  };

  const res = await fetch(url, options).then((res) => res.json());
  if (res.code !== 0) {
    console.info("上传出错了:", res);
    return;
  }
  initPlayer(res.data.hlsUrl, type);
}

function initPlayer(url, type) {
  const player = new Player({
    id: "player",
    url,
    volume: 0.1,
    playbackRate: [0.5, 0.75, 1, 1.5, 2, 5],
    defaultPlaybackRate: 1,
  });
}

init();
