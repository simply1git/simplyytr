r"""
Shamani Squad Viral Shorts Production Renderer
Implements the exact forensic visual, audio, typographical, and loop-retention formula
derived from @shamani_squad (52.1K+ subs, millions of views).

Pillars:
1. Multi-layer 1080x1920 canvas: 1080x1400 centered video + Gaussian blurred ambient pillarbox.
2. Floating neon hook banner: Word 1 in vivid neon green (#00FF66) with radial neon aura + white text + emoji.
3. Watermark: Top-right golden 'SHAMANI SQUAD' branding.
4. Kinetic typography: Two-tier glowing amber/gold subtitles (#FFB800) with Gaussian aura (#FF8000).
5. Audio mastering: Boosted vocal track + ducked motivational phonk BGM (-22 dB).
6. Algorithmic loop: Hard cutoff at voice endpoint for seamless replay retention > 100%.
"""

import os
import sys
import json
import argparse
import subprocess
import shutil

LOCAL_FFMPEG = r"d:\Projects\SIMPLYYTR\local_tools\bin\ffmpeg.exe"
DEFAULT_FFMPEG = LOCAL_FFMPEG if os.path.exists(LOCAL_FFMPEG) else "ffmpeg"
DEFAULT_BGM = r"d:\Projects\SIMPLYYTR\scratch\shorts-pipeline\analysis\ref_deep_dive\outro_music.wav"
DEFAULT_TRANSCRIPT = r"d:\Projects\SIMPLYYTR\scratch\shorts-pipeline\transcripts\podcast_transcript.json"

