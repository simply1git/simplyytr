import os
import logging
import subprocess
import shutil

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def setup_sadtalker():
    """Clones SadTalker and downloads checkpoints if not present."""
    if not os.path.exists("SadTalker"):
        logging.info("Setting up SadTalker...")
        subprocess.run(["git", "clone", "https://github.com/OpenTalker/SadTalker.git"], check=True)
        
        # Download models
        os.chdir("SadTalker")
        logging.info("Downloading SadTalker models...")
        # Simulating model download or running their shell script
        # On windows this requires bash, on Kaggle we can run sh
        if os.environ.get("KAGGLE_KERNEL_RUN_TYPE"):
            subprocess.run(["sh", "scripts/download_models.sh"], check=True)
        os.chdir("..")
        logging.info("SadTalker setup complete.")

def generate_avatar(image_path, audio_path, output_path):
    """
    Takes a static image and an audio file, and generates a lip-synced video.
    """
    setup_sadtalker()
    logging.info(f"Generating Avatar video from {image_path} and {audio_path}...")
    
    # We call the SadTalker inference script
    # python inference.py --driven_audio <audio> --source_image <image> --enhancer gfpgan
    
    sadtalker_dir = os.path.abspath("SadTalker")
    inference_script = os.path.join(sadtalker_dir, "inference.py")
    
    # For now, to prevent huge downloads on local testing, we mock it.
    # On actual Kaggle, this will be executed.
    is_kaggle = os.environ.get("KAGGLE_KERNEL_RUN_TYPE") is not None
    
    if is_kaggle:
        cmd = [
            "python", inference_script,
            "--driven_audio", os.path.abspath(audio_path),
            "--source_image", os.path.abspath(image_path),
            "--result_dir", os.path.abspath(os.path.dirname(output_path)),
            "--still",
            "--preprocess", "crop",
            "--enhancer", "gfpgan"
        ]
        logging.info(f"Running SadTalker: {' '.join(cmd)}")
        subprocess.run(cmd, cwd=sadtalker_dir, check=True)
        
        # SadTalker saves the result with a generated name in result_dir
        # We need to find the latest mp4 in that dir and rename it to output_path
        res_dir = os.path.abspath(os.path.dirname(output_path))
        mp4s = [f for f in os.listdir(res_dir) if f.endswith('.mp4')]
        if mp4s:
            latest = max(mp4s, key=lambda f: os.path.getctime(os.path.join(res_dir, f)))
            shutil.move(os.path.join(res_dir, latest), output_path)
    else:
        logging.info("Local environment detected. Mocking avatar generation...")
        # Create a blank video with the audio for testing
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=512x512:d=5",
            "-i", audio_path, "-c:v", "libx264", "-c:a", "aac", "-shortest", output_path
        ]
        subprocess.run(cmd, check=True)
        
    logging.info(f"Avatar saved to {output_path}")
    return output_path
