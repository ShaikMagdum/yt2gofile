import os
import httpx
from typing import Optional, Dict, Any, Callable

class GoFileUploader:
    SERVERS_API = "https://api.gofile.io/servers"

    @classmethod
    async def get_best_server(cls) -> str:
        """
        Retrieves the best available GoFile upload server.
        Falls back to 'store3' or 'store1' if the endpoint fails.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(cls.SERVERS_API)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "ok":
                        servers = data.get("data", {}).get("servers", [])
                        if servers and len(servers) > 0:
                            return servers[0].get("name", "store3")
        except Exception:
            pass
        return "store3"

    @classmethod
    async def upload_file(
        cls,
        file_path: str,
        token: Optional[str] = None,
        folder_id: Optional[str] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None
    ) -> Dict[str, Any]:
        """
        Uploads a local file to GoFile.
        Supports optional account token and target folder ID.
        Returns GoFile file metadata including downloadPage URL.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        file_size = os.path.getsize(file_path)
        file_name = os.path.basename(file_path)
        server = await cls.get_best_server()
        upload_url = f"https://{server}.gofile.io/contents/uploadfile"

        headers = {}
        if token and token.strip():
            headers["Authorization"] = f"Bearer {token.strip()}"

        data_fields: Dict[str, str] = {}
        if folder_id and folder_id.strip():
            data_fields["folderId"] = folder_id.strip()

        # Upload file with chunked streaming
        async with httpx.AsyncClient(timeout=600.0) as client:
            with open(file_path, "rb") as f:
                files = {"file": (file_name, f, "application/octet-stream")}
                response = await client.post(
                    upload_url,
                    headers=headers,
                    data=data_fields if data_fields else None,
                    files=files
                )

        if response.status_code != 200:
            raise Exception(f"GoFile upload failed with status HTTP {response.status_code}: {response.text}")

        res_json = response.json()
        if res_json.get("status") != "ok":
            raise Exception(f"GoFile API Error: {res_json.get('message') or response.text}")

        result_data = res_json.get("data", {})
        download_page = result_data.get("downloadPage")
        code = result_data.get("code")

        # Guarantee download page URL format
        if not download_page and code:
            download_page = f"https://gofile.io/d/{code}"

        return {
            "status": "success",
            "server": server,
            "downloadPage": download_page,
            "code": code,
            "fileId": result_data.get("fileId"),
            "fileName": result_data.get("fileName") or file_name,
            "md5": result_data.get("md5"),
            "fileSize": file_size,
            "parentFolder": result_data.get("parentFolder")
        }
