import os
import json
import logging
import subprocess
import datetime
import time
import random
import sys
import shutil
from urllib.parse import urlparse

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def setup_environment():
    logging.info("Installing required dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "boto3", "requests", "srt", "edge-tts", "yt-dlp", "faster-whisper", "Pillow"], check=True)
    except subprocess.CalledProcessError as e:
        logging.error(f"Failed to install dependencies: {e}")

# Must run before other imports
setup_environment()

import requests
import boto3
import srt
import yt_dlp
from PIL import Image, ImageDraw, ImageFont

PREMIUM_SATISFYING_QUERIES = [
    "satisfying kinetic sand",
    "minecraft parkour gameplay",
    "satisfying ASMR slime",
    "soap cutting satisfying",
    "wood carving art",
    "fluid art painting",
    "subway surfers gameplay",
    "relaxing looping animation",
    "gta 5 ramp jumps",
    "hydraulic press crush",
    "satisfying paint mixing",
    "marble run physics",
    "nature landscape drone",
    "city neon rain walk",
    "calm ocean waves",
    "relaxing mountain view"
]

# Attempt importing faster_whisper conditionally
try:
    from faster_whisper import WhisperModel
    HAS_WHISPER = True
except ImportError:
    HAS_WHISPER = False
    logging.warning("faster_whisper not found, kinetic ASS subtitles will fall back to VTT/SRT subtitles.")

# --- INLINED HELPER MODULES ---

import re

def parse_bilibili_duration(duration_str):
    """Convert Bilibili duration format (e.g. '0:50', '1:02:30') to seconds."""
    try:
        parts = list(map(int, duration_str.split(':')))
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        elif len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
    except Exception:
        pass
    return 0

def clean_html_tags(text):
    """Strip HTML tags from search API titles."""
    return re.sub(r'<[^>]+>', '', text)

def search_bilibili(keyword):
    """Queries Bilibili's public web search API for matching videos."""
    logging.info(f"Searching Bilibili for matching videos: {keyword}")
    url = f"https://api.bilibili.com/x/web-interface/search/all/v2?keyword={keyword}&page=1"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.bilibili.com"
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        data = res.json()
        if data.get("code") == 0:
            result = data.get("data", {}).get("result", [])
            for item in result:
                if item.get("result_type") == "video":
                    return item.get("data", [])
    except Exception as e:
        logging.error(f"Bilibili search failed: {e}")
    return []

def download_viral_short(keyword, temp_dir, vercel_url=None, pipeline_secret=None):
    """
    Searches YouTube for Shorts matching the keyword, sorts by view count,
    and downloads the most viral one under 60 seconds that hasn't been used yet.
    If YouTube search fails (e.g., geoblocked or rate-limited), it falls back
    to sourcing content from Bilibili (self-healing / versatile sourcing).
    """
    logging.info(f"Searching for viral Shorts using keyword: {keyword}")
    
    used_ids = set()
    if vercel_url and pipeline_secret:
        try:
            res = requests.get(f"{vercel_url}/api/pipeline/history", headers={"Authorization": f"Bearer {pipeline_secret}"})
            if res.status_code == 200:
                used_ids = set(res.json().get("usedVideoIds", []))
                logging.info(f"Fetched {len(used_ids)} used video IDs from history.")
        except Exception as e:
            logging.warning(f"Failed to fetch history: {e}")

    ydl_opts_search = {
        'extract_flat': True,
        'quiet': True,
        'no_warnings': True
    }
    
    best_video = None
    is_bilibili = False
    
    # Try YouTube first
    try:
        search_query = f"ytsearch20:{keyword} #shorts"
        with yt_dlp.YoutubeDL(ydl_opts_search) as ydl:
            info = ydl.extract_info(search_query, download=False)
            if 'entries' in info and info['entries']:
                valid_entries = []
                for entry in info['entries']:
                    video_id = entry.get('id')
                    if video_id in used_ids:
                        continue
                        
                    duration = entry.get('duration')
                    if duration is not None and duration <= 60:
                        valid_entries.append(entry)
                        
                if valid_entries:
                    best_video = sorted(valid_entries, key=lambda x: x.get('view_count', 0), reverse=True)[0]
    except Exception as e:
        logging.warning(f"YouTube search blocked or failed: {e}. Falling back to Bilibili...")

    # Self-healing fallback to Bilibili
    if not best_video:
        logging.info("Sourcing viral short from Bilibili...")
        bili_entries = search_bilibili(keyword)
        valid_bili = []
        for entry in bili_entries:
            bili_id = str(entry.get('id') or entry.get('aid'))
            if bili_id in used_ids:
                continue
            duration_str = entry.get('duration', '')
            duration = parse_bilibili_duration(duration_str)
            # Match Bilibili short clips (under 90s)
            if duration > 0 and duration <= 90:
                valid_bili.append(entry)
                
        if valid_bili:
            best_bili = sorted(valid_bili, key=lambda x: x.get('play', 0), reverse=True)[0]
            is_bilibili = True
            video_url = best_bili.get('arcurl')
            video_title = clean_html_tags(best_bili.get('title', 'bilibili_video'))
            video_id = str(best_bili.get('id') or best_bili.get('aid'))
            view_count = best_bili.get('play', 0)
            logging.info(f"Found Bilibili video: '{video_title}' with {view_count} views.")
        else:
            logging.error("Failed to find any matching videos on YouTube or Bilibili.")
            return None
    else:
        video_url = best_video['url']
        video_title = best_video.get('title', 'viral_short')
        video_id = best_video['id']
        view_count = best_video.get('view_count', 0)
        logging.info(f"Found YouTube short: '{video_title}' with {view_count} views.")

    output_path = os.path.join(temp_dir, "viral_short.mp4")
    
    ydl_opts_download = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_path,
        'noplaylist': True,
        'quiet': False
    }
    
    # Bilibili downloads are more stable with direct 'best' format
    if is_bilibili:
        ydl_opts_download['format'] = 'best'
        
    logging.info(f"Downloading {video_url} to {output_path}...")
    
    retries = 3
    success = False
    for attempt in range(retries):
        try:
            with yt_dlp.YoutubeDL(ydl_opts_download) as ydl:
                ydl.download([video_url])
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                success = True
                break
        except Exception as e:
            logging.error(f"Download attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                ydl_opts_download['format'] = 'best'
                time.sleep(5 * (attempt + 1))
                
    if success:
        logging.info("Download complete.")
        return {
            'filepath': output_path,
            'title': video_title,
            'url': video_url,
            'view_count': view_count,
            'description': f"Sourced via {'Bilibili' if is_bilibili else 'YouTube'}."
        }
    else:
        logging.error("Download failed after all retry attempts.")
        return None

def format_time_ass(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centi = int(round((seconds - int(seconds)) * 100))
    if centi == 100:
        centi = 0
        secs += 1
    return f"{hours}:{minutes:02d}:{secs:02d}.{centi:02d}"

def generate_kinetic_ass(audio_path, output_ass_path, model_size="base"):
    if not HAS_WHISPER:
        logging.warning("Whisper not available, skipping ASS kinetic subtitles.")
        return None

    try:
        logging.info(f"Loading faster-whisper model ({model_size})...")
        model = WhisperModel(model_size, device="cuda" if os.environ.get("KAGGLE_KERNEL_RUN_TYPE") else "cpu", compute_type="int8")
        logging.info(f"Transcribing {audio_path}...")
        segments, info = model.transcribe(audio_path, word_timestamps=True)
        
        words_data = []
        for segment in segments:
            for word in segment.words:
                words_data.append({
                    "word": word.word.strip(),
                    "start": word.start,
                    "end": word.end
                })
        logging.info(f"Extracted {len(words_data)} words. Generating ASS file...")
        
        ass_content = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,90,&H0000FFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,8,4,5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        for w in words_data:
            start_time = format_time_ass(w['start'])
            end_time = format_time_ass(w['end'])
            text = w['word']
            ass_content += f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{text}\n"

        with open(output_ass_path, "w", encoding="utf-8") as f:
            f.write(ass_content)
        logging.info(f"Kinetic typography ASS saved to {output_ass_path}")
        return output_ass_path
    except Exception as e:
        logging.error(f"Failed to generate kinetic ASS subtitles: {e}")
        return None

def run_ffmpeg_command(cmd):
    try:
        logging.info("Executing FFmpeg command...")
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        logging.warning(f"FFmpeg command failed: {e.stderr}")
        if "h264_nvenc" in cmd:
            logging.info("Attempting CPU fallback with libx264...")
            fallback_cmd = []
            skip_next = False
            for arg in cmd:
                if arg in ["-rc", "-cq", "-preset"]:
                    skip_next = True
                    continue
                if skip_next:
                    skip_next = False
                    continue
                if arg == "h264_nvenc":
                    fallback_cmd.append("libx264")
                else:
                    fallback_cmd.append(arg)
            try:
                subprocess.run(fallback_cmd, check=True, capture_output=True, text=True)
            except subprocess.CalledProcessError as fallback_e:
                raise Exception(f"FFmpeg fallback failed: {fallback_e.stderr}")
        else:
            raise Exception(f"FFmpeg failed: {e.stderr}")

def has_audio_stream(filepath):
    try:
        res = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "default=noprint_wrappers=1:nokey=1", filepath], stdout=subprocess.PIPE, text=True)
        return 'audio' in res.stdout
    except:
        return False

