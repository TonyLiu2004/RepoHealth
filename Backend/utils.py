import requests
import asyncio
import httpx
from urlextract import URLExtract
from playwright.async_api import async_playwright

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

browser_semaphore = asyncio.Semaphore(3)

async def get_all_files(repo_url, access_token):
    parts = repo_url.rstrip('/').split('/')
    owner, repo = parts[-2], parts[-1]
    
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient() as client:
        repo_info = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers=headers
        )
        repo_info.raise_for_status()
        default_branch = repo_info.json()["default_branch"]

        url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
        
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return [
            item['path'] for item in data['tree'] 
            if item['type'] == 'blob'
        ]

async def get_github_file_content(repo_url, file_path, access_token):
    parts = repo_url.rstrip('/').split('/')
    owner, repo = parts[-2], parts[-1]
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
    
    headers = {
        "Accept": "application/vnd.github.v3.raw", 
        "Authorization": f"token {access_token}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.text

def get_links(text):
    extractor = URLExtract()
    links = extractor.find_urls(text)
    return list(set(link for link in links if link.startswith(('http://', 'https://'))))

async def check_with_browser(link: str):
    # limit to 3 at a time
    async with browser_semaphore:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            context = await browser.new_context(
                user_agent=HEADERS["User-Agent"],
                viewport={'width': 1280, 'height': 720}
            )
            page = await context.new_page()
            
            try:
                response = await page.goto(link, wait_until="load")
                status = response.status if response else 404
                
                # check for soft 404s (text on page)
                content = await page.content()
                soup_text = content.lower()
                soft_404_terms = ["page not found", "404 error", "this page doesn't exist"]
                is_soft_404 = any(term in soup_text for term in soft_404_terms)

                active = (200 <= status < 400 or status in [401, 403]) and not is_soft_404
                
                return {
                    "link": link,
                    "status": f"Browser:{status}",
                    "active": active,
                    "note": "Verified with Playwright"
                }
            except Exception as e:
                print(link, e)
                return {"link": link, "status": "Browser Error", "active": False, "error": str(e)}
            finally:
                await browser.close()
            
async def check_link_status(link: str, timeout: int):
    """Returns the status code of a link, or an error message."""
    try:
        if "localhost" in link or "127.0.0.1" in link:
            return {
                "link": link, 
                "status": "Internal", 
                "active": True
            }
        
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=timeout) as client:
            # head is more efficient
            response = await client.get(link)
            
            if 200 <= response.status_code < 400:
                return {
                    "link": link,
                    "status": response.status_code,
                    "active": True
                }
            elif response.status_code in [400, 401, 403, 405, 503]:
                print(f"checking {link} with browser")
                return await check_with_browser(link)

            return {"link": link, "status": response.status_code, "active": False}
            
    except Exception as e:
        return {
            "link": link, 
            "status": "Error", 
            "active": False, 
            "error": str(e)
        }
    

def is_relevant_link(link, repo_url, FILTER):
    link_lower = link.lower()
    # Must be a web link
    if not link_lower.startswith(('http://', 'https://')):
        return False
    
    if any(pattern in link_lower for pattern in FILTER):
        return False

    # Exclude template URLs
    if '{' in link or '}' in link or '[' in link or ']' in link:
        return False
    
    # Exclude Localhost
    if any(noise in link_lower for noise in ["localhost", "127.0.0.1", "0.0.0.0"]):
        return False
    
    # Exclude links to the repo itself
    if link_lower.rstrip('/') == repo_url.lower().rstrip('/'):
        return False
        
    return True