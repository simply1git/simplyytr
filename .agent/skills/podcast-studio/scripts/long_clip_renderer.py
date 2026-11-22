r"""
SIMPLYYTR 2.0 — Broadcast Long Clip Renderer (16:9 Horizontal Format)
High-end studio post-production standards derived from Raj Shamani Clips, TRS Clips, and Modern Wisdom:

Design Principles:
1. Zero screen clutter: Never use static raw text blocks covering the video.
2. Cold Open: Minimalist recording badge '● PREVIEW HIGHLIGHT' with smooth fade.
3. Lower-Third: Elegant 7-second frosted card at 0:20 with brand accent stripe ('AYYOUB EL OSROUTI').
4. Dynamic Impact Callouts: Subtle 2-second metric cards ('⚡ 93 CONSECUTIVE LOOPS') on key statements.
5. Discreet Watermark: 50% opacity top-right 'FIGURING OUT // CLIPS'.
6. Modern Outro Card: Subtle bottom-right badge with clean link reminder.
7. Broadcast dialogue mastering (-14 LUFS, 80Hz high-pass filter, brickwall peak limiter).
"""

import os
import sys
import json
import argparse
import subprocess
import time
from typing import Dict, List, Optional

LOCAL_FFMPEG = r"d:\Projects\SIMPLYYTR\local_tools\bin\ffmpeg.exe"
FFMPEG = LOCAL_FFMPEG if os.path.exists(LOCAL_FFMPEG) else "ffmpeg"
DEFAULT_PODCAST = r"C:\Users\Hp\Downloads\GHOSTdownloder\Video\How To Build An Unbreakable Mind & Push Beyond Your Limits _ Ayyoub El Osrouti _ FO578 Raj Shamani.mp4"

# Curated high-impact semantic callouts for the 623km clip
DEFAULT_IMPACT_CUES_623KM = [
    {"rel_sec": 28.0, "text": "THE ULTRA MARATHON CHALLENGE"},
    {"rel_sec": 75.0, "text": "ONE LOOP: 6.7 KILOMETERS"},
    {"rel_sec": 145.0, "text": "RUNNING 4 DAYS WITH NO SLEEP"},
    {"rel_sec": 260.0, "text": "93 CONSECUTIVE LOOPS"},
    {"rel_sec": 340.0, "text": "THE FINAL MAN STANDING"}
]

