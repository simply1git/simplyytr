import os
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def create_split_screen_video(top_video, bottom_video, output_path, audio_path=None, srt_path=None):
    """
    Takes a viral short (top) and filler footage (bottom) and stacks them vertically.
    Optionally adds an audio voiceover and subtitles in the center.
    Uses NVENC hardware acceleration.
    """
    logging.info("Building split-screen complex filtergraph...")
    
    cmd = ["ffmpeg", "-y"]
    
    # Inputs
    cmd.extend(["-i", top_video])
    cmd.extend(["-stream_loop", "-1", "-i", bottom_video]) # Loop bottom video in case it's shorter
    
    filter_parts = []
    
    # 1. Scale and crop top video to 1080x960 (top half)
    filter_parts.append("[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1,fps=30,format=yuv420p[top]")
    
    # 2. Scale and crop bottom video to 1080x960 (bottom half)
    filter_parts.append("[1:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1,fps=30,format=yuv420p[bottom]")
    
    # 3. Stack them vertically
    filter_parts.append("[top][bottom]vstack=inputs=2[stacked]")
    
    last_v = "[stacked]"
    
    # 4. Optional Subtitles
    if srt_path:
        abs_srt_path = os.path.abspath(srt_path).replace('\\', '/')
        # MarginV=480 puts it exactly in the middle of a 1920 tall screen
        filter_parts.append(f"{last_v}subtitles={abs_srt_path}:force_style='FontName=Arial,FontSize=36,PrimaryColour=&H0000FFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=2,Alignment=2,MarginV=450'[with_subs]")
        last_v = "[with_subs]"
        
    filter_complex = ";".join(filter_parts)
    
    cmd.extend(["-filter_complex", filter_complex])
    cmd.extend(["-map", last_v])
    
    # Handle Audio
    if audio_path:
        cmd.extend(["-i", audio_path])
        # Mix original audio (0:a) and voiceover (2:a)
        # Volume of original video down to 0.3, voiceover at 1.0
        audio_filter = "[0:a]volume=0.3[orig_a];[2:a]volume=1.0[voice_a];[orig_a][voice_a]amix=inputs=2:duration=first:dropout_transition=2[final_a]"
        cmd.extend(["-filter_complex", audio_filter, "-map", "[final_a]"])
    else:
        # Just use original viral video audio
        cmd.extend(["-map", "0:a"])
        
    cmd.extend([
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
        "-shortest", # End when the shortest stream ends (usually the top video)
        output_path
    ])
    
    try:
        logging.info("Running split-screen FFmpeg composition...")
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        logging.info(f"Successfully generated {output_path}")
    except subprocess.CalledProcessError as e:
        logging.error(f"FFmpeg error: {e.stderr}")
        raise

if __name__ == "__main__":
    # Test script locally using the viral short downloaded earlier
    test_dir = "./temp_assets"
    top = os.path.join(test_dir, "viral_short.mp4")
    # For testing, we'll just use the viral short as both top and bottom
    bottom = top 
    out = os.path.join(test_dir, "split_screen_test.mp4")
    
    if os.path.exists(top):
        create_split_screen_video(top, bottom, out)
    else:
        print("Run trend_scraper.py first to get a viral video for testing.")
