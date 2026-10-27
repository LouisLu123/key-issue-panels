#!/usr/bin/env python3
"""Validate local resources and simulate Pages root/project publishing, without dependencies."""
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import ProxyHandler, build_opener
import argparse
import json
import re
import shutil
import tempfile
import threading

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ('index.html', 'style.css', 'navy.css', 'app.js', '.nojekyll', 'assets')

class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids, self.references = [], []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('src', 'href', 'poster'):
            if key in attrs:
                self.references.append(('index.html', attrs[key]))
        if 'srcset' in attrs:
            self.references.extend(('index.html', item.strip().split()[0])
                                   for item in attrs['srcset'].split(','))
        if tag == 'base':
            raise AssertionError('Do not set a root-dependent <base> URL.')


def exact_file(path):
    # Case-sensitive verification also works when the local filesystem is insensitive.
    current = ROOT
    for part in path.parts:
        assert part not in ('..', ''), f'Invalid resource path: {path}'
        assert part in {p.name for p in current.iterdir()}, f'Missing/case-mismatched: {path}'
        current /= part
    assert current.is_file(), f'Not a file: {path}'


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def check_http(resources, anchors):
    results = []
    opener = build_opener(ProxyHandler({}))
    with tempfile.TemporaryDirectory(prefix='pages-check-') as temp:
        parent = Path(temp)
        project = parent / 'project-preview'
        project.mkdir()
        for name in PUBLIC:
            source = ROOT / name
            if source.is_dir():
                shutil.copytree(source, project / name)
            else:
                shutil.copy2(source, project / name)
        # A standard static server: no SPA rewrites and no missing-resource fallback.
        for directory, prefix in ((project, '/'), (parent, '/project-preview/')):
            server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(directory)))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f'http://127.0.0.1:{server.server_port}{prefix}'
            try:
                for resource in sorted(resources | {'index.html'}):
                    with opener.open(urljoin(base, resource), timeout=5) as response:
                        assert response.status == 200
                        content = response.read()
                        assert content == (ROOT / resource).read_bytes(), resource
                for anchor in anchors:
                    # Reloading a hash URL requests the same index.html from the host.
                    with opener.open(base + '#' + anchor, timeout=5) as response:
                        assert response.status == 200
                        assert response.read() == (ROOT / 'index.html').read_bytes()
                results.append({'prefix': prefix, 'resource_requests': len(resources | {'index.html'}),
                                'hash_refreshes': len(anchors), 'status': 'passed'})
            finally:
                server.shutdown()
                server.server_close()
                thread.join()
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--http', action='store_true', help='Also check root and repository-prefix HTTP serving.')
    args = parser.parse_args()
    assert (ROOT / 'index.html').is_file(), 'Missing root index.html'
    html = (ROOT / 'index.html').read_text()
    doc = Document(html)
    assert len(doc.ids) == len(set(doc.ids)), 'Duplicate HTML IDs'
    references = doc.references
    for name in ('style.css', 'navy.css'):
        css = (ROOT / name).read_text()
        references.extend((name, ref.strip(' \"\'')) for ref in re.findall(r'url\(([^)]+)\)', css))
    js = (ROOT / 'app.js').read_text()
    references.extend(('index.html', ref) for ref in re.findall(r'fetch\(\s*[\"\']([^\"\']+)[\"\']', js))
    for name in ('index.html', 'style.css', 'navy.css', 'app.js'):
        text = (ROOT / name).read_text()
        assert not re.search(r'(?:file://|/Users/|/home/|localhost|127\.0\.0\.1|[A-Z]:\\)', text), name
    assert not re.search(r'\b(?:pushState|replaceState)\s*\(', js), 'Review server routing for History API navigation.'
    resources, external, anchors = set(), set(), set()
    for owner, reference in references:
        parsed = urlsplit(reference)
        if parsed.scheme or parsed.netloc:
            if parsed.scheme not in ('data', 'mailto', 'tel'):
                external.add(reference)
            continue
        assert not parsed.path.startswith('/'), f'Root-absolute URL: {reference}'
        if parsed.path:
            target = Path(owner).parent / unquote(parsed.path)
            exact_file(target)
            resources.add(target.as_posix())
        elif parsed.fragment:
            assert unquote(parsed.fragment) in doc.ids, f'Missing anchor: {reference}'
            anchors.add(parsed.fragment)
    json.loads((ROOT / 'assets/jiangsu.json').read_text())
    report = {'entry': 'index.html', 'local_resources': sorted(resources),
              'local_only_paths': 0, 'broken_anchors': 0,
              'external_urls': sorted(external),
              'http_checks': check_http(resources, anchors) if args.http else 'not requested'}
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
