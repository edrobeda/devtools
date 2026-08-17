import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { VideoCameraOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'basics',
  'convert',
  'quality',
  'filter',
  'video',
  'audio',
  'inspect',
  'stream',
  'hw',
  'advanced',
  'gotchas',
]

const CATEGORY_COLOR = {
  basics: 'blue',
  convert: 'green',
  quality: 'purple',
  filter: 'cyan',
  video: 'magenta',
  audio: 'gold',
  inspect: 'geekblue',
  stream: 'orange',
  hw: 'volcano',
  advanced: 'red',
  gotchas: 'lime',
}

const labelOf = {
  basics: { pt: 'Básicos & sintaxe', en: 'Basics & syntax' },
  convert: { pt: 'Conversões & formatos', en: 'Conversions & formats' },
  quality: { pt: 'Codecs & qualidade', en: 'Codecs & quality' },
  filter: { pt: 'Filtros (vídeo)', en: 'Filters (video)' },
  video: { pt: 'Vídeo & screenshots', en: 'Video & screenshots' },
  audio: { pt: 'Áudio', en: 'Audio' },
  inspect: { pt: 'Inspeção & ffprobe', en: 'Inspection & ffprobe' },
  stream: { pt: 'Streaming & HLS', en: 'Streaming & HLS' },
  hw: { pt: 'Aceleração de hardware', en: 'Hardware acceleration' },
  advanced: { pt: 'Avançado', en: 'Advanced' },
  gotchas: { pt: 'Gotchas & dicas', en: 'Gotchas & tips' },
}