def create_split_screen_video(top_video, bottom_video, output_path, audio_path=None, srt_path=None):
    logging.info("Building split-screen complex filtergraph...")
    
    # Calculate duration to trim inputs
    audio_duration = 60.0
    if audio_path and os.path.exists(audio_path):
        try:
            res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audio_path], stdout=subprocess.PIPE, text=True)
            audio_duration = float(res.stdout.strip()) + 2.0
        except:
            pass
    else:
        try:
            res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", top_video], stdout=subprocess.PIPE, text=True)
            audio_duration = float(res.stdout.strip())
        except:
            pass

    cmd = ["ffmpeg", "-y"]
    cmd.extend(["-t", str(audio_duration), "-i", top_video])
    cmd.extend(["-stream_loop", "-1", "-t", str(audio_duration), "-i", bottom_video])
    
    filter_parts = [
        "[0:v]scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,eq=saturation=1.1:contrast=1.05:gamma=1.0,setsar=1,fps=30,format=yuv420p[top]",
        "[1:v]scale=1080:840:force_original_aspect_ratio=increase,crop=1080:840,eq=saturation=1.2:contrast=1.15:gamma=0.95,setsar=1,fps=30,format=yuv420p[bottom_graded]",
        "[top][bottom_graded]vstack=inputs=2[stacked]",
        "[stacked]drawbox=x=0:y=1076:w=1080:h=8:color=black@1.0:t=fill[with_divider]"
    ]
    last_v = "[with_divider]"
    
    if srt_path and os.path.exists(srt_path):
        abs_srt_path = os.path.abspath(srt_path).replace('\\', '/').replace(':', '\\:')
        if srt_path.endswith('.ass'):
            filter_parts.append(f"{last_v}ass='{abs_srt_path}'[with_subs]")
        else:
            filter_parts.append(f"{last_v}subtitles='{abs_srt_path}':force_style='FontName=Arial,FontSize=36,PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=2,Alignment=2,MarginV=450'[with_subs]")
        last_v = "[with_subs]"

    if audio_path and os.path.exists(audio_path):
        cmd.extend(["-i", audio_path])
        if has_audio_stream(top_video):
            filter_parts.append("[0:a]volume=0.3[orig_a];[2:a]volume=1.0[voice_a];[orig_a][voice_a]amix=inputs=2:duration=first:dropout_transition=2[final_a]")
        else:
            filter_parts.append("[2:a]volume=1.0[final_a]")
        last_a = "[final_a]"
    else:
        last_a = "0:a?"
        
    filter_complex = ";".join(filter_parts)
    cmd.extend(["-filter_complex", filter_complex])
    cmd.extend(["-map", last_v, "-map", last_a])
    
    cmd.extend([
        "-c:v", "h264_nvenc",
        "-preset", "p2",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_path
    ])
    
    run_ffmpeg_command(cmd)

