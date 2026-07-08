import os
import logging
import subprocess
import shutil
import sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def setup_openvoice():
    """Clones OpenVoice and downloads checkpoints if not present."""
    if not os.path.exists("OpenVoice"):
        logging.info("Setting up OpenVoice...")
        subprocess.run(["git", "clone", "https://github.com/myshell-ai/OpenVoice.git"], check=True)
        # Install OpenVoice locally in editable mode
        subprocess.run(["pip", "install", "-e", "./OpenVoice"], check=True)
        
    # Download checkpoints (V2)
    if not os.path.exists("checkpoints_v2"):
        logging.info("Downloading OpenVoice V2 checkpoints...")
        try:
            subprocess.run(["wget", "https://myshell-public-repo-hosting.s3.amazonaws.com/openvoice/checkpoints_v2_0417.zip"], check=True)
            subprocess.run(["unzip", "checkpoints_v2_0417.zip"], check=True)
            os.remove("checkpoints_v2_0417.zip")
        except Exception as e:
            logging.error(f"Failed to download/extract checkpoints: {e}")

def clone_voice(text, reference_audio_path, output_path, voice_name="en-US-GuyNeural"):
    """
    Clones the voice from reference_audio_path reading the provided text.
    Uses Edge-TTS for base speech generation, then applies OpenVoice V2 ToneColorConverter.
    """
    logging.info(f"Voice cloner initiated for text: {text[:30]}...")
    setup_openvoice()
    
    base_audio = output_path + ".base.wav"
    logging.info("Generating base speech via edge-tts...")
    subprocess.run(["edge-tts", "--text", text, "--voice", voice_name, "--write-media", base_audio], check=True)
    
    # We write a temporary script to execute inference inside the OpenVoice path context
    inference_script = f"""
import sys
import os
import torch
import shutil

sys.path.append(os.path.join(os.getcwd(), 'OpenVoice'))
from openvoice import se_extractor
from openvoice.api import ToneColorConverter

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"OpenVoice running on: {{device}}")

try:
    ckpt_converter = 'checkpoints_v2/converter'
    tone_color_converter = ToneColorConverter(f'{{ckpt_converter}}/config.json', device=device)
    tone_color_converter.load_ckpt(f'{{ckpt_converter}}/checkpoint.pth')
    
    # Extract tone color of target reference speaker
    target_se, audio_name = se_extractor.get_se("{reference_audio_path}", tone_color_converter, target_dir='processed', vad=True)
    
    # Extract tone color of source base speaker (Edge-TTS)
    src_se, src_name = se_extractor.get_se("{base_audio}", tone_color_converter, target_dir='processed', vad=True)
    
    # Convert base audio to target speaker tone color
    tone_color_converter.convert(
        audio_src_path="{base_audio}",
        src_se=src_se,
        tgt_se=target_se,
        output_path="{output_path}"
    )
    print("Tone color conversion complete!")
except Exception as e:
    print(f"OpenVoice conversion failed: {{e}}")
    sys.exit(1)
"""
    
    temp_script = "run_openvoice.py"
    with open(temp_script, "w", encoding="utf-8") as f:
        f.write(inference_script)
        
    logging.info("Running OpenVoice ToneColorConverter...")
    try:
        res = subprocess.run(["python", temp_script], capture_output=True, text=True)
        print(res.stdout)
        if res.returncode != 0:
            logging.error(f"OpenVoice script failed: {res.stderr}")
            raise Exception("OpenVoice conversion script returned non-zero exit code")
    except Exception as e:
        logging.error(f"OpenVoice conversion failed: {e}. Falling back to raw Edge-TTS...")
        shutil.copyfile(base_audio, output_path)
    finally:
        # Cleanup temp scripts and base audio
        if os.path.exists(temp_script):
            try: os.remove(temp_script)
            except: pass
        if os.path.exists(base_audio):
            try: os.remove(base_audio)
            except: pass
            
    return output_path