const COMMANDS = [
  // ─── Básicos & sintaxe ────────────────────────────────────────────────────
  { cmd: 'ffmpeg -i input.mp4', cat: 'basics', pt: 'Sem output: imprime formato, codecs, duração e streams do arquivo', en: 'No output given: prints format, codecs, duration and streams' },
  { cmd: 'ffmpeg -version', cat: 'basics', pt: 'Versão e opções compiladas (x264, libass, nvenc etc.)', en: 'Version and compiled features (x264, libass, nvenc, etc.)' },
  { cmd: 'ffmpeg -hide_banner -i input.mp4', cat: 'basics', pt: 'Suprime o banner de build — só a info do input', en: 'Suppresses the build banner — just the input info' },
  { cmd: 'ffmpeg -y -i input.mp4 output.mp4', cat: 'basics', pt: '-y sobrescreve arquivos existentes sem perguntar', en: '-y overwrites existing files without asking' },
  { cmd: 'ffmpeg -n -i input.mp4 output.mp4', cat: 'basics', pt: '-n nunca sobrescreve: aborta se o arquivo existir', en: '-n never overwrites: aborts if the file exists' },
  { cmd: 'ffmpeg -loglevel error -i input.mp4 -c copy output.mkv', cat: 'basics', pt: 'Modo quiet: mostra só erros (útil em scripts)', en: 'Quiet mode: shows errors only (handy in scripts)' },
  { cmd: 'ffmpeg -encoders', cat: 'basics', pt: 'Lista codecs de encode disponíveis no build', en: 'Lists the encoders available in this build' },
  { cmd: 'ffmpeg -filters', cat: 'basics', pt: 'Lista todos os filtros de vídeo/áudio disponíveis', en: 'Lists all available video/audio filters' },
  { cmd: 'ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4', cat: 'basics', pt: 'Sintaxe geral: inputs → opções de output → output', en: 'General syntax: inputs → output options → output' },
  { cmd: 'ffmpeg -ss 00:01:30 -i input.mp4 -t 10 -c copy output.mp4', cat: 'basics', pt: 'Corta 1:30 por 10s, sem re-encode (seek rápido)', en: 'Trims from 1:30 for 10s with no re-encode (fast seek)' },
  { cmd: 'ffmpeg -i input.mp4 -t 10 output.mp4', cat: 'basics', pt: '-t = duração; use -to 00:01:30 para ponto final', en: '-t = duration; use -to 00:01:30 for an end point' },
  { cmd: 'ffmpeg -i input.mp4 -map 0:v -map 0:a -c copy output.mkv', cat: 'basics', pt: '-map seleciona streams explicitamente (vídeo + áudio)', en: '-map selects streams explicitly (video + audio)' },

  // ─── Conversões & formatos ────────────────────────────────────────────────
  { cmd: 'ffmpeg -i input.mov -c copy output.mp4', cat: 'convert', pt: 'Remux: troca o container sem re-encodar (instantâneo)', en: 'Remux: changes the container without re-encoding (instant)' },
  { cmd: 'ffmpeg -i input.mkv -map 0 -c copy output.mp4', cat: 'convert', pt: 'Converte MKV→MP4 mantendo streams (só refaz o container)', en: 'MKV→MP4 keeping streams (container-only remux)' },
  { cmd: 'ffmpeg -i input.avi -c:v libx264 -crf 23 output.mp4', cat: 'convert', pt: 'Conversão real para MP4/H.264 (re-encode)', en: 'Real conversion to MP4/H.264 (re-encode)' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 0 -crf 32 output.webm', cat: 'convert', pt: 'Para WebM/VP9 — -b:v 0 é obrigatório pro CRF funcionar', en: 'To WebM/VP9 — -b:v 0 is required for CRF to work' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx265 -crf 28 -preset medium output.mp4', cat: 'convert', pt: 'HEVC (H.265) com economia de espaço (~metade do H.264)', en: 'HEVC (H.265) saving space (~half of H.264)' },
  { cmd: 'ffmpeg -i input.mp4 -vn output.mp3', cat: 'convert', pt: '-vn descarta o vídeo: extrai só o áudio original', en: '-vn drops video: extracts only the original audio' },
  { cmd: 'ffmpeg -i input.mp4 -an output.mov', cat: 'convert', pt: '-an remove o áudio (só vídeo)', en: '-an removes audio (video only)' },
  { cmd: 'ffmpeg -i input.mkv -sn output.mp4', cat: 'convert', pt: '-sn remove as legendas', en: '-sn removes subtitles' },
  { cmd: 'ffmpeg -i input.mp3 -c:a aac output.m4a', cat: 'convert', pt: 'Transforma em AAC/MP4 (para iTunes/audio Apple)', en: 'To AAC/MP4 (for iTunes/Apple audio)' },
  { cmd: 'ffmpeg -i input.mp3 -c:a libopus output.ogg', cat: 'convert', pt: 'Opus em OGG — ótima compressão para voz', en: 'Opus in OGG — great compression for voice' },
  { cmd: 'ffmpeg -i input.wav -c:a flac output.flac', cat: 'convert', pt: 'WAV → FLAC (lossless comprimido)', en: 'WAV → FLAC (compressed lossless)' },

  // ─── Codecs & qualidade ───────────────────────────────────────────────────
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium output.mp4', cat: 'quality', pt: 'CRF 18–23 ≈ qualidade sem perda visível; 0–51, menor é melhor', en: 'CRF 18–23 ≈ visually lossless; range 0–51, lower is better' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 -preset veryslow -crf 20 output.mp4', cat: 'quality', pt: 'Preset ultrafast→veryslow: mais lento comprime melhor', en: 'Preset ultrafast→veryslow: slower compresses better' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 -b:v 2M -maxrate 4M -bufsize 8M -c:a aac -b:a 128k output.mp4', cat: 'quality', pt: 'Bitrate controlado (bom para precificação/streaming)', en: 'Capped bitrate (good for billing/streaming)' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 -profile:v high -level 4.1 -crf 22 output.mp4', cat: 'quality', pt: 'Restringe perfil/nível para players/device antigos', en: 'Restricts profile/level for old players/devices' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 -crf 18 -pix_fmt yuv420p output.mp4', cat: 'quality', pt: '-pix_fmt yuv420p = compatibilidade máxima no H.264', en: '-pix_fmt yuv420p = maximum H.264 compatibility' },
  { cmd: 'ffmpeg -i input.wav -c:a libmp3lame -q:a 2 output.mp3', cat: 'quality', pt: 'MP3 VBR via -q:a (0–9; 0 melhor, 2 é padrão bacana)', en: 'MP3 VBR via -q:a (0–9; 0 best, 2 is a nice default)' },
  { cmd: 'ffmpeg -i input.mp4 -c:a aac -b:a 192k output.mp4', cat: 'quality', pt: 'AAC com bitrate explícito', en: 'AAC with explicit bitrate' },
  { cmd: 'ffmpeg -i input.mp4 -c:a copy -c:v copy output.mp4', cat: 'quality', pt: '-c copy copia V e A sem tocar nos codecs (sem perda)', en: '-c copy copies V and A untouched (lossless step)' },

  // ─── Filtros (vídeo) ──────────────────────────────────────────────────────
  { cmd: 'ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4', cat: 'filter', pt: 'Redimensiona para 1280x720 (esticando se preciso)', en: 'Resizes to 1280x720 (stretching if needed)' },
  { cmd: 'ffmpeg -i input.mp4 -vf scale=-1:720 output.mp4', cat: 'filter', pt: 'Largura automática (-1) mantendo a proporção', en: 'Auto width (-1) keeping the aspect ratio' },
  { cmd: 'ffmpeg -i input.mp4 -vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2 output.mp4', cat: 'filter', pt: 'Encaixa em 1280x720 com letterbox (sem distorcer)', en: 'Fits in 1280x720 with letterboxing (no distortion)' },
  { cmd: 'ffmpeg -i input.mp4 -vf crop=640:480:200:100 output.mp4', cat: 'filter', pt: 'Corta a região em w:h:x:y', en: 'Crops the region at w:h:x:y' },
  { cmd: 'ffmpeg -i input.mp4 -vf transpose=1 output.mp4', cat: 'filter', pt: 'Gira 90° horário (1); 2 = 180°, 3 = anti-horário', en: 'Rotates 90° clockwise (1); 2 = 180°, 3 = counter-clockwise' },
  { cmd: 'ffmpeg -i input.mp4 -vf fps=30 output.mp4', cat: 'filter', pt: 'Padroniza o frame rate em 30 fps', en: 'Normalizes the frame rate to 30 fps' },
  { cmd: 'ffmpeg -i input.mp4 -vf "trim=start=5:end=20,setpts=PTS-STARTPTS" output.mp4', cat: 'filter', pt: 'Corta o vídeo no domínio do filtro (reframe preciso)', en: 'Cuts video in the filter domain (precise re-frame)' },
  { cmd: 'ffmpeg -i input.mp4 -vf scale=480:-1:flags=lanczos,fps=15 output.mp4', cat: 'filter', pt: 'Cadeia de filtros separados por vírgula (escala + fps)', en: 'Filter chain separated by comma (scale + fps)' },
  { cmd: 'ffmpeg -i bg.mp4 -i logo.png -filter_complex "[0:v][1:v]overlay=main_w-overlay_w-10:10[out]" -map "[out]" output.mp4', cat: 'filter', pt: 'Overlay de logo no canto (usa -filter_complex com 2 inputs)', en: 'Logo overlay in the corner (uses -filter_complex with 2 inputs)' },
  { cmd: "ffmpeg -i input.mp4 -vf \"drawtext=text='hello':fontsize=48:fontcolor=white\" output.mp4", cat: 'filter', pt: 'Desenha texto no vídeo (adianta fontfile= em builds sem fontconfig)', en: 'Draws text on video (add fontfile= on builds without fontconfig)' },

  // ─── Vídeo & screenshots ──────────────────────────────────────────────────
  { cmd: 'ffmpeg -ss 00:00:10 -i input.mp4 -frames:v 1 output.png', cat: 'video', pt: 'Screenshot do frame no 10s (1 frame)', en: 'Screenshot of the frame at 10s (1 frame)' },
  { cmd: 'ffmpeg -i input.mp4 -vf "select=\'not(mod(n,100))\',scale=480:-1,tile=4x4" sheet.png', cat: 'video', pt: 'Contact sheet: grade 4x4 com 1 frame a cada 100 frames', en: 'Contact sheet: 4x4 grid with one frame every 100 frames' },
  { cmd: 'ffmpeg -i input.mp4 -vf "fps=15,scale=640:-1:flags=lanczos,palettegen" palette.png', cat: 'video', pt: 'Passo 1 do GIF: gera a paleta otimizada', en: 'GIF step 1: generates the optimized palette' },
  { cmd: 'ffmpeg -i input.mp4 -i palette.png -filter_complex "[0:v][1:v]paletteuse" output.gif', cat: 'video', pt: 'Passo 2 do GIF: aplica a paleta (qualidade muito melhor)', en: 'GIF step 2: applies the palette (far better quality)' },
  { cmd: 'ffmpeg -loop 1 -i image.png -t 10 -c:v libx264 -pix_fmt yuv420p output.mp4', cat: 'video', pt: 'Imagem estática → vídeo de 10s com movimento (loop 1)', en: 'Still image → 10s MP4 (loop 1 makes it replay)' },
  { cmd: 'ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" -af "atempo=2.0" fast.mp4', cat: 'video', pt: 'Acelera 2x (setpts no vídeo + atempo no áudio)', en: 'Speeds up 2x (setpts on video + atempo on audio)' },
  { cmd: 'ffmpeg -i input.mp4 -vf reverse -af areverse reversed.mp4', cat: 'video', pt: 'Inverte o vídeo (reverse) e o áudio (areverse)', en: 'Reverses video (reverse) and audio (areverse)' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 -crf 23 -r 25 output.mp4', cat: 'video', pt: 'Re-encoda a 25 fps', en: 'Re-encodes at 25 fps' },

  // ─── Áudio ────────────────────────────────────────────────────────────────
  { cmd: 'ffmpeg -i input.mp4 -vn -c:a libmp3lame -q:a 2 output.mp3', cat: 'audio', pt: 'Extrai faixa de áudio como MP3 de qualidade', en: 'Extracts the track as a quality MP3' },
  { cmd: 'ffmpeg -i input.wav -ar 44100 -ac 2 output.wav', cat: 'audio', pt: 'Resample para 44.1 kHz e 2 canais', en: 'Resamples to 44.1 kHz and 2 channels' },
  { cmd: 'ffmpeg -i input.wav -ac 1 output.wav', cat: 'audio', pt: 'Mistura para mono', en: 'Downmixes to mono' },
  { cmd: 'ffmpeg -i input.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 output.wav', cat: 'audio', pt: 'Normaliza para -16 LUFS (padrão de podcast)', en: 'Normalizes to -16 LUFS (podcast standard)' },
  { cmd: 'ffmpeg -i input.mp3 -af "volume=2.0" louder.mp3', cat: 'audio', pt: 'Dobra o ganho com o filtro volume', en: 'Doubles the gain with the volume filter' },
  { cmd: 'ffmpeg -i input.mp3 -t 300 -c copy first5min.mp3', cat: 'audio', pt: 'Pega os primeiros 5 minutos', en: 'Takes the first 5 minutes' },
  { cmd: 'ffmpeg -i a.mp3 -i b.mp3 -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" -map "[out]" merged.mp3', cat: 'audio', pt: 'Concatena dois áudios (decodifica e junta)', en: 'Concatenates two audio files (decodes and merges)' },
  { cmd: 'ffmpeg -i big.wav -f segment -segment_time 60 -c copy part_%03d.wav', cat: 'audio', pt: 'Divide em partes de 60s (part_001.wav, ...)', en: 'Splits into 60s parts (part_001.wav, ...)' },
  { cmd: 'ffmpeg -i input.m4a -af "atempo=1.5" faster.m4a', cat: 'audio', pt: 'Muda a velocidade do áudio sem alterar o tom', en: 'Changes audio speed without changing pitch' },
  { cmd: 'ffmpeg -i input.mp3 -af "highpass=f=80,lowpass=f=12000" broadcast.mp3', cat: 'audio', pt: 'Filtros passa-alta/passa-baixa (limpeza de frequência)', en: 'Highpass/lowpass filters (frequency cleanup)' },

  // ─── Inspeção & ffprobe ───────────────────────────────────────────────────
  { cmd: 'ffprobe -v error -show_format -show_streams input.mp4', cat: 'inspect', pt: 'Tudo sobre formato e streams (codecs, resolução, duração)', en: 'Everything about format and streams (codecs, resolution, duration)' },
  { cmd: 'ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,avg_frame_rate -of default=noprint_wrappers=1 input.mp4', cat: 'inspect', pt: 'Resolução, codec e fps do primeiro vídeo', en: 'Resolution, codec and fps of the first video stream' },
  { cmd: 'ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 input.mp4', cat: 'inspect', pt: 'Specs do áudio (codec, taxa, canais) numa linha CSV', en: 'Audio specs (codec, rate, channels) as one CSV line' },
  { cmd: 'ffprobe -v error -show_entries format=duration:format=size -of default=noprint_wrappers=1 input.mp4', cat: 'inspect', pt: 'Duração e tamanho do arquivo', en: 'File duration and size' },
  { cmd: 'ffprobe -v quiet -print_format json -show_format -show_streams input.mp4', cat: 'inspect', pt: 'Tudo em JSON (fácil de parsear no jq/scripts)', en: 'Everything as JSON (easy to parse with jq/scripts)' },
  { cmd: 'ffprobe -v error -show_entries format_tags -of default=noprint_wrappers=1 input.mp4', cat: 'inspect', pt: 'Metadados/tags do container', en: 'Container metadata/tags' },
  { cmd: 'ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames input.mp4', cat: 'inspect', pt: 'Conta o total de frames (pode demorar em vídeos longos)', en: 'Counts the total number of frames (slow on long videos)' },

  // ─── Streaming & HLS ──────────────────────────────────────────────────────
  { cmd: 'ffmpeg -re -i input.mp4 -c copy -f flv rtmp://ingest.example/live/KEY', cat: 'stream', pt: '-re lê em tempo real; envia para RTMP (Twitch/YouTube)', en: '-re reads in real time; outputs to RTMP (Twitch/YouTube)' },
  { cmd: 'ffmpeg -re -i input.mp4 -c:v libx264 -b:v 2M -c:a aac -b:a 128k -f flv rtmp://ingest.example/live/KEY', cat: 'stream', pt: 'Streaming com bitrate controlado (recomendado)', en: 'Streaming with controlled bitrate (recommended)' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 -c:a aac -hls_time 6 -hls_playlist_type vod output.m3u8', cat: 'stream', pt: 'Segmenta em HLS (segmentos de 6s + playlist)', en: 'Segments into HLS (6s chunks + playlist)' },
  { cmd: 'ffmpeg -re -i input.mp4 -listen 1 -c copy -f mpegts http://0.0.0.0:8080/stream', cat: 'stream', pt: 'Vira um mini-servidor de streaming HTTP (aguarda cliente)', en: 'Becomes a tiny HTTP streaming server (waits for a client)' },
  { cmd: 'ffmpeg -i "concat:part1.ts|part2.ts" -c copy output.mp4', cat: 'stream', pt: 'Concatena arquivos .ts no protocolo concat (mesmos codecs)', en: 'Concatenates .ts files via the concat protocol (same codecs)' },
  { cmd: 'ffmpeg -i "https://example.com/video.mp4" -c copy output.mp4', cat: 'stream', pt: 'Baixa/processa direto de uma URL remota', en: 'Downloads/processes straight from a remote URL' },
  { cmd: 'ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -b:v 3M -minrate 3M -maxrate 3M -bufsize 6M -f flv rtmp://...', cat: 'stream', pt: 'CBR (bitrate fixo) — mais estável para streaming', en: 'CBR (fixed bitrate) — more stable for streaming' },
  { cmd: 'ffmpeg -i live.ts -c copy -f segment -segment_time 60 -segment_list list.m3u8 chunk_%03d.ts', cat: 'stream', pt: 'Segmenta um stream contínuo em pedaços + playlist', en: 'Splits a continuous stream into chunks + playlist' },

  // ─── Aceleração de hardware ───────────────────────────────────────────────
  { cmd: 'ffmpeg -hwaccel cuda -i input.mp4 -c:v h264_nvenc -preset p5 -cq 23 output.mp4', cat: 'hw', pt: 'NVIDIA: NVENC com quality de 23 (equivalente ao CRF)', en: 'NVIDIA: NVENC at quality 23 (CRF equivalent)' },
  { cmd: 'ffmpeg -hwaccel auto -i input.mp4 -c:v h264_videotoolbox output.mp4', cat: 'hw', pt: 'macOS: VideoToolbox (H.264 empacotado)', en: 'macOS: VideoToolbox (hardware H.264)' },
  { cmd: "ffmpeg -vaapi_device /dev/dri/renderD128 -i input.mp4 -vf 'format=nv12,hwupload' -c:v h264_vaapi output.mp4", cat: 'hw', pt: 'Linux Intel/AMD: VA-API (precisa dos filtros de upload)', en: 'Linux Intel/AMD: VA-API (needs the hwupload filters)' },
  { cmd: 'ffmpeg -i input.mp4 -c:v h264_qsv output.mp4', cat: 'hw', pt: 'Intel Quick Sync (QSV)', en: 'Intel Quick Sync (QSV)' },
  { cmd: 'ffmpeg -hwaccel cuda -i input.mp4 -vf scale_cuda=1280:720 -c:v h264_nvenc output.mp4', cat: 'hw', pt: 'Escala direto na GPU com scale_cuda', en: 'Scales directly on the GPU with scale_cuda' },
  { cmd: 'ffmpeg -encoders 2>/dev/null | grep -i nvenc', cat: 'hw', pt: 'Confirma quais encoders de hardware o build tem', en: 'Confirms which hardware encoders the build ships' },

  // ─── Avançado ─────────────────────────────────────────────────────────────
  { cmd: 'ffmpeg -i video.mp4 -i audio.mp3 -map 0:v -map 1:a -c copy output.mp4', cat: 'advanced', pt: 'Junta vídeo de um input com áudio de outro', en: 'Combines the video of one input with the audio of another' },
  { cmd: 'ffmpeg -i input.mp4 -map 0:v -c copy video.mp4 -map 0:a -c copy audio.m4a', cat: 'advanced', pt: 'Um comando, dois outputs: extrai V e A separados', en: 'One command, two outputs: extracts V and A separately' },
  { cmd: 'ffmpeg -i input.mp4 -metadata title="Meu vídeo" -metadata artist="..." -c copy tagged.mp4', cat: 'advanced', pt: 'Edita metadados sem re-encodar', en: 'Edits metadata without re-encoding' },
  { cmd: 'ffmpeg -i input.mp3 -i cover.jpg -map 0:0 -map 1:0 -c copy -id3v2_version 3 -metadata:s:v title="Album cover" output.mp3', cat: 'advanced', pt: 'Embute a capa do álbum no MP3', en: 'Embeds the album artwork into the MP3' },
  { cmd: 'ffmpeg -i input.mp4 -vf subtitles=leg.srt output.mp4', cat: 'advanced', pt: 'Queima as legendas no vídeo (requer libass)', en: 'Burns subtitles into the video (requires libass)' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 -b:v 2M -pass 1 -f null /dev/null && ffmpeg -i input.mp4 -c:v libx264 -b:v 2M -pass 2 output.mp4', cat: 'advanced', pt: '2-pass: passada 1 analisa, passada 2 codifica (máxima eficiência)', en: '2-pass: pass 1 analyzes, pass 2 encodes (max efficiency)' },
  { cmd: 'ffmpeg -i input.mp4 -filter_complex "[0:v]split[a][b];[a]scale=640:-1[av];[b]scale=128:-1[bv]" -map "[av]" small.mp4 -map "[bv]" tiny.mp4', cat: 'advanced', pt: 'Gera dois tamanhos num único comando (split + map)', en: 'Produces two sizes in a single command (split + map)' },

  // ─── Gotchas & dicas ──────────────────────────────────────────────────────
  { cmd: 'ffmpeg -ss 00:01:00 -i input.mp4 ...', cat: 'gotchas', pt: '-ss ANTES do -i = seek rápido/impreciso (bom com -c copy); DEPOIS = decode preciso frame a frame', en: '-ss BEFORE -i = fast/inaccurate seek (good with -c copy); AFTER = exact frame-accurate decode' },
  { cmd: 'ffmpeg -i input.mp4 -c copy output.wav', cat: 'gotchas', pt: 'Não rola: -c copy só muda container, nunca converte codec', en: 'No: -c copy only changes the container, never transcode' },
  { cmd: 'ffmpeg -i input.mp4 output.avi', cat: 'gotchas', pt: 'Sem -c explícito o ffmpeg escolhe codecs legados do container — sempre declare os codecs', en: 'Without explicit -c ffmpeg picks legacy container codecs — always declare them' },
  { cmd: 'ffmpeg -i input.mp4 -vn -ss 5 ...', cat: 'gotchas', pt: '-vf/-vn/-t são opções de OUTPUT: vão sempre DEPOIS do -i (antes dele viram opções de input)', en: '-vf/-vn/-t are OUTPUT options: always go AFTER -i (before it they become input options)' },
  { cmd: 'ffmpeg -i input.mp4 -c:v libx264 output.mp4', cat: 'gotchas', pt: 'Sem -pix_fmt yuv420p o H.264 pode sair em formato que players antigos não abrem', en: 'Without -pix_fmt yuv420p the H.264 may use a format old players can\'t open' },
  { cmd: 'ffmpeg -i frame_%03d.png -c:v libx264 -pix_fmt yuv420p output.mp4', cat: 'gotchas', pt: '%03d = sequência de imagens (frame_001.png...). % escapado evita surpresas', en: '%03d = image sequence (frame_001.png...). Escaped % avoids surprises' },
  { cmd: 'ffmpeg -i input.mp4 -vf "fps=10,scale=320:-1" output.gif', cat: 'gotchas', pt: 'GIF cru fica pesado; o pipeline palettegen+paletteuse reduz MUITO o tamanho', en: 'Raw GIF is bulky; the palettegen+paletteuse pipeline shrinks it a LOT' },
  { cmd: 'ffmpeg -y -i input.mp4 output.mp4', cat: 'gotchas', pt: 'Em scripts, use -y: sem ele o ffmpeg pausa perguntando se pode sobrescrever', en: 'In scripts, use -y: without it ffmpeg pauses asking to overwrite' },
  { cmd: 'ffmpeg -i multi.ts input.mp4', cat: 'gotchas', pt: 'Streams extra (legendas etc.) são descartados sem -map explícito', en: 'Extra streams (subtitles, etc.) are dropped without an explicit -map' },
  { cmd: 'ffmpeg -i input.mp4 -vf drawtext=... output.mp4', cat: 'gotchas', pt: 'drawtext em build headless exige fontfile=/caminho/da/fonte.ttf', en: 'drawtext on headless builds requires fontfile=/path/to/font.ttf' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de FFmpeg',
    intro: (
      <>
        Coleção pesquisável de comandos do <Text code>ffmpeg</Text> e{' '}
        <Text code>ffprobe</Text> — o canivete suíço de processamento de
        mídia. Cobre sintaxe básica (inputs, outputs, <Text code>-map</Text>,{' '}
        <Text code>-t</Text>/<Text code>-ss</Text>), conversões e remux sem
        re-encode (<Text code>-c copy</Text>), codecs e qualidade (CRF,
        presets, bitrate), filtros (<Text code>scale</Text>/
        <Text code>crop</Text>/<Text code>overlay</Text>/
        <Text code>drawtext</Text>), screenshots e GIFs, operações de áudio,
        inspeção com <Text code>ffprobe</Text>, streaming/HLS, aceleração de
        hardware (NVENC, VA-API, VideoToolbox) e os gotchas clássicos. Nada
        sai do navegador — é só texto de referência.
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Para trocar de container sem qualidade perdida use{' '}
        <Text code>-c copy</Text>. Corte rápido com{' '}
        <Text code>-ss</Text> antes do <Text code>-i</Text> (mais um{' '}
        <Text code>-c copy</Text>) e re-encode preciso com{' '}
        <Text code>-ss</Text> depois. CRF 23 no x264 é a qualidade
        "sem perda visível" padrão. Adicione{' '}
        <Text code>-pix_fmt yuv420p</Text> para compatibilidade máxima. Em
        hardware: <Text code>-hwaccel cuda -c:v h264_nvenc</Text> (NVIDIA) ou{' '}
        <Text code>h264_vaapi</Text> (Intel/AMD no Linux).
      </>
    ),
    search: 'Buscar snippet ou descrição...',
    all: 'Todos',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'FFmpeg Cheat Sheet',
    intro: (
      <>
        A searchable collection of <Text code>ffmpeg</Text> and{' '}
        <Text code>ffprobe</Text> commands — the swiss-army knife of media
        processing. Covers basic syntax (inputs, outputs,{' '}
        <Text code>-map</Text>, <Text code>-t</Text>/<Text code>-ss</Text>),
        conversions and remux without re-encoding (<Text code>-c copy</Text>),
        codecs and quality (CRF, presets, bitrate), filters (
        <Text code>scale</Text>/<Text code>crop</Text>/
        <Text code>overlay</Text>/<Text code>drawtext</Text>), screenshots and
        GIFs, audio work, <Text code>ffprobe</Text> inspection, streaming/HLS,
        hardware acceleration (NVENC, VA-API, VideoToolbox) and the classic
        gotchas. Nothing leaves the browser — it is reference text only.
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        To change containers without touching quality use{' '}
        <Text code>-c copy</Text>. Fast cut with <Text code>-ss</Text> before{' '}
        <Text code>-i</Text> (plus <Text code>-c copy</Text>), frame-accurate
        re-encode with <Text code>-ss</Text> after. CRF 23 on x264 is the
        standard "visually lossless" quality. Add{' '}
        <Text code>-pix_fmt yuv420p</Text> for maximum compatibility. On
        hardware: <Text code>-hwaccel cuda -c:v h264_nvenc</Text> (NVIDIA) or{' '}
        <Text code>h264_vaapi</Text> (Intel/AMD on Linux).
      </>
    ),
    search: 'Search a snippet or description...',
    all: 'All',
    empty: 'No matches found. Try another search or category.',
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function FfmpegCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return COMMANDS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q) ||
        labelOf[c.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Command | Category | Description |\n|---|---|---|\n'
    const rows = filtered.map((c) =>
      `| \`${c.cmd.replace(/\|/g, '\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copied)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><VideoCameraOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<VideoCameraOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(item.cmd)} />
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Collapse items={[
        {
          key: 'source',
          label: t.source,
          children: (
            <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
              <code>{JSON.stringify(COMMANDS, null, 2)}</code>
            </pre>
          ),
        },
      ]} />
    </Space>
  )
}