def setup_openvoice():
    if not os.path.exists("OpenVoice"):
        logging.info("Setting up OpenVoice...")
        try:
            subprocess.run(["git", "clone", "https://github.com/myshell-ai/OpenVoice.git"], check=True)
            subprocess.run([sys.executable, "-m", "pip", "install", "-e", "./OpenVoice"], check=True)
        except Exception as e:
            logging.error(f"OpenVoice setup failed: {e}")

def clone_voice(text, reference_audio_path, output_path, voice_name="en-US-GuyNeural"):
    logging.info(f"Cloning voice/generating voiceover for text: {text[:30]}...")
    try:
        from voice_cloner import clone_voice as run_clone
        return run_clone(text, reference_audio_path, output_path, voice_name)
    except Exception as e:
        logging.error(f"Failed to run voice_cloner: {e}. Falling back to Edge-TTS...")
        subtitle_path = output_path.replace('.wav', '.vtt').replace('.mp3', '.vtt')
        cmd = [
            "edge-tts",
            "--text", text,
            "--voice", voice_name,
            "--write-media", output_path
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            logging.info("TTS voice synthesis complete.")
            return output_path
        except Exception as tts_err:
            logging.error(f"TTS synthesis failed, copying reference audio: {tts_err}")
            shutil.copyfile(reference_audio_path, output_path)
            return output_path

def setup_sadtalker():
    if not os.path.exists("SadTalker"):
        logging.info("Setting up SadTalker...")
        try:
            subprocess.run(["git", "clone", "https://github.com/OpenTalker/SadTalker.git"], check=True)
            if os.environ.get("KAGGLE_KERNEL_RUN_TYPE"):
                subprocess.run(["sh", "SadTalker/scripts/download_models.sh"], check=True)
        except Exception as e:
            logging.error(f"SadTalker setup failed: {e}")

def generate_avatar(image_path, audio_path, output_path):
    setup_sadtalker()
    logging.info(f"Generating Avatar video from {image_path} and {audio_path}...")
    
    sadtalker_dir = os.path.abspath("SadTalker")
    inference_script = os.path.join(sadtalker_dir, "inference.py")
    is_kaggle = os.environ.get("KAGGLE_KERNEL_RUN_TYPE") is not None
    
    if is_kaggle and os.path.exists(inference_script):
        cmd = [
            sys.executable, inference_script,
            "--driven_audio", os.path.abspath(audio_path),
            "--source_image", os.path.abspath(image_path),
            "--result_dir", os.path.abspath(os.path.dirname(output_path)),
            "--still",
            "--preprocess", "crop"
        ]
        try:
            logging.info(f"Running SadTalker: {' '.join(cmd)}")
            subprocess.run(cmd, cwd=sadtalker_dir, check=True)
            res_dir = os.path.abspath(os.path.dirname(output_path))
            mp4s = [f for f in os.listdir(res_dir) if f.endswith('.mp4')]
            if mp4s:
                latest = max(mp4s, key=lambda f: os.path.getmtime(os.path.join(res_dir, f)))
                shutil.move(os.path.join(res_dir, latest), output_path)
                return output_path
        except Exception as e:
            logging.error(f"SadTalker execution failed: {e}")
            
    # Mock/Fallback avatar video creation using static image + audio
    logging.info("Generating static image avatar video fallback...")
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", image_path,
        "-i", audio_path,
        "-c:v", "libx264", "-tune", "stillimage", "-c:a", "aac",
        "-b:a", "192k", "-pix_fmt", "yuv420p", "-shortest",
        output_path
    ]
    run_ffmpeg_command(cmd)
    return output_path

