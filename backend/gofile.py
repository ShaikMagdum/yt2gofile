import os
import time
import httpx
import requests
from typing import Optional, Dict, Any, Callable, List

class ProgressFileReader:
    def __init__(self, filename: str, callback: Optional[Callable[[int, int, float, float], None]] = None):
        self._f = open(filename, "rb")
        self._total = os.path.getsize(filename)
        self._read = 0
        self._callback = callback
        self._start_time = time.time()
        self._last_time = 0.0

    def read(self, size: int = -1) -> bytes:
        chunk = self._f.read(size)
        self._read += len(chunk)
        now = time.time()
        # Fire callback at most every 0.25 seconds or on completion
        if self._callback and (now - self._last_time > 0.25 or self._read >= self._total):
            self._last_time = now
            elapsed = now - self._start_time
            speed = self._read / elapsed if elapsed > 0 else 0
            eta = (self._total - self._read) / speed if speed > 0 else 0
            try:
                self._callback(self._read, self._total, speed, eta)
            except Exception:
                pass
        return chunk

    def __len__(self) -> int:
        return self._total

    def close(self):
        self._f.close()


class GoFileUploader:
    SERVERS_API = "https://api.gofile.io/servers"

    @classmethod
    async def get_servers_data(cls) -> Dict[str, Any]:
        """
        Retrieves live GoFile server list and recommended best server.
        """
        best_server = "store-eu-par-6"
        servers_list: List[Dict[str, str]] = []
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(cls.SERVERS_API)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "ok":
                        raw_servers = data.get("data", {}).get("servers", [])
                        if raw_servers:
                            best_server = raw_servers[0].get("name", "store-eu-par-6")
                            for s in raw_servers:
                                name = s.get("name")
                                zone = s.get("zone", "global")
                                if name and not any(item["name"] == name for item in servers_list):
                                    servers_list.append({"name": name, "zone": zone})
        except Exception:
            pass

        # Fallback list if API fails
        if not servers_list:
            servers_list = [
                {"name": "store-eu-par-6", "zone": "eu"},
                {"name": "store-eu-par-11", "zone": "eu"},
                {"name": "store-eu-par-5", "zone": "eu"},
                {"name": "store-na-phx-4", "zone": "na"},
                {"name": "store-na-phx-3", "zone": "na"},
                {"name": "store3", "zone": "na"},
                {"name": "store4", "zone": "eu"},
            ]

        return {
            "status": "ok",
            "bestServer": best_server,
            "servers": servers_list
        }

    @classmethod
    async def get_best_server(cls) -> str:
        """
        Retrieves the single best available GoFile upload server name.
        """
        data = await cls.get_servers_data()
        return data.get("bestServer", "store-eu-par-6")

    @classmethod
    def clean_server_name(cls, server: Optional[str]) -> str:
        """
        Cleans and normalizes user provided server name (e.g. 'https://store-eu-par-6.gofile.io' -> 'store-eu-par-6').
        """
        if not server:
            return "auto"
        s = server.strip().lower()
        s = s.replace("https://", "").replace("http://", "")
        if ".gofile.io" in s:
            s = s.split(".gofile.io")[0]
        s = s.strip("/\\ ")
        return s if s else "auto"

    @classmethod
    def upload_file_sync(
        cls,
        file_path: str,
        server: Optional[str] = None,
        token: Optional[str] = None,
        folder_id: Optional[str] = None,
        progress_callback: Optional[Callable[[int, int, float, float], None]] = None
    ) -> Dict[str, Any]:
        """
        Synchronously uploads a local file to GoFile with real-time speed/progress streaming.
        Accepts custom GoFile server name or defaults to best server.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        file_size = os.path.getsize(file_path)
        file_name = os.path.basename(file_path)

        # Determine target server
        target_server = cls.clean_server_name(server)
        if not target_server or target_server == "auto":
            # Quick sync fallback to store-eu-par-6 or fetch
            try:
                r = requests.get(cls.SERVERS_API, timeout=5)
                if r.status_code == 200 and r.json().get("status") == "ok":
                    s_list = r.json().get("data", {}).get("servers", [])
                    if s_list:
                        target_server = s_list[0].get("name", "store-eu-par-6")
            except Exception:
                target_server = "store-eu-par-6"

        upload_url = f"https://{target_server}.gofile.io/contents/uploadfile"

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) YT2GoFile-Turbo/2.0"
        }
        if token and token.strip():
            headers["Authorization"] = f"Bearer {token.strip()}"

        data_fields: Dict[str, str] = {}
        if folder_id and folder_id.strip():
            data_fields["folderId"] = folder_id.strip()

        reader = ProgressFileReader(file_path, progress_callback)
        try:
            files = {"file": (file_name, reader, "application/octet-stream")}
            session = requests.Session()
            response = session.post(
                upload_url,
                headers=headers,
                data=data_fields if data_fields else None,
                files=files,
                timeout=900
            )
        finally:
            reader.close()

        if response.status_code != 200:
            raise Exception(f"GoFile upload to [{target_server}] failed with HTTP {response.status_code}: {response.text}")

        res_json = response.json()
        if res_json.get("status") != "ok":
            raise Exception(f"GoFile API Error from [{target_server}]: {res_json.get('message') or response.text}")

        result_data = res_json.get("data", {})
        download_page = result_data.get("downloadPage")
        code = result_data.get("code")

        if not download_page and code:
            download_page = f"https://gofile.io/d/{code}"

        return {
            "status": "success",
            "server": target_server,
            "downloadPage": download_page,
            "code": code,
            "fileId": result_data.get("fileId"),
            "fileName": result_data.get("fileName") or file_name,
            "md5": result_data.get("md5"),
            "fileSize": file_size,
            "parentFolder": result_data.get("parentFolder")
        }
