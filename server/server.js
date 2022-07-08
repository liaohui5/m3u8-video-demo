"use strict";

const express    = require("express");
const bodyParser = require("body-parser");
const ffmpeg     = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fileUpload = require("express-fileupload");

// 因为 fluent-ffmpeg 需要用到 https://ffmpeg.org/download.html
// 所以需要下载二进制包, 然后设置二进制包的路径
// docs: https://www.npmjs.com/package/@ffmpeg-installer/ffmpeg
// ffmpeg 的 api 文档: https://www.psvmc.cn/article/2019-08-24-fluent-ffmpeg-api.html
ffmpeg.setFfmpegPath(ffmpegPath);

const { resolve }               = require("path");
const { existsSync, mkdirSync } = require("fs");

const PORT= 8000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload());

function setHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Method", "GET,POST,DELETE,PUT,PATCH");
}

// allow cross site request
app.use("*", (req, res, next) => {
  setHeaders(res);
  next();
});

// static files
app.use("/uploads", express.static("./uploads", { setHeaders }));

// express error handler
app.use(async (err, req, res, next) => {
  if (err) {
    return res.json({
      code: 500,
      data: null,
      msg : err.message,
    });
  }
  await next();
});

// 转换视频格式
function formatVideo(option) {
  const defaultOption = {
    filePath: "",
    outputPath: "",
    outputOptions: "",
    onError: () => {},
    onEnd: () => {},
  };
  const options = Object.assign(defaultOption, option);
  const { filePath, outputPath, outputOption, outputOptions, onError, onEnd } = options;

  ffmpeg(filePath).videoCodec("libx264").format("hls").outputOptions(outputOptions).output(outputPath).on("error", onError).on("end", onEnd).run();
}

// 上传文件
app.post("/upload_video", (req, res) => {
  const uploadDir                 = resolve(__dirname, "./uploads");             // uploadDir: 上传文件目录
  const file                      = req.files.video_file;
  const { size, type, name, md5 } = file;
  const fileName                  = md5 + name.substring(name.lastIndexOf(".")); // 文件名: abcd.mp4
  const filePath                  = resolve(uploadDir, fileName);
  // filePath: 源文件保存路径: /desktop/m3u8-video-demo/server/uploads/abcd.mp4

  // TODO: 服务端限制文件大小和格式

  // 转换视屏格式后存放文件的目录
  const outputDir = resolve(uploadDir, md5);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir);
  }
  const outputName = md5 + ".m3u8";                  // 转m3u8格式 abcd.m3u8
  const outputPath = resolve(outputDir, outputName); // /desktop/m3u8-video-demo/server/uploads/abcd/abcd.mp4

  const url        = `http://localhost:${PORT}/uploads/${fileName}`;
  const hlsUrl     = `http://localhost:${PORT}/uploads/${md5}/${outputName}`;

  if (existsSync(filePath) && existsSync(outputPath)) {
    return res.json({
      code: 0,
      msg: "success",
      data: {
        url,
        hlsUrl,
      },
    });
  }

  file.mv(filePath, (err) => {
    if (err) {
      res.json({
        code: 0,
        msg : `文件上传失败: ${err.message}`,
        data: null,
      });
      return;
    }

    // 文件上传成功, 转换文件格式为 m3u8 格式
    formatVideo({
      filePath,             // 源文件路径
      outputPath,           // 输出文件的路径
      outputOptions: [      // 输出选项
        "-hls_time 10",     // 每10s切分一个片段
        "-hls_list_size 0", // 不限制片段的个数
      ],
      onError(e) {          // 转换出错时
        res.json({
          code: 1,
          msg : "出错了" + e.message,
          data: null,
        });
      },
      onEnd() {             // 转换成功时
        res.json({
          code: 0,
          msg : "success",
          data: {
            url,
            hlsUrl,
          },
        });
      },
    });
  });
});

app.listen(PORT, () => `server is started on: http://localhost:${PORT}`);