# --- MAIN WORKER PIPELINE ---

def download_file(url, filepath):
    logging.info(f"Downloading {url} to {filepath}")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(filepath, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    return filepath

def generate_voiceover(text, voice, output_path):
    logging.info(f"Generating voiceover for: {text[:30]}... using {voice}")
    subtitle_path = output_path.replace('.mp3', '.vtt')
    cmd = [
        "edge-tts",
        "--text", text,
        "--voice", voice,
        "--write-media", output_path,
        "--write-subtitles", subtitle_path
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        logging.info("Voiceover and subtitles generated successfully.")
        if os.path.exists(subtitle_path):
            srt_path = output_path.replace('.mp3', '.srt')
            convert_vtt_to_srt(subtitle_path, srt_path)
            return output_path, srt_path
        return output_path, None
    except subprocess.CalledProcessError as e:
        logging.error(f"Error generating voiceover: {e.stderr}")
        raise

def convert_vtt_to_srt(vtt_path, srt_path):
    with open(vtt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    with open(srt_path, 'w', encoding='utf-8') as f:
        sub_idx = 1
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if '-->' in line:
                ts = line.replace('.', ',')
                f.write(f"{sub_idx}\n")
                f.write(f"{ts}\n")
                i += 1
                while i < len(lines) and lines[i].strip() != '':
                    text = lines[i].strip()
                    if text:
                        f.write(f"{text}\n")
                    i += 1
                f.write("\n")
                sub_idx += 1
            i += 1

def download_pexels_videos(prompts, pexels_api_key, temp_dir):
    logging.info("Searching Pexels for video clips...")
    downloaded_clips = []
    if not pexels_api_key:
        logging.warning("No Pexels API key provided.")
        return downloaded_clips

    headers = {"Authorization": pexels_api_key}
    
    for idx, prompt in enumerate(prompts):
        # Request up to 15 results to have a diverse pool
        url = f"https://api.pexels.com/videos/search?query={prompt}&orientation=portrait&per_page=15"
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            videos = data.get('videos', [])
            if videos:
                # Shuffle the results so we don't always pick the first one
                random.shuffle(videos)
                
                found_video = False
                for video in videos:
                    video_files = video.get('video_files', [])
                    vertical_files = [f for f in video_files if f.get('width') and f.get('height') and f['height'] > f['width']]
                    
                    if vertical_files:
                        # Sort by resolution descending to get best quality vertical stream
                        vertical_files = sorted(
                            vertical_files, 
                            key=lambda x: (x.get('height', 0) * x.get('width', 0)), 
                            reverse=True
                        )
                        best_file_url = vertical_files[0]['link']
                        clip_path = os.path.join(temp_dir, f"clip_{idx}.mp4")
                        download_file(best_file_url, clip_path)
                        downloaded_clips.append(clip_path)
                        logging.info(f"Downloaded random clip {video['id']} for prompt '{prompt}'")
                        found_video = True
                        break
                        
                if not found_video:
                    # Fallback to the first video
                    video = videos[0]
                    video_files = video.get('video_files', [])
                    if video_files:
                        best_file_url = video_files[0]['link']
                        clip_path = os.path.join(temp_dir, f"clip_{idx}.mp4")
                        download_file(best_file_url, clip_path)
                        downloaded_clips.append(clip_path)
                        logging.info(f"Downloaded fallback clip for prompt '{prompt}'")
        except Exception as e:
            logging.error(f"Failed to fetch Pexels video for prompt '{prompt}': {e}")
            
    return downloaded_clips

def generate_thumbnail(title, output_path):
    logging.info("Generating thumbnail...")
    try:
        img = Image.new('RGB', (1280, 720), color = (73, 109, 137))
        d = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("arial.ttf", 60)
        except IOError:
            font = ImageFont.load_default()
            
        d.text((100, 300), title, fill=(255, 255, 0), font=font)
        img.save(output_path)
        logging.info("Thumbnail generated.")
        return output_path
    except Exception as e:
        logging.error(f"Error generating thumbnail: {e}")
        open(output_path, 'a').close()
        return output_path

def get_media_duration(filepath):
    cmd = [
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration", "-of",
        "default=noprint_wrappers=1:nokey=1", filepath
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        return float(result.stdout.strip())
    except:
        return 0.0

def has_audio_stream(filepath):
    try:
        res = subprocess.run(["ffprobe", "-i", filepath, "-show_streams", "-select_streams", "a", "-loglevel", "error"], capture_output=True, text=True)
        return "codec_type=audio" in res.stdout
    except:
        return False

def compose_video(audio_path, srt_path, clip_paths, output_path):
    logging.info("Composing final video using FFmpeg complex filtergraph...")
    if not clip_paths:
        raise ValueError("No video clips available for composition.")

    audio_duration = get_media_duration(audio_path)
    if audio_duration == 0:
        audio_duration = 60.0
        
    sequence_clips = []
    current_duration = 0.0
    clip_idx = 0
    fade_duration = 0.5
    
    while current_duration < audio_duration:
        clip = clip_paths[clip_idx % len(clip_paths)]
        duration = get_media_duration(clip)
        if duration == 0:
            duration = 5.0
            
        sequence_clips.append((clip, duration))
        
        if current_duration == 0.0:
            current_duration += duration
        else:
            current_duration += (duration - fade_duration)
            
        clip_idx += 1

    cmd = ["ffmpeg", "-y", "-i", audio_path]
    
    for clip, _ in sequence_clips:
        cmd.extend(["-i", clip])
        
    filter_parts = []
    for i in range(len(sequence_clips)):
        vid_idx = i + 1
        filter_parts.append(f"[{vid_idx}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v{i}]")
        
    last_out = "[v0]"
    current_offset = 0.0
    
    for i in range(1, len(sequence_clips)):
        prev_duration = sequence_clips[i-1][1]
        current_offset += (prev_duration - fade_duration)
        out_name = f"[x{i}]"
        filter_parts.append(f"{last_out}[v{i}]xfade=transition=fade:duration={fade_duration}:offset={current_offset:.2f}{out_name}")
        last_out = out_name

    if srt_path and os.path.exists(srt_path):
        abs_srt_path = os.path.abspath(srt_path).replace('\\', '/').replace(':', '\\:')
        if srt_path.endswith('.ass'):
            filter_parts.append(f"{last_out}ass='{abs_srt_path}'[final_v]")
        else:
            filter_parts.append(f"{last_out}subtitles='{abs_srt_path}':force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=10'[final_v]")
        last_v = "[final_v]"
    else:
        last_v = last_out
    
    filter_complex = ";".join(filter_parts)
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", last_v,
        "-map", "0:a?",
        "-c:v", "h264_nvenc",
        "-preset", "p2",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_path
    ])
    
    run_ffmpeg_command(cmd)

def upload_to_r2(file_path, object_name, r2_config, retries=3):
    logging.info(f"Uploading {file_path} to R2 bucket {r2_config['bucket']}...")
    s3 = boto3.client('s3',
        endpoint_url=f"https://{r2_config['account_id']}.r2.cloudflarestorage.com",
        aws_access_key_id=r2_config['access_key'],
        aws_secret_access_key=r2_config['secret_key']
    )
    for attempt in range(retries):
        try:
            s3.upload_file(file_path, r2_config['bucket'], object_name)
            public_url = f"{r2_config['public_url']}/{object_name}"
            logging.info(f"Upload successful. URL: {public_url}")
            return public_url
        except Exception as e:
            logging.error(f"R2 Upload attempt {attempt + 1}/{retries} failed: {e}")
            if attempt < retries - 1:
                time.sleep(5 * (attempt + 1))
            else:
                raise

def send_webhook(webhook_url, payload, secret, retries=3):
    logging.info("Sending completion webhook...")
    headers = {
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json"
    }
    for attempt in range(retries):
        try:
            response = requests.post(webhook_url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            logging.info("Webhook sent successfully.")
            return True
        except Exception as e:
            logging.error(f"Webhook attempt {attempt + 1}/{retries} failed: {e}")
            time.sleep(3 * (attempt + 1))
    return False

def send_status_update(job_id, message, vercel_url, secret):
    logging.info(f"Status Update: {message}")
    try:
        requests.post(
            f"{vercel_url}/api/pipeline/worker-status", 
            json={"jobId": job_id, "message": message},
            headers={"Authorization": f"Bearer {secret}"},
            timeout=10
        )
    except Exception as e:
        logging.error(f"Failed to send status update: {e}")

def cleanup_temp_dir(temp_dir):
    logging.info("Cleaning up temp directory...")
    if os.path.exists(temp_dir):
        for f in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, f)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                logging.warning(f"Failed to delete {file_path}: {e}")
    else:
        os.makedirs(temp_dir, exist_ok=True)

def main():
    VERCEL_URL = os.environ.get("VERCEL_URL", "https://simplyytr.vercel.app")
    PIPELINE_SECRET = os.environ.get("PIPELINE_SECRET", "youtubbot_secure_pipeline_key_2026")
    
    logging.info("Starting Continuous Orchestrator Loop...")
    while True:
        logging.info("Checking for pending jobs via worker-job endpoint...")
        try:
            config_res = requests.get(f"{VERCEL_URL}/api/pipeline/worker-job", headers={"Authorization": f"Bearer {PIPELINE_SECRET}", "x-worker-version": "36"})
            if config_res.status_code == 404:
                logging.info("No pending jobs found. Generating a new one via Auto-Trigger...")
                res = requests.post(f"{VERCEL_URL}/api/pipeline/auto-trigger", headers={"Authorization": f"Bearer {PIPELINE_SECRET}", "x-worker-version": "36"})
                res.raise_for_status()
                config_res = requests.get(f"{VERCEL_URL}/api/pipeline/worker-job", headers={"Authorization": f"Bearer {PIPELINE_SECRET}", "x-worker-version": "36"})
            
            config_res.raise_for_status()
            config_data = config_res.json()
            job = config_data.get('job', {})
            config = config_data.get('config', {})
        except Exception as e:
            logging.error(f"Failed to fetch job from Vercel: {e}")
            logging.info("Sleeping for 60 seconds before retrying...")
            time.sleep(60)
            continue

        if not job:
            logging.error("Failed to load a valid job.")
            time.sleep(60)
            continue

        job_id = job['id']
        send_status_update(job_id, "Initializing Video Rendering Bay on Kaggle GPU...", VERCEL_URL, PIPELINE_SECRET)
        
        full_script = f"{job.get('scriptHook', '')} {job.get('scriptBody', '')} {job.get('scriptCta', '')}".strip()
        prompts = job.get('visualPrompts', [])
        voice = job.get('voiceName', 'en-US-GuyNeural')
        title = job.get('generatedTitle', 'Video Thumbnail')
        
        pexels_key = config.get('pexels_api_key')
        webhook_url = config.get('webhook_url')
        webhook_secret = PIPELINE_SECRET
        
        r2_config = {
            'account_id': config.get('r2_account_id'),
            'access_key': config.get('r2_access_key_id'),
            'secret_key': config.get('r2_secret_access_key'),
            'bucket': config.get('r2_bucket_name'),
            'public_url': config.get('r2_public_url')
        }

        temp_dir = "./temp_assets"
        cleanup_temp_dir(temp_dir)
        
        audio_path = os.path.join(temp_dir, "voiceover.mp3")
        final_video_path = os.path.join(temp_dir, "final_video.mp4")
        thumbnail_path = os.path.join(temp_dir, "thumbnail.jpg")

        job_type = job.get('jobType', 'clone')

        try:
            if job_type == 'aggregator':
                keyword = job.get('topic')
                if not keyword or len(keyword.strip()) == 0:
                    target_channels = config.get('target_channels', 'Alex Hormozi, Andrew Huberman, Motivation')
                    channels_list = [c.strip() for c in target_channels.split(',') if c.strip()]
                    keyword = random.choice(channels_list) if channels_list else (prompts[0] if prompts else 'trending')
                send_status_update(job_id, f"Downloading viral short for '{keyword}'...", VERCEL_URL, PIPELINE_SECRET)
                try:
                    viral_data = download_viral_short(keyword, temp_dir, VERCEL_URL, PIPELINE_SECRET)
                except Exception as e:
                    logging.warning(f"YouTube block detected in aggregator: {e}. Falling back to Pexels...")
                    viral_data = None

                send_status_update(job_id, "Downloading filler clips from Pexels...", VERCEL_URL, PIPELINE_SECRET)
                random_queries = random.sample(PREMIUM_SATISFYING_QUERIES, min(2, len(PREMIUM_SATISFYING_QUERIES)))
                filler_clip_paths = download_pexels_videos(random_queries, pexels_key, temp_dir)
                
                if not viral_data:
                    if not filler_clip_paths:
                        raise Exception("Failed to download viral short AND failed to download Pexels fallback.")
                    top_video = filler_clip_paths[1] if len(filler_clip_paths) > 1 else filler_clip_paths[0]
                else:
                    top_video = viral_data['filepath']

                bottom_video = filler_clip_paths[0] if filler_clip_paths else top_video
                
                if viral_data and not viral_data.get('is_pexels'):
                    send_status_update(job_id, "Extracting original audio (NO AI voiceover)...", VERCEL_URL, PIPELINE_SECRET)
                    subprocess.run(["ffmpeg", "-y", "-i", top_video, "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2", audio_path], check=False)
                    audio_to_mix = None
                else:
                    send_status_update(job_id, "Generating AI Commentary...", VERCEL_URL, PIPELINE_SECRET)
                    audio_path, _ = generate_voiceover(full_script, voice, audio_path)
                    audio_to_mix = audio_path
                
                send_status_update(job_id, "Transcribing with Whisper & generating kinetic typography...", VERCEL_URL, PIPELINE_SECRET)
                ass_path = os.path.join(temp_dir, "subtitles.ass")
                generate_kinetic_ass(audio_path, ass_path)
                srt_path = ass_path
                
                send_status_update(job_id, "Building split-screen video...", VERCEL_URL, PIPELINE_SECRET)
                create_split_screen_video(top_video, bottom_video, final_video_path, audio_to_mix, srt_path)
                generate_thumbnail(viral_data['title'] if viral_data else title, thumbnail_path)
                
            elif job_type == 'clone':
                logging.info("Starting Clone Pipeline...")
                keyword = job.get('topic')
                if not keyword or len(keyword.strip()) == 0:
                    target_channels = config.get('target_channels', 'Alex Hormozi, Andrew Huberman, Motivation')
                    channels_list = [c.strip() for c in target_channels.split(',') if c.strip()]
                    keyword = random.choice(channels_list) if channels_list else (prompts[0] if prompts else 'trending')
                
                send_status_update(job_id, f"Searching YouTube for viral short ({keyword})...", VERCEL_URL, PIPELINE_SECRET)
                try:
                    viral_data = download_viral_short(keyword, temp_dir, VERCEL_URL, PIPELINE_SECRET)
                except Exception as e:
                    logging.warning(f"YouTube block detected: {e}. Falling back to Pexels...")
                    viral_data = None
                
                if not viral_data:
                    send_status_update(job_id, "YouTube blocked. Falling back to Pexels background...", VERCEL_URL, PIPELINE_SECRET)
                    random_queries = [random.choice(PREMIUM_SATISFYING_QUERIES)]
                    pexels_clips = download_pexels_videos(random_queries, pexels_key, temp_dir)
                    if not pexels_clips:
                        raise Exception("Failed to download viral short AND failed to download Pexels fallback.")
                    viral_data = {'filepath': pexels_clips[0], 'title': f"{keyword} Motivation", 'is_pexels': True}
                else:
                    viral_data['is_pexels'] = False
                    
                viral_video_path = viral_data['filepath']
                
                reference_audio = os.path.join(temp_dir, "ref_audio.wav")
                if not viral_data.get('is_pexels'):
                    send_status_update(job_id, "Extracting audio track from viral video...", VERCEL_URL, PIPELINE_SECRET)
                    subprocess.run(["ffmpeg", "-y", "-i", viral_video_path, "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2", reference_audio], check=True, capture_output=True)
                else:
                    # Create dummy file so clone_voice edge-tts fallback doesn't complain
                    with open(reference_audio, 'wb') as f:
                        f.write(b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00')
                
                cloned_audio_path = os.path.join(temp_dir, "cloned_audio.wav")
                if config.get('replace_original_audio', False) or viral_data.get('is_pexels'):
                    send_status_update(job_id, "Synthesizing AI voice clone/narration...", VERCEL_URL, PIPELINE_SECRET)
                    clone_voice(full_script, reference_audio, cloned_audio_path, voice)
                else:
                    send_status_update(job_id, "Keeping original audio for avatar & subtitles...", VERCEL_URL, PIPELINE_SECRET)
                    shutil.copyfile(reference_audio, cloned_audio_path)
                
                send_status_update(job_id, "Generating avatar video...", VERCEL_URL, PIPELINE_SECRET)
                avatar_base_img = os.path.join(temp_dir, "avatar_base.jpg")
                if not os.path.exists(avatar_base_img):
                    img = Image.new('RGB', (512, 512), color=(73, 109, 137))
                    d = ImageDraw.Draw(img)
                    try:
                        font = ImageFont.truetype("arial.ttf", 60)
                    except IOError:
                        font = ImageFont.load_default()
                    d.text((150, 220), "Avatar", fill=(255, 255, 0), font=font)
                    img.save(avatar_base_img)
                
                avatar_video_path = os.path.join(temp_dir, "avatar_video.mp4")
                generate_avatar(avatar_base_img, cloned_audio_path, avatar_video_path)
                
                send_status_update(job_id, "Transcribing with Whisper & generating kinetic typography...", VERCEL_URL, PIPELINE_SECRET)
                ass_path = os.path.join(temp_dir, "subtitles.ass")
                generate_kinetic_ass(cloned_audio_path, ass_path)
                
                rel_ass_path = ass_path.replace('\\', '/').replace(':', '\\:') if os.path.exists(ass_path) else None
                
                filter_complex_parts = [
                    "[0:v]hflip,scale=iw*1.05:ih*1.05,crop=iw/1.05:ih/1.05,eq=contrast=1.05:saturation=1.05[bg]",
                    "[1:v]scale=320:-1[avatar_scaled]",
                    "[bg][avatar_scaled]overlay=W-w-10:H-h-10[with_avatar]"
                ]
                last_v = "[with_avatar]"
                if rel_ass_path:
                    filter_complex_parts.append(f"{last_v}ass='{rel_ass_path}'[subbed]")
                    last_v = "[subbed]"
                
                filter_complex_parts.append(f"{last_v}setpts=PTS/1.05[final_v]")
                filter_complex_parts.append("[2:a]atempo=1.05[final_a]")
                
                filter_complex = ";".join(filter_complex_parts)
                
                audio_duration = 60.0
                try:
                    res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", cloned_audio_path], stdout=subprocess.PIPE, text=True)
                    audio_duration = float(res.stdout.strip()) + 2.0
                except:
                    pass

                cmd = [
                    "ffmpeg", "-y",
                    "-t", str(audio_duration), "-i", viral_video_path,
                    "-t", str(audio_duration), "-i", avatar_video_path,
                    "-t", str(audio_duration), "-i", cloned_audio_path,
                    "-filter_complex", filter_complex,
                    "-map", "[final_v]",
                    "-map", "[final_a]",
                    "-c:v", "h264_nvenc",
                    "-preset", "p2",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    "-shortest",
                    final_video_path
                ]
                
                send_status_update(job_id, "Composing final clone video with FFmpeg...", VERCEL_URL, PIPELINE_SECRET)
                run_ffmpeg_command(cmd)
                
                generate_thumbnail(viral_data['title'], thumbnail_path)
                audio_path = cloned_audio_path

            else:
                logging.info("Starting Generative Pipeline...")
                send_status_update(job_id, "Generating voiceover...", VERCEL_URL, PIPELINE_SECRET)
                audio_path, srt_path = generate_voiceover(full_script, voice, audio_path)
                
                send_status_update(job_id, "Transcribing with Whisper & generating kinetic typography...", VERCEL_URL, PIPELINE_SECRET)
                ass_path = os.path.join(temp_dir, "subtitles.ass")
                generate_kinetic_ass(audio_path, ass_path)
                srt_path = ass_path
                
                send_status_update(job_id, "Downloading Pexels video clips...", VERCEL_URL, PIPELINE_SECRET)
                clip_paths = download_pexels_videos(prompts, pexels_key, temp_dir)
                
                send_status_update(job_id, "Composing video clips and subtitles...", VERCEL_URL, PIPELINE_SECRET)
                compose_video(audio_path, srt_path, clip_paths, final_video_path)
                generate_thumbnail(title, thumbnail_path)
            
            send_status_update(job_id, "Uploading final assets to Cloudflare R2...", VERCEL_URL, PIPELINE_SECRET)
            voice_ext = ".wav" if audio_path.endswith(".wav") else ".mp3"
            video_url = upload_to_r2(final_video_path, f"{job_id}_video.mp4", r2_config)
            thumb_url = upload_to_r2(thumbnail_path, f"{job_id}_thumb.jpg", r2_config)
            voice_url = upload_to_r2(audio_path, f"{job_id}_voice{voice_ext}", r2_config)
            
            if viral_data and 'youtube.com' in viral_data.get('url', ''):
                youtube_id = viral_data['url'].split('v=')[-1].split('&')[0]
                try:
                    requests.post(f"{VERCEL_URL}/api/pipeline/history", json={"youtubeId": youtube_id}, headers={"Authorization": f"Bearer {PIPELINE_SECRET}"})
                    logging.info(f"Registered {youtube_id} in history.")
                except Exception as e:
                    logging.warning(f"Failed to register history: {e}")

            payload = {
                "jobId": job_id,
                "videoUrl": video_url,
                "thumbnailUrl": thumb_url,
                "voiceoverUrl": voice_url
            }
            send_webhook(webhook_url, payload, webhook_secret)
            
        except Exception as e:
            logging.error(f"Worker failed: {e}")
            payload = {
                "jobId": job_id,
                "error": str(e)
            }
            send_webhook(webhook_url, payload, webhook_secret)
            
        delay_seconds = random.randint(10, 60)
        logging.info(f"Loop finished. Sleeping for {delay_seconds} seconds before next check...")
        time.sleep(delay_seconds)

if __name__ == "__main__":
    main()