## 项目介绍

将 mp4 或者 flv 等常见格式的视屏, 转码为 m3u8 的可以分片加载的格式

服务端用的 [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) 来转码

前端用的 [xgplayer](https://github.com/bytedance/xgplayer) 来播放

经测试用 [dplayer](https://dplayer.js.org/) 也是可以的

## 安装启动

```sh
git clone https://github.com/liaohui5/m3u8-video-demo

# 启动服务端: http://localhost:8000
cd server && npm run dev

# 启动客户端: http://localhost:9000
cd client && npm run dev
```

## 测试

1. 打开浏览器访问: `http://localhost:9000`
2. 上传一个视屏, 不要太大, 因为要转码, 如果太大就需要等待很长时间, 建议直接找一个短视屏来测试效果
3. 如果能够正常播放就证明没有问题