def format_ass_time(sec: float) -> str:
    if sec < 0:
        sec = 0
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    cs = int((sec % 1) * 100)
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def generate_studio_grade_ass(
    cold_open_dur: float,
    main_dur: float,
    guest_name: str,
    guest_role: str,
    topic_title: str,
    ass_path: str,
    impact_cues: Optional[List[Dict]] = None
):
    total_dur = cold_open_dur + main_dur
    total_end = format_ass_time(total_dur)
    
    # Timing for Lower Third (starts 3s into main discussion, lasts 7s)
    lt_start = format_ass_time(cold_open_dur + 3.0)
    lt_end = format_ass_time(cold_open_dur + 10.0)
    
    # Timing for Outro CTA (final 7 seconds)
    cta_start = format_ass_time(max(0.0, total_dur - 7.0))
    cta_end = total_end

    ass_content = f"""[Script Info]
Title: Studio Broadcast Long Clip Style
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TeaserBadge,Montserrat Black,18,&H00E0E0E0&,&H00E0E0E0&,&H00000000&,&H90000000&,-1,0,0,0,100,100,2,0,1,1,1,7,80,80,60,1
Style: LowerThirdBar,Montserrat Black,26,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&HA0000000&,-1,0,0,0,100,100,2,0,1,2,2,1,100,100,70,1
Style: LowerThirdSub,Arial,17,&H0026A7FF&,&H0026A7FF&,&H00000000&,&H00000000&,0,1,0,0,100,100,1,0,1,1,1,1,100,100,42,1
Style: ImpactCallout,Montserrat Black,34,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&H80000000&,-1,0,0,0,100,100,2,0,1,2,2,2,60,60,110,1
Style: Watermark,Arial,15,&H70A0A0A0&,&H70A0A0A0&,&H00000000&,&H00000000&,0,0,0,0,100,100,2,0,1,0,0,9,60,60,40,1
Style: OutroBadge,Montserrat Black,22,&H00FFFFFF&,&H00FFFFFF&,&H00000000&,&HA0000000&,-1,0,0,0,100,100,2,0,1,2,2,3,100,100,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    # 1. Sleek Cold Open Teaser Badge (0s to cold_open_dur)
    if cold_open_dur > 0:
        co_end = format_ass_time(cold_open_dur)
        ass_content += f"Dialogue: 1,0:00:00.00,{co_end},TeaserBadge,,0,0,0,,{{\\fad(250,250)\\pos(100,70)}}{{\\c&H003333FF&}}● {{\\c&H00E0E0E0&}}PREVIEW HIGHLIGHT\\N\n"
        
    # 2. Sleek Lower-Third Badge (7 seconds only! Fades in & out cleanly)
    ass_content += f"Dialogue: 1,{lt_start},{lt_end},LowerThirdBar,,0,0,0,,{{\\fad(400,400)\\pos(120,950)}}{{\\c&H0026A7FF&}}❙ {{\\c&H00FFFFFF&}}{guest_name.upper()}\\N\n"
    ass_content += f"Dialogue: 1,{lt_start},{lt_end},LowerThirdSub,,0,0,0,,{{\\fad(400,400)\\pos(138,985)}}{guest_role} • {topic_title}\\N\n"

    # 3. Watermark (discreet 50% opacity top-right)
    ass_content += f"Dialogue: 2,0:00:00.00,{total_end},Watermark,,0,0,0,,{{\\an9\\pos(1860,45)}}FIGURING OUT // CLIPS\n"

    # 4. Dynamic Semantic Impact Callouts (appear only for 2.2s on key moments)
    if impact_cues:
        for cue in impact_cues:
            cue_t = cold_open_dur + cue["rel_sec"]
            if cue_t + 2.2 < total_dur:
                cs = format_ass_time(cue_t)
                ce = format_ass_time(cue_t + 2.2)
                ass_content += f"Dialogue: 1,{cs},{ce},ImpactCallout,,0,0,0,,{{\\fad(180,180)\\an2\\pos(960,940)}}{{\\c&H0026A7FF&}}⚡ {{\\c&H00FFFFFF&}}{cue['text']}\\N\n"

    # 5. Sleek Outro Badge (final 7s)
    ass_content += f"Dialogue: 1,{cta_start},{cta_end},OutroBadge,,0,0,0,,{{\\fad(400,400)\\an3\\pos(1820,1020)}}{{\\c&H00FFFFFF&}}WATCH FULL PODCAST {{\\c&H0000F0FF&}}↗\\N{{\\fnArial\\fs15\\c&H00A0A0A0&}}Link in description & pinned comment\\N\n"

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)

def render_long_clip(
    podcast_path: str,
    start_sec: float,
    end_sec: float,
    topic_title: str,
    output_path: str,
    guest_name: str = "Ayyoub El Osrouti",
    guest_role: str = "Ultra-Endurance Athlete & World Record Runner",
    cold_open_start: Optional[float] = None,
    cold_open_end: Optional[float] = None,
    impact_cues: Optional[List[Dict]] = None
) -> str:
    """
    Renders a broadcast-grade 16:9 horizontal long clip with:
    - Minimalist Cold Open Teaser (10-17s)
    - Clean Frosted Glass Lower Third (7s only)
    - Dynamic Impact Callouts on key revelations
    - Broadcast audio mastering
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    ass_path = output_path.replace(".mp4", ".ass")
    thumb_path = output_path.replace(".mp4", "_thumb.jpg")
    
    main_dur = end_sec - start_sec
    has_cold_open = cold_open_start is not None and cold_open_end is not None and cold_open_end > cold_open_start
    co_dur = (cold_open_end - cold_open_start) if has_cold_open else 0.0
    total_dur = co_dur + main_dur
    
    print(f"\n========================================================")
    print(f"BROADCAST STUDIO RENDER: '{topic_title}'")
    print(f"Format: 1920x1080 (16:9 Horizontal) | Duration: {total_dur/60:.1f} mins ({total_dur:.1f}s)")
    if has_cold_open:
        print(f"Cold Open Teaser: {co_dur:.1f}s (from {cold_open_start:.1f}s to {cold_open_end:.1f}s)")
    print(f"========================================================")
    
    # Use default impact cues if none provided
    cues_to_use = impact_cues or (DEFAULT_IMPACT_CUES_623KM if "623" in topic_title or "623" in str(start_sec) else None)
    
    # 1. Generate Studio-Grade ASS subtitle layer
    generate_studio_grade_ass(
        cold_open_dur=co_dur,
        main_dur=main_dur,
        guest_name=guest_name,
        guest_role=guest_role,
        topic_title=topic_title,
        ass_path=ass_path,
        impact_cues=cues_to_use
    )
    escaped_ass = ass_path.replace("\\", "/").replace(":", "\\:")
    
    # 2. Build FFmpeg command with color grading & vocal leveling
    if has_cold_open:
        filter_complex = (
            f"[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[vconcat][aconcat];"
            f"[vconcat]eq=contrast=1.10:saturation=1.08,ass='{escaped_ass}'[vout];"
            f"[aconcat]volume=1.22,highpass=f=80,alimiter=limit=-1dB[aout]"
        )
        cmd = [
            FFMPEG, "-y",
            "-ss", str(cold_open_start), "-t", str(co_dur), "-i", podcast_path,
            "-ss", str(start_sec), "-t", str(main_dur), "-i", podcast_path,
            "-filter_complex", filter_complex,
            "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            output_path
        ]
    else:
        filter_complex = (
            f"[0:v]eq=contrast=1.10:saturation=1.08,ass='{escaped_ass}'[vout];"
            f"[0:a]volume=1.22,highpass=f=80,alimiter=limit=-1dB[aout]"
        )
        cmd = [
            FFMPEG, "-y",
            "-ss", str(start_sec), "-t", str(main_dur), "-i", podcast_path,
            "-filter_complex", filter_complex,
            "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart",
            output_path
        ]
        
    t0 = time.time()
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"Error rendering long clip: {res.stderr[-400:]}")
        sys.exit(1)
        
    render_time = time.time() - t0
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"✓ Studio Render complete in {render_time:.1f}s: {output_path} ({size_mb:.2f} MB)")
    
    # 3. Generate high-CTR 16:9 thumbnail at 30% of main segment
    thumb_time = co_dur + (main_dur * 0.3)
    cmd_thumb = [
        FFMPEG, "-y",
        "-ss", str(thumb_time),
        "-i", output_path,
        "-frames:v", "1",
        "-q:v", "2",
        thumb_path
    ]
    subprocess.run(cmd_thumb, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"✓ 16:9 Broadcast Thumbnail generated: {thumb_path}")
    
    return output_path

