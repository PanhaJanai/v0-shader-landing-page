import os
import sys
import socket
import json
import uuid
import webbrowser
import subprocess
from bottle import route, run, template, request, response, static_file, HTTPResponse

DEFAULT_FOLDER = os.path.abspath(os.path.dirname(__file__))

# Global state to keep track of currently active folder
current_folder = DEFAULT_FOLDER

def choose_folder():
    """Runs a Tkinter folder chooser dialog in a separate subprocess to avoid threading issues."""
    code = """
import tkinter as tk
from tkinter import filedialog
import sys
try:
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    folder = filedialog.askdirectory()
    root.destroy()
    if folder:
        print(folder)
except Exception as e:
    sys.exit(1)
"""
    try:
        result = subprocess.run(
            [sys.executable, '-c', code],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception as e:
        print(f"Subprocess folder picker failed: {e}")
    return ""

def list_images_in_folder(folder):
    """Scans the folder for images, pulling basic metadata (dimensions, sizes) quickly."""
    if not os.path.exists(folder) or not os.path.isdir(folder):
        return []
        
    image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'}
    images = []
    
    try:
        from PIL import Image
    except ImportError:
        Image = None
        
    try:
        for name in os.listdir(folder):
            ext = os.path.splitext(name)[1].lower()
            if ext in image_extensions:
                path = os.path.join(folder, name)
                if os.path.isfile(path):
                    size = os.path.getsize(path)
                    mtime = os.path.getmtime(path)
                    
                    width, height = 0, 0
                    if Image:
                        try:
                            # Using 'with' only parses the header (fast)
                            with Image.open(path) as img:
                                width, height = img.size
                        except:
                            pass
                            
                    images.append({
                        "name": name,
                        "size": size,
                        "mtime": mtime,
                        "width": width,
                        "height": height,
                        "ext": ext[1:]
                    })
    except Exception as e:
        print(f"Error listing files in {folder}: {e}")
        
    # Sort initially by filename
    images.sort(key=lambda x: x["name"])
    return images

# ==========================================
# Bottle Routes
# ==========================================

@route('/')
def index():
    return HTML_CONTENT

@route('/api/images')
def api_images():
    global current_folder
    images = list_images_in_folder(current_folder)
    return {
        "success": True,
        "folder": current_folder,
        "images": images
    }

@route('/api/set-folder', method='POST')
def api_set_folder():
    global current_folder
    try:
        data = json.load(request.body)
        folder = data.get('folder', '').strip()
        if folder:
            folder = os.path.abspath(os.path.normpath(folder))
            if os.path.exists(folder) and os.path.isdir(folder):
                current_folder = folder
                return {
                    "success": True,
                    "folder": current_folder,
                    "images": list_images_in_folder(current_folder)
                }
            else:
                return HTTPResponse(status=400, content_type='application/json', body=json.dumps({
                    "success": False, "message": "Folder path does not exist or is not a directory."
                }))
        return HTTPResponse(status=400, content_type='application/json', body=json.dumps({
            "success": False, "message": "Folder path cannot be empty."
        }))
    except Exception as e:
        return HTTPResponse(status=500, content_type='application/json', body=json.dumps({
            "success": False, "message": f"Error setting folder: {str(e)}"
        }))

@route('/api/select-folder', method='POST')
def api_select_folder():
    folder = choose_folder()
    if folder:
        return {"success": True, "folder": folder}
    return {"success": False, "message": "Folder selection cancelled or failed."}

@route('/api/open-folder', method='POST')
def api_open_folder():
    global current_folder
    try:
        if sys.platform == 'win32':
            os.startfile(current_folder)
        elif sys.platform == 'darwin':
            subprocess.run(['open', current_folder])
        else:
            subprocess.run(['xdg-open', current_folder])
        return {"success": True}
    except Exception as e:
        return HTTPResponse(status=500, content_type='application/json', body=json.dumps({
            "success": False, "message": f"Could not open directory: {str(e)}"
        }))

@route('/api/thumbnail')
def api_thumbnail():
    """Serves a fast 200x200 resized thumbnail to keep browser memory and scrolling smooth."""
    folder = request.query.get('folder')
    filename = request.query.get('file')
    
    if not folder or not filename:
        return HTTPResponse(status=400, body="Missing folder or file parameters")
        
    folder = os.path.abspath(os.path.normpath(folder))
    filepath = os.path.abspath(os.path.normpath(os.path.join(folder, filename)))
    
    # Path traversal protection
    if not filepath.startswith(folder):
        return HTTPResponse(status=403, body="Access denied")
        
    if not os.path.exists(filepath) or not os.path.isfile(filepath):
        return HTTPResponse(status=404, body="File not found")
        
    try:
        from PIL import Image
        import io
        img = Image.open(filepath)
        img.thumbnail((200, 200))
        
        output = io.BytesIO()
        if img.mode in ('RGBA', 'LA') or (img.info.get('transparency') is not None):
            img.save(output, format='PNG')
            response.content_type = 'image/png'
        else:
            img.save(output, format='JPEG', quality=80)
            response.content_type = 'image/jpeg'
        return output.getvalue()
    except Exception as e:
        # Fallback to direct static serve if image resize fails
        return static_file(filename, root=folder)

@route('/api/process', method='POST')
def api_process():
    try:
        data = json.load(request.body)
        folder = data.get('folder', '').strip()
        images_order = data.get('images', [])
        prefix = data.get('prefix', 'image').strip()
        convert_to = data.get('convert_to', 'original').lower()
        keep_original = data.get('keep_original', True)
        quality = int(data.get('quality', 85))
        
        if not folder:
            return HTTPResponse(status=400, content_type='application/json', body=json.dumps({
                "success": False, "message": "Folder path is required."
            }))
            
        folder = os.path.abspath(os.path.normpath(folder))
        if not os.path.exists(folder) or not os.path.isdir(folder):
            return HTTPResponse(status=400, content_type='application/json', body=json.dumps({
                "success": False, "message": "Target folder does not exist."
            }))
            
        try:
            from PIL import Image
        except ImportError:
            return HTTPResponse(status=500, content_type='application/json', body=json.dumps({
                "success": False, "message": "Python Pillow library is not installed."
            }))
            
        # 1. Rename to unique temporary files to prevent collisions during the sort-rename process
        op_id = uuid.uuid4().hex[:8]
        temp_mappings = []
        errors = []
        
        for idx, img_info in enumerate(images_order, start=1):
            filename = img_info.get('name')
            filepath = os.path.abspath(os.path.normpath(os.path.join(folder, filename)))
            
            # Security boundary check
            if not filepath.startswith(folder):
                errors.append(f"Skipped {filename} (path traversal detected)")
                continue
                
            if not os.path.exists(filepath):
                errors.append(f"Skipped {filename} (file does not exist)")
                continue
                
            ext = os.path.splitext(filename)[1].lower()
            temp_filename = f"__temp_process_{op_id}_{idx}{ext}"
            temp_filepath = os.path.join(folder, temp_filename)
            
            try:
                os.rename(filepath, temp_filepath)
                temp_mappings.append((temp_filepath, idx, ext, filename))
            except Exception as e:
                errors.append(f"Failed to temporarily isolate {filename}: {str(e)}")
                
        # 2. Convert and/or rename to final destinations
        processed_count = 0
        for temp_filepath, idx, ext, orig_name in temp_mappings:
            try:
                # Decide target file extension
                target_ext = ext if convert_to == 'original' else f".{convert_to}"
                target_filename = f"{prefix}_{idx}{target_ext}"
                target_filepath = os.path.join(folder, target_filename)
                
                # Check if we should convert format
                if convert_to != 'original':
                    # Perform format conversion
                    img = Image.open(temp_filepath)
                    
                    # Convert color modes for formats like JPEG which don't support alpha channel
                    if convert_to in ('jpg', 'jpeg'):
                        if img.mode in ('RGBA', 'LA'):
                            bg = Image.new('RGB', img.size, (255, 255, 255))
                            bg.paste(img, mask=img.split()[3])
                            img = bg
                        elif img.mode != 'RGB':
                            img = img.convert('RGB')
                    
                    if os.path.exists(target_filepath):
                        os.remove(target_filepath)
                        
                    save_fmt = 'JPEG' if convert_to in ('jpg', 'jpeg') else convert_to.upper()
                    img.save(target_filepath, format=save_fmt, quality=quality)
                    img.close()
                    
                    # If user chose to KEEP the original files, restore the temp back to orig_name
                    if keep_original:
                        # Rename temp back to original
                        original_restore_path = os.path.join(folder, orig_name)
                        # Avoid renaming over itself if it matches the target (safety check)
                        if original_restore_path != target_filepath:
                            if os.path.exists(original_restore_path):
                                os.remove(original_restore_path)
                            os.rename(temp_filepath, original_restore_path)
                        else:
                            # It's the same file, keep it
                            if os.path.exists(temp_filepath):
                                os.remove(temp_filepath)
                    else:
                        # User wants to delete original, remove the temp file
                        if os.path.exists(temp_filepath):
                            os.remove(temp_filepath)
                else:
                    # Pure renaming (no format conversion)
                    if os.path.exists(target_filepath):
                        os.remove(target_filepath)
                    os.rename(temp_filepath, target_filepath)
                    
                processed_count += 1
            except Exception as e:
                errors.append(f"Failed to finalize item {idx} ({orig_name}): {str(e)}")
                # Try to restore the original file if possible
                if os.path.exists(temp_filepath):
                    try:
                        os.rename(temp_filepath, os.path.join(folder, orig_name))
                    except:
                        pass
                        
        # Re-fetch new state
        new_images = list_images_in_folder(folder)
        
        success = len(errors) == 0
        message = f"Successfully processed {processed_count} images."
        if errors:
            message += f" Completed with {len(errors)} error(s)."
            
        return {
            "success": success,
            "message": message,
            "errors": errors,
            "images": new_images
        }
    except Exception as e:
        return HTTPResponse(status=500, content_type='application/json', body=json.dumps({
            "success": False, "message": f"Server process error: {str(e)}"
        }))

# ==========================================
# Frontend HTML template
# ==========================================
HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vivid Image Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #090617 0%, #0d0922 50%, #05030a 100%);
            --glass-bg: rgba(22, 19, 47, 0.45);
            --glass-border: rgba(255, 255, 255, 0.06);
            --text-primary: #f3f4f6;
            --text-muted: #9ca3af;
            --accent-purple: #8b5cf6;
            --accent-purple-glow: rgba(139, 92, 246, 0.3);
            --accent-indigo: #6366f1;
            --accent-indigo-glow: rgba(99, 102, 241, 0.3);
            --accent-emerald: #10b981;
            --accent-rose: #f43f5e;
            --accent-rose-glow: rgba(244, 63, 94, 0.2);
            --sidebar-width: 380px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-gradient);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            overflow: hidden;
        }

        .app-container {
            display: flex;
            width: 100vw;
            height: 100vh;
            position: relative;
        }

        /* Sidebar Styling */
        .sidebar {
            width: var(--sidebar-width);
            background: var(--glass-bg);
            backdrop-filter: blur(24px);
            border-right: 1px solid var(--glass-border);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            overflow-y: auto;
            z-index: 10;
            box-shadow: 10px 0 35px rgba(0, 0, 0, 0.4);
            flex-shrink: 0;
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--accent-purple), var(--accent-indigo));
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1.2rem;
            color: #fff;
            box-shadow: 0 0 20px var(--accent-purple-glow);
        }

        .logo-text {
            font-size: 1.4rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            background: linear-gradient(90deg, #fff, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .section-card {
            background: rgba(255, 255, 255, 0.015);
            border: 1px solid var(--glass-border);
            border-radius: 14px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            transition: border-color 0.3s ease;
        }

        .section-card:hover {
            border-color: rgba(255, 255, 255, 0.1);
        }

        .section-title {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--text-muted);
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .section-title svg {
            width: 16px;
            height: 16px;
            color: var(--accent-purple);
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        label {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .input-row {
            display: flex;
            gap: 8px;
        }

        input[type="text"], select {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #fff;
            padding: 10px 14px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 0.9rem;
            width: 100%;
            transition: all 0.25s ease;
        }

        input[type="text"]:focus, select:focus {
            border-color: var(--accent-purple);
            box-shadow: 0 0 12px var(--accent-purple-glow);
            outline: none;
            background: rgba(0, 0, 0, 0.6);
        }

        .btn {
            background: linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-purple) 100%);
            color: #fff;
            border: none;
            padding: 11px 18px;
            border-radius: 8px;
            font-family: inherit;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px var(--accent-purple-glow);
            filter: brightness(1.15);
        }

        .btn:active {
            transform: translateY(0);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            box-shadow: none;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.09);
            box-shadow: none;
            border-color: rgba(255, 255, 255, 0.18);
        }

        .btn-browse {
            flex-shrink: 0;
            width: 42px;
            padding: 0;
        }

        .checkbox-container {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            font-size: 0.85rem;
            color: var(--text-muted);
            user-select: none;
        }

        .checkbox-container input {
            cursor: pointer;
            accent-color: var(--accent-purple);
            width: 18px;
            height: 18px;
        }

        .range-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .range-container input[type="range"] {
            flex-grow: 1;
            accent-color: var(--accent-purple);
            height: 5px;
            border-radius: 3px;
            background: rgba(255, 255, 255, 0.1);
            outline: none;
        }

        .range-val {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--text-primary);
            width: 35px;
            text-align: right;
        }

        /* Console styling */
        .console-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex-grow: 1;
            min-height: 180px;
        }

        .console-box {
            background: rgba(5, 3, 15, 0.75);
            border: 1px solid var(--glass-border);
            border-radius: 10px;
            padding: 14px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
            overflow-y: auto;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
            color: #34d399;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
        }

        .log-entry {
            line-height: 1.4;
            word-break: break-all;
            white-space: pre-wrap;
        }

        .log-error { color: var(--accent-rose); }
        .log-warn { color: #fbbf24; }
        .log-info { color: #60a5fa; }
        .log-system { color: #a78bfa; }

        /* Main Workspace Section */
        .main-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
            position: relative;
        }

        .header {
            background: rgba(12, 9, 28, 0.4);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--glass-border);
            padding: 20px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 5;
        }

        .folder-badge {
            background: rgba(99, 102, 241, 0.08);
            border: 1px solid rgba(99, 102, 241, 0.18);
            color: #c7d2fe;
            padding: 8px 16px;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 550px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .folder-badge svg {
            color: var(--accent-indigo);
            flex-shrink: 0;
        }

        .search-container {
            position: relative;
            width: 280px;
        }

        .search-input {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 8px 16px 8px 38px;
            color: #fff;
            font-size: 0.85rem;
            outline: none;
            transition: all 0.25s ease;
        }

        .search-input:focus {
            border-color: var(--accent-indigo);
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 12px var(--accent-indigo-glow);
        }

        .search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            pointer-events: none;
            width: 14px;
            height: 14px;
        }

        /* Image List Container */
        .list-container {
            flex-grow: 1;
            padding: 32px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            scrollbar-width: thin;
            scrollbar-color: rgba(139, 92, 246, 0.25) transparent;
        }

        .list-container::-webkit-scrollbar, .console-box::-webkit-scrollbar {
            width: 6px;
        }

        .list-container::-webkit-scrollbar-track, .console-box::-webkit-scrollbar-track {
            background: transparent;
        }

        .list-container::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.2);
            border-radius: 3px;
        }

        .list-container::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.45);
        }

        /* Image Row Card */
        .image-item {
            background: rgba(255, 255, 255, 0.015);
            border: 1px solid var(--glass-border);
            border-radius: 14px;
            padding: 14px 22px;
            display: flex;
            align-items: center;
            gap: 24px;
            transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
            user-select: none;
        }

        .image-item:hover {
            background: rgba(255, 255, 255, 0.035);
            border-color: rgba(255, 255, 255, 0.12);
            box-shadow: 0 6px 22px rgba(0, 0, 0, 0.3);
        }

        .image-item.hidden {
            display: none !important;
        }

        .drag-handle {
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            padding: 10px 4px;
            transition: color 0.2s ease;
            flex-shrink: 0;
        }

        .drag-handle:hover {
            color: var(--accent-purple);
        }

        .drag-handle:active {
            cursor: grabbing;
        }

        .order-badge {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            font-weight: 700;
            flex-shrink: 0;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .thumbnail-container {
            width: 80px;
            height: 80px;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: #020108;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 5px 12px rgba(0,0,0,0.4);
        }

        .thumbnail {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .image-item:hover .thumbnail {
            transform: scale(1.08);
        }

        .file-info {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
        }

        .file-name {
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .file-meta {
            font-size: 0.78rem;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .meta-badge {
            background: rgba(99, 102, 241, 0.08);
            color: #a5b4fc;
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid rgba(99, 102, 241, 0.15);
            text-transform: uppercase;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        /* Rename Flow Layout */
        .rename-flow {
            display: flex;
            align-items: center;
            gap: 14px;
            flex-shrink: 0;
            width: 320px;
            justify-content: flex-end;
            padding-right: 15px;
        }

        .arrow-icon {
            color: var(--accent-indigo);
            display: flex;
            align-items: center;
            animation: pulse-arrow 2s infinite ease-in-out;
        }

        .arrow-icon svg {
            width: 18px;
            height: 18px;
        }

        .preview-name {
            font-weight: 600;
            font-size: 1rem;
            color: #c084fc;
            text-shadow: 0 0 12px rgba(192, 132, 252, 0.3);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px;
            text-align: right;
            direction: rtl; /* Truncate start if too long */
        }

        /* Drag & Drop Classes */
        .drag-ghost {
            opacity: 0.35;
            background: var(--accent-indigo-glow) !important;
            border-color: var(--accent-indigo) !important;
        }

        .drag-chosen {
            background: rgba(255, 255, 255, 0.07);
            border-color: var(--accent-purple);
        }

        /* Animations */
        @keyframes pulse-arrow {
            0%, 100% { transform: translateX(0); opacity: 0.6; }
            50% { transform: translateX(5px); opacity: 1; }
        }

        /* Empty & Welcome states */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
            height: 60%;
            color: var(--text-muted);
            text-align: center;
            padding: 40px;
        }

        .empty-icon {
            width: 72px;
            height: 72px;
            opacity: 0.3;
            color: var(--accent-purple);
        }

        .empty-state h3 {
            font-size: 1.3rem;
            color: var(--text-primary);
            font-weight: 600;
        }

        .empty-state p {
            font-size: 0.9rem;
            max-width: 320px;
            line-height: 1.5;
        }

        /* Toast Notifications */
        .toast-notification {
            position: fixed;
            bottom: 32px;
            right: 32px;
            background: rgba(10, 7, 24, 0.95);
            border: 1px solid var(--accent-purple);
            box-shadow: 0 10px 40px rgba(139, 92, 246, 0.3);
            border-radius: 10px;
            padding: 14px 22px;
            display: flex;
            align-items: center;
            gap: 14px;
            z-index: 100;
            transform: translateY(120px);
            opacity: 0;
            transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: none;
        }

        .toast-notification.show {
            transform: translateY(0);
            opacity: 1;
        }

        .toast-icon {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-weight: bold;
            font-size: 0.75rem;
            flex-shrink: 0;
        }

        .toast-success { border-color: var(--accent-emerald); box-shadow: 0 10px 40px rgba(16, 185, 129, 0.2); }
        .toast-success .toast-icon { background: var(--accent-emerald); }
        .toast-error { border-color: var(--accent-rose); box-shadow: 0 10px 40px rgba(244, 63, 94, 0.2); }
        .toast-error .toast-icon { background: var(--accent-rose); }

        .toast-msg {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--text-primary);
        }

        /* Spinner / Loading Overlay */
        .loading-overlay {
            position: absolute;
            inset: 0;
            background: rgba(6, 4, 18, 0.8);
            backdrop-filter: blur(6px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            z-index: 99;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .loading-overlay.active {
            opacity: 1;
            pointer-events: all;
        }

        .spinner {
            width: 55px;
            height: 55px;
            border: 4px solid rgba(255, 255, 255, 0.08);
            border-top: 4px solid var(--accent-purple);
            border-radius: 50%;
            animation: spin 0.85s linear infinite;
            box-shadow: 0 0 15px var(--accent-purple-glow);
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-text {
            font-weight: 600;
            font-size: 1.15rem;
            color: #fff;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- Loading Overlay -->
        <div class="loading-overlay" id="loading-overlay">
            <div class="spinner"></div>
            <div class="loading-text" id="loading-msg">Processing Images...</div>
        </div>

        <!-- Sidebar Section -->
        <div class="sidebar">
            <div class="logo-container">
                <div class="logo-icon">V</div>
                <div class="logo-text">Vivid Image Studio</div>
            </div>

            <!-- Folder Settings -->
            <div class="section-card">
                <div class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    Source Folder
                </div>
                <div class="form-group">
                    <label for="folder-input">Directory Path</label>
                    <div class="input-row">
                        <input type="text" id="folder-input" placeholder="Paste or browse a folder path..." />
                        <button id="btn-browse" class="btn btn-secondary btn-browse" title="Browse Native Folder">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                        </button>
                        <button id="btn-load" class="btn" title="Refresh/Load Directory">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Sort & Rename Panel -->
            <div class="section-card">
                <div class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                    Sort & Rename
                </div>
                <div class="form-group">
                    <label for="prefix-input">Filename Prefix</label>
                    <input type="text" id="prefix-input" value="image" placeholder="e.g. holiday_trip, photo" />
                </div>
            </div>

            <!-- Convert & Export Options -->
            <div class="section-card">
                <div class="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Format Converter
                </div>
                <div class="form-group">
                    <label for="format-select">Convert Extension To</label>
                    <select id="format-select">
                        <option value="original">Keep Current Format</option>
                        <option value="webp">WebP</option>
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                    </select>
                </div>
                
                <div class="form-group" id="quality-card" style="display: none;">
                    <label for="quality-range">Compression Quality</label>
                    <div class="range-container">
                        <input type="range" id="quality-range" min="10" max="100" value="85" />
                        <span class="range-val" id="quality-val">85%</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="checkbox-container">
                        <input type="checkbox" id="keep-original" checked />
                        Keep original files when converting
                    </label>
                </div>
            </div>

            <!-- Action Button -->
            <button id="btn-process" class="btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Apply Reorder & Conversion
            </button>

            <!-- Console Log -->
            <div class="console-container">
                <label>Operation Console</label>
                <div class="console-box" id="console-box">
                    <div class="log-entry log-system">[system] Ready to manipulate images.</div>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Header Bar -->
            <div class="header">
                <div class="folder-badge" id="active-folder-badge" title="Active directory">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span id="active-folder-text">Loading folder...</span>
                </div>
                
                <div style="display: flex; gap: 12px; align-items: center;">
                    <!-- Search Box -->
                    <div class="search-container">
                        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" class="search-input" id="search-input" placeholder="Filter list by filename..." />
                    </div>
                    
                    <!-- Open Explorer button -->
                    <button id="btn-open-explorer" class="btn btn-secondary" style="padding: 8px 14px; font-size: 0.8rem;" title="Show files in OS explorer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        Open Folder
                    </button>
                </div>
            </div>

            <!-- Interactive List of Images -->
            <div class="list-container" id="image-list">
                <!-- Javascript will populate rows here -->
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <h3>No Images Loaded</h3>
                    <p>Load a directory containing JPEG, PNG, WEBP, or BMP images to begin sorting.</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Banner -->
    <div class="toast-notification" id="toast">
        <div class="toast-icon">✓</div>
        <div class="toast-msg" id="toast-text">Success message goes here.</div>
    </div>

    <script>
        let currentFolder = '';
        let imagesList = [];

        // Elements
        const elFolderInput = document.getElementById('folder-input');
        const elActiveFolderText = document.getElementById('active-folder-text');
        const elImageList = document.getElementById('image-list');
        const elPrefixInput = document.getElementById('prefix-input');
        const elFormatSelect = document.getElementById('format-select');
        const elQualityCard = document.getElementById('quality-card');
        const elQualityRange = document.getElementById('quality-range');
        const elQualityVal = document.getElementById('quality-val');
        const elKeepOriginal = document.getElementById('keep-original');
        const elConsoleBox = document.getElementById('console-box');
        const elSearchInput = document.getElementById('search-input');
        const elLoadingOverlay = document.getElementById('loading-overlay');
        const elLoadingMsg = document.getElementById('loading-msg');
        
        // Buttons
        const btnBrowse = document.getElementById('btn-browse');
        const btnLoad = document.getElementById('btn-load');
        const btnProcess = document.getElementById('btn-process');
        const btnOpenExplorer = document.getElementById('btn-open-explorer');

        // Initialize Sortable on the image list container
        const sortable = new Sortable(elImageList, {
            handle: '.drag-handle',
            animation: 250,
            ghostClass: 'drag-ghost',
            chosenClass: 'drag-chosen',
            onEnd: function() {
                updatePreviews();
                log("Reordered items list.", "info");
            }
        });

        // Log to UI Console
        function log(message, type = "success") {
            const time = new Date().toLocaleTimeString();
            const entry = document.createElement('div');
            entry.className = `log-entry log-${type}`;
            entry.textContent = `[${time}] ${message}`;
            elConsoleBox.appendChild(entry);
            elConsoleBox.scrollTop = elConsoleBox.scrollHeight;
        }

        // Show Toast Notification
        function showToast(message, isSuccess = true) {
            const toast = document.getElementById('toast');
            const toastText = document.getElementById('toast-text');
            const toastIcon = toast.querySelector('.toast-icon');
            
            toast.className = 'toast-notification';
            if (isSuccess) {
                toast.classList.add('toast-success');
                toastIcon.textContent = '✓';
            } else {
                toast.classList.add('toast-error');
                toastIcon.textContent = '✕';
            }
            
            toastText.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        }

        // Set Loading overlay status
        function setLoading(active, text = "Processing Images...") {
            elLoadingMsg.textContent = text;
            if (active) {
                elLoadingOverlay.classList.add('active');
            } else {
                elLoadingOverlay.classList.remove('active');
            }
        }

        // Update previews dynamically
        function updatePreviews() {
            const prefix = elPrefixInput.value.trim() || 'image';
            const targetFormat = elFormatSelect.value;
            const rows = elImageList.querySelectorAll('.image-item');
            
            rows.forEach((row, idx) => {
                const orderNum = idx + 1;
                row.querySelector('.order-badge').textContent = orderNum;
                
                const origExt = row.dataset.ext;
                const newExt = (targetFormat === 'original') ? origExt : targetFormat;
                
                row.querySelector('.preview-name').textContent = `${prefix}_${orderNum}.${newExt}`;
            });
        }

        // Format File size nicely
        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Render List of Images in UI
        function renderImages(images) {
            elImageList.innerHTML = '';
            imagesList = images;
            
            if (images.length === 0) {
                elImageList.innerHTML = `
                    <div class="empty-state">
                        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <h3>No Images Found</h3>
                        <p>No compatible images (.jpg, .png, .webp, .gif, .bmp) were found in this directory.</p>
                    </div>
                `;
                return;
            }

            images.forEach((img, idx) => {
                const orderNum = idx + 1;
                const row = document.createElement('div');
                row.className = 'image-item';
                row.dataset.name = img.name;
                row.dataset.ext = img.ext;
                
                // Construct parameters for dynamic thumbnail endpoint
                const thumbnailSrc = `/api/thumbnail?folder=${encodeURIComponent(currentFolder)}&file=${encodeURIComponent(img.name)}`;
                const sizeStr = formatBytes(img.size);
                const dimStr = (img.width && img.height) ? `${img.width}x${img.height}` : 'Unknown dim';
                
                row.innerHTML = `
                    <div class="drag-handle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                    </div>
                    <div class="order-badge">${orderNum}</div>
                    <div class="thumbnail-container">
                        <img src="${thumbnailSrc}" class="thumbnail" alt="thumbnail" loading="lazy" />
                    </div>
                    <div class="file-info">
                        <div class="file-name" title="${img.name}">${img.name}</div>
                        <div class="file-meta">
                            <span class="meta-badge">${img.ext}</span>
                            <span>${sizeStr}</span>
                            <span>•</span>
                            <span>${dimStr}</span>
                        </div>
                    </div>
                    <div class="rename-flow">
                        <div class="arrow-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </div>
                        <div class="preview-name">Loading...</div>
                    </div>
                `;
                
                elImageList.appendChild(row);
            });
            
            updatePreviews();
        }

        // Fetch directory details
        async function fetchImages() {
            setLoading(true, "Listing image directory...");
            try {
                const response = await fetch('/api/images');
                const result = await response.json();
                
                if (result.success) {
                    currentFolder = result.folder;
                    elFolderInput.value = currentFolder;
                    elActiveFolderText.textContent = currentFolder;
                    renderImages(result.images);
                    log(`Loaded ${result.images.length} images from folder.`, "info");
                } else {
                    log(result.message || "Failed to load directory details", "error");
                    showToast(result.message || "Error loading images.", false);
                }
            } catch (err) {
                log(`HTTP fetch failure: ${err.message}`, "error");
                showToast("Connection to Python server failed.", false);
            } finally {
                setLoading(false);
            }
        }

        // Set manually specified folder
        async function setFolder(folderPath) {
            if (!folderPath.trim()) return;
            setLoading(true, "Verifying folder path...");
            try {
                const response = await fetch('/api/set-folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folder: folderPath })
                });
                const result = await response.json();
                
                if (result.success) {
                    currentFolder = result.folder;
                    elFolderInput.value = currentFolder;
                    elActiveFolderText.textContent = currentFolder;
                    renderImages(result.images);
                    log(`Changed folder workspace to: ${currentFolder}`, "system");
                    showToast("Workspace updated successfully!");
                } else {
                    log(result.message, "error");
                    showToast(result.message, false);
                }
            } catch (err) {
                log(`Failed to update workspace folder: ${err.message}`, "error");
                showToast("Failed to verify folder path.", false);
            } finally {
                setLoading(false);
            }
        }

        // Browse native folder dialog
        async function browseFolder() {
            log("Opening native file dialog in background...", "info");
            try {
                const response = await fetch('/api/select-folder', { method: 'POST' });
                const result = await response.json();
                
                if (result.success && result.folder) {
                    setFolder(result.folder);
                } else if (result.message) {
                    log(`Browse cancelled or failed: ${result.message}`, "warn");
                }
            } catch (err) {
                log(`Folder selector process error: ${err.message}`, "error");
                showToast("Dialog opener process failed.", false);
            }
        }

        // Process images (Sorting, Renaming, Converting)
        async function processImages() {
            const rows = elImageList.querySelectorAll('.image-item');
            if (rows.length === 0) {
                showToast("No images to process.", false);
                return;
            }

            const imagesOrder = [];
            rows.forEach(row => {
                imagesOrder.push({ name: row.dataset.name });
            });

            const payload = {
                folder: currentFolder,
                images: imagesOrder,
                prefix: elPrefixInput.value.trim() || 'image',
                convert_to: elFormatSelect.value,
                keep_original: elKeepOriginal.checked,
                quality: parseInt(elQualityRange.value)
            };

            setLoading(true, `Processing ${imagesOrder.length} files...`);
            log(`Starting reorder and convert task (format: ${payload.convert_to})...`, "system");

            try {
                const response = await fetch('/api/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (result.success) {
                    log(result.message, "success");
                    showToast("Images sorted & updated successfully!");
                    renderImages(result.images);
                } else {
                    log(result.message || "Errors occurred.", "error");
                    if (result.errors && result.errors.length) {
                        result.errors.forEach(err => log(err, "error"));
                    }
                    showToast("Process complete, but errors occurred.", false);
                    renderImages(result.images);
                }
            } catch (err) {
                log(`Process post failed: ${err.message}`, "error");
                showToast("Server connection error during processing.", false);
            } finally {
                setLoading(false);
            }
        }

        // Open in OS File Explorer
        async function openFolderInExplorer() {
            try {
                const response = await fetch('/api/open-folder', { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                    log("Opened folder in system explorer.", "info");
                } else {
                    log(`Failed to open explorer: ${result.message}`, "error");
                }
            } catch(e) {
                log(`Failed to open explorer: ${e.message}`, "error");
            }
        }

        // Event Listeners
        btnBrowse.addEventListener('click', browseFolder);
        btnLoad.addEventListener('click', () => setFolder(elFolderInput.value));
        btnProcess.addEventListener('click', processImages);
        btnOpenExplorer.addEventListener('click', openFolderInExplorer);
        
        elFolderInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') setFolder(elFolderInput.value);
        });

        elPrefixInput.addEventListener('input', updatePreviews);
        
        elFormatSelect.addEventListener('change', (e) => {
            if (e.target.value === 'webp' || e.target.value === 'jpg') {
                elQualityCard.style.display = 'flex';
            } else {
                elQualityCard.style.display = 'none';
            }
            updatePreviews();
        });

        elQualityRange.addEventListener('input', (e) => {
            elQualityVal.textContent = `${e.target.value}%`;
        });

        // Search filtering logic
        elSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const items = elImageList.querySelectorAll('.image-item');
            
            items.forEach(item => {
                const name = item.dataset.name.toLowerCase();
                if (name.includes(query)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });

        // Load current folder on startup
        window.addEventListener('DOMContentLoaded', fetchImages);
    </script>
</body>
</html>
"""

# ==========================================
# Application Runner
# ==========================================

def find_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('localhost', 0))
    port = s.getsockname()[1]
    s.close()
    return port

if __name__ == '__main__':
    print(f"Starting Vivid Image Studio Server...")
    print(f"Targeting workspace folder: {current_folder}")
    
    port = find_free_port()
    local_url = f"http://localhost:{port}/"
    
    # Auto-open browser window
    try:
        webbrowser.open(local_url)
    except Exception as e:
        print(f"Failed to automatically open browser: {e}")
        
    print(f"Server is running at: {local_url}")
    print("Press Ctrl+C in this terminal window to stop the server.")
    
    try:
        # Run server quietly (suppressing most bottle output to keep terminal clean)
        run(host='localhost', port=port, quiet=True)
    except KeyboardInterrupt:
        print("\nStopping Vivid Image Studio Server. Goodbye!")
