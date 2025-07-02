#!/usr/bin/env python3
import os
import sys
import time
import subprocess
import json
import signal
import requests
import threading
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_PORT = int(os.getenv("API_PORT", "8000"))
API_HOST = os.getenv("API_HOST", "0.0.0.0")
NGROK_AUTH_TOKEN = os.getenv("NGROK_AUTH_TOKEN")

def start_ngrok():
    """Start ngrok and return the public URL"""
    print("Starting ngrok tunnel...")
    
    # Check if NGROK_AUTH_TOKEN is set
    if not NGROK_AUTH_TOKEN:
        print("WARNING: NGROK_AUTH_TOKEN not set. Using ngrok without authentication may have limitations.")
    else:
        # Configure ngrok with auth token
        print(f"Configuring ngrok with auth token: {NGROK_AUTH_TOKEN[:5]}...")
        try:
            result = subprocess.run(["ngrok", "config", "add-authtoken", NGROK_AUTH_TOKEN], 
                                  check=True, capture_output=True, text=True)
            print(f"ngrok config result: {result.stdout}")
            if result.stderr:
                print(f"ngrok config error: {result.stderr}")
        except subprocess.CalledProcessError as e:
            print(f"ERROR: Failed to configure ngrok with auth token: {e}")
            print(f"ngrok output: {e.stdout}")
            print(f"ngrok error: {e.stderr}")
    
    # Check if ngrok is installed and available
    try:
        version_result = subprocess.run(["ngrok", "version"], check=True, capture_output=True, text=True)
        print(f"ngrok version: {version_result.stdout.strip()}")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: ngrok command failed: {e}")
        return None
    except FileNotFoundError:
        print("ERROR: ngrok command not found. Is ngrok installed?")
        return None
    
    # Start ngrok in background
    print(f"Starting ngrok http tunnel on {API_HOST}:{API_PORT}...")
    try:
        ngrok_process = subprocess.Popen(
            ["ngrok", "http", f"{API_HOST}:{API_PORT}"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Check if ngrok process is running
        if ngrok_process.poll() is not None:
            print(f"ERROR: ngrok process exited immediately with code {ngrok_process.returncode}")
            stdout, stderr = ngrok_process.communicate()
            print(f"ngrok stdout: {stdout.decode('utf-8')}")
            print(f"ngrok stderr: {stderr.decode('utf-8')}")
            return None
            
        print(f"ngrok process started with PID {ngrok_process.pid}")
    except Exception as e:
        print(f"ERROR: Failed to start ngrok process: {e}")
        return None
    
    # Wait for ngrok to start
    print("Waiting for ngrok to start...")
    time.sleep(10)  # Increased wait time
    
    # Get the public URL from ngrok API
    max_attempts = 10
    for attempt in range(1, max_attempts + 1):
        try:
            print(f"Fetching ngrok tunnel URL from API (attempt {attempt}/{max_attempts})...")
            response = requests.get("http://localhost:4040/api/tunnels", timeout=5)
            
            if response.status_code != 200:
                print(f"ERROR: ngrok API returned status code {response.status_code}")
                time.sleep(2)
                continue
                
            tunnels_data = response.json()
            if "tunnels" not in tunnels_data:
                print(f"ERROR: Unexpected response from ngrok API: {tunnels_data}")
                time.sleep(2)
                continue
                
            tunnels = tunnels_data["tunnels"]
            
            print(f"Found {len(tunnels)} ngrok tunnels")
            
            if not tunnels:
                print("No ngrok tunnels found. Retrying...")
                time.sleep(2)
                continue
                
            # Prefer HTTPS URL
            for tunnel in tunnels:
                if tunnel["proto"] == "https":
                    public_url = tunnel["public_url"]
                    print(f"ngrok tunnel established: {public_url}")
                    
                    # Save URL to file for reference
                    with open("ngrok_url.txt", "w") as f:
                        f.write(public_url)
                        
                    return public_url
                    
            # Fallback to first tunnel if no HTTPS
            public_url = tunnels[0]["public_url"]
            print(f"ngrok tunnel established: {public_url}")
            
            # Save URL to file for reference
            with open("ngrok_url.txt", "w") as f:
                f.write(public_url)
                
            return public_url
                
        except requests.exceptions.ConnectionError:
            print(f"ERROR on attempt {attempt}: Failed to connect to ngrok API. Is ngrok running?")
            # Try to check if ngrok process is still running
            if ngrok_process.poll() is not None:
                print(f"ngrok process exited with code {ngrok_process.returncode}")
                stdout, stderr = ngrok_process.communicate()
                print(f"ngrok stdout: {stdout.decode('utf-8')}")
                print(f"ngrok stderr: {stderr.decode('utf-8')}")
            
            if attempt < max_attempts:
                print(f"Retrying in 2 seconds...")
                time.sleep(2)
            else:
                print("Maximum attempts reached. Continuing without ngrok URL.")
                return None
        except Exception as e:
            print(f"ERROR on attempt {attempt}: Failed to get ngrok URL: {e}")
            if attempt < max_attempts:
                print(f"Retrying in 2 seconds...")
                time.sleep(2)
            else:
                print("Maximum attempts reached. Continuing without ngrok URL.")
                return None

def start_fastapi_server():
    """Start the FastAPI server using uvicorn"""
    print("Starting FastAPI server...")
    print(f"Binding to host: {API_HOST} and port: {API_PORT}")
    
    # Use the same host and port from environment variables
    # Add --reload flag to automatically reload on changes
    cmd = ["uvicorn", "main:app", "--host", API_HOST, "--port", str(API_PORT), "--log-level", "debug"]
    
    print(f"Running command: {' '.join(cmd)}")
    
    # Use subprocess instead of execvp to avoid replacing the current process
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,  # Line buffered
        )
        
        # Create threads to continuously read and print output from uvicorn
        def read_output(stream, prefix):
            for line in stream:
                print(f"{prefix}: {line.strip()}")
                
        stdout_thread = threading.Thread(target=read_output, args=(process.stdout, "UVICORN"))
        stderr_thread = threading.Thread(target=read_output, args=(process.stderr, "UVICORN ERROR"))
        
        stdout_thread.daemon = True
        stderr_thread.daemon = True
        
        stdout_thread.start()
        stderr_thread.start()
        
        # Wait a moment for the server to start
        time.sleep(5)
        
        # Check if the process is still running
        if process.poll() is None:
            print("FastAPI server started successfully")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"ERROR: FastAPI server failed to start with code {process.returncode}")
            print(f"stdout: {stdout}")
            print(f"stderr: {stderr}")
            return None
    except Exception as e:
        print(f"ERROR: Failed to start FastAPI server: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    # Start FastAPI server first
    fastapi_process = start_fastapi_server()
    
    if not fastapi_process:
        print("ERROR: Failed to start FastAPI server. Exiting.")
        return
    
    # Then start ngrok and get the public URL
    ngrok_url = start_ngrok()
    
    if ngrok_url:
        print(f"\n\n=== IMPORTANT ===\nNGROK URL: {ngrok_url}\nPlease manually update your mobile app's API endpoints with this URL\nFile: mobile-app/CareerMentor/constants/ApiEndpoints.ts\n=================\n\n")
    else:
        print("\n\n=== WARNING ===\nFailed to get ngrok URL. The backend will still start, but\nit may not be accessible from outside your local network.\n===============\n\n")
    
    # Keep the script running and monitor the FastAPI process
    try:
        while True:
            # Check if FastAPI is still running
            if fastapi_process.poll() is not None:
                stdout, stderr = fastapi_process.communicate()
                print(f"ERROR: FastAPI server exited unexpectedly with code {fastapi_process.returncode}")
                print(f"stdout: {stdout}")
                print(f"stderr: {stderr}")
                break
            time.sleep(30)
    except KeyboardInterrupt:
        print("\nShutting down services...")
        if fastapi_process and fastapi_process.poll() is None:
            fastapi_process.terminate()
            fastapi_process.wait(timeout=5)
            print("FastAPI server stopped.")
    except Exception as e:
        print(f"Error in main loop: {e}")
        if fastapi_process and fastapi_process.poll() is None:
            fastapi_process.terminate()

if __name__ == "__main__":
    main()
