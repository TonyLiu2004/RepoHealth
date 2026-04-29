import os
import requests
import asyncio
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from utils import get_all_files, get_github_file_content, get_links, check_link_status, is_relevant_link

load_dotenv()

app = FastAPI(title="RepoHealth API")

CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

TARGET_EXTENSIONS = (
    # Documentation & Text
    '.md', '.txt', '.html', '.rst', '.pdf', '.org',
    
    # JavaScript / TypeScript (Frontend & Node)
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    
    # Python
    '.py', '.ipynb',
    
    # Java / Kotlin / Android
    '.java', '.kt', '.kts',
    
    # Swift / Objective-C (iOS)
    '.swift', '.m', '.h',
    
    # C-Family
    '.c', '.cpp', '.cc', '.hpp',
    
    # Ruby / PHP / Go / Rust
    '.rb', '.php', '.go', '.rs',
    
    # Config & Metadata (Crucial for project health)
    '.json', '.yaml', '.yml', '.toml', '.xml', '.gradle'
)

EXCLUDE_FILES = (
    'package-lock.json', 
    'yarn.lock', 
    'pnpm-lock.yaml', 
    'composer.lock', 
    'cargo.lock', 
    'go.sum'
)

LINK_EXCLUDE_PATTERNS = {
    "/tree/", "/blob/", "/commit/", "/pull/", "/issues/",  # GitHub Internal Nav
    "localhost", "127.0.0.1", "0.0.0.0",                  # Local Dev
    "mailto:", "tel:", "sms:",                            # Non-HTTP protocols
    "javascript:", "anchor",                              # Scripts/Stubs
}

TARGET_FILES = (
    'package.json', 
    'CONTRIBUTING', 
    'LICENSE'
)

# Stores the token in memory for this session
# Use a database later
user_storage = {}

@app.get("/")
def read_root():
    return {"message": "GitHub Health Checker", "login_url": "/login"}

@app.get("/login")
async def login():
    # Redirect user to GitHub OAuth
    return RedirectResponse(f"https://github.com/login/oauth/authorize?client_id={CLIENT_ID}")


@app.get("/callback")
async def callback(code: str):
    # Exchange code for token
    res = requests.post(
        "https://github.com/login/oauth/access_token",
        data={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "code": code},
        headers={"Accept": "application/json"}
    )
    token_data = res.json()
    access_token = token_data.get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to retrieve access token")

    user_storage['token'] = access_token
    return {"message": "Successfully logged in!", "access_token": access_token}


@app.get("/analyze")
async def analyze(repo: str = Query(..., description="The full GitHub URL to analyze")):
    """
    1. file pre-filtering
    2. link extraction using urlextract
    3. link filtering
    """
    token = user_storage.get('token')
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated. Please go to /login")

    try:
        all_files = await get_all_files(repo, token)
        
        #only fetch files with certain extensions or in TARGET FILES, filter by EXCLUDE_FILES 
        to_fetch = []
        for file in all_files:
            filename = os.path.basename(file)
            
            if file in EXCLUDE_FILES or filename in EXCLUDE_FILES:
                continue

            if file.endswith(TARGET_EXTENSIONS) or filename in TARGET_FILES:
                to_fetch.append(file)

        # Get file contents from github
        tasks = [get_github_file_content(repo, file, token) for file in to_fetch]
        contents = await asyncio.gather(*tasks)

        # Get and filter links
        file_to_links = {}
        unique_links = set()
        for file, text in zip(to_fetch, contents):
            links = get_links(text)
            filtered_links = [link for link in links if is_relevant_link(link, repo, LINK_EXCLUDE_PATTERNS)]
            if filtered_links:
                file_to_links[file] = filtered_links
                unique_links.update(filtered_links)

        # Check link status for every link
        link_tasks = [check_link_status(url, 10) for url in unique_links]
        statuses = await asyncio.gather(*link_tasks)

        link_statuses = {}
        active_links = 0
        for res in statuses:
            link = res['link']
            status_info = {
                "status": res.get("status"),
                "active": res.get("active")
            }
            if res.get('active') == True:
                active_links+=1

            if "error" in res:
                status_info["error"] = res["error"]
            if "note" in res:
                status_info['note'] = res['note']

            link_statuses[link] = status_info

        # Organize into results
        results = {}
        for file, links in file_to_links.items():
            results[file] = {url: link_statuses[url] for url in links}

        print(f"successfully analyzed repo {repo}, scanned {len(to_fetch)} files, ({active_links}/{len(unique_links)} active links.)")

        return {
            "repo": repo,
            "health_status": "Scanned",
            "file_analysis": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/repos")
async def get_user_repos():
    token = user_storage.get('token')
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    res = requests.get(
        "https://api.github.com/user/repos?sort=updated",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"}
    )
    return res.json()

    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)