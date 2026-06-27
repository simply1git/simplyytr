import os
import json
import argparse
import logging
import subprocess
import requests
import boto3
from urllib.parse import urlparse
import srt
import datetime
from PIL import Image, ImageDraw, ImageFont

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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
    # Run edge-tts via subprocess to capture the SubMaker subtitle output
    # We use vtt output format to easily parse it, but edge-tts handles --write-subtitles
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
        
        # Convert VTT to SRT (FFmpeg prefers SRT or ASS for reliable overlay)
        if os.path.exists(subtitle_path):
            srt_path = output_path.replace('.mp3', '.srt')
            convert_vtt_to_srt(subtitle_path, srt_path)
            return output_path, srt_path
        return output_path, None
    except subprocess.CalledProcessError as e:
        logging.error(f"Error generating voiceover: {e.stderr}")
        raise

def convert_vtt_to_srt(vtt_path, srt_path):
    # Basic conversion from VTT to SRT
    with open(vtt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    with open(srt_path, 'w', encoding='utf-8') as f:
        sub_idx = 1
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if '-->' in line:
                # Replace VTT timestamp dots with SRT commas
                ts = line.replace('.', ',')
                f.write(f"{sub_idx}\n")
                f.write(f"{ts}\n")
                i += 1
                # Write the text
                while i < len(lines) and lines[i].strip() != '':
                    # Remove any VTT specific tags like <c> or alignment
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
    headers = {"Authorization": pexels_api_key}
    
    for idx, prompt in enumerate(prompts):
        url = f"https://api.pexels.com/videos/search?query={prompt}&orientation=portrait&per_page=3"
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            if data.get('videos') and len(data['videos']) > 0:
                # Get highest resolution portrait video from the first result
                video = data['videos'][0]
                video_files = video.get('video_files', [])
                
                # Sort by quality (highest first, preferably HD and vertical)
                video_files = sorted(
                    [f for f in video_files if f.get('width') and f.get('height') and f['height'] > f['width']], 
                    key=lambda x: (x.get('height', 0) * x.get('width', 0)), 
                    reverse=True
                )
                
                if video_files:
                    best_file_url = video_files[0]['link']
                    clip_path = os.path.join(temp_dir, f"clip_{idx}.mp4")
                    download_file(best_file_url, clip_path)
                    downloaded_clips.append(clip_path)
                    logging.info(f"Downloaded clip for prompt '{prompt}'")
                else:
                    logging.warning(f"No suitable vertical video files found for prompt '{prompt}'")
            else:
                logging.warning(f"No Pexels results for prompt '{prompt}'")
                
        except Exception as e:
            logging.error(f"Failed to fetch Pexels video for prompt '{prompt}': {e}")
            
    return downloaded_clips

def generate_thumbnail(title, output_path, pollinations_api_key=None):
    logging.info("Generating thumbnail...")
    # For now, generate a basic text-based thumbnail using Pillow.
    # In a fully integrated version, we could call Pollinations.ai here.
    try:
        img = Image.new('RGB', (1280, 720), color = (73, 109, 137))
        d = ImageDraw.Draw(img)
        # Try to load a generic font, fallback to default
        try:
            font = ImageFont.truetype("arial.ttf", 60)
        except IOError:
            font = ImageFont.load_default()
            
        # Draw text centered (rough estimation for default font)
        d.text((100, 300), title, fill=(255, 255, 0), font=font)
        img.save(output_path)
        logging.info("Thumbnail generated.")
        return output_path
    except Exception as e:
        logging.error(f"Error generating thumbnail: {e}")
        # Create a dummy file if generation fails so the process doesn't completely halt
        open(output_path, 'a').close()
        return output_path

def compose_video(audio_path, srt_path, clip_paths, output_path):
    logging.info("Composing final video using FFmpeg...")
    # Note: For this script, we'll use a basic FFmpeg concatenation approach.
    # A robust production version would use complex filtergraphs for precise crossfades 
    # and exact timing alignment with the audio track.
    
    if not clip_paths:
        raise ValueError("No video clips available for composition.")

    # 1. Create a list file for FFmpeg concat demuxer
    list_file_path = "clips_list.txt"
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

    cmd = ["ffmpeg", "-y"]
    cmd.extend(["-i", audio_path])
    
    for clip, _ in sequence_clips:
        cmd.extend(["-i", clip])
        
    filter_parts = []
    
    # Normalize each video stream
    for i in range(len(sequence_clips)):
        vid_idx = i + 1
        norm_filter = f"[{vid_idx}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p[v{i}]"
        filter_parts.append(norm_filter)
        
    last_out = "[v0]"
    current_offset = 0.0
    
    # Add crossfades
    for i in range(1, len(sequence_clips)):
        prev_duration = sequence_clips[i-1][1]
        current_offset += (prev_duration - fade_duration)
        out_name = f"[x{i}]"
        xfade = f"{last_out}[v{i}]xfade=transition=fade:duration={fade_duration}:offset={current_offset:.2f}{out_name}"
        filter_parts.append(xfade)
        last_out = out_name

    # Subtitles
    abs_srt_path = os.path.abspath(srt_path).replace('\\', '/')
    sub_filter = f"{last_out}subtitles={abs_srt_path}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=10'[final_v]"
    filter_parts.append(sub_filter)
    
    filter_complex = ";".join(filter_parts)
    
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "[final_v]",
        "-map", "0:a",
        "-c:v", "h264_nvenc",
        "-rc", "vbr",
        "-cq", "19",
        "-b:v", "5M",
        "-maxrate", "8M",
        "-bufsize", "8M",
        "-profile:v", "high",
        "-level", "4.1",
        "-preset", "p2",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_path
    ])
    
    try:
        logging.info(f"Running FFmpeg with {len(sequence_clips)} clips and crossfades...")
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        logging.info("Video composition completed successfully.")
    except subprocess.CalledProcessError as e:
        logging.error(f"FFmpeg error: {e.stderr}")
        raise

