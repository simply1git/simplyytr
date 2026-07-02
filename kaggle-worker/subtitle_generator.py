import os
import json
import logging
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def format_time_ass(seconds):
    """Convert seconds to ASS time format: H:MM:SS.cs"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centi = int(round((seconds - int(seconds)) * 100))
    # Handle rounding overflow
    if centi == 100:
        centi = 0
        secs += 1
    return f"{hours}:{minutes:02d}:{secs:02d}.{centi:02d}"

def generate_kinetic_ass(audio_path, output_ass_path, model_size="base"):
    """
    Transcribes audio using faster-whisper to get word-level timestamps,
    and generates an .ass subtitle file where each word pops on screen individually.
    """
    logging.info(f"Loading faster-whisper model ({model_size})...")
    # compute_type="int8" is safe for T4 GPUs and CPUs
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
    
    # ASS Header
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
    
    # Add each word as a separate dialogue line
    for w in words_data:
        start_time = format_time_ass(w['start'])
        end_time = format_time_ass(w['end'])
        text = w['word']
        # 5 is center alignment. Using PrimaryColour yellow (&H0000FFFF)
        ass_content += f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{text}\n"

    with open(output_ass_path, "w", encoding="utf-8") as f:
        f.write(ass_content)
        
    logging.info(f"Kinetic typography ASS saved to {output_ass_path}")
    return output_ass_path

if __name__ == "__main__":
    # For testing locally
    import sys
    if len(sys.argv) > 1:
        generate_kinetic_ass(sys.argv[1], "test_captions.ass")