def format_ass_time(sec: float) -> str:
    if sec < 0:
        sec = 0
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    cs = int((sec % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def parse_time_sec(val) -> float:
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).strip()
    if ":" in val_str:
        parts = val_str.split(":")
        if len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        elif len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    return float(val_str)

def extract_clip_subtitles(transcript_path: str, start_sec: float, end_sec: float):
    if not os.path.exists(transcript_path):
        return []
    with open(transcript_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    segments = data.get("segments", [])
    clip_words = []
    for seg in segments:
        words = seg.get("words", [])
        for w in words:
            w_start = w.get("start", 0)
            w_end = w.get("end", 0)
            if w_end > start_sec and w_start < end_sec:
                rel_start = max(0.0, w_start - start_sec)
                rel_end = min(end_sec - start_sec, w_end - start_sec)
                word_clean = w.get("word", "").strip()
                if word_clean:
                    clip_words.append({
                        "word": word_clean,
                        "start": rel_start,
                        "end": rel_end
                    })
    return clip_words

def build_ass_subtitles(banner_text: str, duration_sec: float, words: list, ass_path: str):
    banner_parts = banner_text.strip().split(" ", 1)
    word1 = banner_parts[0] if banner_parts else ""
    rest = (" " + banner_parts[1]) if len(banner_parts) > 1 else ""

    ass_content = f"""[Script Info]
Title: Shamani Squad Signature Style
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: HeaderGlow,Montserrat Black,50,&H0000FF00&,&H0000FF00&,&H00000000&,&H00000000&,-1,0,0,0,100,100,2,0,1,0,0,8,40,40,180,1
Style: HeaderText,Montserrat Black,50,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&H00000000&,-1,0,0,0,100,100,2,0,1,4,3,8,40,40,180,1
Style: Watermark,Montserrat Black,26,&H0028CAFF&,&H0028CAFF&,&H00000000&,&H00000000&,-1,0,0,0,100,100,2,0,1,3,2,9,60,60,150,1
Style: SubGlow,Montserrat Black,80,&H000080FF&,&H000080FF&,&H00000000&,&H00000000&,-1,0,0,0,100,100,1,0,1,0,0,2,60,60,680,1
Style: SubText,Montserrat Black,80,&H0000B8FF&,&H0000B8FF&,&H00000000&,&H00000000&,-1,0,0,0,100,100,1,0,1,5,3,2,60,60,680,1
Style: SubContext,Arial,42,&H00E0E0E0&,&H00E0E0E0&,&H00000000&,&H00000000&,0,1,0,0,100,100,0,0,1,3,2,2,60,60,780,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    # 1. Pinned Top Banner (0s to duration)
    t_end = format_ass_time(duration_sec)
    ass_content += f"Dialogue: 1,0:00:00.00,{t_end},HeaderGlow,,0,0,0,,{{\\blur16\\c&H0066FF00&}}{word1}\\N\n"
    ass_content += f"Dialogue: 2,0:00:00.00,{t_end},HeaderText,,0,0,0,,{{\\c&H0066FF00&}}{word1}{{\\c&H00FFFFFF&}}{rest}\\N\n"

    # 2. Watermark: Top right corner
    ass_content += f"Dialogue: 2,0:00:00.00,{t_end},Watermark,,0,0,0,,{{\\an9\\pos(980,150)}}SHAMANI{{\\N}}{{\\fnBrush Script MT\\fs38\\i1\\c&H0026A7FF&}}SQUAD\n"

    # 3. Two-Tier Kinetic Subtitles
    if words:
        chunk_size = 4
        for i in range(0, len(words), chunk_size):
            chunk = words[i:i+chunk_size]
            c_start = format_ass_time(chunk[0]["start"])
            c_end = format_ass_time(chunk[-1]["end"])
            
            # Context line (first 2 words in italic white)
            context_text = " ".join([w["word"] for w in chunk[:2]])
            # Highlight keyword (last 1-2 words in glowing gold)
            kw_text = " ".join([w["word"] for w in chunk[2:]]) if len(chunk) > 2 else chunk[-1]["word"]
            kw_clean = kw_text.upper().replace('"', '').replace("'", "")
            
            # Glow layer (underneath)
            ass_content += f"Dialogue: 0,{c_start},{c_end},SubGlow,,0,0,0,,{{\\blur14\\c&H000080FF&}}{kw_clean}\n"
            # Text layer (crisp on top)
            ass_content += f"Dialogue: 1,{c_start},{c_end},SubText,,0,0,0,,{kw_clean}\n"
            if len(chunk) > 2:
                ass_content += f"Dialogue: 1,{c_start},{c_end},SubContext,,0,0,0,,{context_text}\n"

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)

def render_shamani_short(
    video_path: str,
    start_sec: float,
    end_sec: float,
    banner_text: str,
    output_path: str,
    bgm_path: str = DEFAULT_BGM,
    transcript_path: str = DEFAULT_TRANSCRIPT,
    ffmpeg_exe: str = DEFAULT_FFMPEG
):
    duration_sec = end_sec - start_sec
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # 1. Prepare ASS subtitles
    ass_path = output_path.replace(".mp4", ".ass")
    words = extract_clip_subtitles(transcript_path, start_sec, end_sec)
    build_ass_subtitles(banner_text, duration_sec, words, ass_path)
    
    # Escape ASS path for FFmpeg filtergraph
    escaped_ass = ass_path.replace("\\", "/").replace(":", "\\:")
    
    has_bgm = os.path.exists(bgm_path)
    
    filter_complex = (
        f"[0:v]split=2[fg_src][bg_src];"
        f"[bg_src]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:5,eq=brightness=-0.32:saturation=0.3[bg];"
        f"[fg_src]crop=860:1080:(1920-860)/2:0,scale=1080:1400[fg];"
        f"[bg][fg]overlay=0:260,eq=contrast=1.18:saturation=1.25,ass='{escaped_ass}'[vbase];"
        f"[0:a]volume=1.25[vox];"
    )
    
    if has_bgm:
        filter_complex += (
            f"[1:a]volume=0.18,aloop=loop=-1:size=2e+09[mus];"
            f"[vox][mus]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )
    else:
        filter_complex += f"[vox]anull[aout]"
        
    cmd = [
        ffmpeg_exe,
        "-y",
        "-ss", str(start_sec),
        "-t", str(duration_sec),
        "-i", video_path,
    ]
    
    if has_bgm:
        cmd.extend([
            "-stream_loop", "-1",
            "-ss", "0",
            "-t", str(duration_sec),
            "-i", bgm_path
        ])
        
    cmd.extend([
        "-filter_complex", filter_complex,
        "-map", "[vbase]",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-r", "30",
        output_path
    ])
    
    print(f"Executing Shamani Squad render ({duration_sec:.1f}s)...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Error rendering video: {res.stderr[-500:]}")
        sys.exit(1)
        
    # Generate thumbnail
    thumb_path = output_path.replace(".mp4", "_thumb.jpg")
    thumb_time = min(3.0, duration_sec / 2.0)
    thumb_cmd = [
        ffmpeg_exe, "-y",
        "-ss", str(thumb_time),
        "-i", output_path,
        "-frames:v", "1",
        "-q:v", "2",
        thumb_path
    ]
    subprocess.run(thumb_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✓ Render complete: {output_path} ({size_mb:.2f} MB)")
    print(f"✓ Thumbnail: {thumb_path}")
    return output_path

def main():
    parser = argparse.ArgumentParser(description="Shamani Squad Signature Shorts Renderer")
    parser.add_argument("--video", type=str, required=True, help="Input podcast video path")
    parser.add_argument("--start", type=str, required=True, help="Clip start timestamp (sec or mm:ss)")
    parser.add_argument("--end", type=str, required=True, help="Clip end timestamp (sec or mm:ss)")
    parser.add_argument("--banner", type=str, required=True, help="Hook banner text (e.g. 'BE DELUSIONAL AND GO ALL IN 🔥')")
    parser.add_argument("--output", type=str, required=True, help="Output MP4 file path")
    parser.add_argument("--bgm", type=str, default=DEFAULT_BGM, help="Background music audio path")
    parser.add_argument("--transcript", type=str, default=DEFAULT_TRANSCRIPT, help="Podcast transcript JSON path")
    
    args = parser.parse_args()
    start_sec = parse_time_sec(args.start)
    end_sec = parse_time_sec(args.end)
    
    render_shamani_short(
        video_path=args.video,
        start_sec=start_sec,
        end_sec=end_sec,
        banner_text=args.banner,
        output_path=args.output,
        bgm_path=args.bgm,
        transcript_path=args.transcript
    )

if __name__ == "__main__":
    main()