def upload_to_r2(file_path, object_name, r2_config):
    logging.info(f"Uploading {file_path} to R2 bucket {r2_config['bucket']}...")
    s3 = boto3.client('s3',
        endpoint_url=f"https://{r2_config['account_id']}.r2.cloudflarestorage.com",
        aws_access_key_id=r2_config['access_key'],
        aws_secret_access_key=r2_config['secret_key']
    )
    try:
        s3.upload_file(file_path, r2_config['bucket'], object_name)
        public_url = f"{r2_config['public_url']}/{object_name}"
        logging.info(f"Upload successful. URL: {public_url}")
        return public_url
    except Exception as e:
        logging.error(f"R2 Upload failed: {e}")
        raise

def send_webhook(webhook_url, payload, secret):
    logging.info("Sending completion webhook...")
    headers = {
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(webhook_url, json=payload, headers=headers)
        response.raise_for_status()
        logging.info("Webhook sent successfully.")
    except Exception as e:
        logging.error(f"Failed to send webhook: {e}")

def main():
    VERCEL_URL = "https://simplyytr.vercel.app"
    PIPELINE_SECRET = "youtubbot_secure_pipeline_key_2026"
    
    logging.info("Fetching next available job from Vercel...")
    try:
        res = requests.get(f"{VERCEL_URL}/api/pipeline/worker-job", headers={"Authorization": f"Bearer {PIPELINE_SECRET}"})
        res.raise_for_status()
        data = res.json()
    except Exception as e:
        logging.error(f"Failed to fetch job from Vercel: {e}")
        return

    if data.get('status') != 'success':
        logging.info("No pending jobs found. Exiting.")
        return

    job = data['job']
    config = data['config']
    
    job_id = job['id']
    full_script = f"{job.get('scriptHook', '')} {job.get('scriptBody', '')} {job.get('scriptCta', '')}"
    prompts = job.get('visualPrompts', [])
    voice = job.get('voiceName', 'en-US-GuyNeural')
    title = job.get('generatedTitle', 'Video Thumbnail')
    
    # Environment config from API
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
    os.makedirs(temp_dir, exist_ok=True)
    
    audio_path = os.path.join(temp_dir, "voiceover.mp3")
    final_video_path = os.path.join(temp_dir, "final_video.mp4")
    thumbnail_path = os.path.join(temp_dir, "thumbnail.jpg")

    try:
        # Step 1: Voiceover and Subtitles
        audio_path, srt_path = generate_voiceover(full_script, voice, audio_path)
        
        # Step 2: Download Stock Video Clips
        clip_paths = download_pexels_videos(prompts, pexels_key, temp_dir)
        
        # Step 3 & 4: Compose Video
        compose_video(audio_path, srt_path, clip_paths, final_video_path)
        
        # Step 5: Thumbnail
        generate_thumbnail(title, thumbnail_path)
        
        # Step 6: Upload to R2
        video_url = upload_to_r2(final_video_path, f"{job_id}_video.mp4", r2_config)
        thumb_url = upload_to_r2(thumbnail_path, f"{job_id}_thumb.jpg", r2_config)
        voice_url = upload_to_r2(audio_path, f"{job_id}_voice.mp3", r2_config)
        
        # Step 7: Webhook
        payload = {
            "jobId": job_id,
            "videoUrl": video_url,
            "thumbnailUrl": thumb_url,
            "voiceoverUrl": voice_url
        }
        send_webhook(webhook_url, payload, webhook_secret)
        
    except Exception as e:
        logging.error(f"Worker failed: {e}")
        # Report failure back to webhook
        payload = {
            "jobId": job_id,
            "error": str(e)
        }
        send_webhook(webhook_url, payload, webhook_secret)

if __name__ == "__main__":
    main()
