from __future__ import annotations

import io
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from core.file_security import (  # noqa: E402
    FileSecurityError,
    UploadTooLargeError,
    safe_extract_zip,
    save_upload_limited,
)


class FakeUpload:
    def __init__(self, content: bytes, chunk_size: int = 4):
        self._stream = io.BytesIO(content)
        self._chunk_size = chunk_size

    async def read(self, _requested_size: int) -> bytes:
        return self._stream.read(self._chunk_size)


class SafeExtractZipTests(unittest.TestCase):
    def _create_zip(self, root: Path, members: dict[str, bytes]) -> Path:
        archive_path = root / "entrada.zip"
        with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, content in members.items():
                archive.writestr(name, content)
        return archive_path

    def test_extracts_valid_archive(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive_path = self._create_zip(
                root,
                {
                    "parcelas/finca.shp": b"shape",
                    "parcelas/finca.dbf": b"database",
                },
            )
            destination = root / "extraido"

            extracted = safe_extract_zip(str(archive_path), str(destination))

            self.assertEqual(len(extracted), 2)
            self.assertEqual(
                (destination / "parcelas" / "finca.shp").read_bytes(),
                b"shape",
            )

    def test_rejects_parent_directory_traversal(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive_path = self._create_zip(root, {"../escape.txt": b"peligro"})
            destination = root / "extraido"

            with self.assertRaises(FileSecurityError):
                safe_extract_zip(str(archive_path), str(destination))

            self.assertFalse((root / "escape.txt").exists())

    def test_rejects_windows_directory_traversal(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive_path = self._create_zip(root, {"..\\escape.txt": b"peligro"})

            with self.assertRaises(FileSecurityError):
                safe_extract_zip(str(archive_path), str(root / "extraido"))

    def test_rejects_too_many_members(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive_path = self._create_zip(
                root,
                {"uno.txt": b"1", "dos.txt": b"2"},
            )

            with self.assertRaises(FileSecurityError):
                safe_extract_zip(
                    str(archive_path),
                    str(root / "extraido"),
                    max_members=1,
                )

    def test_rejects_excessive_uncompressed_size(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive_path = self._create_zip(root, {"grande.txt": b"x" * 100})

            with self.assertRaises(FileSecurityError):
                safe_extract_zip(
                    str(archive_path),
                    str(root / "extraido"),
                    max_uncompressed_bytes=50,
                )

    def test_rejects_suspicious_compression_ratio(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive_path = self._create_zip(root, {"bomba.txt": b"A" * 10_000})

            with self.assertRaises(FileSecurityError):
                safe_extract_zip(
                    str(archive_path),
                    str(root / "extraido"),
                    max_compression_ratio=2,
                )


class UploadLimitTests(unittest.IsolatedAsyncioTestCase):
    async def test_saves_upload_in_chunks(self):
        output = io.BytesIO()

        total = await save_upload_limited(
            FakeUpload(b"contenido"),
            output,
            max_bytes=20,
        )

        self.assertEqual(total, 9)
        self.assertEqual(output.getvalue(), b"contenido")

    async def test_rejects_oversized_upload(self):
        with self.assertRaises(UploadTooLargeError):
            await save_upload_limited(
                FakeUpload(b"demasiado-grande"),
                io.BytesIO(),
                max_bytes=5,
            )

    async def test_rejects_empty_upload(self):
        with self.assertRaises(FileSecurityError):
            await save_upload_limited(
                FakeUpload(b""),
                io.BytesIO(),
                max_bytes=5,
            )


if __name__ == "__main__":
    unittest.main()