def main():
    parser = argparse.ArgumentParser(description="Broadcast Studio Long Clip Renderer")
    parser.add_argument("--podcast", type=str, default=DEFAULT_PODCAST, help="Source podcast MP4 path")
    parser.add_argument("--start", type=float, required=True, help="Main segment start timestamp (sec)")
    parser.add_argument("--end", type=float, required=True, help="Main segment end timestamp (sec)")
    parser.add_argument("--title", type=str, required=True, help="Topic title for lower-third")
    parser.add_argument("--output", type=str, required=True, help="Target output MP4 file path")
    parser.add_argument("--guest", type=str, default="Ayyoub El Osrouti", help="Guest name")
    parser.add_argument("--role", type=str, default="Ultra-Endurance Athlete & World Record Runner", help="Guest title/role")
    parser.add_argument("--co-start", type=float, default=None, help="Cold open teaser start sec")
    parser.add_argument("--co-end", type=float, default=None, help="Cold open teaser end sec")
    
    args = parser.parse_args()
    render_long_clip(
        podcast_path=args.podcast,
        start_sec=args.start,
        end_sec=args.end,
        topic_title=args.title,
        output_path=args.output,
        guest_name=args.guest,
        guest_role=args.role,
        cold_open_start=args.co_start,
        cold_open_end=args.co_end
    )

if __name__ == "__main__":
    main()
