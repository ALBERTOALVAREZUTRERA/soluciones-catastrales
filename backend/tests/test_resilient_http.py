import io
import unittest
import urllib.error
import urllib.request

from core.resilient_http import open_url_with_retry


class _Response(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()


class ResilientHttpTests(unittest.TestCase):
    def test_retries_transient_get_once(self):
        calls = []
        delays = []

        def opener(*_args, **_kwargs):
            calls.append(True)
            if len(calls) == 1:
                raise urllib.error.URLError("temporal")
            return _Response(b"ok")

        request = urllib.request.Request("https://example.test/data")
        with open_url_with_retry(
            request,
            context=None,
            timeout=1,
            service="test",
            opener=opener,
            sleeper=delays.append,
        ) as response:
            self.assertEqual(response.read(), b"ok")

        self.assertEqual(len(calls), 2)
        self.assertEqual(delays, [0.2])

    def test_does_not_retry_non_transient_http_error(self):
        calls = []

        def opener(request, **_kwargs):
            calls.append(True)
            raise urllib.error.HTTPError(
                request.full_url,
                404,
                "Not found",
                {},
                None,
            )

        with self.assertRaises(urllib.error.HTTPError):
            open_url_with_retry(
                urllib.request.Request("https://example.test/missing"),
                context=None,
                timeout=1,
                service="test",
                opener=opener,
                sleeper=lambda _delay: None,
            )

        self.assertEqual(len(calls), 1)

    def test_rejects_non_idempotent_requests(self):
        request = urllib.request.Request(
            "https://example.test/send",
            data=b"payload",
            method="POST",
        )
        with self.assertRaises(ValueError):
            open_url_with_retry(
                request,
                context=None,
                timeout=1,
                service="test",
            )


if __name__ == "__main__":
    unittest.main()
