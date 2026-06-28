import yt_dlp
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def download_viral_short(keyword, temp_dir):
    """
    Searches YouTube for Shorts matching the keyword, sorts by view count,
    and downloads the most viral one under 60 seconds.
    """
    logging.info(f"Searching for viral Shorts using keyword: {keyword}")
    
    ydl_opts_search = {
        'extract_flat': True,
        'quiet': True,
        'no_warnings': True
    }
    
    # Search for top 20 results matching the keyword + #shorts
    search_query = f"ytsearch20:{keyword} #shorts"
    
    best_video = None
    
    with yt_dlp.YoutubeDL(ydl_opts_search) as ydl:
        info = ydl.extract_info(search_query, download=False)
        if 'entries' in info and info['entries']:
            # We must filter for videos under 60 seconds (Shorts)
            valid_entries = []
            for entry in info['entries']:
                # extract_flat might not have full duration/view_count for all Extractors, 
                # but YouTube usually provides them.
                duration = entry.get('duration')
                if duration is not None and duration <= 60:
                    valid_entries.append(entry)
                    
            if valid_entries:
                # Sort by view count to find the most viral
                best_video = sorted(valid_entries, key=lambda x: x.get('view_count', 0), reverse=True)[0]
            else:
                logging.warning("No shorts found under 60 seconds in the search results.")
                return None
        else:
            logging.warning("No search results found.")
            return None
            
    if not best_video:
        return None
        
    video_url = best_video['url']
    video_title = best_video.get('title', 'viral_short')
    logging.info(f"Found viral short: '{video_title}' with {best_video.get('view_count', 'unknown')} views.")
    
    output_path = os.path.join(temp_dir, "viral_short.mp4")
    
    ydl_opts_download = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_path,
        'noplaylist': True,
        'quiet': False
    }
    
    logging.info(f"Downloading to {output_path}...")
    with yt_dlp.YoutubeDL(ydl_opts_download) as ydl:
        ydl.download([video_url])
        
    if os.path.exists(output_path):
        logging.info("Download complete.")
        # Return a dictionary with metadata and file path
        return {
            'filepath': output_path,
            'title': video_title,
            'url': video_url,
            'view_count': best_video.get('view_count', 0),
            'description': best_video.get('description', '')
        }
    else:
        logging.error("Download failed or file not found.")
        return None

if __name__ == "__main__":
    # Test execution
    test_dir = "./temp_assets"
    os.makedirs(test_dir, exist_ok=True)
    result = download_viral_short("motivational speech", test_dir)
    print("Scraper Result:", result)
