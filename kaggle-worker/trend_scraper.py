import yt_dlp
import logging
import os
import requests
import time
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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

if __name__ == "__main__":
    test_dir = "./temp_assets"
    os.makedirs(test_dir, exist_ok=True)
    result = download_viral_short("motivational speech", test_dir)
    print("Scraper Result:", result)
